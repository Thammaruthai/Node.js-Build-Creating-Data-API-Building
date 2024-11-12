// middleware/validateArticle.mjs
const validateArticle = (req, res, next) => {
  const { title, image, category_id, description, content, status_id } =
    req.body;

  if (!title) return res.status(400).json({ message: "Title is required" });
  if (typeof title !== "string")
    return res.status(400).json({ message: "Title must be a string" });

  if (!image) return res.status(400).json({ message: "Image is required" });
  if (typeof image !== "string")
    return res.status(400).json({ message: "Image must be a string" });

  if (category_id === undefined)
    return res.status(400).json({ message: "Category ID is required" });
  if (typeof category_id !== "number")
    return res.status(400).json({ message: "Category ID must be a number" });

  if (!description)
    return res.status(400).json({ message: "Description is required" });
  if (typeof description !== "string")
    return res.status(400).json({ message: "Description must be a string" });

  if (!content) return res.status(400).json({ message: "Content is required" });
  if (typeof content !== "string")
    return res.status(400).json({ message: "Content must be a string" });

  if (status_id === undefined)
    return res.status(400).json({ message: "Status ID is required" });
  if (typeof status_id !== "number")
    return res.status(400).json({ message: "Status ID must be a number" });

  next();
};

export default validateArticle;
