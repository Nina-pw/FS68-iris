# IRIS — Cosmetics Online Platform

**IRIS** คือแพลตฟอร์มออนไลน์สำหรับการซื้อขายสินค้าเครื่องสำอาง  
ระบบถูกออกแบบให้รองรับการใช้งานทั้งฝั่ง **User (ลูกค้า)** และ **Admin (ผู้ขาย/ผู้ดูแลระบบ)**  
โดยมีฟังก์ชันครบตั้งแต่การเลือกสินค้า เพิ่มลงตะกร้า ไปจนถึงการชำระเงินออนไลน์ รวมถึงระบบบริหารจัดการสินค้าและคำสั่งซื้อของผู้ขาย

---

## สมาชิกผู้พัฒนา

| รหัสนักศึกษา | ชื่อ-นามสกุล |
|----------------|-------------------------------|
| 650610793 | นางสาวพิมพ์มาดา วังสมบัติ |
| 650610805 | นางสาววริศรา วงษ์คำ |
| 650610809 | นางสาวแว่นแก้ว พิมพ์เสนา |

---

## ฟังก์ชันหลักของระบบ

### ฝั่งผู้ใช้ (Customer)
- ลงทะเบียน / เข้าสู่ระบบผ่าน **Email** หรือ **OAuth (Google, Facebook)**
- เรียกดูสินค้าตามหมวดหมู่
- ค้นหาและกรองสินค้าตามราคา หรือประเภท
- เพิ่มสินค้าในตะกร้า และจัดการจำนวนสินค้าก่อนชำระเงิน
- ชำระเงินผ่านระบบ **SCB QR Payment**
- ตรวจสอบประวัติการสั่งซื้อ

### ฝั่งผู้ดูแลระบบ (Admin)
- จัดการสินค้า (เพิ่ม / แก้ไข / ลบ)
- ตรวจสอบคำสั่งซื้อของลูกค้า
- ดูยอดขายรวม

---

## Technology Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React + Vite |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (ผ่าน Drizzle ORM) |
| **Authentication** | OAuth + Passport.js |
| **API Design** | RESTful API |
| **Payment** | SCB QR Payment API |

---

- ฝั่ง **Frontend** ใช้ React เพื่อสร้าง UI  
- ฝั่ง **Backend** พัฒนาโดยใช้ Express.js รองรับ RESTful API  
- มีระบบ **OAuth (Google, Facebook)** สำหรับการเข้าสู่ระบบ  
- เชื่อมต่อฐานข้อมูลผ่าน Drizzle ORM  
- รองรับการชำระเงินผ่าน **SCB QR Payment API**

---

# IRIS Project Setup Guide

## ขั้นตอนหลังจาก Clone Project
หลังจาก `git clone` โปรเจกต์มาแล้ว ให้ทำตามลำดับดังนี้

---

### Database (iris-db)

1. เข้าโฟลเดอร์  
   ```bash
   cd ./iris-db/
   ```

2. ติดตั้ง dependencies  
   ```bash
   npm i
   ```

3. เพิ่มไฟล์ `.env` โดยอิงค่าจาก `docker-compose.yml`

4. ตรวจสอบสิทธิ์ไฟล์ init script  
   - **macOS / Linux:**  
     ```bash
     chmod +x ./_entrypoint/init.sh
     ```
   - **Windows:**  
     ตรวจสอบว่าไฟล์ `.sh` ใช้ **LF** (ไม่ใช่ CRLF)

5. รัน container  
   ```bash
   docker compose up -d
   ```

---

### Backend (iris-backend)

1. เข้าโฟลเดอร์  
   ```bash
   cd ./iris-backend/
   ```

2. ติดตั้ง dependencies  
   ```bash
   npm i
   ```

3. **กรณีรันด้วย Docker:**  
   ```bash
   docker compose --env-file ./.env.docker up -d --force-recreate --build
   ```

4. **กรณีรันบน Local:**  
   ```bash
   npm run dev
   ```
   (ใช้ไฟล์ `.env` สำหรับค่า environment)

---

### Frontend (iris-frontend)

1. เข้าโฟลเดอร์  
   ```bash
   cd ./iris-frontend/
   ```

2. ติดตั้ง dependencies  
   ```bash
   pnpm i
   ```

3. **กรณีรันด้วย Docker:**  
   ```bash
   docker compose --env-file ./.env.local up -d --force-recreate --build
   ```

4. **กรณีรันบน Local:**  
   ```bash
   pnpm run dev
   ```
   จากนั้นคลิกลิงก์ `http://localhost:xxxx` เพื่อเปิดหน้าเว็บ

---

## Seed ข้อมูลเบื้องต้นใน Database

### กรณีรันบน Local
```bash
cd ./iris-backend/db/
npm run db:generate
npm run db:push
npm run seed:products
```

### กรณีรันบน Docker
1. เปิด Docker Desktop  
2. ไปที่ container `iris-backend` → เปิดแท็บ **Exec**
3. รันคำสั่งต่อไปนี้:
   ```bash
   npm run db:generate
   npm run db:push
   npm run seed:products
   ```

---

## 💡 Tips

- หากเจอปัญหา `Permission denied` ตอนรันสคริปต์ ให้ตรวจสอบว่าไฟล์ `.sh` เป็น **LF**
- หากเจอ error `FATAL: password authentication failed` ให้ตรวจสอบค่า `POSTGRES_USER` และ `POSTGRES_PASSWORD` ในไฟล์ `.env` และ `docker-compose.yml`

---
