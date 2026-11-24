
import mongoose from "mongoose";

import Prediction from "../models/prediction.model.js";

import {
  generateTemporaryPredictions,
} from "../services/prediction.service.js";

// Generate Demand Prediction
export const generatePrediction = async (req, res) => {
  try {
    const userId = req.user.id;

    const { predictionDate } = req.body;

    // Validate date format
    if (
      typeof predictionDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(predictionDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Prediction date must be in YYYY-MM-DD format",
      });
    }

    const normalizedDate = new Date(
      `${predictionDate}T00:00:00.000Z`
    );

    // Validate actual calendar date
    if (
      Number.isNaN(normalizedDate.getTime()) ||
      normalizedDate.toISOString().slice(0, 10) !== predictionDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid prediction date",
      });
    }

    // Generate temporary predictions
    const result = await generateTemporaryPredictions({
      userId,
      predictionDate: normalizedDate,
    });

    if (result.predictions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No food items found. Please add food items first.",
      });
    }

    // Save prediction or update existing prediction
    const prediction = await Prediction.findOneAndUpdate(
      {
        createdBy: userId,
        predictionDate: normalizedDate,
      },
      {
        $set: {
          historyDays: result.historyDays,
          predictions: result.predictions,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Demand prediction generated successfully",
      data: prediction,
    });

  } catch (error) {
    console.error("Generate Prediction Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



export const getPredictionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const predictions = await Prediction.find({
      createdBy: userId,
    })
      .sort({ predictionDate: -1 })
      .select("-createdBy -__v");

    return res.status(200).json({
      success: true,
      message: "Prediction history fetched successfully",
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    console.error("Get Prediction History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPredictionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prediction ID",
      });
    }

    const prediction = await Prediction.findOne({
      _id: id,
      createdBy: userId,
    }).select("-createdBy -__v");

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prediction details fetched successfully",
      data: prediction,
    });
  } catch (error) {
    console.error("Get Prediction By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
