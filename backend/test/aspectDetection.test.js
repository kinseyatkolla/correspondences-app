const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ASPECT_EXACT_ORB_DEGREES,
  MOON_ASPECT_DETECTION_ORB_DEGREES,
  getAspectDetectionOrbDegrees,
  involvesMoon,
  isBracketedAspectMinimum,
  isRefinedAspectExact,
} = require("../lib/aspectDetection");

test("Moon pairs use a wider detection orb than slow-planet pairs", () => {
  assert.equal(getAspectDetectionOrbDegrees("sun", "jupiter"), 0.5);
  assert.equal(
    getAspectDetectionOrbDegrees("moon", "jupiter"),
    MOON_ASPECT_DETECTION_ORB_DEGREES
  );
  assert.equal(
    getAspectDetectionOrbDegrees("sun", "moon"),
    MOON_ASPECT_DETECTION_ORB_DEGREES
  );
  assert.equal(involvesMoon("moon", "mars"), true);
  assert.equal(involvesMoon("sun", "mars"), false);
});

test("slow-planet isolated in-orb samples are still rejected", () => {
  assert.equal(isBracketedAspectMinimum(1.2, 0.4, 1.1), false);
});

test("Moon isolated in-orb samples are accepted as local minima", () => {
  assert.equal(
    isBracketedAspectMinimum(1.2, 0.4, 1.1, { allowIsolatedSample: true }),
    true
  );
});

test("a plateau between two equally close samples still counts as a minimum", () => {
  assert.equal(
    isBracketedAspectMinimum(1.6, 0.54, 0.54, { allowIsolatedSample: true }),
    true
  );
  assert.equal(
    isBracketedAspectMinimum(0.54, 0.54, 1.6, { allowIsolatedSample: true }),
    false
  );
});

test("approaching samples are not treated as the aspect moment", () => {
  assert.equal(
    isBracketedAspectMinimum(1.6, 0.8, 0.1, { allowIsolatedSample: true }),
    false
  );
});

test("only refined orbs inside the exact threshold are kept", () => {
  assert.equal(isRefinedAspectExact(0), true);
  assert.equal(isRefinedAspectExact(ASPECT_EXACT_ORB_DEGREES), true);
  assert.equal(isRefinedAspectExact(0.51), false);
  assert.equal(isRefinedAspectExact(null), false);
});
