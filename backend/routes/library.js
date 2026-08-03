const express = require("express");
const router = express.Router();
const Library = require("../models/Library");

// GET /api/library - Get all library items
router.get("/", async (req, res) => {
  try {
    const { search, type, limit = 50, page = 1 } = req.query;

    let query = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Filter by mediaType
    if (type) {
      query.mediaType = type;
    }

    const libraryItems = await Library.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Library.countDocuments(query);

    res.json({
      success: true,
      data: libraryItems,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching library items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching library items",
      error: error.message,
    });
  }
});

// GET /api/library/random - Get a random library item
router.get("/random", async (req, res) => {
  try {
    const count = await Library.countDocuments();
    const random = Math.floor(Math.random() * count);
    const libraryItem = await Library.findOne().skip(random);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "No library items found",
      });
    }

    res.json({
      success: true,
      data: libraryItem,
    });
  } catch (error) {
    console.error("Error fetching random library item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching random library item",
      error: error.message,
    });
  }
});

// GET /api/library/:id - Get a specific library item
router.get("/:id", async (req, res) => {
  try {
    const libraryItem = await Library.findById(req.params.id);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "Library item not found",
      });
    }

    res.json({
      success: true,
      data: libraryItem,
    });
  } catch (error) {
    console.error("Error fetching library item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching library item",
      error: error.message,
    });
  }
});

// POST /api/library - Create a new library item
router.post("/", async (req, res) => {
  try {
    const libraryItem = new Library(req.body);
    const savedItem = await libraryItem.save();

    res.status(201).json({
      success: true,
      data: savedItem,
      message: "Library item created successfully",
    });
  } catch (error) {
    console.error("Error creating library item:", error);
    res.status(500).json({
      success: false,
      message: "Error creating library item",
      error: error.message,
    });
  }
});

// PUT /api/library/:id - Update a library item
router.put("/:id", async (req, res) => {
  try {
    const libraryItem = await Library.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "Library item not found",
      });
    }

    res.json({
      success: true,
      data: libraryItem,
      message: "Library item updated successfully",
    });
  } catch (error) {
    console.error("Error updating library item:", error);
    res.status(500).json({
      success: false,
      message: "Error updating library item",
      error: error.message,
    });
  }
});

// DELETE /api/library/:id - Delete a library item
router.delete("/:id", async (req, res) => {
  try {
    const libraryItem = await Library.findByIdAndDelete(req.params.id);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "Library item not found",
      });
    }

    res.json({
      success: true,
      message: "Library item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting library item:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting library item",
      error: error.message,
    });
  }
});

module.exports = router;
