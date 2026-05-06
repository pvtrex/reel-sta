import mongoose, { Schema, model, models } from "mongoose";

export interface IVideo {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  controls?: boolean;
}

const videoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    optimizedUrl: { type: String },
  
    controls: { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (models?.Video) {
  delete (mongoose as any).models.Video;
}

const Video = model<IVideo>("Video", videoSchema);

export default Video;
