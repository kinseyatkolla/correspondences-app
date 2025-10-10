const mongoose = require("mongoose");
const config = require("./config");
const BookOfShadows = require("./models/BookOfShadows");

async function checkBOSData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get some examples of entries with correspondences
    console.log("\n🔍 Detailed Examples:");

    // Aries with its correspondences
    const aries = await BookOfShadows.findOne({ name: "aries" });
    if (aries) {
      console.log(`\n${aries.name.toUpperCase()} (${aries.category}):`);
      console.log(`Description: ${aries.description}`);
      console.log("Correspondences:");
      aries.correspondences.forEach((corr) => {
        console.log(`  - ${corr.name} (${corr.type}, ${corr.relationship})`);
      });
    }

    // Fire element
    const fire = await BookOfShadows.findOne({ name: "fire" });
    if (fire) {
      console.log(`\n${fire.name.toUpperCase()} (${fire.category}):`);
      console.log(`Description: ${fire.description}`);
      console.log("Correspondences:");
      fire.correspondences.forEach((corr) => {
        console.log(`  - ${corr.name} (${corr.type}, ${corr.relationship})`);
      });
    }

    // Mars planet
    const mars = await BookOfShadows.findOne({ name: "mars" });
    if (mars) {
      console.log(`\n${mars.name.toUpperCase()} (${mars.category}):`);
      console.log(`Description: ${mars.description}`);
      console.log("Correspondences:");
      mars.correspondences.forEach((corr) => {
        console.log(`  - ${corr.name} (${corr.type}, ${corr.relationship})`);
      });
    }

    // Magician tarot card
    const magician = await BookOfShadows.findOne({ name: "magician" });
    if (magician) {
      console.log(`\n${magician.name.toUpperCase()} (${magician.category}):`);
      console.log(`Description: ${magician.description}`);
      console.log("Correspondences:");
      magician.correspondences.forEach((corr) => {
        console.log(`  - ${corr.name} (${corr.type}, ${corr.relationship})`);
      });
    }

    // Count total correspondences
    const totalEntries = await BookOfShadows.countDocuments();
    const entriesWithCorrespondences = await BookOfShadows.countDocuments({
      correspondences: { $exists: true, $not: { $size: 0 } },
    });

    console.log(`\n📊 Summary:`);
    console.log(`Total entries: ${totalEntries}`);
    console.log(`Entries with correspondences: ${entriesWithCorrespondences}`);

    // Count correspondences by relationship type
    const pipeline = [
      { $unwind: "$correspondences" },
      { $group: { _id: "$correspondences.relationship", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const relationshipCounts = await BookOfShadows.aggregate(pipeline);
    console.log("\nCorrespondence relationships:");
    relationshipCounts.forEach((rel) => {
      console.log(`  ${rel._id}: ${rel.count}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  } catch (error) {
    console.error("Error checking BOS data:", error);
    process.exit(1);
  }
}

checkBOSData();
