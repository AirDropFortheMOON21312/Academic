import { IFormatter } from './baseFormatter';
import { MarkdownFormatter } from './markdownFormatter';
import { JsonFormatter } from './jsonFormatter';
import { ConversationalFormatter } from './conversationalFormatter';
import { VisualFormatter } from './visualFormatter';

export type FormatType = 'markdown' | 'json' | 'conversational' | 'visual';

export interface FormatOption {
  id: FormatType;
  name: string;
  description: string;
}

/**
 * Factory for creating and managing formatters
 */
export class FormatFactory {
  private formatters: Map<FormatType, IFormatter>;

  private static instance: FormatFactory;

  private constructor() {
    this.formatters = new Map([
      ['markdown', new MarkdownFormatter()],
      ['json', new JsonFormatter()],
      ['conversational', new ConversationalFormatter()],
      ['visual', new VisualFormatter()]
    ]);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): FormatFactory {
    if (!FormatFactory.instance) {
      FormatFactory.instance = new FormatFactory();
    }
    return FormatFactory.instance;
  }

  /**
   * Get a formatter by type
   */
  getFormatter(type: FormatType): IFormatter {
    const formatter = this.formatters.get(type);
    if (!formatter) {
      console.warn(`Formatter ${type} not found, falling back to markdown`);
      return this.formatters.get('markdown')!;
    }
    return formatter;
  }

  /**
   * Get all available format options
   */
  getAvailableFormats(): FormatOption[] {
    return Array.from(this.formatters.values()).map((f) => ({
      id: this.getFormatId(f),
      name: f.name,
      description: f.description
    }));
  }

  /**
   * Helper to get format ID from formatter instance
   */
  private getFormatId(formatter: IFormatter): FormatType {
    if (formatter instanceof MarkdownFormatter) return 'markdown';
    if (formatter instanceof JsonFormatter) return 'json';
    if (formatter instanceof ConversationalFormatter) return 'conversational';
    if (formatter instanceof VisualFormatter) return 'visual';
    return 'markdown';
  }

  /**
   * Check if a format type is valid
   */
  isValidFormat(type: string): type is FormatType {
    return this.formatters.has(type as FormatType);
  }
}

// Export singleton instance
export const formatFactory = FormatFactory.getInstance();
