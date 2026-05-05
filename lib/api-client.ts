import { IVideo } from "@/models/Video";
import { IImage } from "@/models/Image";

export type VideoFormData = Omit<IVideo, "_id">;
export type ImageFormData = Omit<IImage, "_id">;

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

class ApiClient {
  private async fetch<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    const response = await fetch(`/api${endpoint}`, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }

  async getVideos() {
    return this.fetch<IVideo[]>("/videos");
  }
  
  async getVideo(id: string) {
    return this.fetch<IVideo>(`/videos/${id}`);
  }

  async getImages() {
    return this.fetch<IImage[]>("/images");
  }
  
  async getImage(id: string) {
    return this.fetch<IImage>(`/images/${id}`);
  }

  async createVideo(videoData: VideoFormData) {
    return this.fetch<IVideo>("/videos", {
      method: "POST",
      body: videoData,
    });
  }
  async createImage(imageData: ImageFormData) {
    return this.fetch<IImage>("/images", {
      method: "POST",
      body: imageData,
    });
  }
}

export const apiClient = new ApiClient();
