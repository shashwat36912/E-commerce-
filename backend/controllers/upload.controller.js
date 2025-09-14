import cloudinary from "../lib/cloudinary.js";
import multer from "multer";

// multer memory storage to get file buffer
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Cloudinary can accept a buffer via data URI
    const fileBuffer = req.file.buffer;
    const base64 = fileBuffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, { folder: "products" });

    return res.json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error.message);
    return res.status(500).json({ message: "Upload failed", error: error.message });
  }
};
