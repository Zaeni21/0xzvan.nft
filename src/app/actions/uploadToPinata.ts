// src/app/actions/uploadToPinata.ts
"use server";

import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

export async function uploadToPinata(file: File, name: string, description: string = "") {
  try {
    // Upload Gambar
    const imageUpload = await pinata.upload.public.file(file, {
      metadata: { name: `${Date.now()}.png` },
    });

    const imageCid = imageUpload.cid;

    // Buat Metadata
    const metadata = {
      name: name.trim(),
      description: description.trim() || "Extraordinary NFT on Nexus Network by 0xzvan.nft",
      image: `ipfs://${imageCid}`,
      attributes: [
        { trait_type: "Collection", value: "Nexus" },
        { trait_type: "Creator", value: "0xzvan" },
        { trait_type: "Minted On", value: new Date().toISOString().split("T")[0] },
      ],
    };

    // Upload Metadata JSON
    const metadataUpload = await pinata.upload.public.json(metadata, {
      metadata: { name: `${Date.now()}.json` },
    });

    const metadataCid = metadataUpload.cid;

    return {
      success: true,
      imageCid,
      metadataCid,
      metadataUri: `ipfs://${metadataCid}`,
      imageUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${imageCid}`,
    };
  } catch (error: any) {
    console.error("Pinata Upload Error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload to Pinata",
    };
  }
}
