import { StudyGuide } from "../types";

export interface FilePayload {
  type: 'image' | 'pdf' | 'text';
  content: string; // Base64 for image/pdf, raw string for text
  mimeType: string;
}

const CHUNK_SIZE = 3; // Reduced chunk size for reliability with Pro models
const DEFAULT_MODEL = 'gemini-3.1-pro-preview'; 

interface ChunkData {
  index: number;
  files: FilePayload[];
  offset: number;
}

export const generateStudyGuide = async (
  files: FilePayload[],
  translateToEnglish: boolean,
  pageOffset: number = 0,
  overrideModel?: string
): Promise<StudyGuide> => {
  const storedModel = localStorage.getItem('gemini_model_pref') || DEFAULT_MODEL;
  const initialModelName = overrideModel || storedModel;

  // Reduced concurrency to avoid 429s
  const isFlash = initialModelName.includes('flash');
  const CONCURRENCY_LIMIT = isFlash ? 3 : 1;

  const chunkCount = Math.ceil(files.length / CHUNK_SIZE);
  const chunks: ChunkData[] = [];
  
  for (let i = 0; i < chunkCount; i++) {
    chunks.push({
      index: i,
      files: files.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      offset: pageOffset + (i * CHUNK_SIZE)
    });
  }

  console.log(`🚀 Processing: ${files.length} files in ${chunkCount} chunks. Model: ${initialModelName}. Concurrency: ${CONCURRENCY_LIMIT}`);

  const processChunk = async (chunk: ChunkData): Promise<StudyGuide> => {
    try {
        const apiKey = localStorage.getItem('gemini_api_key') || '';
        
        const response = await fetch('/api/process-chunk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                files: chunk.files,
                translateToEnglish,
                pageOffset: chunk.offset,
                overrideModel: initialModelName
            })
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            } else {
                const text = await response.text();
                console.error(`Received non-JSON error from server: ${text.substring(0, 200)}...`);
                throw new Error(`Server Error: ${response.status}`);
            }
        }

        return await response.json();
    } catch (e: any) {
        console.error(`Failed to process chunk ${chunk.index}`, e);
        // Return a partial error result so the whole process doesn't fail
        return {
            summary: "Error processing this section.",
            detailedPageNotes: Array(chunk.files.length).fill(`## Error Analysis\nCould not process this specific file batch (Files ${chunk.offset + 1}-${chunk.offset + chunk.files.length}).\n\nError: ${e.message}`),
            conceptMap: [],
            quiz: [],
            feynmanExplanation: "",
            flashcards: [],
            audioScript: "",
            confidence: { score: 0, reasoning: "Processing Error" }
        };
    }
  };

  const resultsMap = new Map<number, StudyGuide>();
  const queue = [...chunks];

  const worker = async () => {
    while (queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) break;
      try {
        const res = await processChunk(chunk);
        resultsMap.set(chunk.index, res);
      } catch (e) {
        console.error("Worker error:", e);
      }
    }
  };

  const numWorkers = Math.min(chunks.length, CONCURRENCY_LIMIT);
  await Promise.all(Array.from({ length: numWorkers }, () => worker()));

  const finalResult: StudyGuide = {
    summary: "",
    detailedPageNotes: [],
    conceptMap: [],
    quiz: [],
    feynmanExplanation: "",
    flashcards: [],
    audioScript: "",
    confidence: { score: 0, reasoning: "" }
  };

  let totalScore = 0;
  let scoreCount = 0;
  let combinedSummary: string[] = [];
  let combinedFeynman: string[] = [];
  let combinedScript: string[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const res = resultsMap.get(i);
    if (res) {
      finalResult.detailedPageNotes.push(...(res.detailedPageNotes || []));
      finalResult.conceptMap.push(...(res.conceptMap || []));
      finalResult.quiz.push(...(res.quiz || []));
      finalResult.flashcards.push(...(res.flashcards || []));
      
      if (res.summary) combinedSummary.push(res.summary);
      if (res.feynmanExplanation) combinedFeynman.push(res.feynmanExplanation);
      if (res.audioScript) combinedScript.push(res.audioScript);
      
      if (res.confidence?.score) {
          totalScore += res.confidence.score;
          scoreCount++;
      }
    }
  }

  finalResult.summary = combinedSummary.join("\n\n");
  finalResult.feynmanExplanation = combinedFeynman.join("\n\n---\n\n");
  finalResult.audioScript = combinedScript.join("\n\n");
  finalResult.confidence.score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
  finalResult.confidence.reasoning = `Analyzed ${files.length} sources with high-density extraction.`;
  // Deduplicate concepts
  finalResult.conceptMap = [...new Set(finalResult.conceptMap)];

  return finalResult;
};
