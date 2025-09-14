import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getFeaturedProducts,
	getProductsByCategory,
	getRecommendedProducts,
	toggleFeaturedProduct,
	updateProduct,
	getProductById,
	autoGenerateProductDetails,
} from "../controllers/product.controller.js";
import { uploadImage, uploadMiddleware } from "../controllers/upload.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
// Register non-id routes before the wildcard route to avoid collisions
router.post("/auto-generate", protectRoute, adminRoute, autoGenerateProductDetails);
router.get("/:id", getProductById);
router.post("/", protectRoute, adminRoute, createProduct);
router.post("/upload", protectRoute, adminRoute, uploadMiddleware.single("file"), uploadImage);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
router.put("/:id", protectRoute, adminRoute, updateProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);
// (auto-generate already registered above)

export default router;
