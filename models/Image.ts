import mongoose, { Schema, model, models } from "mongoose";

export const IMAGE_DIMENSIONS = {
  width: 1080,
  height: 1920,
} as const;

export interface IImage {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  transformation?: {
    height: number;
    width: number;
    quality?: number;
  };
}

const imageSchema = new Schema<IImage>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    transformation: {
      height: { type: Number, default: IMAGE_DIMENSIONS.height },
      width: { type: Number, default: IMAGE_DIMENSIONS.width },
      quality: { type: Number, min: 1, max: 100 },
    },
  },
  { timestamps: true }
);

const Image = models?.Image || model<IImage>("Image", imageSchema);

export default Image;