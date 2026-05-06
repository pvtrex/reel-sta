import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

export async function compressImage(inputBuffer: Buffer, format: string): Promise<Buffer> {
  let pipeline = sharp(inputBuffer);

  // Reduce quality for images > 50MB (already handled by size check before calling this)
  if (format === 'jpeg' || format === 'jpg') {
    pipeline = pipeline.jpeg({ quality: 60, mozjpeg: true });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality: 60, compressionLevel: 9 });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality: 60 });
  }

  return await pipeline.toBuffer();
}

export async function compressVideo(inputPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate('2000k') // Intelligent bitrate reduction
      .audioBitrate('128k')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}
