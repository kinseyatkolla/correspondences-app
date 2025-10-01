const mongoose = require("mongoose");
const config = require("./config");
const BookOfShadows = require("./models/BookOfShadows");

async function seedBookOfShadows() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing BOS entries
    await BookOfShadows.deleteMany({});
    console.log("🗑️ Cleared existing BOS entries");

    const bosEntries = [];

    // Numbers (0-12)
    const numbers = [
      { num: 0, name: "Zero", meaning: "The void, potential, beginning" },
      { num: 1, name: "One", meaning: "Unity, individuality, leadership" },
      { num: 2, name: "Two", meaning: "Duality, partnership, balance" },
      { num: 3, name: "Three", meaning: "Trinity, creativity, expression" },
      { num: 4, name: "Four", meaning: "Stability, foundation, structure" },
      { num: 5, name: "Five", meaning: "Change, freedom, adventure" },
      { num: 6, name: "Six", meaning: "Harmony, responsibility, service" },
      { num: 7, name: "Seven", meaning: "Spirituality, wisdom, mystery" },
      { num: 8, name: "Eight", meaning: "Power, material success, authority" },
      { num: 9, name: "Nine", meaning: "Completion, fulfillment, endings" },
      { num: 10, name: "Ten", meaning: "Perfection, completion, new cycle" },
      {
        num: 11,
        name: "Eleven",
        meaning: "Intuition, inspiration, enlightenment",
      },
      { num: 12, name: "Twelve", meaning: "Cosmic order, completion, cycles" },
    ];

    numbers.forEach(({ num, name, meaning }) => {
      bosEntries.push({
        name: `${name} (${num})`,
        description: `The mystical significance and correspondences of the number ${num}`,
        category: "numbers",
        content: `The number ${num} represents ${meaning.toLowerCase()}. In numerology and magical traditions, ${num} holds deep symbolic meaning and is associated with various correspondences.`,
        keywords: [`${num}`, name.toLowerCase(), "numerology", "symbolism"],
        correspondences: ["Numerology", "Sacred Geometry", "Astrology"],
        isActive: true,
      });
    });

    // Colors (ROYGBV + additional)
    const colors = [
      { name: "Red", hex: "#FF0000", meaning: "Passion, energy, courage" },
      {
        name: "Orange",
        hex: "#FFA500",
        meaning: "Creativity, enthusiasm, joy",
      },
      {
        name: "Yellow",
        hex: "#FFFF00",
        meaning: "Intellect, optimism, clarity",
      },
      { name: "Green", hex: "#00FF00", meaning: "Nature, growth, healing" },
      { name: "Blue", hex: "#0000FF", meaning: "Communication, truth, calm" },
      {
        name: "Violet",
        hex: "#8A2BE2",
        meaning: "Spirituality, intuition, mystery",
      },
      {
        name: "White",
        hex: "#FFFFFF",
        meaning: "Purity, protection, new beginnings",
      },
      {
        name: "Black",
        hex: "#000000",
        meaning: "Mystery, protection, banishing",
      },
      {
        name: "Gold",
        hex: "#FFD700",
        meaning: "Divine energy, success, wisdom",
      },
      {
        name: "Silver",
        hex: "#C0C0C0",
        meaning: "Intuition, reflection, lunar energy",
      },
    ];

    colors.forEach(({ name, hex, meaning }) => {
      bosEntries.push({
        name: name,
        description: `The magical properties and correspondences of ${name}`,
        category: "colors",
        content: `${name} (${hex}) represents ${meaning.toLowerCase()}. This color is associated with specific chakras, elements, and magical properties in various traditions.`,
        keywords: [name.toLowerCase(), "color", "magic", "correspondence"],
        correspondences: ["Chakras", "Elements", "Crystals", "Candles"],
        isActive: true,
      });
    });

    // Planets (from ephemeris data)
    const planets = [
      { name: "Sun", symbol: "☉", meaning: "Vitality, ego, leadership" },
      { name: "Moon", symbol: "☽", meaning: "Emotions, intuition, cycles" },
      {
        name: "Mercury",
        symbol: "☿",
        meaning: "Communication, intellect, travel",
      },
      { name: "Venus", symbol: "♀", meaning: "Love, beauty, harmony" },
      { name: "Mars", symbol: "♂", meaning: "Action, courage, energy" },
      { name: "Jupiter", symbol: "♃", meaning: "Expansion, wisdom, luck" },
      { name: "Saturn", symbol: "♄", meaning: "Structure, discipline, karma" },
      { name: "Uranus", symbol: "♅", meaning: "Innovation, rebellion, change" },
      {
        name: "Neptune",
        symbol: "♆",
        meaning: "Intuition, dreams, spirituality",
      },
      {
        name: "Pluto",
        symbol: "♇",
        meaning: "Transformation, power, regeneration",
      },
    ];

    planets.forEach(({ name, symbol, meaning }) => {
      bosEntries.push({
        name: name,
        description: `The astrological and magical correspondences of ${name}`,
        category: "planets",
        content: `${name} ${symbol} represents ${meaning.toLowerCase()}. This planetary energy influences various aspects of life and magical work.`,
        keywords: [name.toLowerCase(), "planet", "astrology", "magic"],
        correspondences: ["Astrology", "Days of Week", "Metals", "Crystals"],
        isActive: true,
      });
    });

    // Zodiac Signs (all 12)
    const zodiacSigns = [
      {
        name: "Aries",
        symbol: "♈",
        element: "Fire",
        meaning: "Pioneering, energetic, assertive",
      },
      {
        name: "Taurus",
        symbol: "♉",
        element: "Earth",
        meaning: "Stable, sensual, determined",
      },
      {
        name: "Gemini",
        symbol: "♊",
        element: "Air",
        meaning: "Curious, adaptable, communicative",
      },
      {
        name: "Cancer",
        symbol: "♋",
        element: "Water",
        meaning: "Nurturing, intuitive, protective",
      },
      {
        name: "Leo",
        symbol: "♌",
        element: "Fire",
        meaning: "Creative, confident, generous",
      },
      {
        name: "Virgo",
        symbol: "♍",
        element: "Earth",
        meaning: "Analytical, practical, service-oriented",
      },
      {
        name: "Libra",
        symbol: "♎",
        element: "Air",
        meaning: "Diplomatic, harmonious, fair",
      },
      {
        name: "Scorpio",
        symbol: "♏",
        element: "Water",
        meaning: "Intense, transformative, mysterious",
      },
      {
        name: "Sagittarius",
        symbol: "♐",
        element: "Fire",
        meaning: "Adventurous, philosophical, optimistic",
      },
      {
        name: "Capricorn",
        symbol: "♑",
        element: "Earth",
        meaning: "Ambitious, disciplined, responsible",
      },
      {
        name: "Aquarius",
        symbol: "♒",
        element: "Air",
        meaning: "Innovative, humanitarian, independent",
      },
      {
        name: "Pisces",
        symbol: "♓",
        element: "Water",
        meaning: "Compassionate, intuitive, artistic",
      },
    ];

    zodiacSigns.forEach(({ name, symbol, element, meaning }) => {
      bosEntries.push({
        name: name,
        description: `The astrological correspondences and magical properties of ${name}`,
        category: "zodiac-signs",
        content: `${name} ${symbol} is a ${element} sign representing ${meaning.toLowerCase()}. This sign influences personality traits and magical correspondences.`,
        keywords: [
          name.toLowerCase(),
          "zodiac",
          element.toLowerCase(),
          "astrology",
        ],
        correspondences: ["Elements", "Planets", "Crystals", "Colors", "Tarot"],
        isActive: true,
      });
    });

    // Weekdays
    const weekdays = [
      {
        name: "Sunday",
        planet: "Sun",
        meaning: "Vitality, success, leadership",
      },
      {
        name: "Monday",
        planet: "Moon",
        meaning: "Intuition, emotions, psychic work",
      },
      {
        name: "Tuesday",
        planet: "Mars",
        meaning: "Courage, action, protection",
      },
      {
        name: "Wednesday",
        planet: "Mercury",
        meaning: "Communication, learning, travel",
      },
      {
        name: "Thursday",
        planet: "Jupiter",
        meaning: "Expansion, luck, wisdom",
      },
      { name: "Friday", planet: "Venus", meaning: "Love, beauty, harmony" },
      {
        name: "Saturday",
        planet: "Saturn",
        meaning: "Discipline, karma, banishing",
      },
    ];

    weekdays.forEach(({ name, planet, meaning }) => {
      bosEntries.push({
        name: name,
        description: `The magical correspondences and energies of ${name}`,
        category: "weekdays",
        content: `${name} is ruled by ${planet} and represents ${meaning.toLowerCase()}. This day is optimal for specific types of magical work.`,
        keywords: [name.toLowerCase(), planet.toLowerCase(), "day", "magic"],
        correspondences: ["Planets", "Colors", "Crystals", "Rituals"],
        isActive: true,
      });
    });

    // Insert all entries
    const savedEntries = await BookOfShadows.insertMany(bosEntries);
    console.log(`✅ Seeded ${savedEntries.length} BOS entries`);

    // Show summary by category
    const categoryCounts = {};
    savedEntries.forEach((entry) => {
      categoryCounts[entry.category] =
        (categoryCounts[entry.category] || 0) + 1;
    });

    console.log("\n📊 Summary by Category:");
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`${category}: ${count} entries`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("Error seeding BOS entries:", error);
    process.exit(1);
  }
}

// Run the seed function
seedBookOfShadows();
