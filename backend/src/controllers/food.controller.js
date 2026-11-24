
import mongoose from "mongoose";
import Food from "../models/food.model.js";

// 1. ADD FOOD
export const addFood = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable } = req.body;

    const food = await Food.create({
      name,
      description,
      price,
      category,
      isAvailable,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Food item added successfully",
      data: food,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. GET ALL FOOD ITEMS
export const getAllFood = async (req, res) => {
  try {
    const foods = await Food.find({
      createdBy: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. GET SINGLE FOOD ITEM
export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const food = await Food.findOne({
      _id: id,
      createdBy: req.user.id,
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: food,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. UPDATE FOOD ITEM
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "isAvailable",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const food = await Food.findOneAndUpdate(
      {
        _id: id,
        createdBy: req.user.id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Food item updated successfully",
      data: food,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. DELETE FOOD ITEM
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID",
      });
    }

    const food = await Food.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Food item deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
