import { config } from "../config/config.js";
import jwt from "jsonwebtoken";


// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );
};