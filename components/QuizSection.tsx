import React, { useState } from 'react';
import { QuizItem } from '../types';
import { CheckCircle2, Circle, ChevronRight, HelpCircle } from 'lucide-react';

interface QuizSectionProps {
  questions: QuizItem[];
}

const QuizSection: React.FC<QuizSectionProps> = ({ questions }) => {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const toggleReveal = (index: number) => {
    const newRevealed = new Set(revealed);
    if (newRevealed.has(index)) {
      newRevealed.delete(index);
    } else {
      newRevealed.add(index);
    }
    setRevealed(newRevealed);
  };

  return (
    <div className="w-full pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
           <div className="p-3 bg-amber-100 rounded-xl">
              <HelpCircle className="w-6 h-6 text-amber-600" />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-slate-800">Active Recall</h2>
              <p className="text-slate-500 text-sm">Self-testing improves retention</p>
           </div>
        </div>
        <div className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {questions.length} Questions
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {questions.map((q, idx) => {
          const isRevealed = revealed.has(idx);
          return (
            <div 
              key={idx} 
              className={`
                bg-white rounded-xl border transition-all duration-300 overflow-hidden flex flex-col
                ${isRevealed ? 'border-indigo-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-indigo-300'}
              `}
            >
              <div 
                className="p-5 cursor-pointer flex items-start gap-4 flex-1"
                onClick={() => toggleReveal(idx)}
              >
                <div className={`mt-1 flex-shrink-0 ${isRevealed ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {isRevealed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-lg mb-2 leading-snug">
                    {q.question}
                  </h3>
                  {!isRevealed && (
                    <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider mt-1 opacity-80">
                      Tap to reveal answer
                    </p>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isRevealed ? 'rotate-90' : ''}`} />
              </div>
              
              <div 
                className={`
                  bg-indigo-50/50 border-t border-indigo-100 transition-all duration-300 ease-in-out
                  ${isRevealed ? 'max-h-96 opacity-100 py-4 px-5' : 'max-h-0 opacity-0 overflow-hidden'}
                `}
              >
                <div className="text-slate-700 leading-relaxed text-sm md:text-base pl-9">
                  {q.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizSection;