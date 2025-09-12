import express from 'express';
import { chatWithAgent, recommendProducts } from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/chat', chatWithAgent);
router.post('/recommend', recommendProducts);

export default router;
