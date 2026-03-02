import { StudyGuide } from '../../types';
import { BaseFormatter, FormattedResponse, FormatterUtils } from './baseFormatter';

interface JsonStructure {
  summary_points: string[];
  detailed_notes_by_page: Record<string, string>;
  conceptual_understanding: {
    concepts: string[];
  };
  assessment_tools: {
    quiz: Array<{
      question: string;
      answer: string;
      type: string;
    }>;
    flashcards: Array<{
      front: string;
      back: string;
    }>;
  };
  explanations: {
    feynman: string;
    audio_script: string;
  };
  quality_metrics: {
    confidence_score: number;
    confidence_reasoning: string;
  };
}

/**
 * JSON Formatter
 * Returns content as structured JSON with categorized data
 */
export class JsonFormatter extends BaseFormatter {
  name = 'JSON';
  description = 'Structured JSON with categorized insights and data';

  format(studyGuide: StudyGuide): FormattedResponse {
    const jsonData: JsonStructure = {
      summary_points: FormatterUtils.extractSummaryPoints(studyGuide.summary),
      detailed_notes_by_page: FormatterUtils.parsePageNotes(
        studyGuide.detailedPageNotes || []
      ) as Record<string, string>,
      conceptual_understanding: {
        concepts: studyGuide.conceptMap || []
      },
      assessment_tools: {
        quiz: (studyGuide.quiz || []).map(q => ({
          question: q.question,
          answer: q.answer,
          type: q.type
        })),
        flashcards: (studyGuide.flashcards || []).map(f => ({
          front: f.front,
          back: f.back
        }))
      },
      explanations: {
        feynman: studyGuide.feynmanExplanation || '',
        audio_script: studyGuide.audioScript || ''
      },
      quality_metrics: {
        confidence_score: studyGuide.confidence?.score || 0,
        confidence_reasoning: studyGuide.confidence?.reasoning || ''
      }
    };

    return {
      data: jsonData,
      content: JSON.stringify(jsonData, null, 2)
    };
  }
}
