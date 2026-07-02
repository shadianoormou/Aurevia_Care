// Run with: npm run seed         (adds sample data)
//           npm run seed:destroy (removes all data)
import dotenv from "dotenv";
import connectDB from "../config/db.js";

import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";

dotenv.config();
connectDB();

const categories = [
  { name: "Pain Relief", description: "Painkillers and analgesics", icon: "💊" },
  { name: "Cold & Flu", description: "Cough, cold and flu remedies", icon: "🤧" },
  { name: "Digestive Health", description: "Antacids, ORS, digestive aids", icon: "🩺" },
  { name: "Vitamins & Supplements", description: "Multivitamins and supplements", icon: "🍊" },
  { name: "Skin Care", description: "Antiseptics, creams, ointments", icon: "🧴" },
  { name: "Allergy Care", description: "Antihistamines and allergy relief", icon: "🌼" },
  { name: "Prescription Medicine", description: "Medicines that legally require a doctor's prescription", icon: "📋" },
];

// Deletes everything from every collection this project uses.
// Kept as its own function so it can run both standalone (npm run seed:destroy)
// and automatically before importData() re-seeds the database.
const destroyData = async () => {
  await Order.deleteMany();
  await Review.deleteMany();
  await Product.deleteMany();
  await Category.deleteMany();
  await User.deleteMany();
  console.log("🗑️  All data destroyed (Users, Products, Categories, Orders, Reviews)");
};

const importData = async () => {
  try {
    await destroyData();

    // --- Users ---
    const admin = await User.create({
      name: "MediMart Admin",
      email: process.env.ADMIN_EMAIL || "admin@medimart.ai",
      password: process.env.ADMIN_PASSWORD || "Admin@12345",
      role: "admin",
      phone: "0100000000",
    });

    const pharmacist = await User.create({
      name: "MediMart Pharmacist",
      email: "pharmacist@medimart.ai",
      password: "Pharma@12345",
      role: "pharmacist",
      phone: "0100000001",
    });

    const customer = await User.create({
      name: "Demo Customer",
      email: "customer@medimart.ai",
      password: "Customer@123",
      role: "customer",
      phone: "0100000002",
      address: {
        street: "House 12, Road 5, Dhanmondi",
        city: "Dhaka",
        state: "Dhaka Division",
        zipCode: "1209",
        country: "Bangladesh",
      },
    });

    console.log("👤 Users seeded");

    // --- Categories ---
    const createdCategories = await Category.insertMany(categories);
    const catId = (name) => createdCategories.find((c) => c.name === name)._id;

    console.log("📂 Categories seeded");

    // --- Products (non-prescription) ---
    const otcProducts = [
      {
        name: "Paracetamol 500mg (10 tablets)",
        brand: "MediCare",
        description: "Fast-acting relief from fever, headache and mild body pain.",
        category: catId("Pain Relief"),
        symptoms: ["fever", "headache", "body pain"],
        price: 30,
        stock: 150,
        lowStockThreshold: 20,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Ibuprofen 400mg (10 tablets)",
        brand: "ReliefPlus",
        description: "Anti-inflammatory tablets for pain and swelling relief.",
        category: catId("Pain Relief"),
        symptoms: ["body pain", "headache"],
        price: 45,
        stock: 8,
        lowStockThreshold: 15,
        image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Cough Syrup 100ml",
        brand: "CalmTuss",
        description: "Soothing syrup for dry and wet cough relief.",
        category: catId("Cold & Flu"),
        symptoms: ["cough", "sore throat"],
        price: 80,
        stock: 60,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Cold & Flu Relief Tablets",
        brand: "FluAway",
        description: "Combination formula for cold, flu, congestion and fever.",
        category: catId("Cold & Flu"),
        symptoms: ["cold", "flu", "fever"],
        price: 65,
        stock: 40,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Antacid Chewable Tablets",
        brand: "GastroEase",
        description: "Quick relief from acidity, heartburn and indigestion.",
        category: catId("Digestive Health"),
        symptoms: ["acidity", "stomach pain"],
        price: 35,
        stock: 5,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Oral Rehydration Salts (ORS)",
        brand: "HydraLyte",
        description: "Electrolyte replacement for dehydration from diarrhea/vomiting.",
        category: catId("Digestive Health"),
        symptoms: ["diarrhea", "vomiting"],
        price: 20,
        stock: 100,
        lowStockThreshold: 20,
        image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Multivitamin Daily Tablets (30ct)",
        brand: "VitaBoost",
        description: "Complete daily multivitamin for immunity and energy support.",
        category: catId("Vitamins & Supplements"),
        symptoms: [],
        price: 120,
        stock: 75,
        lowStockThreshold: 15,
        image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Vitamin C 1000mg Effervescent",
        brand: "ImmunoFizz",
        description: "Immune support with effervescent Vitamin C tablets.",
        category: catId("Vitamins & Supplements"),
        symptoms: ["cold"],
        price: 95,
        stock: 3,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Antiseptic Cream 30g",
        brand: "SkinGuard",
        description: "Antiseptic cream for minor cuts, burns and skin rashes.",
        category: catId("Skin Care"),
        symptoms: ["skin rash"],
        price: 55,
        stock: 45,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Antihistamine Tablets (10ct)",
        brand: "AllerFree",
        description: "Fast relief from allergy symptoms like sneezing and itching.",
        category: catId("Allergy Care"),
        symptoms: ["allergy"],
        price: 40,
        stock: 55,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Eye Drops - Redness Relief 10ml",
        brand: "ClearView",
        description: "Relieves eye irritation, redness and dryness.",
        category: catId("Skin Care"),
        symptoms: ["eye irritation"],
        price: 60,
        stock: 30,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Laxative Tablets (10ct)",
        brand: "RegulEase",
        description: "Gentle relief from occasional constipation.",
        category: catId("Digestive Health"),
        symptoms: ["constipation"],
        price: 38,
        stock: 22,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500",
        requiresPrescription: false,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
    ];

    // --- Products (prescription-required) ---
    const prescriptionProducts = [
      {
        name: "Amoxicillin 500mg (21 capsules)",
        brand: "MediCare",
        description: "Broad-spectrum antibiotic capsules. Requires a valid doctor's prescription.",
        category: catId("Prescription Medicine"),
        symptoms: ["infection"],
        price: 180,
        stock: 25,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500",
        requiresPrescription: true,
        isVerified: true,
        verifiedBy: pharmacist._id,
        verifiedAt: new Date(),
      },
      {
        name: "Metformin 500mg (30 tablets)",
        brand: "GlucoBalance",
        description: "Oral medication for managing type 2 diabetes. Requires a valid doctor's prescription.",
        category: catId("Prescription Medicine"),
        symptoms: [],
        price: 150,
        stock: 40,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500",
        requiresPrescription: true,
        isVerified: false,
      },
      {
        name: "Atorvastatin 20mg (30 tablets)",
        brand: "CardioSafe",
        description: "Cholesterol-lowering medication. Requires a valid doctor's prescription.",
        category: catId("Prescription Medicine"),
        symptoms: [],
        price: 210,
        stock: 18,
        lowStockThreshold: 10,
        image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500",
        requiresPrescription: true,
        isVerified: true,
        verifiedBy: admin._id,
        verifiedAt: new Date(),
      },
    ];

    const createdProducts = await Product.insertMany([...otcProducts, ...prescriptionProducts]);
    console.log("💊 Products seeded (including prescription-required medicine)");

    // --- Sample reviews ---
    const paracetamol = createdProducts.find((p) => p.name.startsWith("Paracetamol"));
    const multivitamin = createdProducts.find((p) => p.name.startsWith("Multivitamin"));

    const reviews = [
      {
        product: paracetamol._id,
        user: customer._id,
        name: customer.name,
        rating: 5,
        comment: "Worked quickly for my fever. Will buy again.",
      },
      {
        product: multivitamin._id,
        user: customer._id,
        name: customer.name,
        rating: 4,
        comment: "Good quality multivitamin, easy to swallow.",
      },
    ];

    await Review.insertMany(reviews);

    // Recalculate rating/numReviews on the reviewed products
    for (const productId of [paracetamol._id, multivitamin._id]) {
      const productReviews = await Review.find({ product: productId });
      const numReviews = productReviews.length;
      const rating = numReviews
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / numReviews
        : 0;
      await Product.findByIdAndUpdate(productId, { rating: Number(rating.toFixed(1)), numReviews });
    }

    console.log("⭐ Reviews seeded");

    // --- Sample order ---
    const orderItemsPrice = paracetamol.price * 2 + multivitamin.price * 1;
    const orderShipping = orderItemsPrice > 500 ? 0 : 50;
    const orderTax = Number((orderItemsPrice * 0.05).toFixed(2));

    await Order.create({
      user: customer._id,
      items: [
        {
          product: paracetamol._id,
          name: paracetamol.name,
          image: paracetamol.image,
          price: paracetamol.price,
          quantity: 2,
        },
        {
          product: multivitamin._id,
          name: multivitamin.name,
          image: multivitamin.image,
          price: multivitamin.price,
          quantity: 1,
        },
      ],
      shippingAddress: {
        fullName: customer.name,
        phone: customer.phone,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        zipCode: customer.address.zipCode,
        country: customer.address.country,
      },
      paymentMethod: "COD",
      itemsPrice: orderItemsPrice,
      shippingPrice: orderShipping,
      taxPrice: orderTax,
      totalPrice: Number((orderItemsPrice + orderShipping + orderTax).toFixed(2)),
      status: "Delivered",
      isPaid: true,
      paidAt: new Date(),
      statusHistory: [{ status: "Pending" }, { status: "Confirmed" }, { status: "Delivered" }],
    });

    console.log("📦 Sample order seeded");

    console.log("\n✅ Seed data imported successfully!\n");
    console.log("   ---- Demo login credentials ----");
    console.log(`   Admin login:      ${admin.email} / ${process.env.ADMIN_PASSWORD || "Admin@12345"}`);
    console.log(`   Pharmacist login: ${pharmacist.email} / Pharma@12345`);
    console.log(`   Customer login:   ${customer.email} / Customer@123\n`);

    process.exit();
  } catch (error) {
    console.error(`❌ Error importing data: ${error.message}`);
    process.exit(1);
  }
};

const runDestroy = async () => {
  try {
    await destroyData();
    process.exit();
  } catch (error) {
    console.error(`❌ Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  runDestroy();
} else {
  importData();
}
