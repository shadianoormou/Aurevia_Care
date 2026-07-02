import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// @desc    Get dashboard stats (totals + sales chart data)
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, deliveredOrders] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.find({ status: { $ne: "Cancelled" } }),
    ]);

    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    // Build last 7 days sales chart data
    const today = new Date();
    const salesByDay = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const dayOrders = deliveredOrders.filter(
        (o) => o.createdAt >= day && o.createdAt < nextDay
      );

      salesByDay.push({
        date: day.toISOString().split("T")[0],
        sales: dayOrders.reduce((sum, o) => sum + o.totalPrice, 0),
        orders: dayOrders.length,
      });
    }

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalSales: Number(totalSales.toFixed(2)),
        salesByDay,
        ordersByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/admin/low-stock
// @access  Private/Admin/Pharmacist
export const getLowStockProducts = async (req, res, next) => {
  try {
    // A product is "low stock" if stock <= its own lowStockThreshold
    const products = await Product.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    })
      .populate("category", "name")
      .sort({ stock: 1 });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role or active status
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
