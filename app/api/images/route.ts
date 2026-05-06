import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Image, { IImage } from "@/models/Image";

export async function GET() {
  try {
    await connectToDatabase();
    const images = await Image.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(images);
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
