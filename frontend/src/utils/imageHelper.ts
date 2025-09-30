// Helper function to get flower emoji based on image name
export const getFlowerEmoji = (imageName?: string) => {
  if (!imageName) {
    return "🌸";
  }

  // Map image names to emojis
  const emojiMap: { [key: string]: string } = {
    "rose.jpg": "🌹",
    "lavender.jpg": "💜",
    "sunflower.jpg": "🌻",
    "lily.jpg": "🤍",
    "orchid.jpg": "🦋",
  };

  return emojiMap[imageName] || "🌸";
};
