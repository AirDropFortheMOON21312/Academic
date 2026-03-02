import { StudyGuide, QuizItem, Flashcard } from '../../types';

/**
 * Response from a formatter after processing a StudyGuide
 */
export interface FormattedResponse {
  /** Text content for markdown/conversational formats */
  content?: string;
  /** Structured data for JSON format */
  data?: object;
  /** HTML string for visual format (optional) */
  html?: string;
}

/**
 * Base interface for all formatters
 */
export interface IFormatter {
  name: string;
  description: string;
  format(studyGuide: StudyGuide): FormattedResponse;
}

/**
 * Utility functions for formatters
 */
export class FormatterUtils {
  /**
   * Extract key points from summary text
   */
  static extractSummaryPoints(summary: string): string[] {
    return summary
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 5);
  }

  /**
   * Parse detailed page notes into structured sections
   */
  static parsePageNotes(notes: string[]): Record<string, unknown> {
    const parsed: Record<string, unknown> = {};
    notes.forEach((note, index) => {
      const pageMatch = note.match(/\[.*?(\d+).*?\]/);
      const pageNum = pageMatch ? pageMatch[1] : `${index + 1}`;
      parsed[`page_${pageNum}`] = note;
    });
    return parsed;
  }

  /**
   * Convert markdown to plain text (basic)
   */
  static markdownToPlainText(markdown: string): string {
    return markdown
      .replace(/#{1,6}\s+/g, '')  // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
      .replace(/\*(.*?)\*/g, '$1')  // Remove italics
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // Remove links
      .replace(/^[-*]\s+/gm, '')  // Remove bullet points
      .replace(/\n\n+/g, '\n')  // Clean up multiple newlines
      .trim();
  }

  /**
   * Create emoji-decorated section header
   */
  static decorateHeader(emoji: string, title: string): string {
    return `${emoji} **${title}**\n`;
  }

  /**
   * Escape special JSON characters
   */
  static escapeJson(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}

/**
 * Base formatter class with common functionality
 */
export abstract class BaseFormatter implements IFormatter {
  abstract name: string;
  abstract description: string;

  abstract format(studyGuide: StudyGuide): FormattedResponse;

  /**
   * Helper to format quiz items
   */
  protected formatQuiz(quiz: QuizItem[]): string {
    return quiz
      .map((q, i) => `${i + 1}. **${q.question}**\n   Answer: ${q.answer}`)
      .join('\n\n');
  }

  /**
   * Helper to format flashcards
   */
  protected formatFlashcards(flashcards: Flashcard[]): string {
    return flashcards
      .map((f, i) => `${i + 1}. Q: ${f.front}\n   A: ${f.back}`)
      .join('\n\n');
  }

  /**
   * Helper to format concepts
   */
  protected formatConcepts(concepts: string[]): string {
    return concepts.map(c => `- ${c}`).join('\n');
  }
}
