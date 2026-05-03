const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/Administrator/Downloads/Relay-main/Relay-main/.env' });

async function check() {
  console.log('Connecting to:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('SUCCESS: Connected to MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Could not connect to MongoDB');
    console.error(err.message);
    process.exit(1);
  }
}
check();
