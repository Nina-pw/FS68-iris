import { type Order } from "../types";

export const MOCK_ORDERS: Order[] = [
  {
    id: 5001,
    userID: 2,
    status: "pending",
    subtotal: 598,
    shipping_fee: 50,
    discount_total: 0,
    grand_total: 648,
    created_at: "2025-01-10T14:00:00Z",
    updated_at: "2025-01-10T14:00:00Z",
    items: [
      {
        id: 1,
        order_id: 5001,
        product_id: 1,
        variant_id: 101,
        name: "Velvet Lip Tint",
        shade_name: "Rose Red",
        unit_price: 299,
        qty: 2,
        line_total: 598,
      },
    ],
  },
];
