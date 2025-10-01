const mongoose = require("mongoose");
const Library = require("./models/Library");
require("dotenv").config();

async function testLibrary() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/correspondences"
    );
    console.log("Connected to MongoDB");

    // Check total count
    const count = await Library.countDocuments();
    console.log(`Total library items: ${count}`);

    // Get sample items
    const sampleItems = await Library.find().limit(3);
    console.log("Sample items:");
    sampleItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.mediaType})`);
    });

    // Check by media type
    const mediaTypes = await Library.aggregate([
      {
        $group: {
          _id: "$mediaType",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\nItems by media type:");
    mediaTypes.forEach((item) => {
      console.log(`${item._id}: ${item.count} items`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

testLibrary();
