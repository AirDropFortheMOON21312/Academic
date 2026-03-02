import { StudyGuide } from '../../types';
import { BaseFormatter, FormattedResponse, FormatterUtils } from './baseFormatter';

/**
 * Conversational Formatter
 * Re-writes content as natural dialogue/narrative
 */
export class ConversationalFormatter extends BaseFormatter {
  name = 'Conversational';
  description = 'Natural narrative format, easy to read and discuss';

  format(studyGuide: StudyGuide): FormattedResponse {
    const parts: string[] = [];

    // Opening
    const summary = studyGuide.summary || '';
    const mainPoints = FormatterUtils.extractSummaryPoints(summary);

    parts.push('## Here\'s What You Need to Know\n');
    if (mainPoints.length > 0) {
      parts.push(
        `This material covers several key areas. ${mainPoints[0]} Additionally, you\'ll encounter concepts like ${mainPoints.slice(1, 3).join(' and ')}. These form the foundation of what you\'re studying.\n`
      );
    }

    // Concepts section (conversational)
    if (studyGuide.conceptMap && studyGuide.conceptMap.length > 0) {
      parts.push('## Essential Concepts to Remember\n');
      const conceptList = studyGuide.conceptMap.slice(0, 5).join(', ');
      parts.push(
        `The most important concepts to focus on are: ${conceptList}. Understanding each of these thoroughly will help you grasp the bigger picture.\n`
      );
    }

    // Detailed explanation
    parts.push('## A Closer Look\n');
    if (studyGuide.detailedPageNotes && studyGuide.detailedPageNotes.length > 0) {
      const plainText = studyGuide.detailedPageNotes
        .map(note => FormatterUtils.markdownToPlainText(note))
        .join(' ')
        .substring(0, 500); // First 500 chars
      parts.push(
        `The material breaks down into specific sections. ${plainText}... This structure helps organize the information logically.\n`
      );
    }

    // Feynman explanation
    if (studyGuide.feynmanExplanation) {
      parts.push('## Simple Explanation\n');
      parts.push(studyGuide.feynmanExplanation);
      parts.push('');
    }

    // Quiz as questions to consider
    if (studyGuide.quiz && studyGuide.quiz.length > 0) {
      parts.push('## Questions to Test Your Understanding\n');
      studyGuide.quiz.slice(0, 3).forEach((q, i) => {
        parts.push(`${i + 1}. ${q.question}`);
      });
      parts.push('');
    }

    // Key takeaways
    parts.push('## Key Takeaways to Remember\n');
    if (mainPoints.length > 0) {
      mainPoints.forEach((point, i) => {
        parts.push(`${i + 1}. ${point}`);
      });
    } else if (studyGuide.conceptMap && studyGuide.conceptMap.length > 0) {
      studyGuide.conceptMap.slice(0, 3).forEach((concept, i) => {
        parts.push(`${i + 1}. Master the concept of ${concept}`);
      });
    }

    // Closing
    parts.push('\nFocus on understanding these core concepts thoroughly, and don\'t hesitate to revisit sections that feel unclear. Mastery comes through practice and review.');

    // Confidence note
    if (studyGuide.confidence && studyGuide.confidence.score < 70) {
      parts.push(
        `\n---\n*Note: This material had lower clarity (${studyGuide.confidence.score}%). Review the original sources carefully.*`
      );
    }

    return {
      content: parts.join('\n').trim()
    };
  }
}
