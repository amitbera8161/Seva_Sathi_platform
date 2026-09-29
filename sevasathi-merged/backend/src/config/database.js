const mongoose = require('mongoose');
const config = require('./env.js');

async function connectDB() {
  await mongoose.connect(config.MONGO_URI);
  console.log('Connected to DB');
}

module.exports = connectDB;
