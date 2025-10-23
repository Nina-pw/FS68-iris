import { type Product } from "../types";

export const MOCK_PRODUCTS: Product[] = [
  {
      p_id: 1,
      pname: "Velvet Lip Tint",
      description: "ลิปทินท์เนื้อกำมะหยี่ สีชัด ติดทนนาน",
      base_price: 299,
      pc_id: 1, // category: Lips
      primary_image_url: "/assets/Home2.png",
      images: ["/assets/Home2.png", "/assets/Home2.png"],
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-01-05T10:00:00Z",
      variants: [
          {
              id: 101,
              p_id: 1,
              sku: "LIP-RED-01",
              shade_name: "Rose Red",
              shade_code: "#B23",
              price: 299,
              stock_qty: 50,
              is_active: true,
              image_url: "/assets/Home2.png",
              created_at: "2025-01-01T10:00:00Z",
              updated_at: "2025-01-05T10:00:00Z",
          },
          {
              id: 102,
              p_id: 1,
              sku: "LIP-ORG-01",
              shade_name: "Coral",
              shade_code: "#F84",
              price: 299,
              stock_qty: 20,
              is_active: true,
              image_url: "/assets/Home2.png",
              created_at: "2025-01-01T10:00:00Z",
              updated_at: "2025-01-05T10:00:00Z",
          },
      ],
      id: undefined,
      image: "",
      name: undefined,
      price: function (_price: any): import("react").ReactNode {
          throw new Error("Function not implemented.");
      }
  },
  {
      p_id: 2,
      pname: "Mascara Volume Plus",
      description: "มาสคาร่าเพิ่มความหนา กันน้ำ",
      base_price: 350,
      pc_id: 2, // category: Mascara
      primary_image_url: "/assets/Home3.png",
      images: ["/assets/Home3.png"],
      created_at: "2025-01-02T12:00:00Z",
      updated_at: "2025-01-05T12:00:00Z",
      variants: [
          {
              id: 201,
              p_id: 2,
              sku: "MASC-BLK-01",
              shade_name: "Deep Black",
              shade_code: "#000",
              price: 350,
              stock_qty: 100,
              is_active: true,
              image_url: "/assets/Home3.png",
              created_at: "2025-01-02T12:00:00Z",
              updated_at: "2025-01-05T12:00:00Z",
          },
      ],
      id: undefined,
      image: "",
      name: undefined,
      price: function (_price: any): import("react").ReactNode {
          throw new Error("Function not implemented.");
      }
  },
];
