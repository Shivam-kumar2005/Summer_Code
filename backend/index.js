/**
 * ==========================================
 * BACKEND ENTRY POINT - index.js
 * ==========================================
 * This file serves as the heart of your MERN stack application's backend.
 * It sets up the server, connects to the database, defines how data looks (schemas),
 * and creates "routes" (URLs) that the frontend can call to get or save data.
 */

// 1. IMPORTING NECESSARY TOOLS (Modules)
import express from 'express';        // Express: The framework for building the web server and API.
import cors from 'cors';              // CORS: Allows your frontend (on one port/domain) to talk to this backend (on another).
import dotenv from 'dotenv';          // Dotenv: Loads secret keys and config from a .env file for security.
import fs from 'fs';                  // File System: To read/write files on the server (used for error logging here).
import path from 'path';              // Path: To handle file and directory paths correctly across different OS.
import { fileURLToPath } from 'url';  // Helper to get the current file's path (needed in ES modules).
import multer from 'multer';          // Multer: Middleware for handling file uploads (like audio files).
import mongoose from 'mongoose';      // Mongoose: The "bridge" between Node.js and MongoDB (the database).
import { OAuth2Client } from 'google-auth-library'; // For verifying Google Login credentials.
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'; // SDK for generating AI voices.
import fetch from 'node-fetch';       // Fetch: To make requests from this server to other servers (like Judge0).

// Helper variables to get the current directory path (since we use ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. CONFIGURATION & INITIALIZATION
dotenv.config();                      // Load variables from .env into process.env

const app = express();                 // Initialize the Express application
const PORT = process.env.PORT || 5000; // Define which port the server will run on

console.log('📡 Starting backend...');
// Log if the DB connection string is found (hiding most of it for security)
console.log('🔗 MONGODB_URI:', process.env.MONGODB_URI ? 'Detected (ends with ...' + process.env.MONGODB_URI.slice(-20) + ')' : 'MISSING');

// 3. MIDDLEWARE SETUP
// Middleware are like "filters" that the request goes through before reaching the routes.
app.use(cors());                      // Enable CORS so the React app can access this API.
app.use(express.json());              // Allows the server to understand and parse JSON data sent by the frontend.

// 4. DATABASE CONNECTION (MongoDB Atlas)
// We use Mongoose to connect to our cloud database.
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,    // Wait 15 seconds before giving up if the server is slow.
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    // If connection fails, log the error and save it to a file for debugging.
    const errorPrefix = '\n❌ MONGODB CONNECTION ERROR:';
    const errorMsg = `\n---------------------------\n${err.message}\n---------------------------\n👉 TIP: Check if your IP address is whitelisted in MongoDB Atlas.\n👉 TIP: Verify your MONGODB_URI in the .env file.\n`;
    console.error(errorPrefix);
    console.error(errorMsg);
    fs.writeFileSync(path.join(__dirname, 'db-error.log'), errorPrefix + errorMsg);
  });

// 5. DATABASE SCHEMAS & MODELS
// A Schema defines the "shape" of the data. It's like a blueprint for a house.
// A Model is a class that allows us to interact with the database using that blueprint.

// Topic Schema: Stores information about different subjects (e.g., Python, C++, Web Dev).
const topicSchema = new mongoose.Schema({
  id: String,                         // Unique ID for the topic
  name: String,                       // Display name
  subtitle: String,                   // Short tagline
  icon: String,                       // Icon name (e.g., 'python', 'code')
  description: String,                // Detailed description
  status: String,                     // Current status (e.g., 'active', 'coming_soon')
}, { timestamps: true });              // Automatically adds 'createdAt' and 'updatedAt' fields.

// Lesson Schema: Stores the actual course content.
const lessonSchema = new mongoose.Schema({
  id: String,
  title: String,                      // Lesson title
  slug: { type: String, unique: true }, // URL-friendly name (e.g., 'intro-to-python')
  course: String,                     // Which topic this lesson belongs to
  chapterOrder: Number,               // Position in the course (1, 2, 3...)
  description: String,
  blocks: [Object],                   // Array of content blocks (text, video, code, etc.)
}, { timestamps: true });

// AudioFile Schema: Stores binary audio data directly in the database.
const audioFileSchema = new mongoose.Schema({
  filename: { type: String, unique: true },
  data: Buffer,                       // Raw binary data of the audio file
  contentType: String                 // Type of file (e.g., 'audio/mpeg')
}, { timestamps: true });

// User Schema: Stores student account information.
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  completedLessons: [String],         // Keeps track of which lessons this user has finished.
}, { timestamps: true });

// Question Schema: Stores practice/quiz questions for the adaptive practice system.
const questionSchema = new mongoose.Schema({
  topicId: String,                    // Link to a specific Topic
  type: { type: String, enum: ['mcq', 'output', 'debug', 'coding'] }, // Type of question
  question: String,
  options: [String],                  // Only for MCQ
  correctAnswer: String,
  explanation: String,                // Why the answer is correct
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  starterCode: String,                // Default code for coding questions
  testCases: [{ input: String, expectedOutput: String }], // To verify user's code
}, { timestamps: true });

// Progress Schema: Tracks user performance in practice sessions.
const progressSchema = new mongoose.Schema({
  userId: String,
  topicId: String,
  score: Number,                      // Score achieved (0-100)
  attempts: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
});

// Creating Models from Schemas
// These allow us to do things like Topic.find() or Lesson.create()
const Topic = mongoose.model('Topic', topicSchema);
const Lesson = mongoose.model('Lesson', lessonSchema);
const AudioFile = mongoose.model('AudioFile', audioFileSchema);
const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const Progress = mongoose.model('Progress', progressSchema);

// 6. FILE UPLOAD CONFIGURATION (Multer)
// Multer helps process multipart/form-data (files). 
// Here, we use 'memoryStorage' to keep the file in RAM temporarily before saving it to MongoDB.
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // Limit: 50MB

// --- API ROUTES ---
// Routes are specific URLs that perform specific actions.

// 7. HEALTH & STATUS CHECK
// A simple route to check if the server and database are alive.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    dbState: mongoose.connection.readyState,
    dbStatus: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState]
  });
});

// 8. STUDENT AUTHENTICATION ROUTES

// SIGNUP: Create a new user account
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email already exists' });

    // Create and save new user
    const user = new User({ name, email, password, completedLessons: [] });
    await user.save();
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// LOGIN: Verify user and return a "token" (mock session)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    // Identify if the user is an admin based on email
    const isAdmin = user.email === (process.env.ADMIN_EMAIL || 'sadiq.imam404@gmail.com');

    const responsePayload = {
      success: true,
      token: 'student-token-' + user._id, // In a real app, use JWT tokens
      user: {
        name: user.name,
        email: user.email,
        completedLessons: user.completedLessons,
        role: isAdmin ? 'admin' : 'student'
      }
    };

    // If admin, give them an extra admin token
    if (isAdmin) {
      responsePayload.adminToken = 'admin-token-' + user._id;
    }

    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GOOGLE AUTH: Login using Google account
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body; // The token sent from Google frontend
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // Check if user exists, if not, create them
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        password: 'google-auth-' + sub, // Generate a unique dummy password
        completedLessons: [],
      });
      await user.save();
    }

    const isAdmin = user.email === (process.env.ADMIN_EMAIL || 'sadiq.imam404@gmail.com');
    const responsePayload = {
      success: true,
      token: 'student-token-' + user._id,
      user: {
        name: user.name,
        email: user.email,
        completedLessons: user.completedLessons,
        picture,
        role: isAdmin ? 'admin' : 'student'
      }
    };
    if (isAdmin) {
      responsePayload.adminToken = 'admin-token-' + user._id;
    }

    res.json(responsePayload);
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, error: 'Google authentication failed' });
  }
});

// PASSWORD RECOVERY (Simulated)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, error: 'Email not found' });
    // In a real app, you would send an actual email here.
    res.json({ success: true, message: 'Reset request received. Check your email for instructions (Simulated).' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { password: newPassword },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- STUDENT PROFILE & PROGRESS ---
// --- STUDENT PROFILE & PROGRESS ---

// Update progress: Mark a lesson as completed
app.post('/api/student/update-progress', async (req, res) => {
  try {
    const { email, lessonSlug } = req.body;
    // $addToSet ensures the lesson is only added once (no duplicates)
    const user = await User.findOneAndUpdate(
      { email },
      { $addToSet: { completedLessons: lessonSlug } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, completedLessons: user.completedLessons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user profile
app.get('/api/student/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: { name: user.name, email: user.email, completedLessons: user.completedLessons } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ADMIN PANEL ROUTES ---

// Admin login check
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === adminPass) {
    res.json({ success: true, token: 'mock-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect password' });
  }
});

// --- AUDIO HANDLING ---

// Serve Audio from Database: 
// Instead of storing files on disk, we serve them from MongoDB buffers.
app.get('/api/audio-db/:filename', async (req, res) => {
  try {
    const file = await AudioFile.findOne({ filename: req.params.filename });
    if (!file) return res.status(404).send('Not found');
    res.set('Content-Type', file.contentType || 'audio/mpeg');
    res.send(file.data); // Send the raw binary data
  } catch (err) {
    res.status(500).send('Error');
  }
});

// Upload Audio: Save an uploaded file to the DB
app.post('/api/admin/upload-audio', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  try {
    const filename = `manual-${Date.now()}-${req.file.originalname}`;
    await AudioFile.findOneAndUpdate(
      { filename },
      {
        filename,
        data: req.file.buffer,
        contentType: req.file.mimetype
      },
      { upsert: true }
    );
    res.json({ success: true, audioUrl: `/api/audio-db/${filename}`, filename });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- COURSE CONTENT MANAGEMENT (CRUD) ---

// Get All Lessons
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ chapterOrder: 1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load lessons' });
  }
});

// Get Single Lesson by Slug
app.get('/api/lessons/:slug', async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ slug: req.params.slug });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load lesson' });
  }
});

// Save or Update Lesson
app.post('/api/admin/save-lesson', async (req, res) => {
  try {
    const newLessonData = req.body;
    const lesson = await Lesson.findOneAndUpdate(
      { slug: newLessonData.slug },
      newLessonData,
      { upsert: true, new: true } // upsert: true means "create if it doesn't exist"
    );
    res.json({ success: true, lesson });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save lesson' });
  }
});

// Delete Lesson
app.delete('/api/admin/delete-lesson/:slug', async (req, res) => {
  try {
    await Lesson.deleteOne({ slug: req.params.slug });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Get All Topics
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load topics' });
  }
});

// Save or Update Topic
app.post('/api/admin/save-topic', async (req, res) => {
  try {
    const newTopicData = req.body;
    const topic = await Topic.findOneAndUpdate(
      { id: newTopicData.id },
      newTopicData,
      { upsert: true, new: true }
    );
    res.json({ success: true, topic });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save topic' });
  }
});

// Delete Topic
app.delete('/api/admin/delete-topic/:topicId', async (req, res) => {
  try {
    await Topic.deleteOne({ id: req.params.topicId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// --- AI AUDIO GENERATION (ElevenLabs) ---

// Generate AI voice from text
app.post('/api/admin/generate-audio', async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.ELEVEN_LABS_KEY;
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';

  if (!apiKey || apiKey === 'YOUR_ELEVEN_LABS_KEY') {
    return res.status(400).json({ error: 'ElevenLabs API Key missing in .env' });
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    // Request audio stream from ElevenLabs
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });

    // Convert the stream into a single Buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    const filename = `ai-sdk-${Date.now()}.mp3`;
    const audioUrl = `/api/audio-db/${filename}`;

    // Save the generated audio buffer to MongoDB
    await AudioFile.findOneAndUpdate(
      { filename },
      { filename, data: buffer, contentType: 'audio/mpeg' },
      { upsert: true }
    );

    // Optional: Get remaining credits from ElevenLabs
    let credits = null;
    try {
      const userInfo = await elevenlabs.user.get();
      const sub = userInfo.subscription || {};
      const limit = sub.character_limit ?? sub.characterLimit ?? 0;
      const count = sub.character_count ?? sub.characterCount ?? 0;
      credits = { remaining: Math.max(0, limit - count), total: limit };
    } catch (e) {
      console.error('Failed to fetch credits:', e);
    }

    res.json({ success: true, audioUrl, filename, credits });
  } catch (err) {
    console.error('❌ AI Generation failed:', err);
    res.status(500).json({ success: false, error: err.message || 'AI Generation failed' });
  }
});

// Get ElevenLabs credit balance
app.get('/api/admin/elevenlabs-credits', async (req, res) => {
  const apiKey = process.env.ELEVEN_LABS_KEY;
  if (!apiKey || apiKey === 'YOUR_ELEVEN_LABS_KEY' || apiKey === 'undefined') {
    return res.status(400).json({ error: 'API Key missing' });
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const userInfo = await elevenlabs.user.get();
    const sub = userInfo.subscription || {};
    const limit = sub.character_limit ?? sub.characterLimit ?? 0;
    const count = sub.character_count ?? sub.characterCount ?? 0;

    res.json({
      remaining: Math.max(0, limit - count),
      total: limit,
      resetDate: sub.next_character_count_reset_unix ?? sub.nextCharacterCountResetUnix
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CODE EXECUTION (Judge0) ---

// Execute code remotely using Judge0 API
app.post('/api/execute', async (req, res) => {
  const { code, language, stdin } = req.body;

  // Map language names to Judge0 IDs
  const langMap = {
    'python': 71, 'c': 50, 'c++': 54, 'cpp': 54, 'javascript': 63, 'java': 62
  };

  const language_id = langMap[(language || '').toLowerCase()];
  if (!language_id) {
    return res.status(400).json({ error: `Unsupported language for execution: ${language}` });
  }

  try {
    const judge0Url = process.env.JUDGE0_URL || 'https://ce.judge0.com';
    // Send code to Judge0
    const response = await fetch(`${judge0Url}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: code, language_id, stdin })
    });

    if (!response.ok) throw new Error(`Judge0 API error: ${response.status}`);

    const data = await response.json();

    // Check if there was a compilation error or runtime error
    if (data.compile_output) {
      res.json({ output: data.compile_output, error: true });
    } else if (data.stderr) {
      res.json({ output: data.stderr, error: true });
    } else {
      res.json({ output: data.stdout || '', error: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Code execution failed: ' + err.message });
  }
});

// --- PRACTICE SYSTEM APIs ---

// Get Questions for Student (Adaptive Difficulty)
// This logic picks questions based on the user's past performance.
app.get('/api/practice', async (req, res) => {
  const { topicId, userId } = req.query;
  try {
    // 1. Check user's previous performance to decide difficulty
    const lastProgress = await Progress.findOne({ userId, topicId }).sort({ completedAt: -1 });

    let targetDifficulty = 'easy';
    if (lastProgress) {
      if (lastProgress.score >= 80) targetDifficulty = 'hard';
      else if (lastProgress.score >= 50) targetDifficulty = 'medium';
    }

    // 2. Fetch questions for the target difficulty
    let questions = await Question.find({ topicId, difficulty: targetDifficulty });

    // 3. Fallback: if not enough questions in target difficulty, pull from others
    if (questions.length < 5) {
      const additional = await Question.find({
        topicId,
        difficulty: { $ne: targetDifficulty }
      }).limit(10 - questions.length);
      questions = [...questions, ...additional];
    }

    // 4. Shuffle and limit to 10 questions max
    const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, 10);
    res.json(shuffled);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch practice questions' });
  }
});

// Submit Practice Results
app.post('/api/practice/submit', async (req, res) => {
  try {
    const { userId, topicId, score } = req.body;
    const progress = new Progress({ userId, topicId, score });
    await progress.save();
    res.json({ success: true, message: 'Progress saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Admin: Question Management
app.get('/api/admin/practice', async (req, res) => {
  try {
    const filter = req.query.topicId ? { topicId: req.query.topicId } : {};
    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/admin/practice', async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.json({ success: true, question });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/admin/practice/:id', async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, question: updated });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/admin/practice/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
