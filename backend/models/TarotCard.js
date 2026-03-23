const mongoose = require("mongoose");

const tarotCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    suit: {
      type: String,
      required: true,
      enum: ["Major Arcana", "Cups", "Wands", "Swords", "Coins"],
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    esotericTitle: {
      type: String,
      trim: true,
    },
    decanKeyword: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    astrologicalCorrespondence: {
      type: String,
      trim: true,
    },
    element: {
      type: String,
      enum: ["Fire", "Water", "Air", "Earth"],
    },
    dates: {
      type: String,
      trim: true,
    },
    decan: {
      type: String,
      trim: true,
    },
    imageName: {
      type: String,
      trim: true,
    },
    isMajorArcana: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  },
);

// Create indexes for better search performance
tarotCardSchema.index({
  name: "text",
  description: "text",
  esotericTitle: "text",
  decanKeyword: "text",
  dates: "text",
  decan: "text",
});
tarotCardSchema.index({ name: 1 });
tarotCardSchema.index({ suit: 1 });
tarotCardSchema.index({ number: 1 });
tarotCardSchema.index({ isMajorArcana: 1 });

module.exports = mongoose.model("TarotCard", tarotCardSchema);
