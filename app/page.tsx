"use client";

import React, { useEffect, useState } from "react";
import VideoFeed, { ImageFeed } from "./components/VideoFeed";
import { IVideo } from "@/models/Video";
import { IImage } from "@/models/Image";
import { apiClient } from "@/lib/api-client";

export default function Home() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [images, setImages] = useState<IImage[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosData, imagesData] = await Promise.all([
          apiClient.getVideos(),
          apiClient.getImages(),
        ]);
        setVideos(videosData);
        setImages(imagesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">ImageKit ReelsPro</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Videos</h2>
        <VideoFeed videos={videos} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Images</h2>
        <ImageFeed images={images} />
      </section>
    </main>
  );
}
