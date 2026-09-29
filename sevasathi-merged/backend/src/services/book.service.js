const { Book } = require('../models/book.model');
const { BookRequest } = require('../models/bookrequest.model');
const { ApiError } = require('../utils/apierror');
const bookDonorService = require('./bookdonor.service');

async function donateBook(userId, payload) {
  const {
    title, author, isbn, category, language, condition,
    quantity, description, images, city, pincode,
  } = payload;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Book title is required');
  }

  // Donating a book shouldn't require a separate profile-registration
  // step first — transparently ensure a donor profile exists (and the
  // 'book_donor' role is granted) the same way registerBookDonor does.
  await bookDonorService.getOrCreateDonorProfile(userId, { city, pincode });

  const qty = Math.max(1, Number(quantity) || 1);

  const book = await Book.create({
    donor: userId,
    title,
    author,
    isbn,
    category,
    language,
    condition,
    description,
    images: Array.isArray(images) ? images.slice(0, 6) : [],
    quantity: qty,
    availableQuantity: qty,
    city,
    pincode,
  });

  return book;
}

// Search across all listings — title/author/ISBN free-text plus
// category/language/condition/location/availability filters.
async function searchBooks({ q, category, language, condition, city, pincode, availableOnly, limit = 50 } = {}) {
  const query = { isActive: true };

  if (category) query.category = category;
  if (language) query.language = language;
  if (condition) query.condition = condition;
  if (pincode) query.pincode = pincode;
  else if (city) query.city = city;
  if (availableOnly === true || availableOnly === 'true') query.status = 'available';

  if (q && q.trim()) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { author: regex }, { isbn: regex }];
  }

  return Book.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .populate('donor', 'fullName city phone');
}

async function getBookById(bookId) {
  const book = await Book.findById(bookId).populate('donor', 'fullName city phone');
  if (!book) throw new ApiError(404, 'Book not found');
  return book;
}

async function myBooks(userId) {
  return Book.find({ donor: userId }).sort({ createdAt: -1 });
}

async function updateBook(bookId, userId, updates) {
  const book = await Book.findById(bookId);
  if (!book) throw new ApiError(404, 'Book not found');
  if (book.donor.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the donor who listed this book can edit it');
  }

  const editableFields = ['title', 'author', 'isbn', 'category', 'language', 'condition', 'description', 'images', 'city', 'pincode'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) book[field] = updates[field];
  }

  await book.save();
  return book;
}

// Donor pausing/withdrawing a listing (Availability management). Any
// requests still open against it are auto-closed as 'unavailable' rather
// than left dangling, so beneficiaries and donors both see an honest
// final state instead of a request stuck forever on 'requested'.
async function setAvailability(bookId, userId, isActive) {
  const book = await Book.findById(bookId);
  if (!book) throw new ApiError(404, 'Book not found');
  if (book.donor.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the donor who listed this book can update it');
  }

  book.isActive = !!isActive;
  await book.save();

  if (!book.isActive) {
    const dangling = await BookRequest.find({ book: book._id, status: { $in: ['requested', 'approved'] } });
    for (const request of dangling) {
      request.status = 'unavailable';
      request.statusHistory.push({ status: 'unavailable', changedBy: userId, note: 'Listing withdrawn by donor' });
      await request.save();
    }
  }

  return book;
}

module.exports = {
  donateBook,
  searchBooks,
  getBookById,
  myBooks,
  updateBook,
  setAvailability,
};
