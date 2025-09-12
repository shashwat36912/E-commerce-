import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkoutSuccess, createCheckoutSession, getPaymentConfig } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", checkoutSuccess);
router.get("/config", getPaymentConfig);

export default router;
