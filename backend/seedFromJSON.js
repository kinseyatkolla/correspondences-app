const mongoose = require("mongoose");
const config = require("./config");
const FlowerEssence = require("./models/FlowerEssence");
const fs = require("fs");
const path = require("path");

async function seedFromJSON() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Read the JSON file
    const jsonPath = path.join(__dirname, "flowerEssences.json");
    
    if (!fs.existsSync(jsonPath)) {
      console.log("❌ flowerEssences.json not found!");
      console.log("Please create a flowerEssences.json file with your data.");
      console.log("Expected format:");
      console.log(JSON.stringify([
        {
          commonName: "Rose",
          latinName: "Rosa damascena",
          positiveQualities: ["Love", "Compassion"],
          patternsOfImbalance: ["Closed heart", "Fear of intimacy"],
          crossReferences: ["Bach Flower Remedies"],
          description: "The Rose essence opens the heart chakra...",
          imageName: "rose.jpg"
        }
      ], null, 2));
      process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    console.log(`📄 Found ${jsonData.length} flower essences in JSON file`);

    // Clear existing flower essences
    await FlowerEssence.deleteMany({});
    console.log("🗑️ Cleared existing flower essences");

    // Insert data from JSON
    const flowerEssences = await FlowerEssence.insertMany(jsonData);
    console.log(`✅ Seeded ${flowerEssences.length} flower essences from JSON`);

    // Show summary
    console.log("\n📊 Summary:");
    console.log(`Total flower essences: ${flowerEssences.length}`);
    
    const uniqueImages = [...new Set(flowerEssences.map(f => f.imageName).filter(Boolean))];
    console.log(`Unique images: ${uniqueImages.length}`);
    console.log("Images:", uniqueImages.join(", "));

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding from JSON:", error);
    process.exit(1);
  }
}

// Run the seed function
seedFromJSON();
