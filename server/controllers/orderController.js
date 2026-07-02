import Order from "../models/Order.js";
import Product from "../models/Product.js";

// @desc    Create a new order (checkout)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, prescriptionAcknowledged } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No order items provided" });
    }

    // Validate stock and build order items with current price snapshot
    const orderItems = [];
    let itemsPrice = 0;
    let containsPrescriptionItems = false;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product || !product.isActive) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      if (product.requiresPrescription) {
        containsPrescriptionItems = true;
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
      });

      itemsPrice += product.price * item.quantity;

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Safety check: if the cart contains any prescription-required medicine,
    // the customer must have explicitly acknowledged the prescription notice.
    // This is enforced on the server too, not just the frontend UI.
    if (containsPrescriptionItems && !prescriptionAcknowledged) {
      return res.status(400).json({
        success: false,
        message:
          "Your order contains prescription-required medicine. Please acknowledge the prescription notice before placing the order.",
      });
    }

    const shippingPrice = itemsPrice > 500 ? 0 : 50; // free shipping over 500
    const taxPrice = Number((itemsPrice * 0.05).toFixed(2)); // 5% tax
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      containsPrescriptionItems,
      prescriptionAcknowledged: containsPrescriptionItems ? !!prescriptionAcknowledged : false,
      status: "Pending",
      statusHistory: [{ status: "Pending" }],
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order (owner or admin only)
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = ["admin", "pharmacist"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to view this order" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
const VALID_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    order.statusHistory.push({ status });

    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.isPaid = true;
      order.paidAt = new Date();
    }

    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
