const bookService = require('../services/book.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.donate = asyncHandler(async (req, res) => {
  const book = await bookService.donateBook(req.user.id, req.body);

  res.status(201).json({
    message: 'Book listed for donation successfully',
    book,
  });
});

exports.search = asyncHandler(async (req, res) => {
  const { q, category, language, condition, city, pincode, availableOnly, limit } = req.query;

  const books = await bookService.searchBooks({ q, category, language, condition, city, pincode, availableOnly, limit });

  res.status(200).json({
    message: 'Books fetched successfully',
    count: books.length,
    books,
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const book = await bookService.getBookById(req.params.id);

  res.status(200).json({
    message: 'Book fetched successfully',
    book,
  });
});

exports.myBooks = asyncHandler(async (req, res) => {
  const books = await bookService.myBooks(req.user.id);

  res.status(200).json({
    message: 'Your book listings fetched successfully',
    count: books.length,
    books,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const book = await bookService.updateBook(req.params.id, req.user.id, req.body);

  res.status(200).json({
    message: 'Book listing updated successfully',
    book,
  });
});

exports.setAvailability = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const book = await bookService.setAvailability(req.params.id, req.user.id, isActive);

  res.status(200).json({
    message: 'Book availability updated successfully',
    book,
  });
});
