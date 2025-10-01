const mongoose = require("mongoose");

const bookOfShadowsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "numbers",
        "colors",
        "plants",
        "planets",
        "metals",
        "aspects",
        "zodiac-signs",
        "houses",
        "decans",
        "moon-phases",
        "seasons",
        "weekdays",
        "equinox-solstices",
        "tarot",
        "symbols",
        "other",
      ],
    },
    references: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookOfShadows",
      },
    ],
    content: {
      type: String,
      trim: true,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    correspondences: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for better search performance
bookOfShadowsSchema.index({
  name: "text",
  description: "text",
  content: "text",
  keywords: "text",
});
bookOfShadowsSchema.index({ name: 1 });
bookOfShadowsSchema.index({ category: 1 });
bookOfShadowsSchema.index({ isActive: 1 });

module.exports = mongoose.model("BookOfShadows", bookOfShadowsSchema);
