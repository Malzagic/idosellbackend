import express from "express";
import { readFileSync, existsSync } from "fs";
import { createObjectCsvWriter } from "csv-writer";

const router = express.Router();

const getOrders = () => {
  if (!existsSync("orders.json")) {
    return [];
  }
  try {
    return JSON.parse(readFileSync("orders.json", "utf-8"));
  } catch (error) {
    console.error("Error reading orders.json:", error.message);
    return [];
  }
};

router.get("/", async (req, res) => {
  const { minWorth, maxWorth } = req.query;
  let orders = getOrders();

  if (minWorth || maxWorth) {
    orders = orders.filter(order => {
      const worth = parseFloat(order.orderWorth);
      return (!minWorth || worth >= parseFloat(minWorth)) && (!maxWorth || worth <= parseFloat(maxWorth));
    });
  }

  const csvWriter = createObjectCsvWriter({
    path: "orders.csv",
    header: [
      { id: "orderID", title: "Order ID" },
      { id: "products", title: "Products" },
      { id: "orderWorth", title: "Order Worth" },
    ],
  });

  const csvData = orders.map(order => ({
    orderID: order.orderID,
    products: JSON.stringify(order.products),
    orderWorth: order.orderWorth,
  }));

  try {
    await csvWriter.writeRecords(csvData);
    res.download("orders.csv", "orders.csv", err => {
      if (err) {
        res.status(500).send("Error downloading file");
      }
    });
  } catch (err) {
    res.status(500).send("Error generating CSV");
  }
});

router.get("/:orderID", (req, res) => {
  const orders = getOrders();
  const order = orders.find(o => o.orderID === req.params.orderID);

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

export default router;
