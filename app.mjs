import express from "express";
import { pool } from "./db.mjs";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome!");
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

app.post("/posts", async (req, res) => {
  const { title, image, category_id, description, content, status_id } =
    req.body;
  if (!title || !image || !category_id || !content || !status_id) {
    return res.status(400).json({
      message:
        "Server could not create post because there are missing data from client",
    });
  }

  try {
    // แยก query เป็นส่วนๆ
    const query = `
      INSERT INTO posts (title, image, category_id, description, content, status_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [title, image, category_id, description, content, status_id];
    // Query to DB
    const result = await pool.query(query, values);

    return res.status(201).json({
      message: "Created post sucessfully",
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      message: "Server could not create post because database connection",
    });
  }
});

app.put("/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  const { title, image, category_id, description, content, status_id } =
    req.body;

  // ตรวจสอบว่าข้อมูลที่จำเป็นทั้งหมดถูกส่งมาหรือไม่
  if (!title || !image || !category_id || !content || !status_id) {
    return res.status(400).json({
      message:
        "Server could not update post because there are missing data from client",
    });
  }

  try {
    // ใช้คำสั่ง SQL UPDATE เพื่อแก้ไขข้อมูลโพสต์ที่ตรงกับ postId
    const query = `
      UPDATE posts
      SET title = $1, image = $2, category_id = $3, description = $4, content = $5, status_id = $6
      WHERE id = $7
      RETURNING *;
    `;
    const values = [
      title,
      image,
      category_id,
      description,
      content,
      status_id,
      postId,
    ];

    // ดำเนินการ query กับฐานข้อมูล
    const result = await pool.query(query, values);

    // ตรวจสอบว่าโพสต์ที่ต้องการอัปเดตมีอยู่ในฐานข้อมูลหรือไม่
    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to update",
      });
    }

    // หากอัปเดตสำเร็จ ให้ส่งสถานะ 200 พร้อมข้อความ
    return res.status(200).json({
      message: "Updated post successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    // หากมีข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล ให้ส่งสถานะ 500
    return res.status(500).json({
      message: "Server could not update post because database connection",
    });
  }
});

app.delete("/posts/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    // ใช้คำสั่ง SQL DELETE เพื่อลบโพสต์ที่ตรงกับ postId
    const query = `DELETE FROM posts WHERE id = $1 RETURNING *;`;
    const values = [postId];

    // ดำเนินการ query กับฐานข้อมูล
    const result = await pool.query(query, values);

    // ตรวจสอบว่าโพสต์ที่ต้องการลบมีอยู่ในฐานข้อมูลหรือไม่
    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to delete",
      });
    }

    // หากลบสำเร็จ ให้ส่งสถานะ 200 พร้อมข้อความ
    return res.status(200).json({
      message: "Deleted post successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    // หากมีข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล ให้ส่งสถานะ 500
    return res.status(500).json({
      message: "Server could not delete post because database connection",
    });
  }
});

// เพิ่มส่วนนี้ตั้งแต่บรรทัดถัดไป จนถึงจุดสิ้นสุดของ API GET /posts แบบ Pagination

app.get("/posts", async (req, res) => {
  const { page = 1, limit = 6, category, keyword } = req.query;

  // แปลง page และ limit เป็นตัวเลข
  const currentPage = parseInt(page, 10) || 1;
  const postsPerPage = parseInt(limit, 10) || 6;

  const offset = (currentPage - 1) * postsPerPage;

  try {
    // กำหนดเงื่อนไขของ query
    let query = `
      SELECT * FROM posts
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) FROM posts
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    // กรองตามหมวดหมู่
    if (category) {
      query += ` AND category_id = $${index}`;
      countQuery += ` AND category_id = $${index}`;
      values.push(category);
      index++;
    }

    // ค้นหาจาก keyword ใน title, description, หรือ content
    if (keyword) {
      query += ` AND (title ILIKE $${index} OR description ILIKE $${index} OR content ILIKE $${index})`;
      countQuery += ` AND (title ILIKE $${index} OR description ILIKE $${index} OR content ILIKE $${index})`;
      values.push(`%${keyword}%`);
      index++;
    }

    // เพิ่มเงื่อนไขการจัดเรียงข้อมูลและ limit-offset
    query += ` ORDER BY id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(postsPerPage, offset);

    // Query เพื่อดึงโพสต์ตามเงื่อนไข
    const postsResult = await pool.query(query, values);

    // Query เพื่อหาจำนวนโพสต์ทั้งหมดที่ตรงกับเงื่อนไข
    const countResult = await pool.query(
      countQuery,
      values.slice(0, index - 1)
    );
    const totalPosts = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    // สร้างข้อมูล response
    res.status(200).json({
      totalPosts,
      totalPages,
      currentPage,
      limit: postsPerPage,
      posts: postsResult.rows,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});


