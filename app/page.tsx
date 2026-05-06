"use client";

import React, { useEffect, useState } from "react";
import VideoFeed, { ImageFeed } from "./components/VideoFeed";
import { IVideo } from "@/models/Video";
import { IImage } from "@/models/Image";
import { apiClient } from "@/lib/api-client";
import AniLoader from "./components/AniLoader";
import FallingText from './components/FallingText';


export default function Home() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [images, setImages] = useState<IImage[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <AniLoader size={18} fixed />;
  }

  return (
    <main className="container mx-auto px-4 py-8 overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-8 ">Social rex <p className="text-lg mb-6 text-gray-500">Hover or Click to Start Uploading Your Memories</p>
     </h1>
        

      <FallingText
        text={`Social Rex is a web platform designed specifically for couples to privately share their day-to-day moments through photos and videos. While it functions like a social media app in terms of content creation and interaction, its core value lies in acting as a secure, cloud-like storage space tailored for personal relationships. Instead of broadcasting content to a wide audience, Social Rex focuses on intimacy and exclusivity, allowing couples to document memories, milestones, and everyday experiences in a centralized, accessible environment. This dual nature combines social interaction with cloud storage making it both a digital diary and a private media archive, ensuring that shared moments are preserved safely while remaining easily retrievable over time.`}
        highlightWords={["Social", "rex", "couples", "private", "cloud"]}
        highlightClass="highlighted"
        trigger="hover"
        backgroundColor="transparent"
        wireframes={false}
        gravity={0.56}
        fontSize="2rem"
        mouseConstraintStiffness={0.9}
      />

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
