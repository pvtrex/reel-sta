import { connectToDatabase } from "../lib/db";
import Video from "../models/Video";
import Image from "../models/Image";

async function checkData() {
  try {
    await connectToDatabase();
    const videos = await Video.find({}).limit(5);
    console.log("--- Videos ---");
    videos.forEach(v => console.log(`ID: ${v._id}, videoUrl: ${v.videoUrl}`));

    const images = await Image.find({}).limit(5);
    console.log("\n--- Images ---");
    images.forEach(i => console.log(`ID: ${i._id}, imageUrl: ${i.imageUrl}`));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkData();
