const mongoose = require("mongoose");

const librarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    mediaType: {
      type: String,
      enum: ["book", "videolink", "audiolink", "article", "website", "other"],
      default: "book",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for better search performance
librarySchema.index({
  name: "text",
  description: "text",
  author: "text",
});
librarySchema.index({ name: 1 });
librarySchema.index({ mediaType: 1 });

module.exports = mongoose.model("Library", librarySchema);
