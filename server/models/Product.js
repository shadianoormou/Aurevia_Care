import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: "" },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // Symptoms this OTC product is commonly associated with (for smart search)
    // e.g. ["fever", "headache"]
    symptoms: [{ type: String, lowercase: true, trim: true }],

    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },

    image: { type: String, default: "" }, // Cloudinary URL
    imagePublicId: { type: String, default: "" }, // for deleting from Cloudinary

    requiresPrescription: { type: Boolean, default: false },

    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    isVerified: { type: Boolean, default: false }, // pharmacist/admin verification
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index to support search by name/brand/description
productSchema.index({ name: "text", brand: "text", description: "text" });

export default mongoose.model("Product", productSchema);
