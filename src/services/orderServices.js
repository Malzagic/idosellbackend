import axios from "axios";
import { writeFileSync, existsSync } from "fs";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = "https://zooart6.iai-shop.com";

const fetchOrders = async () => {
  try {
    const response = await axios.get("https://api.idosell.com/orders", {
      headers: {
        // Autoryzacja przy pomocy klucza API, zakodowanego w Base64
        Authorization:
          "Basic " +
          Buffer.from(
            "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP"
          ).toString("base64"),
      },
    });
    return response.data.orders;
  } catch (error) {
    // console.error("Błąd pobierania zamówień:", error.message);
    if (error.response) {
      console.error("Status odpowiedzi:", error.response.status);
      console.error("Dane odpowiedzi:", error.response.data);
    }
    // throw error;
  }
};

// Przetwarzanie danych do wymaganego formatu
const processOrders = orders => {
  if (!orders) return [];
  return orders.map(order => ({
    orderID: order.order_id,
    products: order.products.map(product => ({
      productID: product.product_id,
      quantity: product.quantity,
    })),
    orderWorth: order.order_total,
  }));
};

const saveOrders = orders => {
  writeFileSync("orders.json", JSON.stringify(orders, null, 2), "utf-8");
};

// Aktualizacja zamówień
const updateOrders = async () => {
  const rawOrders = await fetchOrders();
  const processedOrders = processOrders(rawOrders);
  saveOrders(processedOrders);
  console.log("Zamówienia zaktualizowane");
};

if (!existsSync("orders.json")) {
  saveOrders([]);
  console.log("Utworzono pusty plik orders.json");
}

cron.schedule("0 0 * * *", async () => {
  console.log("Aktualizacja zamówień...");
  await updateOrders();
});

export { fetchOrders, processOrders, saveOrders, updateOrders };
