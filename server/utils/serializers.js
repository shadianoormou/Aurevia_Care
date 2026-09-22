const parseJson = (value, fallback = []) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

export const serializeUser = (row) => ({
  _id: row.Id,
  name: row.Name,
  email: row.Email,
  role: row.Role,
  phone: row.Phone || "",
  isActive: Boolean(row.IsActive),
  address: {
    street: row.AddressStreet || "", city: row.AddressCity || "", state: row.AddressState || "",
    zipCode: row.AddressZipCode || "", country: row.AddressCountry || "",
  },
  createdAt: row.CreatedAt,
  updatedAt: row.UpdatedAt,
});

export const serializeCategory = (row) => ({
  _id: row.Id, name: row.Name, description: row.Description || "", icon: row.Icon || "",
  sortOrder: Number(row.SortOrder ?? 999), isFeatured: Boolean(row.IsFeatured),
  createdAt: row.CreatedAt, updatedAt: row.UpdatedAt,
});

export const serializeProduct = (row) => ({
  _id: row.Id,
  name: row.Name,
  brand: row.Brand || "",
  description: row.Description,
  category: row.CategoryId ? { _id: row.CategoryId, name: row.CategoryName, icon: row.CategoryIcon } : null,
  subcategory: row.SubcategoryId ? { _id: row.SubcategoryId, name: row.SubcategoryName, icon: row.SubcategoryIcon } : null,
  symptoms: parseJson(row.Symptoms),
  price: Number(row.Price), stock: Number(row.Stock), lowStockThreshold: Number(row.LowStockThreshold),
  image: row.ImageUrl || "", requiresPrescription: Boolean(row.RequiresPrescription),
  rating: Number(row.Rating || 0), numReviews: Number(row.NumReviews || 0),
  isVerified: Boolean(row.IsVerified), verifiedBy: row.VerifiedBy || null, verifiedAt: row.VerifiedAt || null,
  isActive: Boolean(row.IsActive), createdAt: row.CreatedAt, updatedAt: row.UpdatedAt,
});

export const serializeReview = (row) => ({
  _id: row.Id, product: row.ProductId, user: row.UserId, name: row.Name,
  rating: Number(row.Rating), comment: row.Comment, createdAt: row.CreatedAt, updatedAt: row.UpdatedAt,
});

export const serializePrescription = (row) => ({
  _id: row.Id, mode: row.Mode, status: row.Status, doctorName: row.DoctorName || "",
  doctorRegistration: row.DoctorRegistration || "", prescriptionNumber: row.PrescriptionNumber || "",
  medicationDetails: row.MedicationDetails || "", note: row.Note || "", fileName: row.FileName || null,
  fileMimeType: row.FileMimeType || null, scanText: row.ScanText || "", verifiedAt: row.VerifiedAt || null,
  rejectionReason: row.RejectionReason || "", expiresAt: row.ExpiresAt || null,
  createdAt: row.CreatedAt, updatedAt: row.UpdatedAt,
});

export const serializeOrder = (row, items = [], history = []) => ({
  _id: row.Id,
  user: row.UserId ? { _id: row.UserId, name: row.UserName, email: row.UserEmail } : undefined,
  items,
  shippingAddress: {
    fullName: row.ShippingFullName, phone: row.ShippingPhone, street: row.ShippingStreet,
    city: row.ShippingCity, state: row.ShippingState || "", zipCode: row.ShippingZipCode || "",
    country: row.ShippingCountry || "",
  },
  paymentMethod: row.PaymentMethod, isPaid: Boolean(row.IsPaid), paidAt: row.PaidAt || null,
  containsPrescriptionItems: Boolean(row.ContainsPrescriptionItems),
  prescriptionAcknowledged: Boolean(row.PrescriptionAcknowledged), prescriptionId: row.PrescriptionId || null,
  itemsPrice: Number(row.ItemsPrice), shippingPrice: Number(row.ShippingPrice),
  taxPrice: Number(row.TaxPrice), totalPrice: Number(row.TotalPrice), status: row.Status,
  statusHistory: history, createdAt: row.CreatedAt, updatedAt: row.UpdatedAt,
});
