const express = require("express");
const router = express.Router();
const Library = require("../models/Library");
const axios = require("axios");

// GET /api/library - Get all library items
router.get("/", async (req, res) => {
  try {
    const { search, type, limit = 50, page = 1 } = req.query;

    let query = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Filter by mediaType
    if (type) {
      query.mediaType = type;
    }

    const libraryItems = await Library.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Library.countDocuments(query);

    res.json({
      success: true,
      data: libraryItems,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching library items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching library items",
      error: error.message,
    });
  }
});

// GET /api/library/random - Get a random library item
router.get("/random", async (req, res) => {
  try {
    const count = await Library.countDocuments();
    const random = Math.floor(Math.random() * count);
    const libraryItem = await Library.findOne().skip(random);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "No library items found",
      });
    }

    res.json({
      success: true,
      data: libraryItem,
    });
  } catch (error) {
    console.error("Error fetching random library item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching random library item",
      error: error.message,
    });
  }
});

// GET /api/library/search-book - Search for books by title and/or author using Google Books API
router.get("/search-book", async (req, res) => {
  try {
    const { title, author, isbn } = req.query;

    // If ISBN is provided, use the existing ISBN lookup
    if (isbn && isbn.trim()) {
      const cleanISBN = isbn.replace(/[-\s]/g, "");
      if (/^\d{10}(\d{3})?$/.test(cleanISBN)) {
        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`
        );

        if (response.data.items && response.data.items.length > 0) {
          const bookData = response.data.items[0].volumeInfo;
          const isbn13 = bookData.industryIdentifiers?.find(
            (id) => id.type === "ISBN_13"
          )?.identifier;
          const isbn10 = bookData.industryIdentifiers?.find(
            (id) => id.type === "ISBN_10"
          )?.identifier;

          const transformedData = {
            title: bookData.title || "Unknown Title",
            authors: bookData.authors || ["Unknown Author"],
            publisher: bookData.publisher || "Unknown Publisher",
            publishedDate: bookData.publishedDate || "",
            description: bookData.description || "",
            isbn: isbn13 || isbn10 || cleanISBN,
            pageCount: bookData.pageCount || 0,
            categories: bookData.categories || [],
            imageLinks: bookData.imageLinks || {},
            language: bookData.language || "en",
            previewLink: bookData.previewLink || "",
          };

          return res.json({
            success: true,
            data: [transformedData], // Return as array for consistency
          });
        }
      }
    }

    // Build search query for title and/or author
    if (!title && !author && !isbn) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least a title, author, or ISBN to search.",
      });
    }

    let searchQuery = "";
    if (title && title.trim()) {
      searchQuery += `intitle:"${encodeURIComponent(title.trim())}"`;
    }
    if (author && author.trim()) {
      searchQuery += `${searchQuery ? "+" : ""}inauthor:"${encodeURIComponent(
        author.trim()
      )}"`;
    }

    // Call Google Books API
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=10`
    );

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No books found matching the search criteria",
      });
    }

    // Transform results
    const books = response.data.items.map((item) => {
      const bookData = item.volumeInfo;
      const isbn13 = bookData.industryIdentifiers?.find(
        (id) => id.type === "ISBN_13"
      )?.identifier;
      const isbn10 = bookData.industryIdentifiers?.find(
        (id) => id.type === "ISBN_10"
      )?.identifier;

      return {
        title: bookData.title || "Unknown Title",
        authors: bookData.authors || ["Unknown Author"],
        publisher: bookData.publisher || "Unknown Publisher",
        publishedDate: bookData.publishedDate || "",
        description: bookData.description || "",
        isbn: isbn13 || isbn10 || "",
        pageCount: bookData.pageCount || 0,
        categories: bookData.categories || [],
        imageLinks: bookData.imageLinks || {},
        language: bookData.language || "en",
        previewLink: bookData.previewLink || "",
      };
    });

    res.json({
      success: true,
      data: books,
    });
  } catch (error) {
    console.error("Error searching for books:", error);
    res.status(500).json({
      success: false,
      message: "Error searching for books",
      error: error.message,
    });
  }
});

// GET /api/library/:id - Get a specific library item
router.get("/:id", async (req, res) => {
  try {
    const libraryItem = await Library.findById(req.params.id);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "Library item not found",
      });
    }

    res.json({
      success: true,
      data: libraryItem,
    });
  } catch (error) {
    console.error("Error fetching library item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching library item",
      error: error.message,
    });
  }
});

// POST /api/library - Create a new library item
router.post("/", async (req, res) => {
  try {
    const libraryItem = new Library(req.body);
    const savedItem = await libraryItem.save();

    res.status(201).json({
      success: true,
      data: savedItem,
      message: "Library item created successfully",
    });
  } catch (error) {
    console.error("Error creating library item:", error);
    res.status(500).json({
      success: false,
      message: "Error creating library item",
      error: error.message,
    });
  }
});

// PUT /api/library/:id - Update a library item
router.put("/:id", async (req, res) => {
  try {
    const libraryItem = await Library.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "Library item not found",
      });
    }

    res.json({
      success: true,
      data: libraryItem,
      message: "Library item updated successfully",
    });
  } catch (error) {
    console.error("Error updating library item:", error);
    res.status(500).json({
      success: false,
      message: "Error updating library item",
      error: error.message,
    });
  }
});

// DELETE /api/library/:id - Delete a library item
router.delete("/:id", async (req, res) => {
  try {
    const libraryItem = await Library.findByIdAndDelete(req.params.id);

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: "Library item not found",
      });
    }

    res.json({
      success: true,
      message: "Library item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting library item:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting library item",
      error: error.message,
    });
  }
});

// GET /api/library/lookup-isbn/:isbn - Look up book by ISBN using Google Books API
router.get("/lookup-isbn/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;

    // Clean ISBN (remove hyphens and spaces)
    const cleanISBN = isbn.replace(/[-\s]/g, "");

    // Validate ISBN format (10 or 13 digits)
    if (!/^\d{10}(\d{3})?$/.test(cleanISBN)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ISBN format. Please provide a 10 or 13 digit ISBN.",
      });
    }

    // Call Google Books API
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`
    );

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No book found with this ISBN",
      });
    }

    const bookData = response.data.items[0].volumeInfo;

    // Transform the data to match our ISBNBookData interface
    const transformedData = {
      title: bookData.title || "Unknown Title",
      authors: bookData.authors || ["Unknown Author"],
      publisher: bookData.publisher || "Unknown Publisher",
      publishedDate: bookData.publishedDate || "",
      description: bookData.description || "",
      isbn: cleanISBN,
      pageCount: bookData.pageCount || 0,
      categories: bookData.categories || [],
      imageLinks: bookData.imageLinks || {},
      language: bookData.language || "en",
      previewLink: bookData.previewLink || "",
    };

    res.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error looking up ISBN:", error);
    res.status(500).json({
      success: false,
      message: "Error looking up book information",
      error: error.message,
    });
  }
});

module.exports = router;
