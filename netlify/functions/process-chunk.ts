import { GoogleGenAI, Type } from "@google/genai";

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const BASE_SYSTEM_INSTRUCTION = `
Role: Act as a strict, expert academic information extractor. The user will provide educational text or images. Your ONLY source of truth is the exact material provided. You must not invent information.

Core Objectives:
* Zero Hallucination: Rely strictly on uploaded content
* Targeted Extraction: Focus on examinable material
* High-Yield Focus: Organize for exam preparation

Response Structure: Return JSON with summary, detailedPageNotes, conceptMap, quiz, feynmanExplanation, flashcards, audioScript, and confidence score.
`;

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { files, language = "English" } = JSON.parse(event.body);

    if (!files || files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No files provided" }),
      };
    }

    const systemPrompt = `${BASE_SYSTEM_INSTRUCTION}\n\nRespond in ${language}.`;

    // Build content parts from files
    const parts: any[] = [];
    parts.push({ text: `--- START FILE ---` });

    for (const file of files) {
      if (file.type === "image") {
        // Image data
        parts.push({
          inline_data: {
            mime_type: file.mimeType,
            data: file.content, // Assuming this is already base64
          },
        });
      } else {
        // Text data
        parts.push({ text: file.content });
      }
      parts.push({ text: "--- END FILE ---" });
    }

    // Call Gemini API
    const model = genai.getGenerativeModel({
      model: "gemini-3.1-pro-preview",
      systemInstruction: systemPrompt,
    });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            detailedPageNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            conceptMap: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
              },
            },
            feynmanExplanation: { type: Type.STRING },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                },
              },
            },
            audioScript: { type: Type.STRING },
            confidence: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
              },
            },
          },
          required: [
            "summary",
            "detailedPageNotes",
            "conceptMap",
            "quiz",
            "feynmanExplanation",
            "flashcards",
            "audioScript",
            "confidence",
          ],
        },
      },
    });

    const text = response.response.text();
    const studyGuide = JSON.parse(text);

    return {
      statusCode: 200,
      body: JSON.stringify(studyGuide),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error: any) {
    console.error("Error processing chunk:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to process chunk",
      }),
    };
  }
};
