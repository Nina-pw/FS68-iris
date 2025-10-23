// src/services/admin.ts
import { apiClient } from "./api";

export type Product = { pId: number; pname: string; /* ... */ };
export type User = { userID: number; name: string; role: string; /* ... */ };

export async function getAllProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/api/admin/products");
  return data;
}

export async function getAllUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/admin/users");
  return data;
}
