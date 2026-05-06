import { IKImage } from "imagekitio-next";
import Link from "next/link";
import { IImage } from "@/models/Image";


export default function ImageComponent({ image }: { image: IImage }) {
  return (
    <div className="card bg-base-100 shadow hover:shadow-lg transition-all duration-300">
      <figure className="relative px-4 pt-4">
        <div
          className="rounded-xl overflow-hidden relative w-full"
          style={{ aspectRatio: "9/16" }}
        >
          {image.imageUrl.startsWith("http") ? (
            <img
              src={image.imageUrl}
              alt={image.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <IKImage
              path={image.imageUrl}
              alt={image.title}
              transformation={[
                {
                  height: "1920",
                  width: "1080",
                },
              ]}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </figure>

      <div className="card-body p-4">
        <h2 className="card-title text-lg">{image.title}</h2>

        <p className="text-sm text-base-content/70 line-clamp-2">
          {image.description}
        </p>
      </div>
    </div>
  );
}
