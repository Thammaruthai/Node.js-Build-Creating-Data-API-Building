import express from "express";
import { pool } from "./db.mjs";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
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
