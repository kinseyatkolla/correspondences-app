const mongoose = require("mongoose");
const config = require("./config");

// Import all seeding functions
const seedExtendedFlowerEssences = require("./seedExtendedFlowerEssences");
const seedCompleteTarotCards = require("./seedCompleteTarotCards");
const seedBookOfShadows = require("./seedBookOfShadows");
const seedLibrary = require("./seedLibrary");

async function seedProduction() {
  try {
    console.log("🌱 Starting production database seeding...");
    console.log("=" .repeat(50));

    // Seed all collections (each handles its own connection)
    console.log("\n📚 Seeding Library...");
    await seedLibrary();
    
    console.log("\n🌸 Seeding Extended Flower Essences...");
    await seedExtendedFlowerEssences();
    
    console.log("\n🃏 Seeding Complete Tarot Deck...");
    await seedCompleteTarotCards();
    
    console.log("\n📖 Seeding Book of Shadows...");
    await seedBookOfShadows();

    console.log("\n" + "=" .repeat(50));
    console.log("🎉 Production database seeding completed successfully!");
    console.log("=" .repeat(50));

    // Connect to show final summary
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas for summary");

    // Show final summary
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📊 Database Collections:");
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    
  } catch (error) {
    console.error("❌ Error seeding production database:", error);
    process.exit(1);
  }
}

// Run the master seed function
seedProduction();