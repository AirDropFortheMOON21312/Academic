import React from 'react';
import { formatFactory, type FormatType } from '../services/formatters/formatFactory';
import { ChevronDown } from 'lucide-react';

interface FormatSelectorProps {
  selectedFormat: FormatType;
  onFormatChange: (format: FormatType) => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ selectedFormat, onFormatChange }) => {
  const formats = formatFactory.getAvailableFormats();

  return (
    <div className="flex items-center gap-3 mb-6">
      <label className="text-sm font-semibold text-slate-700">Output Format:</label>
      <div className="relative">
        <select
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value as FormatType)}
          className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
        >
          {formats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
      <span className="text-xs text-slate-500 ml-2">
        {formats.find(f => f.id === selectedFormat)?.description}
      </span>
    </div>
  );
};

export default FormatSelector;
