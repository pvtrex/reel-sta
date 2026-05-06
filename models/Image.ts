import mongoose, { Schema, model, models } from "mongoose";

export interface IImage {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  optimizedUrl?: string;

}

const imageSchema = new Schema<IImage>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    optimizedUrl: { type: String },
  
  },
  { timestamps: true }
);

if (models?.Image) {
  delete (mongoose as any).models.Image;
}

const Image = model<IImage>("Image", imageSchema);

export default Image;
