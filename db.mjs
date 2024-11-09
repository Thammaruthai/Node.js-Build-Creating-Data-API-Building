import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres", // ชื่อผู้ใช้ฐานข้อมูล
  host: "localhost", // ชื่อโฮสต์ฐานข้อมูล เช่น localhost
  database: "Test01", // ชื่อฐานข้อมูล
  password: "Automation01", // รหัสผ่านฐานข้อมูล
  port: 5432, // พอร์ตของ PostgreSQL (ค่าเริ่มต้นคือ 5432)
});

pool.on("connect", () => {
  console.log("✅ Connected to the database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle database client", err);
  process.exit(-1);
});

export { pool };
