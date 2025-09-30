const mongoose = require("mongoose");
const config = require("./config");
const FlowerEssence = require("./models/FlowerEssence");
const extendedFlowerEssencesData = require("./flowerEssencesExtended.json");

async function seedExtendedFlowerEssences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing flower essences
    await FlowerEssence.deleteMany({});
    console.log("Cleared existing flower essences");

    // Insert new extended flower essences
    const flowerEssences = await FlowerEssence.insertMany(
      extendedFlowerEssencesData
    );
    console.log(`Seeded ${flowerEssences.length} extended flower essences`);

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding extended flower essences:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedExtendedFlowerEssences();
