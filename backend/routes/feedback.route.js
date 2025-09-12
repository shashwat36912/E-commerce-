import express from 'express';
import { createFeedback, getFeedbacksByProduct, deleteFeedback } from '../controllers/feedback.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public: list feedbacks for a product
router.get('/product/:productId', getFeedbacksByProduct);

// Protected: create feedback for a product (user must be signed in)
router.post('/product/:productId', protectRoute, createFeedback);

// Admin only: delete feedback by id
router.delete('/:id', protectRoute, deleteFeedback);

export default router;
