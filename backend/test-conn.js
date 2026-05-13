import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing connection to:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILURE:', err.message);
    process.exit(1);
  });
