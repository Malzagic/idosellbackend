import express from "express";
import basicAuth from "express-basic-auth";
import ordersRouter from "./src/routes/orders.js";
import { updateOrders } from "./src/services/orderServices.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  basicAuth({
    users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD },
    challenge: true,
    unauthorizedResponse: "Unauthorized",
  })
);

app.use("/api/orders", ordersRouter);

(async () => {
  await updateOrders();
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
