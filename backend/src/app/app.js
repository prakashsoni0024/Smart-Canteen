import express from "express"
import cors from "cors"
import authRoutes from "../routes/auth.routes.js";
import foodRoutes from "../routes/food.routes.js";
import salesRoutes from "../routes/sales.routes.js";
import predictionRoutes from "../routes/prediction.routes.js";

const app = express()

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/predictions", predictionRoutes);





export default app