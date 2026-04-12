"use server";

import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud",
});

export async function uploadToPinata(
  file: File,
  name: string,
  description: string = ""
) {
  try {
    // Pakai upload.file() langsung, lebih aman di berbagai versi SDK
    const imageUpload = await pinata.upload.file(file);
    const imageCid = imageUpload.cid;

    const metadata = {
      name: name.trim(),
      description: description.trim() || "Extraordinary NFT on Nexus Network",
      image: `ipfs://${imageCid}`,
      attributes: [
        { trait_type: "Collection", value: "Nexus" },
        { trait_type: "Creator", value: "0xzvan" },
      ],
    };

    const metadataUpload = await pinata.upload.json(metadata);
    const metadataCid = metadataUpload.cid;

    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

    return {
      success: true,
      imageCid,
      metadataCid,
      metadataUri: `ipfs://${metadataCid}`,
      imageUrl: `https://${gateway}/ipfs/${imageCid}`,
    };
  } catch (error: any) {
    console.error("Pinata Error:", error);
    return { success: false, error: error.message };
  }
}
