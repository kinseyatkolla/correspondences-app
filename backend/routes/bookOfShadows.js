const express = require("express");
const router = express.Router();
const BookOfShadows = require("../models/BookOfShadows");

// GET /api/book-of-shadows - Get all BOS entries
router.get("/", async (req, res) => {
  try {
    const { search, category, limit = 50, page = 1 } = req.query;

    let query = { isActive: true };

    // Add search functionality
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
          { keywords: { $in: [new RegExp(search, "i")] } },
        ],
      };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const bosEntries = await BookOfShadows.find(query)
      .populate("references", "name description category")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await BookOfShadows.countDocuments(query);

    res.json({
      success: true,
      data: bosEntries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching BOS entries:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching BOS entries",
      error: error.message,
    });
  }
});

// GET /api/book-of-shadows/random - Get a random BOS entry
router.get("/random", async (req, res) => {
  try {
    const count = await BookOfShadows.countDocuments({ isActive: true });
    const random = Math.floor(Math.random() * count);
    const bosEntry = await BookOfShadows.findOne({ isActive: true })
      .populate("references", "name description category")
      .skip(random);

    if (!bosEntry) {
      return res.status(404).json({
        success: false,
        message: "No BOS entries found",
      });
    }

    res.json({
      success: true,
      data: bosEntry,
    });
  } catch (error) {
    console.error("Error fetching random BOS entry:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching random BOS entry",
      error: error.message,
    });
  }
});

// GET /api/book-of-shadows/:id - Get a specific BOS entry
router.get("/:id", async (req, res) => {
  try {
    const bosEntry = await BookOfShadows.findById(req.params.id).populate(
      "references",
      "name description category"
    );

    if (!bosEntry) {
      return res.status(404).json({
        success: false,
        message: "BOS entry not found",
      });
    }

    res.json({
      success: true,
      data: bosEntry,
    });
  } catch (error) {
    console.error("Error fetching BOS entry:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching BOS entry",
      error: error.message,
    });
  }
});

// GET /api/book-of-shadows/categories - Get all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await BookOfShadows.distinct("category");
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// POST /api/book-of-shadows - Create a new BOS entry
router.post("/", async (req, res) => {
  try {
    const bosEntry = new BookOfShadows(req.body);
    const savedEntry = await bosEntry.save();

    res.status(201).json({
      success: true,
      data: savedEntry,
      message: "BOS entry created successfully",
    });
  } catch (error) {
    console.error("Error creating BOS entry:", error);
    res.status(500).json({
      success: false,
      message: "Error creating BOS entry",
      error: error.message,
    });
  }
});

// PUT /api/book-of-shadows/:id - Update a BOS entry
router.put("/:id", async (req, res) => {
  try {
    const bosEntry = await BookOfShadows.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("references", "name description category");

    if (!bosEntry) {
      return res.status(404).json({
        success: false,
        message: "BOS entry not found",
      });
    }

    res.json({
      success: true,
      data: bosEntry,
      message: "BOS entry updated successfully",
    });
  } catch (error) {
    console.error("Error updating BOS entry:", error);
    res.status(500).json({
      success: false,
      message: "Error updating BOS entry",
      error: error.message,
    });
  }
});

// DELETE /api/book-of-shadows/:id - Soft delete a BOS entry
router.delete("/:id", async (req, res) => {
  try {
    const bosEntry = await BookOfShadows.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!bosEntry) {
      return res.status(404).json({
        success: false,
        message: "BOS entry not found",
      });
    }

    res.json({
      success: true,
      message: "BOS entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting BOS entry:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting BOS entry",
      error: error.message,
    });
  }
});

module.exports = router;
