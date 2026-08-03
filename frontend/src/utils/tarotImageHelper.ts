import type { ImageSourcePropType } from "react-native";

export type TarotDeckId = "rws" | "correspondences";

export const TAROT_DECKS: { id: TarotDeckId; label: string }[] = [
  { id: "rws", label: "Rider-Waite-Smith" },
  { id: "correspondences", label: "Correspondences Deck" },
];

/** API `imageName` → bundled RWS filename; same keys used by `getTarotImages` / draw screen. */
export const IMAGE_NAME_TO_RWS_FILE: Record<string, string> = {
  "fool.jpg": "RWSa-T-00.png",
  "magician.jpg": "RWSa-T-01.png",
  "high-priestess.jpg": "RWSa-T-02.png",
  "empress.jpg": "RWSa-T-03.png",
  "emperor.jpg": "RWSa-T-04.png",
  "hierophant.jpg": "RWSa-T-05.png",
  "lovers.jpg": "RWSa-T-06.png",
  "chariot.jpg": "RWSa-T-07.png",
  "strength.jpg": "RWSa-T-08.png",
  "hermit.jpg": "RWSa-T-09.png",
  "wheel-of-fortune.jpg": "RWSa-T-10.png",
  "justice.jpg": "RWSa-T-11.png",
  "hanged-man.jpg": "RWSa-T-12.png",
  "death.jpg": "RWSa-T-13.png",
  "temperance.jpg": "RWSa-T-14.png",
  "devil.jpg": "RWSa-T-15.png",
  "tower.jpg": "RWSa-T-16.png",
  "star.jpg": "RWSa-T-17.png",
  "moon.jpg": "RWSa-T-18.png",
  "sun.jpg": "RWSa-T-19.png",
  "judgement.jpg": "RWSa-T-20.png",
  "world.jpg": "RWSa-T-21.png",
  "ace-cups.jpg": "RWSa-C-02.png",
  "two-cups.jpg": "RWSa-C-03.png",
  "three-cups.jpg": "RWSa-C-04.png",
  "four-cups.jpg": "RWSa-C-05.png",
  "five-cups.jpg": "RWSa-C-06.png",
  "six-cups.jpg": "RWSa-C-07.png",
  "seven-cups.jpg": "RWSa-C-08.png",
  "eight-cups.jpg": "RWSa-C-09.png",
  "nine-cups.jpg": "RWSa-C-10.png",
  "ten-cups.jpg": "RWSa-C-0A.png",
  "page-cups.jpg": "RWSa-C-J1.png",
  "knight-cups.jpg": "RWSa-C-J2.png",
  "queen-cups.jpg": "RWSa-C-QU.png",
  "king-cups.jpg": "RWSa-C-KI.png",
  "ace-of-wands.jpg": "RWSa-W-02.png",
  "two-of-wands.jpg": "RWSa-W-03.png",
  "three-of-wands.jpg": "RWSa-W-04.png",
  "four-of-wands.jpg": "RWSa-W-05.png",
  "five-of-wands.jpg": "RWSa-W-06.png",
  "six-of-wands.jpg": "RWSa-W-07.png",
  "seven-of-wands.jpg": "RWSa-W-08.png",
  "eight-of-wands.jpg": "RWSa-W-09.png",
  "nine-of-wands.jpg": "RWSa-W-10.png",
  "ten-of-wands.jpg": "RWSa-W-0A.png",
  "page-of-wands.jpg": "RWSa-W-J1.png",
  "knight-of-wands.jpg": "RWSa-W-J2.png",
  "queen-of-wands.jpg": "RWSa-W-QU.png",
  "king-of-wands.jpg": "RWSa-W-KI.png",
  "ace-of-swords.jpg": "RWSa-S-02.png",
  "two-of-swords.jpg": "RWSa-S-03.png",
  "three-of-swords.jpg": "RWSa-S-04.png",
  "four-of-swords.jpg": "RWSa-S-05.png",
  "five-of-swords.jpg": "RWSa-S-06.png",
  "six-of-swords.jpg": "RWSa-S-07.png",
  "seven-of-swords.jpg": "RWSa-S-08.png",
  "eight-of-swords.jpg": "RWSa-S-09.png",
  "nine-of-swords.jpg": "RWSa-S-10.png",
  "ten-of-swords.jpg": "RWSa-S-0A.png",
  "page-of-swords.jpg": "RWSa-S-J1.png",
  "knight-of-swords.jpg": "RWSa-S-J2.png",
  "queen-of-swords.jpg": "RWSa-S-QU.png",
  "king-of-swords.jpg": "RWSa-S-KI.png",
  "ace-of-pentacles.jpg": "RWSa-P-02.png",
  "two-of-pentacles.jpg": "RWSa-P-03.png",
  "three-of-pentacles.jpg": "RWSa-P-04.png",
  "four-of-pentacles.jpg": "RWSa-P-05.png",
  "five-of-pentacles.jpg": "RWSa-P-06.png",
  "six-of-pentacles.jpg": "RWSa-P-07.png",
  "seven-of-pentacles.jpg": "RWSa-P-08.png",
  "eight-of-pentacles.jpg": "RWSa-P-09.png",
  "nine-of-pentacles.jpg": "RWSa-P-10.png",
  "ten-of-pentacles.jpg": "RWSa-P-0A.png",
  "page-of-pentacles.jpg": "RWSa-P-J1.png",
  "knight-of-pentacles.jpg": "RWSa-P-J2.png",
  "queen-of-pentacles.jpg": "RWSa-P-QU.png",
  "king-of-pentacles.jpg": "RWSa-P-KI.png",
};

const TAROT_FACE_FALLBACK_FILE = "RWSa-T-00.png";

function fileCodeFromMinorNumber(n: number): string {
  // RWS filenames use decimal "10" for the 9 and hex "0A" for the 10.
  if (n === 9) return "10";
  if (n === 10) return "0A";
  return (n + 1).toString(16).toUpperCase().padStart(2, "0");
}

/** Supports new DB file-style names like `0-fool.png` and `cups-12-knight.png`. */
function rwsFileFromImageFileName(imageName: string): string | undefined {
  const lower = imageName.trim().toLowerCase();

  // Major arcana: `0-fool.png` ... `21-world.png`
  const majorMatch = lower.match(/^(\d{1,2})-[a-z0-9-]+\.png$/);
  if (majorMatch) {
    const major = Number(majorMatch[1]);
    if (major >= 0 && major <= 21) {
      return `RWSa-T-${major.toString().padStart(2, "0")}.png`;
    }
  }

  // Minor arcana: `cups-01.png` ... `cups-14-king.png`
  const minorMatch = lower.match(
    /^(cups|wands|swords|pentacles|coins)-(\d{2})(?:-(page|knight|queen|king))?\.png$/,
  );
  if (!minorMatch) return undefined;

  const suitRaw = minorMatch[1];
  const n = Number(minorMatch[2]);
  const role = minorMatch[3];

  const suitCode =
    suitRaw === "cups"
      ? "C"
      : suitRaw === "wands"
        ? "W"
        : suitRaw === "swords"
          ? "S"
          : "P";

  if (n >= 1 && n <= 10) {
    return `RWSa-${suitCode}-${fileCodeFromMinorNumber(n)}.png`;
  }
  if (n === 11 && role === "page") return `RWSa-${suitCode}-J1.png`;
  if (n === 12 && role === "knight") return `RWSa-${suitCode}-J2.png`;
  if (n === 13 && role === "queen") return `RWSa-${suitCode}-QU.png`;
  if (n === 14 && role === "king") return `RWSa-${suitCode}-KI.png`;

  return undefined;
}

function resolveRwsFileKey(imageName?: string | null): string | undefined {
  if (!imageName) return undefined;
  return (
    IMAGE_NAME_TO_RWS_FILE[imageName] ||
    rwsFileFromImageFileName(imageName) ||
    undefined
  );
}

/** Resolve a face image using the same pipeline as the draw screen (`getTarotImages` + RWS file key). */
export function resolveTarotFaceFromMap(
  images: Record<string, ImageSourcePropType>,
  imageName?: string | null,
): ImageSourcePropType {
  const file = resolveRwsFileKey(imageName);
  return ((file && images[file]) ||
    images[TAROT_FACE_FALLBACK_FILE]) as ImageSourcePropType;
}

const RWS_IMAGES: Record<string, ImageSourcePropType> = {
  "RWSa-C-02.png": require("../../assets/images/tarot/rws/RWSa-C-02.png"),
  "RWSa-C-03.png": require("../../assets/images/tarot/rws/RWSa-C-03.png"),
  "RWSa-C-04.png": require("../../assets/images/tarot/rws/RWSa-C-04.png"),
  "RWSa-C-05.png": require("../../assets/images/tarot/rws/RWSa-C-05.png"),
  "RWSa-C-06.png": require("../../assets/images/tarot/rws/RWSa-C-06.png"),
  "RWSa-C-07.png": require("../../assets/images/tarot/rws/RWSa-C-07.png"),
  "RWSa-C-08.png": require("../../assets/images/tarot/rws/RWSa-C-08.png"),
  "RWSa-C-09.png": require("../../assets/images/tarot/rws/RWSa-C-09.png"),
  "RWSa-C-0A.png": require("../../assets/images/tarot/rws/RWSa-C-0A.png"),
  "RWSa-C-10.png": require("../../assets/images/tarot/rws/RWSa-C-10.png"),
  "RWSa-C-J1.png": require("../../assets/images/tarot/rws/RWSa-C-J1.png"),
  "RWSa-C-J2.png": require("../../assets/images/tarot/rws/RWSa-C-J2.png"),
  "RWSa-C-KI.png": require("../../assets/images/tarot/rws/RWSa-C-KI.png"),
  "RWSa-C-QU.png": require("../../assets/images/tarot/rws/RWSa-C-QU.png"),
  "RWSa-P-02.png": require("../../assets/images/tarot/rws/RWSa-P-02.png"),
  "RWSa-P-03.png": require("../../assets/images/tarot/rws/RWSa-P-03.png"),
  "RWSa-P-04.png": require("../../assets/images/tarot/rws/RWSa-P-04.png"),
  "RWSa-P-05.png": require("../../assets/images/tarot/rws/RWSa-P-05.png"),
  "RWSa-P-06.png": require("../../assets/images/tarot/rws/RWSa-P-06.png"),
  "RWSa-P-07.png": require("../../assets/images/tarot/rws/RWSa-P-07.png"),
  "RWSa-P-08.png": require("../../assets/images/tarot/rws/RWSa-P-08.png"),
  "RWSa-P-09.png": require("../../assets/images/tarot/rws/RWSa-P-09.png"),
  "RWSa-P-0A.png": require("../../assets/images/tarot/rws/RWSa-P-0A.png"),
  "RWSa-P-10.png": require("../../assets/images/tarot/rws/RWSa-P-10.png"),
  "RWSa-P-J1.png": require("../../assets/images/tarot/rws/RWSa-P-J1.png"),
  "RWSa-P-J2.png": require("../../assets/images/tarot/rws/RWSa-P-J2.png"),
  "RWSa-P-KI.png": require("../../assets/images/tarot/rws/RWSa-P-KI.png"),
  "RWSa-P-QU.png": require("../../assets/images/tarot/rws/RWSa-P-QU.png"),
  "RWSa-S-02.png": require("../../assets/images/tarot/rws/RWSa-S-02.png"),
  "RWSa-S-03.png": require("../../assets/images/tarot/rws/RWSa-S-03.png"),
  "RWSa-S-04.png": require("../../assets/images/tarot/rws/RWSa-S-04.png"),
  "RWSa-S-05.png": require("../../assets/images/tarot/rws/RWSa-S-05.png"),
  "RWSa-S-06.png": require("../../assets/images/tarot/rws/RWSa-S-06.png"),
  "RWSa-S-07.png": require("../../assets/images/tarot/rws/RWSa-S-07.png"),
  "RWSa-S-08.png": require("../../assets/images/tarot/rws/RWSa-S-08.png"),
  "RWSa-S-09.png": require("../../assets/images/tarot/rws/RWSa-S-09.png"),
  "RWSa-S-0A.png": require("../../assets/images/tarot/rws/RWSa-S-0A.png"),
  "RWSa-S-10.png": require("../../assets/images/tarot/rws/RWSa-S-10.png"),
  "RWSa-S-J1.png": require("../../assets/images/tarot/rws/RWSa-S-J1.png"),
  "RWSa-S-J2.png": require("../../assets/images/tarot/rws/RWSa-S-J2.png"),
  "RWSa-S-KI.png": require("../../assets/images/tarot/rws/RWSa-S-KI.png"),
  "RWSa-S-QU.png": require("../../assets/images/tarot/rws/RWSa-S-QU.png"),
  "RWSa-T-00.png": require("../../assets/images/tarot/rws/RWSa-T-00.png"),
  "RWSa-T-01.png": require("../../assets/images/tarot/rws/RWSa-T-01.png"),
  "RWSa-T-02.png": require("../../assets/images/tarot/rws/RWSa-T-02.png"),
  "RWSa-T-03.png": require("../../assets/images/tarot/rws/RWSa-T-03.png"),
  "RWSa-T-04.png": require("../../assets/images/tarot/rws/RWSa-T-04.png"),
  "RWSa-T-05.png": require("../../assets/images/tarot/rws/RWSa-T-05.png"),
  "RWSa-T-06.png": require("../../assets/images/tarot/rws/RWSa-T-06.png"),
  "RWSa-T-07.png": require("../../assets/images/tarot/rws/RWSa-T-07.png"),
  "RWSa-T-08.png": require("../../assets/images/tarot/rws/RWSa-T-08.png"),
  "RWSa-T-09.png": require("../../assets/images/tarot/rws/RWSa-T-09.png"),
  "RWSa-T-10.png": require("../../assets/images/tarot/rws/RWSa-T-10.png"),
  "RWSa-T-11.png": require("../../assets/images/tarot/rws/RWSa-T-11.png"),
  "RWSa-T-12.png": require("../../assets/images/tarot/rws/RWSa-T-12.png"),
  "RWSa-T-13.png": require("../../assets/images/tarot/rws/RWSa-T-13.png"),
  "RWSa-T-14.png": require("../../assets/images/tarot/rws/RWSa-T-14.png"),
  "RWSa-T-15.png": require("../../assets/images/tarot/rws/RWSa-T-15.png"),
  "RWSa-T-16.png": require("../../assets/images/tarot/rws/RWSa-T-16.png"),
  "RWSa-T-17.png": require("../../assets/images/tarot/rws/RWSa-T-17.png"),
  "RWSa-T-18.png": require("../../assets/images/tarot/rws/RWSa-T-18.png"),
  "RWSa-T-19.png": require("../../assets/images/tarot/rws/RWSa-T-19.png"),
  "RWSa-T-20.png": require("../../assets/images/tarot/rws/RWSa-T-20.png"),
  "RWSa-T-21.png": require("../../assets/images/tarot/rws/RWSa-T-21.png"),
  "RWSa-W-02.png": require("../../assets/images/tarot/rws/RWSa-W-02.png"),
  "RWSa-W-03.png": require("../../assets/images/tarot/rws/RWSa-W-03.png"),
  "RWSa-W-04.png": require("../../assets/images/tarot/rws/RWSa-W-04.png"),
  "RWSa-W-05.png": require("../../assets/images/tarot/rws/RWSa-W-05.png"),
  "RWSa-W-06.png": require("../../assets/images/tarot/rws/RWSa-W-06.png"),
  "RWSa-W-07.png": require("../../assets/images/tarot/rws/RWSa-W-07.png"),
  "RWSa-W-08.png": require("../../assets/images/tarot/rws/RWSa-W-08.png"),
  "RWSa-W-09.png": require("../../assets/images/tarot/rws/RWSa-W-09.png"),
  "RWSa-W-0A.png": require("../../assets/images/tarot/rws/RWSa-W-0A.png"),
  "RWSa-W-10.png": require("../../assets/images/tarot/rws/RWSa-W-10.png"),
  "RWSa-W-J1.png": require("../../assets/images/tarot/rws/RWSa-W-J1.png"),
  "RWSa-W-J2.png": require("../../assets/images/tarot/rws/RWSa-W-J2.png"),
  "RWSa-W-KI.png": require("../../assets/images/tarot/rws/RWSa-W-KI.png"),
  "RWSa-W-QU.png": require("../../assets/images/tarot/rws/RWSa-W-QU.png"),
};

const CORRESPONDENCES_IMAGES: Record<string, ImageSourcePropType> = {
  "RWSa-C-02.png": require("../../assets/images/tarot/correspondences/cups-01.png"),
  "RWSa-C-03.png": require("../../assets/images/tarot/correspondences/cups-02.png"),
  "RWSa-C-04.png": require("../../assets/images/tarot/correspondences/cups-03.png"),
  "RWSa-C-05.png": require("../../assets/images/tarot/correspondences/cups-04.png"),
  "RWSa-C-06.png": require("../../assets/images/tarot/correspondences/cups-05.png"),
  "RWSa-C-07.png": require("../../assets/images/tarot/correspondences/cups-06.png"),
  "RWSa-C-08.png": require("../../assets/images/tarot/correspondences/cups-07.png"),
  "RWSa-C-09.png": require("../../assets/images/tarot/correspondences/cups-08.png"),
  "RWSa-C-0A.png": require("../../assets/images/tarot/correspondences/cups-10.png"),
  "RWSa-C-10.png": require("../../assets/images/tarot/correspondences/cups-09.png"),
  "RWSa-C-J1.png": require("../../assets/images/tarot/correspondences/cups-11-page.png"),
  "RWSa-C-J2.png": require("../../assets/images/tarot/correspondences/cups-12-knight.png"),
  "RWSa-C-KI.png": require("../../assets/images/tarot/correspondences/cups-14-king.png"),
  "RWSa-C-QU.png": require("../../assets/images/tarot/correspondences/cups-13-queen.png"),
  "RWSa-P-02.png": require("../../assets/images/tarot/correspondences/pentacles-01.png"),
  "RWSa-P-03.png": require("../../assets/images/tarot/correspondences/pentacles-02.png"),
  "RWSa-P-04.png": require("../../assets/images/tarot/correspondences/pentacles-03.png"),
  "RWSa-P-05.png": require("../../assets/images/tarot/correspondences/pentacles-04.png"),
  "RWSa-P-06.png": require("../../assets/images/tarot/correspondences/pentacles-05.png"),
  "RWSa-P-07.png": require("../../assets/images/tarot/correspondences/pentacles-06.png"),
  "RWSa-P-08.png": require("../../assets/images/tarot/correspondences/pentacles-07.png"),
  "RWSa-P-09.png": require("../../assets/images/tarot/correspondences/pentacles-08.png"),
  "RWSa-P-0A.png": require("../../assets/images/tarot/correspondences/pentacles-10.png"),
  "RWSa-P-10.png": require("../../assets/images/tarot/correspondences/pentacles-09.png"),
  "RWSa-P-J1.png": require("../../assets/images/tarot/correspondences/pentacles-11-page.png"),
  "RWSa-P-J2.png": require("../../assets/images/tarot/correspondences/pentacles-12-knight.png"),
  "RWSa-P-KI.png": require("../../assets/images/tarot/correspondences/pentacles-14-king.png"),
  "RWSa-P-QU.png": require("../../assets/images/tarot/correspondences/pentacles-13-queen.png"),
  "RWSa-S-02.png": require("../../assets/images/tarot/correspondences/swords-01.png"),
  "RWSa-S-03.png": require("../../assets/images/tarot/correspondences/swords-02.png"),
  "RWSa-S-04.png": require("../../assets/images/tarot/correspondences/swords-03.png"),
  "RWSa-S-05.png": require("../../assets/images/tarot/correspondences/swords-04.png"),
  "RWSa-S-06.png": require("../../assets/images/tarot/correspondences/swords-05.png"),
  "RWSa-S-07.png": require("../../assets/images/tarot/correspondences/swords-06.png"),
  "RWSa-S-08.png": require("../../assets/images/tarot/correspondences/swords-07.png"),
  "RWSa-S-09.png": require("../../assets/images/tarot/correspondences/swords-08.png"),
  "RWSa-S-0A.png": require("../../assets/images/tarot/correspondences/swords-10.png"),
  "RWSa-S-10.png": require("../../assets/images/tarot/correspondences/swords-09.png"),
  "RWSa-S-J1.png": require("../../assets/images/tarot/correspondences/swords-11-page.png"),
  "RWSa-S-J2.png": require("../../assets/images/tarot/correspondences/swords-12-knight.png"),
  "RWSa-S-KI.png": require("../../assets/images/tarot/correspondences/swords-14-king.png"),
  "RWSa-S-QU.png": require("../../assets/images/tarot/correspondences/swords-13-queen.png"),
  "RWSa-T-00.png": require("../../assets/images/tarot/correspondences/0-fool.png"),
  "RWSa-T-01.png": require("../../assets/images/tarot/correspondences/1-magician.png"),
  "RWSa-T-02.png": require("../../assets/images/tarot/correspondences/2-highpriestess.png"),
  "RWSa-T-03.png": require("../../assets/images/tarot/correspondences/3-empress.png"),
  "RWSa-T-04.png": require("../../assets/images/tarot/correspondences/4-emperor.png"),
  "RWSa-T-05.png": require("../../assets/images/tarot/correspondences/5-heirophant.png"),
  "RWSa-T-06.png": require("../../assets/images/tarot/correspondences/6-lovers.png"),
  "RWSa-T-07.png": require("../../assets/images/tarot/correspondences/7-chariot.png"),
  "RWSa-T-08.png": require("../../assets/images/tarot/correspondences/8-strength.png"),
  "RWSa-T-09.png": require("../../assets/images/tarot/correspondences/9-hermit.png"),
  "RWSa-T-10.png": require("../../assets/images/tarot/correspondences/10-wheel.png"),
  "RWSa-T-11.png": require("../../assets/images/tarot/correspondences/11-justice.png"),
  "RWSa-T-12.png": require("../../assets/images/tarot/correspondences/12-hangedman.png"),
  "RWSa-T-13.png": require("../../assets/images/tarot/correspondences/13-death.png"),
  "RWSa-T-14.png": require("../../assets/images/tarot/correspondences/14-temperance.png"),
  "RWSa-T-15.png": require("../../assets/images/tarot/correspondences/15-devil.png"),
  "RWSa-T-16.png": require("../../assets/images/tarot/correspondences/16-tower.png"),
  "RWSa-T-17.png": require("../../assets/images/tarot/correspondences/17-star.png"),
  "RWSa-T-18.png": require("../../assets/images/tarot/correspondences/18-moon.png"),
  "RWSa-T-19.png": require("../../assets/images/tarot/correspondences/19-sun.png"),
  "RWSa-T-20.png": require("../../assets/images/tarot/correspondences/20-judgement.png"),
  "RWSa-T-21.png": require("../../assets/images/tarot/correspondences/21-world.png"),
  "RWSa-W-02.png": require("../../assets/images/tarot/correspondences/wands-01.png"),
  "RWSa-W-03.png": require("../../assets/images/tarot/correspondences/wands-02.png"),
  "RWSa-W-04.png": require("../../assets/images/tarot/correspondences/wands-03.png"),
  "RWSa-W-05.png": require("../../assets/images/tarot/correspondences/wands-04.png"),
  "RWSa-W-06.png": require("../../assets/images/tarot/correspondences/wands-05.png"),
  "RWSa-W-07.png": require("../../assets/images/tarot/correspondences/wands-06.png"),
  "RWSa-W-08.png": require("../../assets/images/tarot/correspondences/wands-07.png"),
  "RWSa-W-09.png": require("../../assets/images/tarot/correspondences/wands-08.png"),
  "RWSa-W-0A.png": require("../../assets/images/tarot/correspondences/wands-10.png"),
  "RWSa-W-10.png": require("../../assets/images/tarot/correspondences/wands-09.png"),
  "RWSa-W-J1.png": require("../../assets/images/tarot/correspondences/wands-11-page.png"),
  "RWSa-W-J2.png": require("../../assets/images/tarot/correspondences/wands-12-knight.png"),
  "RWSa-W-KI.png": require("../../assets/images/tarot/correspondences/wands-14-king.png"),
  "RWSa-W-QU.png": require("../../assets/images/tarot/correspondences/wands-13-queen.png"),
};

/** Guidebook spread images (`*-g.png`), keyed like face maps for `IMAGE_NAME_TO_RWS_FILE` lookup. */
const TAROT_GUIDEBOOK_IMAGES: Record<string, ImageSourcePropType> = {
  "RWSa-C-02.png": require("../../assets/images/tarot/guidebook/cups-01-g.png"),
  "RWSa-C-03.png": require("../../assets/images/tarot/guidebook/cups-02-g.png"),
  "RWSa-C-04.png": require("../../assets/images/tarot/guidebook/cups-03-g.png"),
  "RWSa-C-05.png": require("../../assets/images/tarot/guidebook/cups-04-g.png"),
  "RWSa-C-06.png": require("../../assets/images/tarot/guidebook/cups-05-g.png"),
  "RWSa-C-07.png": require("../../assets/images/tarot/guidebook/cups-06-g.png"),
  "RWSa-C-08.png": require("../../assets/images/tarot/guidebook/cups-07-g.png"),
  "RWSa-C-09.png": require("../../assets/images/tarot/guidebook/cups-08-g.png"),
  "RWSa-C-0A.png": require("../../assets/images/tarot/guidebook/cups-10-g.png"),
  "RWSa-C-10.png": require("../../assets/images/tarot/guidebook/cups-09-g.png"),
  "RWSa-C-J1.png": require("../../assets/images/tarot/guidebook/cups-11-page-g.png"),
  "RWSa-C-J2.png": require("../../assets/images/tarot/guidebook/cups-12-knight-g.png"),
  "RWSa-C-KI.png": require("../../assets/images/tarot/guidebook/cups-14-king-g.png"),
  "RWSa-C-QU.png": require("../../assets/images/tarot/guidebook/cups-13-queen-g.png"),
  "RWSa-P-02.png": require("../../assets/images/tarot/guidebook/pentacles-01-g.png"),
  "RWSa-P-03.png": require("../../assets/images/tarot/guidebook/pentacles-02-g.png"),
  "RWSa-P-04.png": require("../../assets/images/tarot/guidebook/pentacles-03-g.png"),
  "RWSa-P-05.png": require("../../assets/images/tarot/guidebook/pentacles-04-g.png"),
  "RWSa-P-06.png": require("../../assets/images/tarot/guidebook/pentacles-05-g.png"),
  "RWSa-P-07.png": require("../../assets/images/tarot/guidebook/pentacles-06-g.png"),
  "RWSa-P-08.png": require("../../assets/images/tarot/guidebook/pentacles-07-g.png"),
  "RWSa-P-09.png": require("../../assets/images/tarot/guidebook/pentacles-08-g.png"),
  "RWSa-P-0A.png": require("../../assets/images/tarot/guidebook/pentacles-10-g.png"),
  "RWSa-P-10.png": require("../../assets/images/tarot/guidebook/pentacles-09-g.png"),
  "RWSa-P-J1.png": require("../../assets/images/tarot/guidebook/pentacles-11-page-g.png"),
  "RWSa-P-J2.png": require("../../assets/images/tarot/guidebook/pentacles-12-knight-g.png"),
  "RWSa-P-KI.png": require("../../assets/images/tarot/guidebook/pentacles-14-king-g.png"),
  "RWSa-P-QU.png": require("../../assets/images/tarot/guidebook/pentacles-13-queen-g.png"),
  "RWSa-S-02.png": require("../../assets/images/tarot/guidebook/swords-01-g.png"),
  "RWSa-S-03.png": require("../../assets/images/tarot/guidebook/swords-02-g.png"),
  "RWSa-S-04.png": require("../../assets/images/tarot/guidebook/swords-03-g.png"),
  "RWSa-S-05.png": require("../../assets/images/tarot/guidebook/swords-04-g.png"),
  "RWSa-S-06.png": require("../../assets/images/tarot/guidebook/swords-05-g.png"),
  "RWSa-S-07.png": require("../../assets/images/tarot/guidebook/swords-06-g.png"),
  "RWSa-S-08.png": require("../../assets/images/tarot/guidebook/swords-07-g.png"),
  "RWSa-S-09.png": require("../../assets/images/tarot/guidebook/swords-08-g.png"),
  "RWSa-S-0A.png": require("../../assets/images/tarot/guidebook/swords-10-g.png"),
  "RWSa-S-10.png": require("../../assets/images/tarot/guidebook/swords-09-g.png"),
  "RWSa-S-J1.png": require("../../assets/images/tarot/guidebook/swords-11-page-g.png"),
  "RWSa-S-J2.png": require("../../assets/images/tarot/guidebook/swords-12-knight-g.png"),
  "RWSa-S-KI.png": require("../../assets/images/tarot/guidebook/swords-14-king-g.png"),
  "RWSa-S-QU.png": require("../../assets/images/tarot/guidebook/swords-13-queen-g.png"),
  "RWSa-T-00.png": require("../../assets/images/tarot/guidebook/0-fool-g.png"),
  "RWSa-T-01.png": require("../../assets/images/tarot/guidebook/1-magician-g.png"),
  "RWSa-T-02.png": require("../../assets/images/tarot/guidebook/2-highpriestess-g.png"),
  "RWSa-T-03.png": require("../../assets/images/tarot/guidebook/3-empress-g.png"),
  "RWSa-T-04.png": require("../../assets/images/tarot/guidebook/4-emperor-g.png"),
  "RWSa-T-05.png": require("../../assets/images/tarot/guidebook/5-heirophant-g.png"),
  "RWSa-T-06.png": require("../../assets/images/tarot/guidebook/6-lovers-g.png"),
  "RWSa-T-07.png": require("../../assets/images/tarot/guidebook/7-chariot-g.png"),
  "RWSa-T-08.png": require("../../assets/images/tarot/guidebook/8-strength-g.png"),
  "RWSa-T-09.png": require("../../assets/images/tarot/guidebook/9-hermit-g.png"),
  "RWSa-T-10.png": require("../../assets/images/tarot/guidebook/10-wheel-g.png"),
  "RWSa-T-11.png": require("../../assets/images/tarot/guidebook/11-justice-g.png"),
  "RWSa-T-12.png": require("../../assets/images/tarot/guidebook/12-hangedman-g.png"),
  "RWSa-T-13.png": require("../../assets/images/tarot/guidebook/13-death-g.png"),
  "RWSa-T-14.png": require("../../assets/images/tarot/guidebook/14-temperance-g.png"),
  "RWSa-T-15.png": require("../../assets/images/tarot/guidebook/15-devil-g.png"),
  "RWSa-T-16.png": require("../../assets/images/tarot/guidebook/16-tower-g.png"),
  "RWSa-T-17.png": require("../../assets/images/tarot/guidebook/17-star-g.png"),
  "RWSa-T-18.png": require("../../assets/images/tarot/guidebook/18-moon-g.png"),
  "RWSa-T-19.png": require("../../assets/images/tarot/guidebook/19-sun-g.png"),
  "RWSa-T-20.png": require("../../assets/images/tarot/guidebook/20-judgement-g.png"),
  "RWSa-T-21.png": require("../../assets/images/tarot/guidebook/21-world-g.png"),
  "RWSa-W-02.png": require("../../assets/images/tarot/guidebook/wands-01-g.png"),
  "RWSa-W-03.png": require("../../assets/images/tarot/guidebook/wands-02-g.png"),
  "RWSa-W-04.png": require("../../assets/images/tarot/guidebook/wands-03-g.png"),
  "RWSa-W-05.png": require("../../assets/images/tarot/guidebook/wands-04-g.png"),
  "RWSa-W-06.png": require("../../assets/images/tarot/guidebook/wands-05-g.png"),
  "RWSa-W-07.png": require("../../assets/images/tarot/guidebook/wands-06-g.png"),
  "RWSa-W-08.png": require("../../assets/images/tarot/guidebook/wands-07-g.png"),
  "RWSa-W-09.png": require("../../assets/images/tarot/guidebook/wands-08-g.png"),
  "RWSa-W-0A.png": require("../../assets/images/tarot/guidebook/wands-10-g.png"),
  "RWSa-W-10.png": require("../../assets/images/tarot/guidebook/wands-09-g.png"),
  "RWSa-W-J1.png": require("../../assets/images/tarot/guidebook/wands-11-page-g.png"),
  "RWSa-W-J2.png": require("../../assets/images/tarot/guidebook/wands-12-knight-g.png"),
  "RWSa-W-KI.png": require("../../assets/images/tarot/guidebook/wands-14-king-g.png"),
  "RWSa-W-QU.png": require("../../assets/images/tarot/guidebook/wands-13-queen-g.png"),
};

/** Resolve bundled guidebook page for a card's API `imageName`. */
export function resolveTarotGuidebookFromImageName(
  imageName?: string | null,
): ImageSourcePropType | null {
  const file = resolveRwsFileKey(imageName);
  if (!file) return null;
  return TAROT_GUIDEBOOK_IMAGES[file] ?? null;
}

const RWS_CARD_BACK = require("../../assets/images/tarot/rws/RWSa-X-RL.png");
const CORRESPONDENCES_CARD_BACKS: ImageSourcePropType[] = [
  require("../../assets/images/tarot/correspondences/back.png"),
  require("../../assets/images/tarot/correspondences/back2.png"),
];

export function getTarotImages(
  deck: TarotDeckId,
): Record<string, ImageSourcePropType> {
  return deck === "correspondences" ? CORRESPONDENCES_IMAGES : RWS_IMAGES;
}

/** Card backs for the draw table: two variants for correspondences, one for RWS. */
export function getTarotCardBackImages(
  deck: TarotDeckId,
): ImageSourcePropType[] {
  return deck === "correspondences"
    ? CORRESPONDENCES_CARD_BACKS
    : [RWS_CARD_BACK];
}

export function getCardBackImage(deck: TarotDeckId): ImageSourcePropType {
  return getTarotCardBackImages(deck)[0];
}
