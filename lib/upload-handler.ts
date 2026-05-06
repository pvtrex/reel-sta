import ImageKit from "imagekit";
import { Readable } from "stream";
import { compressImage, compressVideo } from "./compression";
import fs from "fs";
import path from "path";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
  privateKey: process.env.PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT!,
});

export async function handleStreamingUpload(
  fileStream: Readable,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<any> {
  const isLarge = fileSize > 50 * 1024 * 1024; // 50MB
  const isVideo = mimeType.startsWith("video/");
  const isImage = mimeType.startsWith("image/");

  let processedStream: Readable | Buffer = fileStream;

  if (isLarge && isImage) {
    // For images, we can buffer and compress (since sharp handles buffers well)
    const chunks: any[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    processedStream = await compressImage(buffer, mimeType.split("/")[1]);
  } else if (isLarge && isVideo) {
    // For videos, we'd ideally stream to a temp file, compress, then upload
    // For this implementation, we'll log and continue or implement a temp file flow
    console.log(`Large video detected: ${fileName}. Compression recommended.`);
  }

  return new Promise((resolve, reject) => {
    imagekit.upload({
      file: processedStream as any,
      fileName: fileName,
      useUniqueFileName: true,
      folder: isVideo ? "/videos" : "/images",
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}
