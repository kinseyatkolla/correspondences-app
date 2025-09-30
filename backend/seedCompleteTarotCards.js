const mongoose = require("mongoose");
const config = require("./config");
const TarotCard = require("./models/TarotCard");
const completeTarotCardsData = require("./tarotCardsComplete.json");

async function seedCompleteTarotCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing tarot cards
    await TarotCard.deleteMany({});
    console.log("Cleared existing tarot cards");

    // Insert complete tarot deck
    const tarotCards = await TarotCard.insertMany(completeTarotCardsData);
    console.log(`Seeded ${tarotCards.length} complete tarot cards`);

    // Log breakdown by suit
    const majorArcana = tarotCards.filter((card) => card.isMajorArcana).length;
    const cups = tarotCards.filter((card) => card.suit === "Cups").length;
    const wands = tarotCards.filter((card) => card.suit === "Wands").length;
    const swords = tarotCards.filter((card) => card.suit === "Swords").length;
    const pentacles = tarotCards.filter(
      (card) => card.suit === "Pentacles"
    ).length;

    console.log("\nDeck breakdown:");
    console.log(`Major Arcana: ${majorArcana} cards`);
    console.log(`Cups: ${cups} cards`);
    console.log(`Wands: ${wands} cards`);
    console.log(`Swords: ${swords} cards`);
    console.log(`Pentacles: ${pentacles} cards`);

    // Close connection
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error seeding complete tarot cards:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedCompleteTarotCards();
