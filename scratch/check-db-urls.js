import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const videoSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
});

const imageSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
});

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
const Image = mongoose.models.Image || mongoose.model("Image", imageSchema);

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const videos = await Video.find({}).limit(5);
    console.log("--- Videos ---");
    videos.forEach(v => console.log(`ID: ${v._id}, videoUrl: ${v.videoUrl}`));

    const images = await Image.find({}).limit(5);
    console.log("\n--- Images ---");
    images.forEach(i => console.log(`ID: ${i._id}, imageUrl: ${i.imageUrl}`));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkData();
