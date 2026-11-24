
import Food from "../models/food.model.js";
import Sales from "../models/sales.model.js";

export const generateTemporaryPredictions = async ({
  userId,
  predictionDate,
}) => {
  const historyDays = 7;

  // Calculate starting date of historical window
  const startDate = new Date(predictionDate);

  startDate.setUTCDate(
    startDate.getUTCDate() - historyDays
  );

  // Get all food items belonging to this user
  const foods = await Food.find({
    createdBy: userId,
  }).select("_id name price category isAvailable");

  // Get sales from the previous 7 calendar days
  // Prediction date itself is excluded
  const sales = await Sales.find({
    createdBy: userId,
    date: {
      $gte: startDate,
      $lt: predictionDate,
    },
  }).select("foodItem quantitySold date");

  // Group sales by food item ID
  const salesMap = new Map();

  for (const sale of sales) {
    const foodId = sale.foodItem.toString();

    if (!salesMap.has(foodId)) {
      salesMap.set(foodId, []);
    }

    salesMap.get(foodId).push(sale.quantitySold);
  }

  // Generate prediction for every food item
  const predictions = foods.map((food) => {
    const foodId = food._id.toString();

    const quantities = salesMap.get(foodId) || [];

    // No historical sales available
    if (quantities.length === 0) {
      return {
        foodItem: food._id,
        foodName: food.name,
        averageSales: null,
        predictedQuantity: null,
        historyCount: 0,
        status: "insufficient_data",
      };
    }

    // Calculate average sales
    const totalSales = quantities.reduce(
      (sum, quantity) => sum + quantity,
      0
    );

    const averageSales = totalSales / quantities.length;

    // Round average to nearest whole number
    const predictedQuantity = Math.round(averageSales);

    return {
      foodItem: food._id,
      foodName: food.name,
      averageSales: Number(averageSales.toFixed(2)),
      predictedQuantity,
      historyCount: quantities.length,
      status: "predicted",
    };
  });

  return {
    historyDays,
    predictions,
  };
};
