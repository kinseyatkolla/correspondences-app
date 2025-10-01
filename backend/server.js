const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");

// Import routes
const flowerEssenceRoutes = require("./routes/flowerEssences");
const tarotCardRoutes = require("./routes/tarotCards");
const astrologyRoutes = require("./routes/astrology");
const libraryRoutes = require("./routes/library");
const bookOfShadowsRoutes = require("./routes/bookOfShadows");

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (optional for now)
mongoose
  .connect(config.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.log("MongoDB not available, running without database");
    console.log("To enable database features, install and start MongoDB");
  });

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Correspondences API is running!" });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Sample API routes for correspondences
app.get("/api/correspondences", (req, res) => {
  res.json({
    message: "Get all correspondences",
    data: [
      {
        id: "1",
        title: "Email from John",
        date: "2024-01-15",
        content: "Hello! How are you doing?",
      },
      {
        id: "2",
        title: "Letter from Sarah",
        date: "2024-01-14",
        content: "Thanks for the update on the project.",
      },
      {
        id: "3",
        title: "Message from Mike",
        date: "2024-01-13",
        content: "Can we schedule a meeting for next week?",
      },
      {
        id: "4",
        title: "Newsletter from TechCorp",
        date: "2024-01-12",
        content: "Latest updates from our team.",
      },
      {
        id: "5",
        title: "Invoice from DesignStudio",
        date: "2024-01-11",
        content: "Payment due for design services.",
      },
    ],
  });
});

app.post("/api/correspondences", (req, res) => {
  res.json({
    message: "Create new correspondence",
    data: req.body,
  });
});

// Use flower essence routes
app.use("/api/flower-essences", flowerEssenceRoutes);

// Use tarot card routes
app.use("/api/tarot-cards", tarotCardRoutes);

// Use astrology routes
app.use("/api/astrology", astrologyRoutes);

// Use library routes
app.use("/api/library", libraryRoutes);

// Use book of shadows routes
app.use("/api/book-of-shadows", bookOfShadowsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
