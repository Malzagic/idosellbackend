// import axios from "axios";
// import { writeFileSync, existsSync } from "fs";
// import cron from "node-cron";
// import dotenv from "dotenv";

// dotenv.config();

// const API_BASE_URL = "https://api.idosell.com/orders";
// const API_KEY =
//   "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP";

// const fetchOrders = async () => {
//   try {
//     const response = await axios.get(API_BASE_URL, {
//       headers: {
//         Authorization: `Basic ${API_KEY}`,
//       },
//     });
//     return response.data.orders;
//   } catch (error) {
//     console.error("Błąd pobierania zamówień:", error.message);
//     if (error.response) {
//       console.error("Status odpowiedzi:", error.response.status);
//       console.error("Dane odpowiedzi:", error.response.data);
//     }
//   }
// };

// const fetchOrders = async () => {
//   const apiUrl = "https://zooart6.yourtechnicaldomain.com/api/admin/v3/orders/orders/search";
//   const apiKey =
//     "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP";

//   const response = await fetch(apiUrl, {
//     method: "POST",
//     headers: {
//       Authorization: `Basic ${apiKey}`,
//       "Content-Type": "application/json",
//       Accept: "application/json",
//     },
//     body: JSON.stringify({
//       // Filtr daty – pobieramy zamówienia z dzisiaj
//       filters: {
//         order_date: {
//           from: "2025-03-15 00:00:00",
//           to: "2025-03-15 23:59:59",
//         },
//       },
//       result_page: 1, // Pierwsza strona wyników
//       result_limit: 100, // Limit wyników na stronę (maksymalnie 100 wg dokumentacji)
//     }),
//   });

//   if (!response.ok) {
//     throw new Error(`Błąd: ${response.status}`);
//   }

//   const data = await response.json();
//   console.log(data);
//   // return data.orders; // Lista zamówień
// };

// export { fetchOrders };

// // Przetwarzanie danych do wymaganego formatu
// const processOrders = orders => {
//   if (!orders) return [];
//   return orders.map(order => ({
//     orderID: order.order_id,
//     products: order.products.map(product => ({
//       productID: product.product_id,
//       quantity: product.quantity,
//     })),
//     orderWorth: order.order_total,
//   }));
// };

// const saveOrders = orders => {
//   writeFileSync("orders.json", JSON.stringify(orders, null, 2), "utf-8");
// };

// // Aktualizacja zamówień
// const updateOrders = async () => {
//   const rawOrders = await fetchOrders();
//   const processedOrders = processOrders(rawOrders);
//   saveOrders(processedOrders);
//   console.log("Zamówienia zaktualizowane");
// };

// if (!existsSync("orders.json")) {
//   saveOrders([]);
//   console.log("Utworzono pusty plik orders.json");
// }

// cron.schedule("0 0 * * *", async () => {
//   console.log("Aktualizacja zamówień...");
//   await updateOrders();
// });

// export { fetchOrders, processOrders, saveOrders, updateOrders };

import dotenv from "dotenv";
import { writeFileSync, existsSync } from "fs";
import cron from "node-cron";

dotenv.config();

const API_URL = "https://zooart6.yourtechnicaldomain.com/api/admin/v5/orders/orders/search";
const API_KEY =
  "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP";

let allorders = [];

const fetchOrders = async () => {
  let page = 0;
  const limit = 100;
  let allOrders = [];
  let hasMore = true;

  while (hasMore) {
    try {
      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "X-API-KEY": API_KEY,
        },
        body: JSON.stringify({
          params: {
            ordersRange: { ordersDateRange: { ordersDateType: "add" } },
            resultsPage: page,
            resultsLimit: limit,
          },
        }),
      };

      const response = await fetch(API_URL, options);
      const responseTextData = await response.text();
      const parsedResponse = JSON.parse(responseTextData);

      if (!response.ok) {
        throw new Error(`Błąd: ${response.status} - ${responseTextData || "Brak szczegółów błędu"}`);
      }

      const formattedOrders = processOrders(parsedResponse.Results);
      allOrders = [...allOrders, ...formattedOrders];
      hasMore = formattedOrders.length === limit;
      page++;
    } catch (error) {
      console.error("Error while fetching the data:", error.message);
      throw error;
    }
  }

  return allOrders;
};

const saveOrders = orders => {
  try {
    if (!Array.isArray(orders)) {
      throw new Error("Data to save is not an array of orders");
    }
    writeFileSync("orders.json", JSON.stringify(orders, null, 2), "utf-8");
  } catch (error) {
    throw new Error("Error while saving orders:", error.message);
  }
};

const processOrders = orders => {
  if (!orders || !Array.isArray(orders)) return [];

  return orders.map(order => ({
    orderID: order.orderId,
    products: (order.orderDetails.productsResults || []).map(product => ({
      productID: product.productId,
      quantity: product.productQuantity,
    })),
    orderWorth:
      order.orderDetails.productsResults.reduce(
        (total, product) => total + (product.productOrderPrice || 0) * (product.productQuantity || 0),
        0
      ) || 0,
  }));
};

const updateOrders = async () => {
  try {
    const rawOrders = await fetchOrders();
    saveOrders(rawOrders);
    console.log("Orders updated successfully");
  } catch (error) {
    console.error("Error during orders update:", error.message);
  }
};

if (!existsSync("orders.json")) {
  saveOrders([]);
  console.log("Created empty orders.json file");
}

cron.schedule("0 0 * * *", async () => {
  console.log("Starting orders update...");
  await updateOrders();
});

export { fetchOrders, updateOrders };
