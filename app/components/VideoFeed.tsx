import { IVideo } from "@/models/Video";
import VideoComponent from "./VideoComponent";
import {IImage} from "@/models/Image";
import ImageComponent from "./ImageComponent";


interface VideoFeedProps {
  videos: IVideo[];
}
interface ImageFeedProps {
  images: IImage[];
}

export default function VideoFeed({ videos }: VideoFeedProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoComponent key={video._id?.toString()} video={video} />
      ))}

      {videos.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-base-content/70">No videos found</p>
        </div>
      )}
    </div>
  );
}
export  function ImageFeed({ images }: ImageFeedProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <ImageComponent key={image._id?.toString()} image={image} />
      ))}

      {images.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-base-content/70">No images found</p>
        </div>
      )}
    </div>
  );
}
