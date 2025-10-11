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
    wikiName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "number",
        "color",
        "element",
        "planet",
        "zodiacSign",
        "house",
        "modality",
        "weekday",
        "season",
        "aspect",
        "decan",
        "tarotCard",
        "flowerEssence",
        "crystal",
        "metal",
        "symbol",
        "wheelOfTheYear",
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
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BookOfShadows",
        },
        type: {
          type: String,
          required: true,
          enum: [
            "number",
            "zodiacSign",
            "planet",
            "element",
            "house",
            "modality",
            "weekday",
            "season",
            "color",
            "aspect",
            "decan",
            "tarotCard",
            "flowerEssence",
            "crystal",
            "metal",
            "symbol",
            "wheelOfTheYear",
            "other",
          ],
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        relationship: {
          type: String,
          required: true,
          enum: [
            "rulership",
            "exaltation",
            "fall",
            "detriment",
            "correspondence",
            "association",
            "element",
            "modality",
            "house",
            "aspect",
            "other",
          ],
        },
        system: {
          type: String,
          required: true,
          enum: ["western", "vedic", "traditional", "modern", "other"],
          default: "traditional",
        },
        strength: {
          type: String,
          enum: ["primary", "secondary", "tertiary"],
          default: "primary",
        },
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
