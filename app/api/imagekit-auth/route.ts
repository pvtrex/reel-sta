import Imagekit from "imagekit";
import { NextRequest, NextResponse } from "next/server";

const imagekit = new Imagekit({
    publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY as string,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT as string,
});

export async function GET() {

    try {
        return NextResponse.json(imagekit.getAuthenticationParameters())
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "ImageKit auth Failed" }, { status: 500 })
    }


}