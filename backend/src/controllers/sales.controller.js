
import mongoose from "mongoose";
import Sales from "../models/sales.model.js";
import Food from "../models/food.model.js";

// Helper: Get logged-in user ID
const getUserId = (req) => {
  return req.user?.id || req.user?._id || req.user?.userId;
};

// Helper: Validate and normalize date
const getNormalizedDate = (date) => {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return null;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  return parsedDate;
};

// 1. Add Daily Sales
export const addSales = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { foodItem, date, quantitySold } = req.body;

    if (!mongoose.isValidObjectId(foodItem)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food item ID",
      });
    }

    const normalizedDate = getNormalizedDate(date);

    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        message: "Date must be in YYYY-MM-DD format",
      });
    }

    if (
      !Number.isInteger(quantitySold) ||
      quantitySold < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity sold must be a non-negative integer",
      });
    }

    // Check whether food belongs to logged-in user
    const food = await Food.findOne({
      _id: foodItem,
      createdBy: userId,
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    const sales = await Sales.create({
      foodItem,
      date: normalizedDate,
      quantitySold,
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Daily sales added successfully",
      data: sales,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Sales entry already exists for this food and date",
      });
    }

    console.error("Add Sales Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 2. Get Sales By Date
export const getSalesByDate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const normalizedDate = getNormalizedDate(req.query.date);

    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required in YYYY-MM-DD format",
      });
    }

    const nextDate = new Date(normalizedDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const sales = await Sales.find({
      createdBy: userId,
      date: {
        $gte: normalizedDate,
        $lt: nextDate,
      },
    })
      .populate("foodItem", "name price category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    console.error("Get Sales By Date Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 3. Get Complete Sales History
export const getSalesHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    const sales = await Sales.find({
      createdBy: userId,
    })
      .populate("foodItem", "name price category")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    console.error("Get Sales History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 4. Update Sales Quantity
export const updateSales = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { quantitySold } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales ID",
      });
    }

    if (
      !Number.isInteger(quantitySold) ||
      quantitySold < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity sold must be a non-negative integer",
      });
    }

    const sales = await Sales.findOneAndUpdate(
      {
        _id: id,
        createdBy: userId,
      },
      {
        $set: { quantitySold },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("foodItem", "name price category");

    if (!sales) {
      return res.status(404).json({
        success: false,
        message: "Sales record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sales updated successfully",
      data: sales,
    });
  } catch (error) {
    console.error("Update Sales Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 5. Delete Sales
export const deleteSales = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales ID",
      });
    }

    const sales = await Sales.findOneAndDelete({
      _id: id,
      createdBy: userId,
    });

    if (!sales) {
      return res.status(404).json({
        success: false,
        message: "Sales record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sales deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sales Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
