/** Whole-sign house themes for sect-based election highlights. */

const HOUSE_TOPICS = {
  1: "Self & identity",
  2: "Money & possessions",
  3: "Communication, siblings & neighborhood",
  4: "Home & foundations",
  5: "Creativity, romance & dating",
  6: "Work & daily routines",
  7: "Partnerships & marriage",
  8: "Others' resources, debt & inheritance",
  9: "Higher learning, philosophy & travel abroad",
  10: "Career & public standing",
  11: "Community & allies",
  12: "Hidden matters, undoing & enemies",
};

function houseOrdinal(h) {
  if (h === 1) return "1st";
  if (h === 2) return "2nd";
  if (h === 3) return "3rd";
  return `${h}th`;
}

module.exports = {
  HOUSE_TOPICS,
  houseOrdinal,
};
