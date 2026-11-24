
import express from "express";

import {
  addSales,
  getSalesByDate,
  getSalesHistory,
  updateSales,
  deleteSales,
} from "../controllers/sales.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All sales routes require authentication
router.use(protect);

// Add daily sales
router.post("/", addSales);

// Get sales by date
router.get("/", getSalesByDate);

// Get complete sales history
router.get("/history", getSalesHistory);

// Update sales
router.patch("/:id", updateSales);

// Delete sales
router.delete("/:id", deleteSales);

export default router;
