"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";
import { useNotification } from "./Notification";
import { apiClient } from "@/lib/api-client";
import FileUpload from "./FileUpload";
import { useRouter } from "next/navigation";
import AniLoader from "./AniLoader";

interface ImageFormData {
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export default function ImageUploadForm() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showNotification } = useNotification();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ImageFormData>({
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      thumbnailUrl: "",
    },
  });

  const handleUploadSuccess = (response: IKUploadResponse) => {
    setValue("imageUrl", response.filePath);
    setValue("thumbnailUrl", response.thumbnailUrl);
   
    showNotification("Image uploaded successfully!", "success");
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const onSubmit = async (data: ImageFormData) => {
    if (!data.imageUrl) {
      showNotification("Please upload an image first", "error");
      return;
    }

    setLoading(true);
    try {
      await apiClient.createImage(data);
      showNotification("Image published successfully!", "success");

      // Reset form after successful submission
      setValue("title", "");
      setValue("description", "");
      setValue("imageUrl", "");
      setValue("thumbnailUrl", "");
      setUploadProgress(0);
      router.push("/");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to publish image",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-primary">
          <AniLoader size={24} />
          <p className="mt-4 text-xl font-bold">Publishing Image...</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-control">
          <label className="label">Title</label>
          <input
            type="text"
            className={`input input-bordered ${
              errors.title ? "input-error" : ""
            }`}
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <span className="text-error text-sm mt-1">
              {errors.title.message}
            </span>
          )}
        </div>

        <div className="form-control">
          <label className="label">Description</label>
          <textarea
            className={`textarea textarea-bordered h-24 ${
              errors.description ? "textarea-error" : ""
            }`}
            {...register("description", { required: "Description is required" })}
          />
          {errors.description && (
            <span className="text-error text-sm mt-1">
              {errors.description.message}
            </span>
          )}
        </div>

        <div className="form-control">
          <label className="label">Upload Image</label>
          <FileUpload
            fileType="image"
            onSuccess={handleUploadSuccess}
            onProgress={handleUploadProgress}
          />
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading || !uploadProgress}
        >
          {loading ? "Publishing..." : "Publish Image"}
        </button>
      </form>
    </>
  );
}
