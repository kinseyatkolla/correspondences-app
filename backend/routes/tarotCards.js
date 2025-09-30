const express = require("express");
const router = express.Router();
const TarotCard = require("../models/TarotCard");

// GET /api/tarot-cards - Get all tarot cards
router.get("/", async (req, res) => {
  try {
    const { search, suit, limit = 200, page = 1 } = req.query;

    let query = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { uprightMeaning: { $regex: search, $options: "i" } },
          { reversedMeaning: { $regex: search, $options: "i" } },
          { keywords: { $in: [new RegExp(search, "i")] } },
        ],
      };
    }

    // Filter by suit
    if (suit) {
      query.suit = suit;
    }

    const tarotCards = await TarotCard.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ suit: 1, number: 1 });

    const total = await TarotCard.countDocuments(query);

    res.json({
      success: true,
      data: tarotCards,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching tarot cards:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tarot cards",
      error: error.message,
    });
  }
});

// GET /api/tarot-cards/random - Get a random tarot card
router.get("/random", async (req, res) => {
  try {
    const count = await TarotCard.countDocuments();
    const random = Math.floor(Math.random() * count);
    const randomCard = await TarotCard.findOne().skip(random);

    if (!randomCard) {
      return res.status(404).json({
        success: false,
        message: "No tarot cards found",
      });
    }

    res.json({
      success: true,
      data: randomCard,
    });
  } catch (error) {
    console.error("Error fetching random tarot card:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching random tarot card",
      error: error.message,
    });
  }
});

// GET /api/tarot-cards/:id - Get single tarot card
router.get("/:id", async (req, res) => {
  try {
    const tarotCard = await TarotCard.findById(req.params.id);

    if (!tarotCard) {
      return res.status(404).json({
        success: false,
        message: "Tarot card not found",
      });
    }

    res.json({
      success: true,
      data: tarotCard,
    });
  } catch (error) {
    console.error("Error fetching tarot card:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tarot card",
      error: error.message,
    });
  }
});

// POST /api/tarot-cards - Create new tarot card
router.post("/", async (req, res) => {
  try {
    const tarotCard = new TarotCard(req.body);
    await tarotCard.save();

    res.status(201).json({
      success: true,
      data: tarotCard,
      message: "Tarot card created successfully",
    });
  } catch (error) {
    console.error("Error creating tarot card:", error);
    res.status(400).json({
      success: false,
      message: "Error creating tarot card",
      error: error.message,
    });
  }
});

// PUT /api/tarot-cards/:id - Update tarot card
router.put("/:id", async (req, res) => {
  try {
    const tarotCard = await TarotCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!tarotCard) {
      return res.status(404).json({
        success: false,
        message: "Tarot card not found",
      });
    }

    res.json({
      success: true,
      data: tarotCard,
      message: "Tarot card updated successfully",
    });
  } catch (error) {
    console.error("Error updating tarot card:", error);
    res.status(400).json({
      success: false,
      message: "Error updating tarot card",
      error: error.message,
    });
  }
});

// DELETE /api/tarot-cards/:id - Delete tarot card
router.delete("/:id", async (req, res) => {
  try {
    const tarotCard = await TarotCard.findByIdAndDelete(req.params.id);

    if (!tarotCard) {
      return res.status(404).json({
        success: false,
        message: "Tarot card not found",
      });
    }

    res.json({
      success: true,
      message: "Tarot card deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tarot card:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting tarot card",
      error: error.message,
    });
  }
});

module.exports = router;
