const express = require("express");
const router = express.Router();

// Helper function to get section content from MediaWiki Action API
async function getSectionContent(pageTitle, sectionAnchor) {
  try {
    // First, get the list of sections to find the section number
    const sectionsUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
      pageTitle
    )}&prop=sections&format=json&origin=*`;

    const sectionsResponse = await fetch(sectionsUrl);
    const sectionsData = await sectionsResponse.json();

    if (sectionsData.error) {
      console.log("Section lookup error:", sectionsData.error);
      return null;
    }

    const sections = sectionsData.parse?.sections || [];

    // Find the section that matches the anchor
    // Section anchors are normalized (spaces become underscores, special chars handled)
    const normalizedAnchor = sectionAnchor.replace(/_/g, " ").toLowerCase();
    const targetSection = sections.find(
      (section) =>
        section.anchor.toLowerCase() === sectionAnchor.toLowerCase() ||
        section.line.toLowerCase() === normalizedAnchor
    );

    if (!targetSection) {
      console.log(
        `Section "${sectionAnchor}" not found. Available sections:`,
        sections.map((s) => s.anchor)
      );
      return null;
    }

    // Now fetch the specific section content
    const sectionUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
      pageTitle
    )}&section=${targetSection.index}&prop=text&format=json&origin=*`;

    const sectionResponse = await fetch(sectionUrl);
    const sectionData = await sectionResponse.json();

    if (sectionData.error) {
      console.log("Section content error:", sectionData.error);
      return null;
    }

    const sectionHtml = sectionData.parse?.text?.["*"];
    if (!sectionHtml) return null;

    // Extract plain text from HTML (remove tags)
    const plainText = sectionHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\[edit\]/g, "")
      .trim();

    return {
      sectionTitle: targetSection.line,
      sectionNumber: targetSection.index,
      sectionText: plainText,
    };
  } catch (error) {
    console.error("Error fetching section content:", error);
    return null;
  }
}

// Helper function to resolve redirects and get final page title
async function resolveRedirect(searchTerm) {
  try {
    const redirectUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      searchTerm
    )}&redirects=1&format=json&origin=*`;

    const response = await fetch(redirectUrl);
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];

    // Check if there's a redirect
    const redirects = data.query?.redirects;
    if (redirects && redirects.length > 0) {
      const finalRedirect = redirects[redirects.length - 1];
      return {
        originalTitle: searchTerm,
        finalTitle: finalRedirect.to,
        isRedirect: true,
        fragment: finalRedirect.tofragment || null, // This is the section anchor
      };
    }

    return {
      originalTitle: searchTerm,
      finalTitle: page.title,
      isRedirect: false,
      fragment: null,
    };
  } catch (error) {
    console.error("Error resolving redirect:", error);
    return null;
  }
}

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

    // Check if search term includes a section anchor
    const [pageName, sectionAnchor] = search.split("#");

    // Resolve any redirects first
    const redirectInfo = await resolveRedirect(pageName);
    const finalPageTitle = redirectInfo?.finalTitle || pageName;
    const finalSection = sectionAnchor || redirectInfo?.fragment;

    console.log("Wikipedia lookup:", {
      original: search,
      finalPage: finalPageTitle,
      section: finalSection,
      wasRedirect: redirectInfo?.isRedirect,
    });

    // Get the main page summary from REST API
    const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      finalPageTitle
    )}`;

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

    // If there's a section anchor, get the specific section content
    let sectionContent = null;
    let expandedExtract = null;

    if (finalSection) {
      sectionContent = await getSectionContent(finalPageTitle, finalSection);
    } else {
      // If no section specified, get a longer extract from the extracts API
      try {
        const extractsUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
          finalPageTitle
        )}&prop=extracts&exintro=0&explaintext=1&exsectionformat=plain&format=json&origin=*`;

        const extractsResponse = await fetch(extractsUrl);
        const extractsData = await extractsResponse.json();

        const pages = extractsData.query?.pages;
        if (pages) {
          const page = Object.values(pages)[0];
          if (page.extract) {
            // Use the full extract without truncation
            expandedExtract = page.extract;
          }
        }
      } catch (error) {
        console.error("Error fetching expanded extract:", error);
        // Will fall back to the short extract from REST API
      }
    }

    // Extract relevant information
    const result = {
      title: data.title || finalPageTitle,
      description: data.description || null,
      extract: data.extract || "No summary available",
      expandedExtract: expandedExtract || null, // Longer extract if no section specified
      extract_html: data.extract_html || null,
      url:
        data.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(finalPageTitle)}`,
      thumbnail: data.thumbnail?.source || null,
      thumbnailWidth: data.thumbnail?.width || null,
      thumbnailHeight: data.thumbnail?.height || null,
      originalimage: data.originalimage?.source || null,
      originalimageWidth: data.originalimage?.width || null,
      originalimageHeight: data.originalimage?.height || null,
      coordinates: data.coordinates || null,
      // Add section-specific content if available
      section: sectionContent
        ? {
            title: sectionContent.sectionTitle,
            content: sectionContent.sectionText,
            anchor: finalSection,
          }
        : null,
      // Add redirect information
      redirect: redirectInfo?.isRedirect
        ? {
            from: redirectInfo.originalTitle,
            to: redirectInfo.finalTitle,
          }
        : null,
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
