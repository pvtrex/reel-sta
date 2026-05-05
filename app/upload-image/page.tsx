"use client";

import ImageUploadForm from "../components/ImageUploadForm";

export default function ImageUploadPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload New Image</h1>
        <ImageUploadForm />
      </div>
    </div>
  );
}
