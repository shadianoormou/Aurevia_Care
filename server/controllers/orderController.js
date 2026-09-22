import { createRequest, sql, withTransaction } from "../config/db.js";
import { clampInt, cleanText, httpError, requireUuid } from "../utils/http.js";
import { serializeOrder } from "../utils/serializers.js";

const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
const transitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const orderSelect = `
  SELECT o.*, u.Name AS UserName, u.Email AS UserEmail
  FROM dbo.Orders o INNER JOIN dbo.Users u ON u.Id = o.UserId
`;

const serializeItems = (rows) => rows.map((row) => ({
  _id: row.Id, product: row.ProductId, name: row.Name, image: row.ImageUrl || "",
  price: Number(row.Price), quantity: Number(row.Quantity),
}));

const loadOrder = async (id) => {
  const orderRequest = await createRequest();
  orderRequest.input("id", sql.UniqueIdentifier, id);
  const orderResult = await orderRequest.query(`${orderSelect} WHERE o.Id = @id`);
  const row = orderResult.recordset[0];
  if (!row) return null;
  const detailRequest = await createRequest();
  detailRequest.input("id", sql.UniqueIdentifier, id);
  const { recordsets } = await detailRequest.batch(`
    SELECT Id, OrderId, ProductId, Name, ImageUrl, Price, Quantity FROM dbo.OrderItems WHERE OrderId = @id;
    SELECT Status, ChangedAt FROM dbo.OrderStatusHistory WHERE OrderId = @id ORDER BY ChangedAt ASC;
  `);
  return serializeOrder(row, serializeItems(recordsets[0]), recordsets[1].map((history) => ({ status: history.Status, changedAt: history.ChangedAt })));
};

const loadOrders = async (where, bind, page, limit) => {
  const request = await createRequest();
  bind(request);
  request.input("offset", sql.Int, (page - 1) * limit);
  request.input("limit", sql.Int, limit);
  const { recordsets } = await request.batch(`
    ${orderSelect} ${where} ORDER BY o.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    SELECT COUNT(1) AS Total FROM dbo.Orders o ${where};
  `);
  const orders = await Promise.all(recordsets[0].map((row) => loadOrder(row.Id)));
  return { orders, total: Number(recordsets[1][0].Total) };
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) throw httpError("Provide between 1 and 30 order items");
  const aggregated = new Map();
  for (const item of items) {
    requireUuid(item?.product, "product ID");
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw httpError("Each item quantity must be between 1 and 100");
    aggregated.set(item.product, (aggregated.get(item.product) || 0) + quantity);
  }
  return [...aggregated.entries()].map(([product, quantity]) => ({ product, quantity }));
};

const normalizeShipping = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const address = {
    fullName: cleanText(source.fullName, 120), phone: cleanText(source.phone, 30),
    street: cleanText(source.street, 240), city: cleanText(source.city, 120),
    state: cleanText(source.state, 120), zipCode: cleanText(source.zipCode, 30), country: cleanText(source.country, 120),
  };
  if (!address.fullName || !address.phone || !address.street || !address.city || !address.country) {
    throw httpError("Full shipping address, phone, and country are required");
  }
  return address;
};

export const createOrder = async (req, res, next) => {
  try {
    const requestedItems = normalizeItems(req.body.items);
    const shippingAddress = normalizeShipping(req.body.shippingAddress);
    const paymentMethod = req.body.paymentMethod === "Stripe" ? "Stripe" : "COD";
    const prescriptionAcknowledged = req.body.prescriptionAcknowledged === true;
    const prescriptionId = req.body.prescriptionId || null;
    if (prescriptionId) requireUuid(prescriptionId, "prescription ID");

    const orderId = await withTransaction(async (transaction) => {
      const lockedProducts = [];
      for (const item of requestedItems) {
        const productRequest = await createRequest(transaction);
        productRequest.input("id", sql.UniqueIdentifier, item.product);
        const result = await productRequest.query(`SELECT Id, Name, ImageUrl, Price, Stock, RequiresPrescription
          FROM dbo.Products WITH (UPDLOCK, HOLDLOCK) WHERE Id = @id AND IsActive = 1`);
        const product = result.recordset[0];
        if (!product) throw httpError("One or more products are no longer available", 404);
        if (Number(product.Stock) < item.quantity) throw httpError(`Insufficient stock for ${product.Name}`);
        lockedProducts.push({ ...product, quantity: item.quantity });
      }

      const containsPrescriptionItems = lockedProducts.some((product) => product.RequiresPrescription);
      if (containsPrescriptionItems && !prescriptionAcknowledged) {
        throw httpError("Confirm the prescription notice before placing a prescription order");
      }
      if (containsPrescriptionItems && !prescriptionId) {
        throw httpError("An approved prescription is required for this order");
      }
      if (prescriptionId) {
        const prescriptionRequest = await createRequest(transaction);
        prescriptionRequest.input("id", sql.UniqueIdentifier, prescriptionId);
        prescriptionRequest.input("userId", sql.UniqueIdentifier, req.user._id);
        const result = await prescriptionRequest.query(`SELECT Id FROM dbo.Prescriptions WITH (UPDLOCK, HOLDLOCK)
          WHERE Id = @id AND UserId = @userId AND Status = 'Approved'
          AND (ExpiresAt IS NULL OR ExpiresAt > SYSUTCDATETIME())`);
        if (!result.recordset[0]) throw httpError("Select a valid approved prescription", 400);
      }

      const itemsPrice = lockedProducts.reduce((sum, product) => sum + Number(product.Price) * product.quantity, 0);
      const shippingPrice = itemsPrice >= 500 ? 0 : 50;
      const taxPrice = Number((itemsPrice * 0.05).toFixed(2));
      const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));
      const orderRequest = await createRequest(transaction);
      orderRequest.input("userId", sql.UniqueIdentifier, req.user._id);
      orderRequest.input("prescriptionId", sql.UniqueIdentifier, containsPrescriptionItems ? prescriptionId : null);
      orderRequest.input("fullName", sql.NVarChar(120), shippingAddress.fullName);
      orderRequest.input("phone", sql.NVarChar(30), shippingAddress.phone);
      orderRequest.input("street", sql.NVarChar(240), shippingAddress.street);
      orderRequest.input("city", sql.NVarChar(120), shippingAddress.city);
      orderRequest.input("state", sql.NVarChar(120), shippingAddress.state || null);
      orderRequest.input("zipCode", sql.NVarChar(30), shippingAddress.zipCode || null);
      orderRequest.input("country", sql.NVarChar(120), shippingAddress.country);
      orderRequest.input("paymentMethod", sql.VarChar(20), paymentMethod);
      orderRequest.input("containsPrescriptionItems", sql.Bit, containsPrescriptionItems);
      orderRequest.input("prescriptionAcknowledged", sql.Bit, containsPrescriptionItems && prescriptionAcknowledged);
      orderRequest.input("itemsPrice", sql.Decimal(12, 2), itemsPrice);
      orderRequest.input("shippingPrice", sql.Decimal(12, 2), shippingPrice);
      orderRequest.input("taxPrice", sql.Decimal(12, 2), taxPrice);
      orderRequest.input("totalPrice", sql.Decimal(12, 2), totalPrice);
      const orderResult = await orderRequest.query(`INSERT INTO dbo.Orders (UserId, PrescriptionId, ShippingFullName,
        ShippingPhone, ShippingStreet, ShippingCity, ShippingState, ShippingZipCode, ShippingCountry, PaymentMethod,
        ContainsPrescriptionItems, PrescriptionAcknowledged, ItemsPrice, ShippingPrice, TaxPrice, TotalPrice)
        OUTPUT inserted.Id VALUES (@userId, @prescriptionId, @fullName, @phone, @street, @city, @state, @zipCode,
        @country, @paymentMethod, @containsPrescriptionItems, @prescriptionAcknowledged, @itemsPrice, @shippingPrice,
        @taxPrice, @totalPrice)`);
      const orderId = orderResult.recordset[0].Id;

      for (const product of lockedProducts) {
        const itemRequest = await createRequest(transaction);
        itemRequest.input("orderId", sql.UniqueIdentifier, orderId);
        itemRequest.input("productId", sql.UniqueIdentifier, product.Id);
        itemRequest.input("name", sql.NVarChar(180), product.Name);
        itemRequest.input("imageUrl", sql.NVarChar(2048), product.ImageUrl || null);
        itemRequest.input("price", sql.Decimal(12, 2), product.Price);
        itemRequest.input("quantity", sql.Int, product.quantity);
        await itemRequest.query(`INSERT INTO dbo.OrderItems (OrderId, ProductId, Name, ImageUrl, Price, Quantity)
          VALUES (@orderId, @productId, @name, @imageUrl, @price, @quantity)`);
        const stockRequest = await createRequest(transaction);
        stockRequest.input("id", sql.UniqueIdentifier, product.Id);
        stockRequest.input("quantity", sql.Int, product.quantity);
        await stockRequest.query("UPDATE dbo.Products SET Stock = Stock - @quantity, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id");
      }
      const historyRequest = await createRequest(transaction);
      historyRequest.input("orderId", sql.UniqueIdentifier, orderId);
      historyRequest.input("changedBy", sql.UniqueIdentifier, req.user._id);
      await historyRequest.query("INSERT INTO dbo.OrderStatusHistory (OrderId, Status, ChangedBy) VALUES (@orderId, 'Pending', @changedBy)");
      return orderId;
    });
    res.status(201).json({ success: true, order: await loadOrder(orderId) });
  } catch (error) { next(error); }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 20, 1, 100);
    const result = await loadOrders("WHERE o.UserId = @userId", (request) => request.input("userId", sql.UniqueIdentifier, req.user._id), page, limit);
    res.status(200).json({ success: true, count: result.orders.length, total: result.total, page, pages: Math.max(1, Math.ceil(result.total / limit)), orders: result.orders });
  } catch (error) { next(error); }
};

export const getOrderById = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "order ID");
    const order = await loadOrder(req.params.id);
    if (!order) throw httpError("Order not found", 404);
    const isStaff = ["admin", "pharmacist"].includes(req.user.role);
    if (!isStaff && order.user?._id !== req.user._id) throw httpError("Not authorized to view this order", 403);
    res.status(200).json({ success: true, order });
  } catch (error) { next(error); }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 20, 1, 100);
    const status = req.query.status;
    if (status && !statuses.includes(status)) throw httpError("Invalid order status");
    const where = status ? "WHERE o.Status = @status" : "";
    const result = await loadOrders(where, (request) => { if (status) request.input("status", sql.VarChar(20), status); }, page, limit);
    res.status(200).json({ success: true, count: result.orders.length, total: result.total, page, pages: Math.max(1, Math.ceil(result.total / limit)), orders: result.orders });
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    requireUuid(req.params.id, "order ID");
    const status = req.body.status;
    if (!statuses.includes(status)) throw httpError("Invalid order status");
    await withTransaction(async (transaction) => {
      const request = await createRequest(transaction);
      request.input("id", sql.UniqueIdentifier, req.params.id);
      const result = await request.query("SELECT Id, Status, PaymentMethod FROM dbo.Orders WITH (UPDLOCK, HOLDLOCK) WHERE Id = @id");
      const order = result.recordset[0];
      if (!order) throw httpError("Order not found", 404);
      if (!transitions[order.Status].includes(status)) throw httpError(`Order cannot move from ${order.Status} to ${status}`);

      if (status === "Cancelled") {
        const itemsRequest = await createRequest(transaction);
        itemsRequest.input("id", sql.UniqueIdentifier, req.params.id);
        const items = await itemsRequest.query("SELECT ProductId, Quantity FROM dbo.OrderItems WHERE OrderId = @id");
        for (const item of items.recordset) {
          const stockRequest = await createRequest(transaction);
          stockRequest.input("productId", sql.UniqueIdentifier, item.ProductId);
          stockRequest.input("quantity", sql.Int, item.Quantity);
          await stockRequest.query("UPDATE dbo.Products SET Stock = Stock + @quantity, UpdatedAt = SYSUTCDATETIME() WHERE Id = @productId");
        }
      }
      const updateRequest = await createRequest(transaction);
      updateRequest.input("id", sql.UniqueIdentifier, req.params.id);
      updateRequest.input("status", sql.VarChar(20), status);
      updateRequest.input("changedBy", sql.UniqueIdentifier, req.user._id);
      await updateRequest.query(`UPDATE dbo.Orders SET Status = @status,
        IsPaid = CASE WHEN @status = 'Delivered' AND PaymentMethod = 'COD' THEN 1 ELSE IsPaid END,
        PaidAt = CASE WHEN @status = 'Delivered' AND PaymentMethod = 'COD' THEN SYSUTCDATETIME() ELSE PaidAt END,
        UpdatedAt = SYSUTCDATETIME() WHERE Id = @id;
        INSERT INTO dbo.OrderStatusHistory (OrderId, Status, ChangedBy) VALUES (@id, @status, @changedBy);`);
    });
    res.status(200).json({ success: true, order: await loadOrder(req.params.id) });
  } catch (error) { next(error); }
};
