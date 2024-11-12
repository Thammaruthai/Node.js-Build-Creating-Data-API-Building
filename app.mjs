import express from "express";
import postRoutes from "./routes/posts.mjs"; // Import routes for posts

const app = express();
const port = 4000;

app.use(express.json());

// ใช้ Router ของโพสต์ทั้งหมดที่เส้นทาง /posts
app.use("/posts", postRoutes);

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

// hello world for test
app.get("/", (req, res) => {
  res.send("Hello World");
});