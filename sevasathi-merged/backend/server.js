const app = require('./src/app.js');
const connectDB = require('./src/config/database.js');
const config = require('./src/config/env.js');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

connectDB();

const PORT = config.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
