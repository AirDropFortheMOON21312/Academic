import React, { useState } from 'react';
import { Flashcard } from '../types';
import { RotateCw, Layers, Sparkles, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

interface FlashcardDeckProps {
  cards: Flashcard[];
}

const SingleFlashcard: React.FC<{ card: Flashcard; index: number }> = ({ card, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group h-[26rem] w-full perspective-1000 cursor-pointer select-none touch-pan-y"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div 
        className="relative h-full w-full transform-style-3d rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.2)]"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Front (Question) */}
        <div className="absolute inset-0 backface-hidden bg-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden">
          {/* Top Decoration */}
          <div className="w-full flex justify-between items-start mb-6">
             <div className="flex items-center gap-2 text-indigo-900/40">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Card {index + 1}</span>
             </div>
             <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                <span className="text-sm font-bold">Q</span>
             </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex items-center justify-center p-2">
             <p className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
              {card.front}
            </p>
          </div>
          
          {/* Bottom Hint */}
          <div className="mt-8 w-full flex justify-center">
            <div className="px-4 py-2 bg-slate-50 rounded-full text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <RotateCw className="w-3 h-3" /> 
                <span>Tap to Flip</span>
            </div>
          </div>
        </div>

        {/* Back (Answer) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-brand-900 to-indigo-700 text-white rounded-3xl p-8 flex flex-col items-center text-center shadow-inner overflow-hidden border border-white/10">
          {/* Top Decoration */}
          <div className="w-full flex justify-between items-start mb-6">
             <div className="flex items-center gap-2 text-white/40">
                <BrainCircuit className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Analysis</span>
             </div>
             <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-indigo-100 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
             </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex items-center justify-center p-2">
            <p className="text-lg md:text-xl font-medium leading-relaxed text-indigo-50">
              {card.back}
            </p>
          </div>
          
           {/* Bottom Hint */}
           <div className="mt-8 w-full flex justify-center">
            <div className="px-4 py-2 bg-white/10 rounded-full text-indigo-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-white/20 transition-colors">
                <RotateCw className="w-3 h-3" /> 
                <span>Flip Back</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="w-full pb-32 md:pb-24 animate-fade-in px-2 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl">
              <Layers className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Flashcards</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Master {cards.length} key concepts</p>
            </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <RotateCw className="w-3 h-3" />
            <span>Interactive Deck</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 mx-auto">
        {cards.map((card, index) => (
          // Use content-based key to force reset state when filtering/changing units
          <SingleFlashcard 
            key={`${index}-${card.front.substring(0, 15)}`} 
            card={card} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default FlashcardDeck;