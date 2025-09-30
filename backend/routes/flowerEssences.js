const express = require("express");
const router = express.Router();
const FlowerEssence = require("../models/FlowerEssence");

// GET /api/flower-essences - Get all flower essences
router.get("/", async (req, res) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;

    let query = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { commonName: { $regex: search, $options: "i" } },
          { latinName: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    const flowerEssences = await FlowerEssence.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ commonName: 1 });

    const total = await FlowerEssence.countDocuments(query);

    res.json({
      success: true,
      data: flowerEssences,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching flower essences:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching flower essences",
      error: error.message,
    });
  }
});

// GET /api/flower-essences/random - Get a random flower essence
router.get("/random", async (req, res) => {
  try {
    const count = await FlowerEssence.countDocuments();
    const random = Math.floor(Math.random() * count);
    const randomFlower = await FlowerEssence.findOne().skip(random);

    if (!randomFlower) {
      return res.status(404).json({
        success: false,
        message: "No flower essences found",
      });
    }

    res.json({
      success: true,
      data: randomFlower,
    });
  } catch (error) {
    console.error("Error fetching random flower essence:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching random flower essence",
      error: error.message,
    });
  }
});

// GET /api/flower-essences/:id - Get single flower essence
router.get("/:id", async (req, res) => {
  try {
    const flowerEssence = await FlowerEssence.findById(req.params.id);

    if (!flowerEssence) {
      return res.status(404).json({
        success: false,
        message: "Flower essence not found",
      });
    }

    res.json({
      success: true,
      data: flowerEssence,
    });
  } catch (error) {
    console.error("Error fetching flower essence:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching flower essence",
      error: error.message,
    });
  }
});

// POST /api/flower-essences - Create new flower essence
router.post("/", async (req, res) => {
  try {
    const flowerEssence = new FlowerEssence(req.body);
    await flowerEssence.save();

    res.status(201).json({
      success: true,
      data: flowerEssence,
      message: "Flower essence created successfully",
    });
  } catch (error) {
    console.error("Error creating flower essence:", error);
    res.status(400).json({
      success: false,
      message: "Error creating flower essence",
      error: error.message,
    });
  }
});

// PUT /api/flower-essences/:id - Update flower essence
router.put("/:id", async (req, res) => {
  try {
    const flowerEssence = await FlowerEssence.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!flowerEssence) {
      return res.status(404).json({
        success: false,
        message: "Flower essence not found",
      });
    }

    res.json({
      success: true,
      data: flowerEssence,
      message: "Flower essence updated successfully",
    });
  } catch (error) {
    console.error("Error updating flower essence:", error);
    res.status(400).json({
      success: false,
      message: "Error updating flower essence",
      error: error.message,
    });
  }
});

// DELETE /api/flower-essences/:id - Delete flower essence
router.delete("/:id", async (req, res) => {
  try {
    const flowerEssence = await FlowerEssence.findByIdAndDelete(req.params.id);

    if (!flowerEssence) {
      return res.status(404).json({
        success: false,
        message: "Flower essence not found",
      });
    }

    res.json({
      success: true,
      message: "Flower essence deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting flower essence:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting flower essence",
      error: error.message,
    });
  }
});

module.exports = router;
