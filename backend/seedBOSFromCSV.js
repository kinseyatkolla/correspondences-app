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

function parseCorrespondences(correspondenceString, sourceEntry) {
  if (!correspondenceString || correspondenceString.trim() === "") {
    return [];
  }

  const correspondences = [];
  // Handle CSV parsing more carefully - split by comma but respect quoted strings
  const items = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < correspondenceString.length; i++) {
    const char = correspondenceString[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      items.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  items.push(current.trim());

  for (const item of items) {
    if (!item) continue;

    const cleanItem = item.replace(/^"|"$/g, ""); // Remove surrounding quotes

    // Handle multiple correspondences in one item (like "taurus high-priestess")
    const subItems = cleanItem.split(" ");
    for (const subItem of subItems) {
      const colonIndex = subItem.indexOf(":");
      if (colonIndex === -1) continue;

      const typePrefix = subItem.substring(0, colonIndex);
      const name = subItem.substring(colonIndex + 1);

      if (!name) continue;

      const type = typePrefix.replace("s", ""); // Remove plural 's'
      const relationship = determineRelationship(type, name, sourceEntry);

      correspondences.push({
        type: type,
        name: name,
        relationship: relationship,
        system: "traditional", // Default system
        strength: "primary", // Default strength
      });
    }
  }

  return correspondences;
}

function createBOSEntry(row) {
  const {
    name,
    wikiName,
    topicCategory,
    description,
    correspondences,
    keywords,
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
    correspondences,
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
    const csvPath = "/Users/kinseywatts/Downloads/BOS - seed.csv";
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
      if (columns.length < 6) continue; // Skip incomplete rows

      const row = {
        name: columns[0]?.trim(),
        wikiName: columns[1]?.trim(),
        topicCategory: columns[2]?.trim(),
        description: columns[3]?.trim(),
        correspondences: columns[4]?.trim(),
        keywords: columns[9]?.trim(), // keywords column
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
