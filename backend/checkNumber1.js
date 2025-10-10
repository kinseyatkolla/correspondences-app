const mongoose = require("mongoose");
const config = require("./config");
const BookOfShadows = require("./models/BookOfShadows");

async function checkNumber1() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check the number 1 entry specifically
    const number1 = await BookOfShadows.findOne({ name: "1" });
    if (number1) {
      console.log(`\nNUMBER 1 (${number1.category}):`);
      console.log(`Description: ${number1.description}`);
      console.log("Correspondences:");
      if (number1.correspondences && number1.correspondences.length > 0) {
        number1.correspondences.forEach((corr) => {
          console.log(`  - ${corr.name} (${corr.type}, ${corr.relationship})`);
        });
      } else {
        console.log("  No correspondences found");
      }
    } else {
      console.log("Number 1 entry not found");
    }

    // Also check if magician exists and what its correspondences are
    const magician = await BookOfShadows.findOne({ name: "magician" });
    if (magician) {
      console.log(`\nMAGICIAN (${magician.category}):`);
      console.log(`Description: ${magician.description}`);
      console.log("Correspondences:");
      if (magician.correspondences && magician.correspondences.length > 0) {
        magician.correspondences.forEach((corr) => {
          console.log(`  - ${corr.name} (${corr.type}, ${corr.relationship})`);
        });
      } else {
        console.log("  No correspondences found");
      }
    }

    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  } catch (error) {
    console.error("Error checking number 1:", error);
    process.exit(1);
  }
}

checkNumber1();
