
import express from "express";
import { body, validationResult } from "express-validator";

import { protect } from "../middleware/auth.middleware.js";

import {
  addFood,
  getAllFood,
  getFoodById,
  updateFood,
  deleteFood,
} from "../controllers/food.controller.js";

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};

// All food routes require authentication
router.use(protect);

// Add food
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Food name is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("category")
      .optional()
      .isIn(["Breakfast", "Lunch", "Snacks", "Beverages", "Other"])
      .withMessage("Invalid food category"),
    body("description").optional().isString(),
    body("isAvailable").optional().isBoolean(),
  ],
  validateRequest,
  addFood
);

// Get all food
router.get("/", getAllFood);

// Get single food
router.get("/:id", getFoodById);

// Update food
router.patch(
  "/:id",
  [
    body("name").optional().trim().notEmpty(),
    body("price").optional().isFloat({ min: 0 }),
    body("category")
      .optional()
      .isIn(["Breakfast", "Lunch", "Snacks", "Beverages", "Other"]),
    body("description").optional().isString(),
    body("isAvailable").optional().isBoolean(),
  ],
  validateRequest,
  updateFood
);

// Delete food
router.delete("/:id", deleteFood);

export default router;
