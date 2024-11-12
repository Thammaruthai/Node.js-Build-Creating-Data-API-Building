import express from "express";
import { pool } from "../db.mjs";
import validateArticle from "../middleware/validateArticle.mjs";

const router = express.Router();

// Create a new post
router.post("/", validateArticle, async (req, res) => {
  const { title, image, category_id, description, content, status_id } =
    req.body;

  try {
    const query = `
      INSERT INTO posts (title, image, category_id, description, content, status_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [title, image, category_id, description, content, status_id];
    const result = await pool.query(query, values);

    return res.status(201).json({
      message: "Created post successfully",
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      message: "Server could not create post because of database connection",
    });
  }
});

// Update an existing post
router.put("/:postId", validateArticle, async (req, res) => {
  const { postId } = req.params;
  const { title, image, category_id, description, content, status_id } =
    req.body;

  try {
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
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to update",
      });
    }

    return res.status(200).json({
      message: "Updated post successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({
      message: "Server could not update post because of database connection",
    });
  }
});

// Delete a post
router.delete("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const query = `DELETE FROM posts WHERE id = $1 RETURNING *;`;
    const values = [postId];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to delete",
      });
    }

    return res.status(200).json({
      message: "Deleted post successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      message: "Server could not delete post because of database connection",
    });
  }
});

// Get posts with pagination, category filter, and keyword search
router.get("/", async (req, res) => {
  const { page = 1, limit = 6, category, keyword } = req.query;
  const currentPage = parseInt(page, 10) || 1;
  const postsPerPage = parseInt(limit, 10) || 6;
  const offset = (currentPage - 1) * postsPerPage;

  try {
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

    if (category) {
      query += ` AND category_id = $${index}`;
      countQuery += ` AND category_id = $${index}`;
      values.push(category);
      index++;
    }

    if (keyword) {
      query += ` AND (title ILIKE $${index} OR description ILIKE $${index} OR content ILIKE $${index})`;
      countQuery += ` AND (title ILIKE $${index} OR description ILIKE $${index} OR content ILIKE $${index})`;
      values.push(`%${keyword}%`);
      index++;
    }

    query += ` ORDER BY id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(postsPerPage, offset);

    const postsResult = await pool.query(query, values);
    const countResult = await pool.query(
      countQuery,
      values.slice(0, index - 1)
    );
    const totalPosts = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalPosts / postsPerPage);

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
      message: "Server could not read post because of database connection",
    });
  }
});

export default router;
