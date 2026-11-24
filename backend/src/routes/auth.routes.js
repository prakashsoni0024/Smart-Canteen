
import express from "express";
import { body, validationResult } from "express-validator";

import {
  registerUser,
  loginUser,
  getProfile,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

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

// Register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  registerUser
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  loginUser
);

// Protected profile
router.get("/profile", protect, getProfile);

export default router;
