import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: "scarlet-absent-fox-734.mypinata.cloud",
});

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload ke Pinata
    const uploadRes = await pinata.upload.file(file);

    return NextResponse.json({ 
      success: true, 
      ipfsHash: uploadRes.ipfsHash,
      url: `https://scarlet-absent-fox-734.mypinata.cloud/ipfs/${uploadRes.ipfsHash}`
    });
  } catch (error) {
    console.error("Pinata Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
