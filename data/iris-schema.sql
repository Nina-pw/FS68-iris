CREATE TABLE IF NOT EXISTS users (
  "userID" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255),
  "role" VARCHAR(20) DEFAULT 'CUSTOMER',
  "verify_token" VARCHAR(255),
  "reset_token" VARCHAR(255),
  "refresh_token" VARCHAR(255),
  "email_verified_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  "c_id" SERIAL PRIMARY KEY,
  "pcname" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  "p_id" SERIAL PRIMARY KEY,
  "pname" VARCHAR(255),
  "description" TEXT,
  "base_price" DECIMAL(10,2),
  "pc_id" INT REFERENCES categories("c_id"),
  "primary_image_url" VARCHAR(500),
  "images" JSON,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  "id" SERIAL PRIMARY KEY,
  "p_id" INT REFERENCES products("p_id"),
  "sku" VARCHAR(100) UNIQUE NOT NULL,
  "shade_name" VARCHAR(100),
  "shade_code" VARCHAR(50),
  "price" DECIMAL(10,2) NOT NULL,
  "stock_qty" INT NOT NULL DEFAULT 0,
  "is_active" BOOLEAN DEFAULT TRUE,
  "image_url" VARCHAR(500),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- (ตาราง carts, cart_items, orders, order_items, invoices ตามจริงของคุณ เพิ่มต่อได้)
