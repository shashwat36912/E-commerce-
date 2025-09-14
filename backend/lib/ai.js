// lib/ai.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function fetchAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  return { base64, mimeType: contentType };
}

export const generateProductDetails = async (imageUrl) => {
  try {
    if (!imageUrl) throw new Error("Image URL required");

    let mimeType = "image/jpeg";
    let base64Data = null;

    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:(.+);base64,(.+)$/);
      if (!match) throw new Error("Invalid data URI image format");
      mimeType = match[1];
      base64Data = match[2];
    } else if (imageUrl.startsWith("http")) {
      const fetched = await fetchAsBase64(imageUrl);
      mimeType = fetched.mimeType;
      base64Data = fetched.base64;
    } else {
      const cleaned = imageUrl.replace(/\s+/g, "");
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(cleaned);
      if (isBase64) base64Data = cleaned;
      else throw new Error("Unsupported image input; provide a URL or data URI or base64 string");
    }

    const allowedCategories = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];

    const contents = [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text:
          "Generate a product name, a short description (20-40 words), and choose the best category from this list: " +
          allowedCategories.join(", ") +
          ". Respond exactly in this format:\nName: <short product name>\nDescription: <one paragraph, 20-40 words>\nCategory: <one of the allowed categories>\nDo not include any other text. Use the image to infer the product type, material, and style.",
      },
    ];

    const response = await ai.models.generateContent({
      model: process.env.GEN_AI_MODEL || "gemini-1.5-flash",
      contents,
    });

    return response.text || (response.output && response.output[0] && response.output[0].content) || JSON.stringify(response);
  } catch (err) {
    console.error("Error in generateProductDetails:", err.message);
    throw err;
  }
};

