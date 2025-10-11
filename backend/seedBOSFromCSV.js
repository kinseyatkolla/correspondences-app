const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const BookOfShadows = require("./models/BookOfShadows");

// Mapping from CSV topicCategory to our model category
const categoryMapping = {
  number: "number",
  element: "element",
  planet: "planet",
  zodiacSign: "zodiacSign",
  house: "house",
  modality: "modality",
  weekday: "weekday",
  season: "season",
  color: "color",
  aspect: "aspect",
  decan: "decan",
  tarotCard: "tarotCard",
  metal: "metal",
  wheelOfTheYear: "wheelOfTheYear",
};

// Simple function to determine relationship type - defaults to "correspondence"
// since the CSV only provides type and name
function determineRelationship(type, correspondenceName, sourceEntry) {
  // For now, just return "correspondence" as the default
  // You can expand this later as you add more specific relationship data
  return "correspondence";
}

function parseCSVLine(line) {
  const columns = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      columns.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  columns.push(current.trim());

  // Remove surrounding quotes from each column
  return columns.map((col) => col.replace(/^"|"$/g, ""));
}

function parseCorrespondences(correspondenceColumns, sourceEntry) {
  if (!correspondenceColumns || correspondenceColumns.length === 0) {
    return [];
  }

  const correspondences = [];

  for (const correspondenceName of correspondenceColumns) {
    if (!correspondenceName || correspondenceName.trim() === "") {
      continue;
    }

    const cleanName = correspondenceName.trim();

    // Determine the type based on the source entry's category and the correspondence name
    const type = determineCorrespondenceType(cleanName, sourceEntry);
    const relationship = determineRelationship(type, cleanName, sourceEntry);

    correspondences.push({
      type: type,
      name: cleanName,
      relationship: relationship,
      system: "traditional", // Default system
      strength: "primary", // Default strength
    });
  }

  return correspondences;
}

// Function to determine correspondence type based on the name and source context
function determineCorrespondenceType(name, sourceEntry) {
  // Define type patterns for common correspondences
  const typePatterns = {
    // Tarot cards
    tarotCard:
      /^(The )?(Fool|Magician|High Priestess|Empress|Emperor|Hierophant|Lovers|Chariot|Strength|Hermit|Wheel of Fortune|Justice|Hanged Man|Death|Temperance|Devil|Tower|Star|Moon|Sun|Judgement|World|Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) (of )?(Cups|Wands|Swords|Pentacles|Coins)$/i,

    // Zodiac signs
    zodiacSign:
      /^(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)$/i,

    // Planets
    planet:
      /^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)$/i,

    // Elements
    element: /^(Fire|Air|Earth|Water)$/i,

    // Colors
    color:
      /^(Red|Orange|Yellow|Green|Blue|Indigo|Violet|Black|White|Grey|Pink|Brown)$/i,

    // Weekdays
    weekday: /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/i,

    // Seasons
    season: /^(Spring|Summer|Fall|Winter)$/i,

    // Metals
    metal:
      /^(Gold|Silver|Mercury|Copper|Iron|Tin|Lead|Zinc|Cobalt|Bismuth) (metal)?$/i,

    // Numbers
    number: /^[0-9]+$/,

    // Modalities
    modality: /^(Cardinal|Fixed|Mutable)$/i,

    // Aspects
    aspect: /^(Conjunction|Opposition|Trine|Square|Quincunx|Sextile|Septile)$/i,

    // Houses
    house: /^([0-9]+(st|nd|rd|th))$/i,

    // Decans
    decan:
      /^(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces) [1-3]$/i,

    // Wheel of the Year
    wheelOfTheYear:
      /^(Winter Solstice|Midwinter|Yule|Imbolc|Candlemas|Spring Equinox|Ostara|Beltane|May Day|Summer Solstice|Midsummer|Litha|Lughnasadh|Lammas|Autumn Equinox|Mabon|Samhain|All Hallows)$/i,
  };

  // Check each pattern to determine type
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(name)) {
      return type;
    }
  }

  // Default fallback based on source entry category
  return sourceEntry.category || "other";
}

function createBOSEntry(row) {
  const {
    name,
    wikiName,
    topicCategory,
    description,
    keywords,
    correspondenceColumns,
  } = row;

  // Skip if no name or topicCategory
  if (!name || !topicCategory) {
    return null;
  }

  const category = categoryMapping[topicCategory] || "other";

  // Create the source entry object to pass to parseCorrespondences
  const sourceEntry = {
    name,
    category,
    topicCategory,
  };

  const parsedCorrespondences = parseCorrespondences(
    correspondenceColumns,
    sourceEntry
  );

  // Create keywords array
  const keywordArray = keywords
    ? keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k)
    : [name.toLowerCase(), category];

  return {
    name: name,
    wikiName: wikiName,
    description: description || `Information about ${name}`,
    category: category,
    content: description || `Correspondences and associations for ${name}`,
    keywords: keywordArray,
    correspondences: parsedCorrespondences,
    isActive: true,
  };
}

async function seedBOSFromCSV() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing BOS entries
    await BookOfShadows.deleteMany({});
    console.log("🗑️ Cleared existing BOS entries");

    // Read and parse CSV
    const csvPath = "/Users/kinseywatts/Downloads/BOS - seed (1).csv";
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const lines = csvContent.split("\n");

    // Skip header row
    const dataLines = lines.slice(1).filter((line) => line.trim());

    console.log(`📄 Processing ${dataLines.length} CSV entries...`);

    const bosEntries = [];
    const entriesByName = new Map(); // To track entries for correspondence linking

    // First pass: create all entries
    for (const line of dataLines) {
      // Parse CSV line properly handling quoted strings
      const columns = parseCSVLine(line);
      if (columns.length < 9) continue; // Skip incomplete rows

      // Extract correspondence columns (columns 9-17)
      const correspondenceColumns = columns
        .slice(9, 18)
        .filter((col) => col && col.trim() !== "");

      const row = {
        name: columns[0]?.trim(),
        wikiName: columns[1]?.trim(),
        topicCategory: columns[2]?.trim(),
        description: columns[3]?.trim(),
        images: columns[4]?.trim(),
        references: columns[5]?.trim(),
        keywords: columns[6]?.trim(), // keywords column
        tarotLink: columns[7]?.trim(),
        flowersLink: columns[8]?.trim(),
        correspondenceColumns: correspondenceColumns,
      };

      const entry = createBOSEntry(row);
      if (entry) {
        bosEntries.push(entry);
        entriesByName.set(entry.name.toLowerCase(), entry);
      }
    }

    // Insert entries to get their MongoDB _ids
    const savedEntries = await BookOfShadows.insertMany(bosEntries);
    console.log(`✅ Created ${savedEntries.length} BOS entries`);

    // Second pass: link correspondences with actual ObjectIds
    const entryMap = new Map();
    savedEntries.forEach((entry) => {
      entryMap.set(entry.name.toLowerCase(), entry);
    });

    const updatedEntries = [];

    for (const savedEntry of savedEntries) {
      const originalEntry = entriesByName.get(savedEntry.name.toLowerCase());
      if (!originalEntry || !originalEntry.correspondences.length) {
        continue;
      }

      const linkedCorrespondences = [];

      for (const corr of originalEntry.correspondences) {
        const linkedEntry = entryMap.get(corr.name.toLowerCase());
        if (linkedEntry) {
          linkedCorrespondences.push({
            _id: linkedEntry._id,
            type: corr.type,
            name: corr.name,
            relationship: corr.relationship,
            system: corr.system,
            strength: corr.strength,
          });
        }
      }

      if (linkedCorrespondences.length > 0) {
        updatedEntries.push({
          _id: savedEntry._id,
          correspondences: linkedCorrespondences,
        });
      }
    }

    // Update entries with linked correspondences
    for (const update of updatedEntries) {
      await BookOfShadows.findByIdAndUpdate(update._id, {
        correspondences: update.correspondences,
      });
    }

    console.log(
      `🔗 Linked correspondences for ${updatedEntries.length} entries`
    );

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

    // Show some example correspondences
    console.log("\n🔍 Example entries with correspondences:");
    const entriesWithCorr = await BookOfShadows.find({
      correspondences: { $exists: true, $not: { $size: 0 } },
    }).limit(3);

    entriesWithCorr.forEach((entry) => {
      console.log(`\n${entry.name} (${entry.category}):`);
      entry.correspondences.forEach((corr) => {
        console.log(`  - ${corr.name} (${corr.relationship})`);
      });
    });

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("Error seeding BOS from CSV:", error);
    process.exit(1);
  }
}

// Export the function
module.exports = seedBOSFromCSV;

// Run if called directly
if (require.main === module) {
  seedBOSFromCSV();
}
