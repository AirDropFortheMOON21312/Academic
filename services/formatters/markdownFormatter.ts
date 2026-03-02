import { StudyGuide } from '../../types';
import { BaseFormatter, FormattedResponse } from './baseFormatter';

/**
 * Markdown Formatter
 * Returns content in structured markdown format (default behavior)
 */
export class MarkdownFormatter extends BaseFormatter {
  name = 'Markdown';
  description = 'Structured markdown with sections, lists, and emphasis';

  format(studyGuide: StudyGuide): FormattedResponse {
    const parts: string[] = [];

    // Summary section
    if (studyGuide.summary) {
      parts.push('## Summary\n');
      parts.push(studyGuide.summary);
      parts.push('');
    }

    // Detailed notes section
    if (studyGuide.detailedPageNotes && studyGuide.detailedPageNotes.length > 0) {
      parts.push('## Detailed Notes\n');
      studyGuide.detailedPageNotes.forEach((note) => {
        parts.push(note);
        parts.push('');
      });
    }

    // Concept map section
    if (studyGuide.conceptMap && studyGuide.conceptMap.length > 0) {
      parts.push('## Key Concepts\n');
      studyGuide.conceptMap.forEach((concept) => {
        parts.push(`- ${concept}`);
      });
      parts.push('');
    }

    // Quiz section
    if (studyGuide.quiz && studyGuide.quiz.length > 0) {
      parts.push('## Quiz Questions\n');
      parts.push(this.formatQuiz(studyGuide.quiz));
      parts.push('');
    }

    // Feynman explanation
    if (studyGuide.feynmanExplanation) {
      parts.push('## Simplified Explanation\n');
      parts.push(studyGuide.feynmanExplanation);
      parts.push('');
    }

    // Flashcards section
    if (studyGuide.flashcards && studyGuide.flashcards.length > 0) {
      parts.push('## Flashcards\n');
      parts.push(this.formatFlashcards(studyGuide.flashcards));
      parts.push('');
    }

    // Audio script
    if (studyGuide.audioScript) {
      parts.push('## Audio/Podcast Script\n');
      parts.push(studyGuide.audioScript);
      parts.push('');
    }

    // Confidence score
    if (studyGuide.confidence) {
      parts.push('## Quality Metrics\n');
      parts.push(`**Confidence Score:** ${studyGuide.confidence.score}/100`);
      parts.push(`**Reasoning:** ${studyGuide.confidence.reasoning}`);
      parts.push('');
    }

    return {
      content: parts.join('\n').trim()
    };
  }
}
