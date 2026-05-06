import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT || "https://ik.imagekit.io/imrex";

const videoSchema = new mongoose.Schema({
  videoUrl: String,
});

const imageSchema = new mongoose.Schema({
  imageUrl: String,
});

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
const Image = mongoose.models.Image || mongoose.model("Image", imageSchema);

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Migrate Videos
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos`);
    for (const video of videos) {
      if (video.videoUrl && !video.videoUrl.startsWith("http")) {
        const fullUrl = `${urlEndpoint}${video.videoUrl.startsWith('/') ? '' : '/'}${video.videoUrl}`;
        console.log(`Updating video ${video._id}: ${video.videoUrl} -> ${fullUrl}`);
        await Video.updateOne({ _id: video._id }, { $set: { videoUrl: fullUrl } });
      }
    }

    // Migrate Images
    const images = await Image.find({});
    console.log(`Found ${images.length} images`);
    for (const image of images) {
      if (image.imageUrl && !image.imageUrl.startsWith("http")) {
        const fullUrl = `${urlEndpoint}${image.imageUrl.startsWith('/') ? '' : '/'}${image.imageUrl}`;
        console.log(`Updating image ${image._id}: ${image.imageUrl} -> ${fullUrl}`);
        await Image.updateOne({ _id: image._id }, { $set: { imageUrl: fullUrl } });
      }
    }

    console.log("Migration completed");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
