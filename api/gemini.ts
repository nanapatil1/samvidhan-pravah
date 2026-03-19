import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, payload, language = "English" } = req.body;

  try {
    switch (type) {
      case "explanation": {
        const { articleNumber } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Provide a detailed explanation of Article ${articleNumber} of the Indian Constitution in ${language}. Include its historical background, key provisions, and at least 2-3 landmark Supreme Court cases related to it. Format the output in Markdown. Ensure the entire response is in ${language}.`,
        });
        return res.status(200).json({ text: response.text });
      }

      case "case-analysis": {
        const { caseDescription } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `As 'Samvidhan Pravah', a premier legal intelligence assistant specializing in the Indian Constitution, analyze the following client case/incident description: "${caseDescription}". 
          Identify the most relevant Articles of the Indian Constitution that apply to this situation. 
          For each article, provide:
          1. The Article Number and Title.
          2. A brief explanation of WHY it is relevant to this specific case.
          3. Potential legal arguments or protections it offers.
          
          Return the response in ${language}. Format the output in a structured Markdown format with clear headings for each article.`,
        });
        return res.status(200).json({ text: response.text });
      }

      case "search": {
        const { query } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Search the Indian Constitution for: "${query}". Return a list of relevant articles with their numbers and brief titles. The titles should be in ${language}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.STRING },
                  title: { type: Type.STRING },
                },
                required: ["number", "title"],
              },
            },
          },
        });
        return res.status(200).json({ results: JSON.parse(response.text || "[]") });
      }

      case "amendments": {
        const { query } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Provide a list of recent or significant amendments to the Indian Constitution. If a query is provided: "${query}", focus on amendments related to that topic. 
          For each amendment, include:
          1. Amendment Number and Year.
          2. Which Articles were changed, added, or removed.
          3. A brief summary of the change.
          
          Return the response in ${language}. Format the output in Markdown.`,
        });
        return res.status(200).json({ text: response.text });
      }

      default:
        return res.status(400).json({ error: "Invalid request type" });
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
