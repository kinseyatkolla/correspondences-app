const mongoose = require("mongoose");
const config = require("./config");
const TarotCard = require("./models/TarotCard");
const tarotCardsData = require("./tarotCards.json");

async function seedTarotCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing tarot cards
    await TarotCard.deleteMany({});
    console.log("Cleared existing tarot cards");

    // Insert new tarot cards
    const tarotCards = await TarotCard.insertMany(tarotCardsData);
    console.log(`Seeded ${tarotCards.length} tarot cards`);

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding tarot cards:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedTarotCards();
