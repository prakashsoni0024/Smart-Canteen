
import mongoose from "mongoose";

const predictionItemSchema = new mongoose.Schema(
  {
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },

    foodName: {
      type: String,
      required: true,
    },

    averageSales: {
      type: Number,
      default: null,
      min: 0,
    },

    predictedQuantity: {
      type: Number,
      default: null,
      min: 0,
    },

    historyCount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["predicted", "insufficient_data"],
      default: "predicted",
    },
  },
  {
    _id: false,
  }
);

const predictionSchema = new mongoose.Schema(
  {
    predictionDate: {
      type: Date,
      required: true,
    },

    historyDays: {
      type: Number,
      default: 7,
    },

    predictions: {
      type: [predictionItemSchema],
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One prediction document per user per date.
// Generating again updates the existing prediction.
predictionSchema.index(
  {
    createdBy: 1,
    predictionDate: 1,
  },
  {
    unique: true,
  }
);

const Prediction = mongoose.model(
  "Prediction",
  predictionSchema
);

export default Prediction;
