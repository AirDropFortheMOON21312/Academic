import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secret-key-change-me";

// --- Constants & Configuration ---

// Increase limit to 100mb for large PDFs
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Debug route to confirm server is running and reachable
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const BASE_SYSTEM_INSTRUCTION = `
Role: Act as a strict, expert academic information extractor. The user will provide educational text or images. Your ONLY source of truth is the exact material provided. You must not invent information, and you must not include outside general knowledge unless absolutely necessary to briefly clarify a highly ambiguous term present in the text.

Core Objectives for Quality & Targeting:
 * Zero Hallucination: Rely strictly on the uploaded content. If an image is blurry, cut off, or illegible, explicitly state: '[Unreadable or missing content in this section]'. Do not guess what the text says.
 * Targeted Extraction: Filter out filler text, anecdotes, and irrelevant examples. Focus exclusively on examinable material: core concepts, definitions, formulas, chronological events, and cause-and-effect relationships.
 * High-Yield Focus: Structure the information so that the core academic message is immediately obvious to a student preparing for exams.

Strict Formatting & Organization Rules:
 * Strict Sequential Order: Process files in the exact order they were provided. Analyze each file completely separately. Do not mix contexts.
 * No Excessive Bolding: DO NOT bold entire sentences or paragraphs. Bold ONLY keywords, names, or specific terminology.
 * Hierarchy: Use clear headings to break down logical sections.
 * Lists (Bullet points): Steps, characteristics, pros/cons, or categories MUST be bulleted.

Mandatory Response Structure:
For EACH image or file you process, output the exact following template in the "detailedPageNotes" array:

--- [ FILE / PAGE X ] ---
 * Main Topic: [Clear, specific title of the page's content]
 * Key Definitions / Concepts: [Direct definitions or core formulas extracted from the text]
 * Structured Notes: [Highly detailed, bulleted breakdown of the specific arguments and facts presented in the text]
 * High-Yield Summary (SOS): [1-2 precise sentences summarizing the absolute most critical takeaway from this specific page]

OUTPUT FORMAT FOR "detailedPageNotes" (Strict Markdown):
For each page, generate a string using the structure above.
`;

const DEFAULT_MODEL = 'gemini-3.1-pro-preview';
// Verified against API — these are the actual available model IDs for this key
const MODEL_CASCADE = [
  'gemini-3.1-pro-preview',  // Best quality
  'gemini-3-flash-preview',  // Fast + capable
  'gemini-2.5-pro',          // Great quality, stable
  'gemini-2.5-flash',        // Fast & reliable
  'gemini-2.0-flash',        // Solid fallback
];

interface FilePayload {
  type: 'image' | 'pdf' | 'text';
  content: string;
  mimeType: string;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Middleware ---

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Auth & File Storage Setup ---

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(FILES_FILE)) fs.writeFileSync(FILES_FILE, '[]');

const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
const saveUsers = (users: any[]) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const getFiles = () => JSON.parse(fs.readFileSync(FILES_FILE, 'utf-8'));
const saveFiles = (files: any[]) => fs.writeFileSync(FILES_FILE, JSON.stringify(files, null, 2));

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    
    const users = getUsers();
    if (users.find((u: any) => u.email === email)) return res.status(400).json({ error: "User already exists" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), email, password: hashedPassword };
    users.push(newUser);
    saveUsers(users);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);
    res.json({ token, user: { id: newUser.id, email: newUser.email } });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find((u: any) => u.email === email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
});

const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: "Invalid token" });
    }
};

// --- File Routes ---

app.get('/api/files', authenticate, (req: any, res) => {
    const files = getFiles().filter((f: any) => f.userId === req.user.id);
    res.json(files);
});

app.post('/api/files/sync', authenticate, (req: any, res) => {
    const { files } = req.body; // Expecting array of file metadata + content (base64)
    if (!Array.isArray(files)) return res.status(400).json({ error: "Invalid files array" });
    
    const allFiles = getFiles();
    
    const updatedUserFiles = [];
    
    for (const file of files) {
        // file.content should be base64
        if (file.content) {
            const fileName = `${req.user.id}_${file.key}_${Date.now()}.bin`;
            const filePath = path.join(UPLOADS_DIR, fileName);
            // Remove header "data:mime;base64,"
            const base64Data = file.content.replace(/^data:.*,/, "");
            fs.writeFileSync(filePath, base64Data, 'base64');
            file.path = fileName;
            delete file.content; // Don't store content in JSON
        }
        file.userId = req.user.id;
        updatedUserFiles.push(file);
    }
    
    // Remove old user files and add new ones (full sync for simplicity in this prototype)
    const otherFiles = allFiles.filter((f: any) => f.userId !== req.user.id);
    saveFiles([...otherFiles, ...updatedUserFiles]);
    
    res.json({ success: true });
});

// Serve uploaded files
app.get('/api/uploads/:filename', authenticate, (req: any, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        // Check if user owns this file (simple check via filename prefix or DB lookup)
        // For prototype, we trust the token.
        const fileRecord = getFiles().find((f: any) => f.path === req.params.filename && f.userId === req.user.id);
        if (!fileRecord) return res.status(403).json({ error: "Access denied" });
        
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

// --- AI Routes ---

app.post("/api/process-chunk", async (req, res) => {
  console.log("Processing chunk request...");
  try {
    const { files, translateToEnglish, pageOffset, overrideModel } = req.body;

    if (!files || !Array.isArray(files)) {
      console.error("Invalid files payload:", req.body);
      return res.status(400).json({ error: "Invalid files payload" });
    }

    // User's custom key (from Settings) takes priority, then fall back to server env key
    const userKey = (req.headers['x-api-key'] as string || '').trim();
    const apiKey = userKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';

    if (!apiKey) {
      return res.status(500).json({ error: "No API key configured. Add GEMINI_API_KEY to .env or enter your own key in Settings." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const initialModelName = overrideModel || DEFAULT_MODEL;

    const languageDirective = translateToEnglish 
      ? "LANGUAGE OVERRIDE: TRANSLATE ALL OUTPUT TO ENGLISH."
      : "LANGUAGE OVERRIDE: DETECT SOURCE LANGUAGE AND USE IT FOR OUTPUT.";

    const systemInstruction = languageDirective + "\n\n" + BASE_SYSTEM_INSTRUCTION;

    const parts: any[] = [];
    
    files.forEach((file: FilePayload, idx: number) => {
        parts.push({ text: `--- START FILE ${idx + 1} (Page ${pageOffset + idx + 1}) ---` });
        
        if (file.type === 'text') {
            parts.push({ text: file.content });
        } else {
            parts.push({ inlineData: { mimeType: file.mimeType, data: file.content } });
        }
        
        parts.push({ text: `--- END FILE ${idx + 1} ---` });
    });

    parts.push({
      text: `Analyze this batch of ${files.length} files.
      IMPORTANT: You must return a JSON object with a "detailedPageNotes" array containing EXACTLY ${files.length} strings.
      Index 0 of the array must correspond to File 1, Index 1 to File 2, etc.
      
      Generate JSON now.`,
    });

    // Always try ALL models — preferred model first, then the rest of the cascade.
    // Never slice: a user pref stored from an old session could start mid-cascade
    // and skip reliable fallbacks like gemini-1.5-flash.
    const cascade = MODEL_CASCADE.includes(initialModelName)
      ? [initialModelName, ...MODEL_CASCADE.filter(m => m !== initialModelName)]
      : [initialModelName, ...MODEL_CASCADE];

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "High-level summary of these specific pages." },
        detailedPageNotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `Markdown notes: Main Topic, Key Definitions, Structured Notes, High-Yield Summary. MUST have ${files.length} items.`
        },
        conceptMap: { type: Type.ARRAY, items: { type: Type.STRING } },
        quiz: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["multiple", "open"] },
            },
            required: ["question", "answer", "type"],
          },
        },
        feynmanExplanation: { type: Type.STRING, description: "One complex topic simplified." },
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
            },
            required: ["front", "back"],
          },
        },
        audioScript: { type: Type.STRING },
        confidence: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ["score", "reasoning"],
        },
      },
      required: ["detailedPageNotes", "conceptMap", "quiz", "flashcards", "confidence"],
    };

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ];

    let success = false;
    let result = null;
    let lastError = 'Unknown error';

    for (let mi = 0; mi < cascade.length && !success; mi++) {
      const currentModel = cascade[mi];

      const config: any = {
        systemInstruction,
        responseMimeType: "application/json",
        safetySettings,
        responseSchema,
      };

      const MAX_RETRIES_PER_MODEL = 2;
      for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL && !success; attempt++) {
        try {
          console.log(`[Model ${mi + 1}/${cascade.length}] Attempt ${attempt + 1}: ${currentModel}`);

          const response = await ai.models.generateContent({
            model: currentModel,
            contents: { parts: parts },
            config,
          });

          let text = response.text;
          if (!text) throw new Error("Empty response from AI");

          text = text.trim();
          if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');

          result = JSON.parse(text);
          success = true;
          console.log(`✅ Success with model: ${currentModel}`);

        } catch (e: any) {
          const errorMsg = (e.message || JSON.stringify(e)).toLowerCase();
          const status = e.status || (e.response?.status) || null;
          lastError = e.message || 'Unknown error';

          console.warn(`❌ [${currentModel}] attempt ${attempt + 1} failed (status=${status}): ${errorMsg.substring(0, 120)}`);

          // Only hard-stop on a genuine authentication failure (invalid key, not model access)
          const isRealAuthError = (status === 401) ||
            (errorMsg.includes('api key not valid') || errorMsg.includes('invalid api key'));
          if (isRealAuthError) {
            return res.status(403).json({ error: "API Key is invalid. Please check your key in Settings." });
          }

          // Rate-limited: wait and retry same model
          if (status === 429 || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
            const waitMs = 3000 * (attempt + 1);
            console.log(`⏳ Rate limited on ${currentModel}, waiting ${waitMs}ms before retry...`);
            await delay(waitMs);
            continue; // retry same model
          }

          // Any other error (model not found, 403 access, 500, timeout): break to next model
          console.log(`➡️ Moving to next model in cascade...`);
          await delay(1000);
          break;
        }
      }
    }

    if (!success || !result) {
      return res.status(500).json({
        error: `Analysis failed across all ${cascade.length} models. Please try again later.`,
        details: `Last error: ${lastError}. Models tried: ${cascade.join(', ')}`,
      });
    }

    res.json(result);

  } catch (error: any) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio = "1:1" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const userKey2 = (req.headers['x-api-key'] as string || '').trim();
    const apiKey = userKey2 || process.env.GEMINI_API_KEY || process.env.API_KEY || '';

    if (!apiKey) {
      return res.status(500).json({ error: "No API key configured. Add GEMINI_API_KEY to .env or enter your own key in Settings." });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p: any) => p.inlineData);

    if (imagePart && imagePart.inlineData) {
        const base64Image = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType || "image/png";
        res.json({ image: `data:${mimeType};base64,${base64Image}` });
    } else {
        throw new Error("No image generated in response");
    }

  } catch (error: any) {
    console.error("Image Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist (if built)
    // For now, we assume dev mode or proper build setup elsewhere
    // But for this environment, we rely on Vite middleware mostly.
    // If running `npm start` in prod, we might need express.static
    app.use(express.static('dist'));
  }

  // Add explicit 404 for API routes to prevent falling through to Vite
  app.all('/api/*path', (req, res) => {
      console.error(`API 404: ${req.method} ${req.url}`);
      res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
