const mongoose = require("mongoose");

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  console.error("Usage: MONGODB_URI='your-connection-string' node runSeed.js");
  process.exit(1);
}

// Override config to use the provided URI
const config = require("./config");
const originalURI = config.MONGODB_URI;
config.MONGODB_URI = MONGODB_URI;

const FlowerEssence = require("./models/FlowerEssence");
const TarotCard = require("./models/TarotCard");
const extendedFlowerEssencesData = require("./flowerEssencesExtended.json");
const completeTarotCardsData = require("./tarotCardsComplete.json");

async function runSeeds() {
  try {
    console.log("🌱 Starting database seeding...");
    console.log(
      "📍 Connection string:",
      MONGODB_URI.replace(/:[^:@]+@/, ":****@")
    );
    console.log("=".repeat(60));

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Show which database we're connected to
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);
    console.log("=".repeat(60));

    // Seed flower essences
    console.log("\n🌸 Seeding Flower Essences...");
    await FlowerEssence.deleteMany({});
    console.log("  Cleared existing flower essences");

    const flowerEssences = await FlowerEssence.insertMany(
      extendedFlowerEssencesData
    );
    console.log(`  ✅ Seeded ${flowerEssences.length} flower essences`);

    // Seed tarot cards
    console.log("\n🃏 Seeding Tarot Cards...");
    await TarotCard.deleteMany({});
    console.log("  Cleared existing tarot cards");

    const tarotCards = await TarotCard.insertMany(completeTarotCardsData);
    console.log(`  ✅ Seeded ${tarotCards.length} tarot cards`);

    // Show summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Final Summary:");

    const flowerCount = await FlowerEssence.countDocuments();
    const tarotCount = await TarotCard.countDocuments();

    console.log(`  Flower Essences: ${flowerCount} documents`);
    console.log(`  Tarot Cards: ${tarotCount} documents`);
    console.log("=".repeat(60));
    console.log("🎉 Seeding completed successfully!");

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the seeds
runSeeds();
