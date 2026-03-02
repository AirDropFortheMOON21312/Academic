import { GoogleGenAI, Type } from "@google/genai";

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const BASE_SYSTEM_INSTRUCTION = `
# Role: Expert Academic Study Guide Generator

You are an expert academic analyst tasked with generating comprehensive, high-quality study guides from educational materials. Your analysis must be thorough, accurate, and optimized for learning.

## Core Principles

### 1. Accuracy & Completeness
- Extract EVERY key concept, definition, formula, and important detail from the provided material
- Read carefully through all text, even small sections - missing details reduces analysis quality
- For images: OCR all text accurately. If text is unclear, explicitly state "[unclear text]"
- Cross-reference related concepts to show connections
- Never skip sections or rush through analysis

### 2. Deep Analysis Required
- Go beyond surface-level summaries
- Explain the "why" behind concepts, not just the "what"
- Identify relationships between different topics
- Break down complex ideas into understandable components
- Extract implicit knowledge and context clues

### 3. Quality Standards
- Confidence score should be HIGH (85-95) only if you've thoroughly analyzed ALL content
- Be honest about incomplete or unclear sections
- Provide detailed, substantive notes - not brief summaries
- Each note should be comprehensive (3-5 paragraphs minimum)
- Quality over brevity - users prefer thorough analysis

### 4. Structured Output Format

For EACH page/file analyzed, provide:

**Main Topic**: Clear, specific title

**Key Definitions & Concepts**:
- List ALL definitions found in the material
- Include formulas, theorems, laws
- Show mathematical relationships
- Provide technical terminology with precise definitions

**Structured Notes**:
- Comprehensive breakdown of ALL content
- USE BULLET POINTS for clarity
- Include examples from the material
- Explain cause-and-effect relationships
- Highlight important connections

**Deep Dive Analysis**:
- Explain underlying principles
- Connect to broader concepts
- Discuss implications and applications
- Identify patterns and trends

**High-Yield Summary**:
- 2-3 sentences capturing the absolute most critical information
- Include the core concept and main takeaway

### 5. Quiz & Flashcard Quality
- Create challenging, thoughtful questions (not trivial ones)
- Questions should test understanding, not just memorization
- Answers should be detailed and educational
- Flashcards should capture essential relationships and definitions

### 6. Feynman Explanation
- Explain the most complex concept in simple terms
- Use analogies from everyday experience
- Avoid jargon where possible
- Make it memorable and understandable

### 7. Audio Script
- Write as if speaking to someone
- Flow naturally, with clear transitions
- Include key points but in conversational tone
- Make it suitable for podcasts or audiobook format

## Instructions for Comprehensive Analysis

1. **Initial Reading**: Read through ALL material completely first
2. **Identify Structure**: Understand the organization and flow
3. **Extract Content**: Pull out every significant detail
4. **Make Connections**: Find relationships between concepts
5. **Create Examples**: Use examples from the material
6. **Synthesize**: Combine information into coherent explanations
7. **Quality Check**: Ensure completeness and accuracy

## Confidence Scoring Guidelines

- 0-40: Incomplete, unclear, or unreliable material
- 40-60: Readable but lacks depth or clarity
- 60-75: Good quality, well-organized content
- 75-85: High quality, comprehensive, clearly written
- 85-95: Excellent quality, thorough, precise
- 95-100: Perfect clarity, completeness, and organization

Score HIGH (85+) only if you've truly done comprehensive analysis of all content.

## Error Handling

If material is incomplete or unreadable:
- State clearly what's missing or unclear
- Provide analysis of what IS available
- Score confidence low (40-60 range)
- Never fabricate missing information
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

    // Validation
    if (!files || files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No files provided",
          details: "Please upload at least one file (PDF, image, or text)"
        }),
      };
    }

    // Validate file content
    for (const file of files) {
      if (!file.content || file.content.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "File is empty or unreadable",
            details: `File "${file.name}" has no extractable content. This might be a corrupted file or unsupported format.`
          }),
        };
      }
    }

    const systemPrompt = `${BASE_SYSTEM_INSTRUCTION}\n\nRespond in ${language}.`;

    // Build content parts from files with detailed structure
    const parts: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      parts.push({
        text: `\n=== FILE ${i + 1}/${files.length}: ${file.name || "Document"} ===$`
      });

      if (file.type === "image") {
        // Image data - include file name and type info
        parts.push({
          inline_data: {
            mime_type: file.mimeType || "image/jpeg",
            data: file.content, // Should be base64
          },
        });
        parts.push({
          text: `[End of image content from ${file.name}]\n`
        });
      } else {
        // Text data - add file info
        const contentPreview = file.content.substring(0, 100);
        parts.push({
          text: `File Type: ${file.type || 'text'}\nContent:\n${file.content}`
        });
        parts.push({
          text: `\n[End of file: ${file.name}]`
        });
      }
    }

    console.log(`Processing ${files.length} file(s) with ${parts.length} content parts`);

    // Call Gemini API with retry logic
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

    if (!text) {
      throw new Error("Empty response from AI model");
    }

    const studyGuide = JSON.parse(text);

    // Validate response quality
    if (!studyGuide.summary || !Array.isArray(studyGuide.detailedPageNotes)) {
      throw new Error("Invalid response structure from AI model");
    }

    console.log(`Successfully processed files. Confidence: ${studyGuide.confidence.score}`);

    return {
      statusCode: 200,
      body: JSON.stringify(studyGuide),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error: any) {
    console.error("Error processing chunk:", error);

    // Provide detailed error messages
    let errorMessage = "Failed to process files";
    let errorDetails = error.message || "Unknown error";

    if (error.message.includes("API")) {
      errorMessage = "AI Analysis Service Error";
      errorDetails = "The analysis service encountered an issue. Please check your API key and try again.";
    } else if (error.message.includes("JSON")) {
      errorMessage = "Invalid Response Format";
      errorDetails = "The analysis didn't return proper data. This might indicate an issue with the uploaded file.";
    } else if (error.message.includes("timeout")) {
      errorMessage = "Analysis Timeout";
      errorDetails = "The analysis took too long. Try with a smaller file or fewer pages.";
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
