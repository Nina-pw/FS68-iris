import { type User } from "../types";

export const MOCK_USERS: User[] = [
  {
    userId: 1,
    name: "Admin User",
    email: "admin@admin.com",
    password: "admin",   // mock password
    role: "admin",          // 👈 role admin
    created_at: "2025-01-01T09:00:00Z",
    updated_at: "2025-01-05T09:00:00Z",
  },
  {
    userId: 2,
    name: "Nina Customer",
    email: "nina@example.com",
    password: "123456",
    role: "user",           // 👈 role user
    created_at: "2025-01-02T10:00:00Z",
    updated_at: "2025-01-05T10:00:00Z",
  },
  {
    userId: 3,
    name: "NN Pw",
    email: "nn@test.com",
    password: "987456",
    role: "user",           // 👈 role user
    created_at: "2025-01-06T10:00:00Z",
    updated_at: "2025-01-09T10:00:00Z",
  },
];
