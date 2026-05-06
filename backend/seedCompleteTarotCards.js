const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const TarotCard = require("./models/TarotCard");

const JSON_PATH = path.resolve(
  __dirname,
  "../tarotseedcomplete.json",
);

function splitKeywords(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return value
    .toString()
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseBoolean(value) {
  return String(value || "")
    .trim()
    .toLowerCase() === "true";
}

function normalizeSuit(value) {
  const suit = (value || "").trim();
  if (suit === "Pentacles") return "Coins";
  return suit;
}

function normalizeElement(value) {
  const raw = (value || "").trim();
  if (!raw) return undefined;

  const normalized = raw.toLowerCase();
  if (normalized === "fire") return "Fire";
  if (normalized === "water") return "Water";
  if (normalized === "air") return "Air";
  if (normalized === "earth") return "Earth";

  // Ignore non-standard values (e.g. "wildcard") to satisfy schema enum.
  return undefined;
}

function parseTarotJson(jsonPath) {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) return [];

  return records
    .map((rec) => {
      const description1 = (rec.description1 || "").trim();
      const description2 = (rec.description2 || "").trim();
      const combinedDescription = [description1, description2]
        .filter(Boolean)
        .join("\n\n");

      return {
        name: (rec.name || "").trim(),
        number: Number(rec.number),
        suit: normalizeSuit(rec.suit),
        esotericTitle: (rec.esotericTitle || "").trim(),
        decanKeyword: (rec.decanKeyword || "").trim(),
        keywords: splitKeywords(rec.keywords),
        keywords2: splitKeywords(rec.keywords2 ?? rec["keywords 2"]),
        dotsQuotes: (rec.dotsQuotes ?? rec["dots/quotes"] ?? "").trim(),
        description1,
        description2,
        description:
          (rec.description || "").trim() ||
          combinedDescription ||
          description1 ||
          description2,
        astrologicalCorrespondence: (rec.astrologicalCorrespondence || "").trim(),
        element: normalizeElement(rec.element),
        dates: (rec.dates || "").trim(),
        decan: (rec.decan || "").trim(),
        imageName: (rec.imageName || "").trim(),
        isMajorArcana: parseBoolean(rec.isMajorArcana),
      };
    })
    .filter(
      (card) =>
        card.name &&
        Number.isFinite(card.number) &&
        card.suit &&
        (card.description || card.description1 || card.description2),
    );
}

async function seedCompleteTarotCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing tarot cards
    await TarotCard.deleteMany({});
    console.log("Cleared existing tarot cards");

    const completeTarotCardsData = parseTarotJson(JSON_PATH);
    if (completeTarotCardsData.length === 0) {
      throw new Error(`No tarot rows parsed from JSON: ${JSON_PATH}`);
    }
    console.log(`Loaded ${completeTarotCardsData.length} tarot rows from JSON`);

    // Insert complete tarot deck
    const tarotCards = await TarotCard.insertMany(completeTarotCardsData);
    console.log(`Seeded ${tarotCards.length} complete tarot cards`);

    // Log breakdown by suit
    const majorArcana = tarotCards.filter((card) => card.isMajorArcana).length;
    const cups = tarotCards.filter((card) => card.suit === "Cups").length;
    const wands = tarotCards.filter((card) => card.suit === "Wands").length;
    const swords = tarotCards.filter((card) => card.suit === "Swords").length;
    const coins = tarotCards.filter((card) => card.suit === "Coins").length;

    console.log("\nDeck breakdown:");
    console.log(`Major Arcana: ${majorArcana} cards`);
    console.log(`Cups: ${cups} cards`);
    console.log(`Wands: ${wands} cards`);
    console.log(`Swords: ${swords} cards`);
    console.log(`Coins: ${coins} cards`);

    // Close connection
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error seeding complete tarot cards:", error);
    process.exit(1);
  }
}

// Export the function instead of running it
module.exports = seedCompleteTarotCards;

if (require.main === module) {
  seedCompleteTarotCards();
}
