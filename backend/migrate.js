import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Schemas
const topicSchema = new mongoose.Schema({
  id: String,
  name: String,
  subtitle: String,
  icon: String,
  description: String,
  status: String, 
}, { timestamps: true });

const lessonSchema = new mongoose.Schema({
  id: String,
  title: String,
  slug: { type: String, unique: true },
  course: String,
  chapterOrder: Number,
  description: String,
  blocks: [Object],
}, { timestamps: true });

const Topic = mongoose.model('Topic', topicSchema);
const Lesson = mongoose.model('Lesson', lessonSchema);

async function migrate() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully.');

    const lessonsPath = path.join(__dirname, 'data', 'lessons.json');
    const topicsPath = path.join(__dirname, 'data', 'topics.json');

    if (fs.existsSync(lessonsPath)) {
      const lessons = JSON.parse(fs.readFileSync(lessonsPath));
      console.log(`Migrating ${lessons.length} lessons...`);
      for (let l of lessons) {
        await Lesson.findOneAndUpdate({ slug: l.slug }, l, { upsert: true });
      }
      console.log('✅ Lessons migrated.');
    } else {
      console.log('❌ lessons.json not found.');
    }

    if (fs.existsSync(topicsPath)) {
      const topics = JSON.parse(fs.readFileSync(topicsPath));
      console.log(`Migrating ${topics.length} topics...`);
      for (let t of topics) {
        await Topic.findOneAndUpdate({ id: t.id }, t, { upsert: true });
      }
      console.log('✅ Topics migrated.');
    } else {
      console.log('❌ topics.json not found.');
    }

    console.log('\n🌟 ALL OLD DATA SUCCESSFULLY FED TO MONGODB ATLAS 🌟');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
