const mongoose = require("mongoose");
const Library = require("./models/Library");
require("dotenv").config();

const libraryData = [
  // Books
  {
    name: "The Complete Book of Correspondences",
    author: "Sandra Kynes",
    publisher: "Llewellyn Publications",
    year: 2003,
    isbn: "978-0738705298",
    description:
      "A comprehensive guide to magical correspondences including herbs, crystals, colors, and more.",
    mediaType: "book",
    sourceUrl: "https://www.lllewellyn.com/product.php?ean=9780738705298",
  },
  {
    name: "Cunningham's Encyclopedia of Magical Herbs",
    author: "Scott Cunningham",
    publisher: "Llewellyn Publications",
    year: 1985,
    isbn: "978-0875421223",
    description:
      "The definitive guide to magical herbs and their properties, correspondences, and uses.",
    mediaType: "book",
    sourceUrl: "https://www.lllewellyn.com/product.php?ean=9780875421223",
  },
  {
    name: "The Magical Household",
    author: "Scott Cunningham & David Harrington",
    publisher: "Llewellyn Publications",
    year: 1992,
    isbn: "978-0875421247",
    description:
      "Practical magic for everyday life, including household correspondences and rituals.",
    mediaType: "book",
    sourceUrl: "https://www.lllewellyn.com/product.php?ean=9780875421247",
  },
  {
    name: "Tarot for Your Self",
    author: "Mary K. Greer",
    publisher: "New Page Books",
    year: 2002,
    isbn: "978-1564145881",
    description:
      "A comprehensive guide to reading tarot cards for personal growth and insight.",
    mediaType: "book",
    sourceUrl: "https://www.newpagebooks.com/tarot-for-yourself",
  },
  {
    name: "Three Books of Occult Philosophy",
    author: "Heinrich Cornelius Agrippa",
    publisher: "Llewellyn Publications",
    year: 1651,
    description:
      "A foundational text of Western occultism, translated by James Freake.",
    mediaType: "book",
    sourceUrl: "https://www.lllewellyn.com/product.php?ean=9780875428321",
  },
  {
    name: "The Magus",
    author: "Francis Barrett",
    publisher: "Various",
    year: 1801,
    description:
      "A classic grimoire of ceremonial magic and occult philosophy.",
    mediaType: "book",
    sourceUrl: "https://www.sacred-texts.com/grim/magus/",
  },
  {
    name: "Crystal Enchantments",
    author: "D.J. Conway",
    publisher: "Llewellyn Publications",
    year: 1999,
    isbn: "978-1567188293",
    description: "A comprehensive guide to crystal magic and correspondences.",
    mediaType: "book",
    sourceUrl: "https://www.lllewellyn.com/product.php?ean=9781567188293",
  },
  {
    name: "Everyday Magic",
    author: "Dorothy Morrison",
    publisher: "Llewellyn Publications",
    year: 1998,
    isbn: "978-1567188293",
    description: "Practical magic for modern witches and pagans.",
    mediaType: "book",
    sourceUrl: "https://www.lllewellyn.com/product.php?ean=9781567188293",
  },

  // Video Resources
  {
    name: "Introduction to Magical Correspondences",
    author: "The Witch's Library",
    description:
      "A beginner-friendly series covering the basics of magical correspondences and how to use them.",
    mediaType: "videolink",
    sourceUrl: "https://www.youtube.com/playlist?list=PLxQjC9B_yKBhWv_sz5",
  },
  {
    name: "Herbal Magic Masterclass",
    author: "Green Witch Academy",
    description:
      "Deep dive into herbal correspondences, harvesting, and magical applications.",
    mediaType: "videolink",
    sourceUrl: "https://www.youtube.com/playlist?list=PLxQjC9B_yKBhWv_sz6",
  },
  {
    name: "Crystal Correspondences & Grids",
    author: "Crystal Wisdom",
    description:
      "Learn about crystal correspondences and how to create effective crystal grids.",
    mediaType: "videolink",
    sourceUrl: "https://www.youtube.com/playlist?list=PLxQjC9B_yKBhWv_sz7",
  },
  {
    name: "Astrology for Beginners",
    author: "Astrology Hub",
    description:
      "Complete guide to understanding astrological correspondences and chart reading.",
    mediaType: "videolink",
    sourceUrl: "https://www.youtube.com/playlist?list=PLxQjC9B_yKBhWv_sz8",
  },
  {
    name: "Tarot Card Meanings & Correspondences",
    author: "Biddy Tarot",
    description:
      "Learn tarot card meanings and their correspondences to elements, planets, and zodiac signs.",
    mediaType: "videolink",
    sourceUrl: "https://www.youtube.com/playlist?list=PLxQjC9B_yKBhWv_sz9",
  },

  // Audio Resources
  {
    name: "The Witch's Library Podcast",
    author: "Various",
    description:
      "Weekly podcast covering magical correspondences, spell work, and occult knowledge.",
    mediaType: "audiolink",
    sourceUrl: "https://www.spotify.com/show/witchslibrary",
  },
  {
    name: "Crystal Healing Meditations",
    author: "Crystal Wisdom",
    description:
      "Guided meditations using crystal correspondences for healing and manifestation.",
    mediaType: "audiolink",
    sourceUrl: "https://www.spotify.com/show/crystalhealing",
  },

  // Articles
  {
    name: "Understanding Magical Correspondences",
    author: "Witchipedia",
    description:
      "A comprehensive article explaining the theory and practice of magical correspondences.",
    mediaType: "article",
    sourceUrl: "https://www.witchipedia.com/correspondences",
  },
  {
    name: "Planetary Correspondences in Magic",
    author: "The Magickal Cat",
    description:
      "Detailed guide to planetary correspondences and their use in magical practice.",
    mediaType: "article",
    sourceUrl: "https://www.themagickalcat.com/planetary-correspondences",
  },
];

async function seedLibrary() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/correspondences"
    );
    console.log("Connected to MongoDB");

    // Clear existing library data
    await Library.deleteMany({});
    console.log("Cleared existing library data");

    // Insert new library data
    const insertedLibrary = await Library.insertMany(libraryData);
    console.log(`Inserted ${insertedLibrary.length} library items`);

    // Display summary by media type
    const summary = await Library.aggregate([
      {
        $group: {
          _id: "$mediaType",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\nLibrary Summary:");
    summary.forEach((item) => {
      console.log(`${item._id}: ${item.count} items`);
    });

    console.log("\nLibrary seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding library:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Export the function instead of running it
module.exports = seedLibrary;
