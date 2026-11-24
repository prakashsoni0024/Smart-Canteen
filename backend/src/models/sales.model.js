
import mongoose from "mongoose";

const salesSchema = new mongoose.Schema(
  {
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    quantitySold: {
      type: Number,
      required: true,
      min: 0,
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

// Same user cannot create duplicate sales
// for the same food item on the same date.
salesSchema.index(
  {
    foodItem: 1,
    date: 1,
    createdBy: 1,
  },
  {
    unique: true,
  }
);

const Sales = mongoose.model("Sales", salesSchema);

export default Sales;
