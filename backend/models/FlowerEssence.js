const mongoose = require("mongoose");

const flowerEssenceSchema = new mongoose.Schema(
  {
    commonName: {
      type: String,
      required: true,
      trim: true,
    },
    latinName: {
      type: String,
      required: true,
      trim: true,
    },
    positiveQualities: [
      {
        type: String,
        trim: true,
      },
    ],
    patternsOfImbalance: [
      {
        type: String,
        trim: true,
      },
    ],
    crossReferences: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for better search performance
flowerEssenceSchema.index({
  commonName: "text",
  latinName: "text",
  description: "text",
});
flowerEssenceSchema.index({ commonName: 1 });
flowerEssenceSchema.index({ latinName: 1 });

module.exports = mongoose.model("FlowerEssence", flowerEssenceSchema);
