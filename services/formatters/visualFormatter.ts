import { StudyGuide } from '../../types';
import { BaseFormatter, FormattedResponse, FormatterUtils } from './baseFormatter';

/**
 * Visual Formatter
 * Adds emoji/icons and visual styling to key sections
 */
export class VisualFormatter extends BaseFormatter {
  name = 'Visual Highlights';
  description = 'Content with emoji markers, highlights, and visual organization';

  format(studyGuide: StudyGuide): FormattedResponse {
    const parts: string[] = [];

    // Add visual divider
    parts.push('---');

    // Summary section with emoji
    if (studyGuide.summary) {
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('📚', 'Summary'));
      parts.push(studyGuide.summary);
      parts.push('');
    }

    // Detailed notes section
    if (studyGuide.detailedPageNotes && studyGuide.detailedPageNotes.length > 0) {
      parts.push('---');
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('📝', 'Detailed Notes'));
      studyGuide.detailedPageNotes.forEach((note) => {
        // Highlight critical sections
        const highlighted = note.replace(
          /critical|important|key|must|essential/gi,
          match => `[CRITICAL] ${match}`
        );
        parts.push(highlighted);
        parts.push('');
      });
      parts.push('');
    }

    // Concept map section
    if (studyGuide.conceptMap && studyGuide.conceptMap.length > 0) {
      parts.push('---');
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('🎯', 'Key Concepts'));
      studyGuide.conceptMap.forEach((concept) => {
        parts.push(`  💡 ${concept}`);
      });
      parts.push('');
    }

    // Quiz section
    if (studyGuide.quiz && studyGuide.quiz.length > 0) {
      parts.push('---');
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('❓', 'Quiz Questions'));
      studyGuide.quiz.forEach((q, i) => {
        parts.push(`  ${i + 1}. **${q.question}**`);
        parts.push(`     ✓ ${q.answer}`);
      });
      parts.push('');
    }

    // Feynman explanation
    if (studyGuide.feynmanExplanation) {
      parts.push('---');
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('💭', 'Simple Explanation'));
      parts.push(studyGuide.feynmanExplanation);
      parts.push('');
    }

    // Flashcards section
    if (studyGuide.flashcards && studyGuide.flashcards.length > 0) {
      parts.push('---');
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('🃏', 'Flashcards'));
      studyGuide.flashcards.forEach((f, i) => {
        parts.push(`  **Card ${i + 1}**`);
        parts.push(`  Q: ${f.front}`);
        parts.push(`  A: ${f.back}`);
        parts.push('');
      });
    }

    // Audio script
    if (studyGuide.audioScript) {
      parts.push('---');
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('🎙️', 'Audio/Podcast Script'));
      parts.push(studyGuide.audioScript);
      parts.push('');
    }

    // Confidence score with visual indicator
    if (studyGuide.confidence) {
      parts.push('---');
      parts.push('');
      parts.push(FormatterUtils.decorateHeader('📊', 'Quality Metrics'));
      const score = studyGuide.confidence.score;
      const indicator = score >= 80 ? '⭐⭐⭐' : score >= 60 ? '⭐⭐' : '⭐';
      parts.push(`  ${indicator} **Confidence:** ${score}/100`);
      parts.push(`  📌 ${studyGuide.confidence.reasoning}`);
      parts.push('');
    }

    // Key takeaways
    parts.push('---');
    parts.push('');
    parts.push(FormatterUtils.decorateHeader('✅', 'Key Takeaways'));
    const conceptList = studyGuide.conceptMap || [];
    conceptList.slice(0, 5).forEach((concept) => {
      parts.push(`  ✔️ ${concept}`);
    });

    parts.push('');
    parts.push('---');

    return {
      content: parts.join('\n').trim()
    };
  }
}
