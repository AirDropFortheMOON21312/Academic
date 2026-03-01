import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { FilePayload } from './geminiService';

// Set worker source to CDN to avoid build issues
const pdfjsVersion = pdfjsLib.version || '3.11.174';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

export const processFile = async (file: File): Promise<FilePayload> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // 1. Handle PDF (Extract Text)
  if (fileType === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      return {
        type: 'text',
        content: fullText,
        mimeType: 'text/plain' // Send as text to Gemini
      };
    } catch (error) {
      console.warn("PDF text extraction failed, falling back to raw PDF upload", error);
      // Fallback: Send as raw PDF (base64)
      return processRawFile(file, 'pdf');
    }
  }

  // 2. Handle DOCX (Extract Text)
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return {
        type: 'text',
        content: result.value,
        mimeType: 'text/plain'
      };
    } catch (error: any) {
      console.error("DOCX extraction failed", error);
      throw new Error(`Failed to process DOCX file "${file.name}": ${error.message || 'Unknown error'}`);
    }
  }

  // 3. Handle Text Files
  if (fileType === 'text/plain' || fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.endsWith('.csv') || fileName.endsWith('.json')) {
    try {
      const text = await file.text();
      return {
        type: 'text',
        content: text,
        mimeType: 'text/plain'
      };
    } catch (error: any) {
      throw new Error(`Failed to read text file "${file.name}": ${error.message || 'Unknown error'}`);
    }
  }

  // 4. Handle Images
  if (fileType.startsWith('image/')) {
    try {
      return await processRawFile(file, 'image');
    } catch (error: any) {
      throw new Error(`Failed to process image "${file.name}": ${error.message || 'Unknown error'}`);
    }
  }

  // Default fallback (try as text or raw base64 depending on size?)
  // For now, treat unknown as raw base64 if small enough, or error.
  console.warn(`Unknown file type: ${fileType}. Treating as binary.`);
  try {
    return await processRawFile(file, 'image'); // Treat as image/binary for Gemini (it might handle it)
  } catch (error: any) {
    throw new Error(`Failed to process file "${file.name}" of type ${fileType}: ${error.message || 'Unknown error'}`);
  }
};

const processRawFile = (file: File, type: 'image' | 'pdf' | 'text'): Promise<FilePayload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        type,
        content: base64,
        mimeType: file.type
      });
    };
    reader.onerror = () => {
      reject(new Error(`FileReader failed to read "${file.name}": ${reader.error?.message || 'Unknown error'}`));
    };
    reader.readAsDataURL(file);
  });
};
