
import express from "express";

import {
  generatePrediction,
  getPredictionHistory,
  getPredictionById,
} from "../controllers/prediction.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/generate", generatePrediction);
router.get("/history", getPredictionHistory);
router.get("/:id", getPredictionById);

export default router;
