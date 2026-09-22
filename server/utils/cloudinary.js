import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// We use multer's in-memory storage instead of multer-storage-cloudinary.
// Reason: multer-storage-cloudinary pins a peer dependency on cloudinary@^1.x,
// which conflicts with cloudinary@^2.x and breaks `npm install`.
// Memory storage keeps the file as a Buffer (req.file.buffer) which we then
// stream to Cloudinary ourselves in uploadBufferToCloudinary() below.
const storage = multer.memoryStorage();

// Only accept image files, and cap upload size at 5MB
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Prescription files never go to the public product-media bucket. They are
// persisted in SQL Server and exposed only through an authorized API route.
const prescriptionFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Upload a JPG, PNG, WEBP, or PDF prescription"), false);
};

export const prescriptionUpload = multer({
  storage,
  fileFilter: prescriptionFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

// Streams a file buffer (from multer memory storage) up to Cloudinary.
// Returns the Cloudinary result, which contains `secure_url` and `public_id`.
export const uploadBufferToCloudinary = (buffer, folder = "aurevia-care/products") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Deletes a previously uploaded image from Cloudinary by its public_id.
// Safe to call even if publicId is empty/undefined.
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
  }
};

export default cloudinary;
