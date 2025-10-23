#!/usr/bin/env bash
set -Eeuo pipefail

# ===== Validate envs (กันค่าว่าง) =====
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_APP_USER:?POSTGRES_APP_USER is required}"
: "${POSTGRES_APP_PASSWORD:?POSTGRES_APP_PASSWORD is required}"

echo "---------------------------------------------"
echo "Setting up PostgreSQL database: ${POSTGRES_DB}"
echo "Creating/ensuring application user: ${POSTGRES_APP_USER}"
echo "---------------------------------------------"

# ใช้ superuser (POSTGRES_USER) เชื่อมเข้า DB ที่สร้างแล้ว
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
  -- ทำให้ปลอดภัยขึ้น: ตัดสิทธิ์ default จาก PUBLIC
  REVOKE CONNECT ON DATABASE "${POSTGRES_DB}" FROM PUBLIC;
  REVOKE ALL ON SCHEMA public FROM PUBLIC;

  -- สร้าง user แบบ idempotent
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${POSTGRES_APP_USER}') THEN
      CREATE ROLE "${POSTGRES_APP_USER}" LOGIN PASSWORD '${POSTGRES_APP_PASSWORD}';
    END IF;
  END
  \$\$;

  -- สร้าง schema drizzle ถ้ายังไม่มี
  CREATE SCHEMA IF NOT EXISTS drizzle;

  -- ให้สิทธิ์กับ app user
  GRANT ALL PRIVILEGES ON DATABASE "${POSTGRES_DB}" TO "${POSTGRES_APP_USER}";
  GRANT USAGE, CREATE ON SCHEMA public  TO "${POSTGRES_APP_USER}";
  GRANT USAGE, CREATE ON SCHEMA drizzle TO "${POSTGRES_APP_USER}";

  -- ให้สิทธิ์กับตาราง/อ็อบเจ็กต์ที่สร้างใหม่ในอนาคตโดยอัตโนมัติ
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${POSTGRES_APP_USER}";
  ALTER DEFAULT PRIVILEGES IN SCHEMA drizzle
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${POSTGRES_APP_USER}";
EOSQL
