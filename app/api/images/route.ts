import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Image, { IImage } from "@/models/Image";

import { imagekit } from "@/lib/imagekit";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const images = await Image.find({}).sort({ createdAt: -1 }).lean();

    // Sign the image URLs
    const signedImages = images.map(image => ({
      ...image,
      imageUrl: imagekit.url({
        path: image.imageUrl,
        signed: true,
        expireSeconds: 3600 // 1 hour
      })
    }));

    return NextResponse.json(signedImages);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    await connectToDatabase();
    const body: IImage = await request.json();

    // Validate required fields
    if (
      !body.title ||
      !body.description ||
      !body.imageUrl
    ) {
      return NextResponse.json(
        { error: "Missing required fields (title, description, imageUrl)" },
        { status: 400 }
      );
    }

    const newImage = await Image.create(body);
    return NextResponse.json(newImage);
  } catch (error) {
    console.error("Error creating image:", error);
    return NextResponse.json(
      { error: "Failed to create image" },
      { status: 500 }
    );
  }
}
