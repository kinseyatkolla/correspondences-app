const mongoose = require("mongoose");
const config = require("./config");
const FlowerEssence = require("./models/FlowerEssence");

const sampleFlowerEssences = [
  {
    commonName: "Rose",
    latinName: "Rosa damascena",
    positiveQualities: [
      "Love",
      "Compassion",
      "Self-acceptance",
      "Emotional healing",
    ],
    patternsOfImbalance: [
      "Closed heart",
      "Fear of intimacy",
      "Emotional wounds",
      "Lack of self-love",
    ],
    crossReferences: ["Bach Flower Remedies", "Essential Oils", "Aromatherapy"],
    description:
      "The Rose essence opens the heart chakra and helps heal emotional wounds. It promotes self-love, compassion, and the ability to give and receive love freely.",
    imageName: "rose.jpg",
  },
  {
    commonName: "Lavender",
    latinName: "Lavandula angustifolia",
    positiveQualities: ["Calm", "Peace", "Relaxation", "Mental clarity"],
    patternsOfImbalance: [
      "Anxiety",
      "Restlessness",
      "Mental overstimulation",
      "Sleep disturbances",
    ],
    crossReferences: ["Essential Oils", "Herbal Medicine", "Aromatherapy"],
    description:
      "Lavender essence calms the nervous system and promotes deep relaxation. It helps with anxiety, insomnia, and mental overstimulation.",
    imageName: "lavender.jpg",
  },
  {
    commonName: "Sunflower",
    latinName: "Helianthus annuus",
    positiveQualities: ["Joy", "Optimism", "Vitality", "Confidence"],
    patternsOfImbalance: [
      "Depression",
      "Low energy",
      "Lack of confidence",
      "Pessimism",
    ],
    crossReferences: ["Bach Flower Remedies", "Herbal Medicine"],
    description:
      "Sunflower essence brings warmth and joy to the spirit. It helps overcome depression, boosts confidence, and restores optimism and vitality.",
    imageName: "sunflower.jpg",
  },
  {
    commonName: "Lily",
    latinName: "Lilium candidum",
    positiveQualities: [
      "Purity",
      "Renewal",
      "Spiritual connection",
      "Innocence",
    ],
    patternsOfImbalance: [
      "Spiritual disconnection",
      "Cynicism",
      "Loss of innocence",
      "Emotional heaviness",
    ],
    crossReferences: ["Bach Flower Remedies", "Spiritual Healing"],
    description:
      "Lily essence purifies the emotional and spiritual body. It helps restore innocence, spiritual connection, and emotional renewal.",
    imageName: "lily.jpg",
  },
  {
    commonName: "Orchid",
    latinName: "Orchis mascula",
    positiveQualities: ["Beauty", "Strength", "Elegance", "Resilience"],
    patternsOfImbalance: [
      "Low self-esteem",
      "Feeling unattractive",
      "Lack of confidence",
      "Fragility",
    ],
    crossReferences: ["Bach Flower Remedies", "Aromatherapy"],
    description:
      "Orchid essence enhances inner and outer beauty. It strengthens self-esteem, promotes elegance, and builds resilience and confidence.",
    imageName: "orchid.jpg",
  },
];

async function seedFlowerEssences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing flower essences
    await FlowerEssence.deleteMany({});
    console.log("Cleared existing flower essences");

    // Insert sample data
    const flowerEssences = await FlowerEssence.insertMany(sampleFlowerEssences);
    console.log(`Seeded ${flowerEssences.length} flower essences`);

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding flower essences:", error);
    process.exit(1);
  }
}

// Run the seed function
seedFlowerEssences();
