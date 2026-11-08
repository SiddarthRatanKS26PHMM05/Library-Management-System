const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_URL = "mongodb://127.0.0.1:27017/libraryDB";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger }
}, { timestamps: true });

memberSchema.index({ email: 1 }, { unique: true });

const Member = mongoose.model("Member", memberSchema);
const Book = mongoose.model("Book", bookSchema);

app.post("/api/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (name.length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const member = await Member.create({ name, email });
    res.status(201).json({ message: "Registration successful.", member: { id: member._id, name: member.name, email: member.email } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This email is already registered." });
    }
    res.status(400).json({ message: "Registration could not be completed." });
  }
});

app.get("/api/books", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = search ? {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ]
    } : {};
    res.json(await Book.find(filter).sort({ title: 1 }));
  } catch (error) {
    res.status(500).json({ message: "Could not retrieve book records." });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const book = await Book.create({
      title: String(req.body.title || "").trim(),
      author: String(req.body.author || "").trim(),
      category: String(req.body.category || "").trim(),
      quantity: Number(req.body.quantity)
    });
    res.status(201).json({ message: "Book added successfully.", book });
  } catch (error) {
    res.status(400).json({ message: "Enter a title, author, category and a valid non-negative whole-number quantity." });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const updated = await Book.findByIdAndUpdate(req.params.id, {
      title: String(req.body.title || "").trim(),
      author: String(req.body.author || "").trim(),
      category: String(req.body.category || "").trim(),
      quantity: Number(req.body.quantity)
    }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Book record not found." });
    res.json({ message: "Book updated successfully.", book: updated });
  } catch (error) {
    res.status(400).json({ message: "Enter valid book details." });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Book record not found." });
    res.json({ message: "Book deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: "Invalid book record." });
  }
});

mongoose.connect(DB_URL)
  .then(() => {
    console.log("MongoDB connected: libraryDB");
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch(() => {
    console.error("Could not connect to MongoDB. Start the local MongoDB service and run the application again.");
    process.exit(1);
  });
