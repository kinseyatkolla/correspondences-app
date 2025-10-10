const express = require("express");
const router = express.Router();

// Wikipedia API endpoint
router.get("/summary", async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search term is required",
      });
    }

    // Wikipedia API URL for getting page summary
    const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      search
    )}`;

    // Fetch from Wikipedia API
    const response = await fetch(wikipediaUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: "Wikipedia article not found",
        });
      }
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract relevant information
    const result = {
      title: data.title || search,
      extract: data.extract || "No summary available",
      url:
        data.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(search)}`,
      thumbnail: data.thumbnail?.source || null,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Wikipedia API error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Wikipedia data",
      error: error.message,
    });
  }
});

module.exports = router;
