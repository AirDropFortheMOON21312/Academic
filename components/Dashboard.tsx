import React from 'react';
import { Unit } from '../types';
import { BookOpen, Calendar, Trash2, ArrowRight, Plus, Sparkles, FileText, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  units: Unit[];
  onSelectUnit: (id: string) => void;
  onCreateUnit: () => void;
  onDeleteUnit: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ units, onSelectUnit, onCreateUnit, onDeleteUnit }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Study Units</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your courses and study materials.</p>
        </div>
        <button 
          onClick={onCreateUnit}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full md:w-auto justify-center group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Create New Unit
        </button>
      </div>

      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <div className="bg-indigo-50 p-8 rounded-full inline-flex mb-6 animate-pulse">
            <Sparkles className="w-12 h-12 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">No units created yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 text-center leading-relaxed">
            Get started by creating your first study unit. You can upload PDFs, images, or text notes and we'll generate a study guide for you.
          </p>
          <button 
            onClick={onCreateUnit}
            className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-2 transition-colors"
          >
            Create your first unit <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit, index) => (
            <motion.div 
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectUnit(unit.id)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all group relative cursor-pointer flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${unit.data ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                    {unit.data && (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                            Ready
                        </span>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteUnit(unit.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Unit"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {unit.title}
              </h3>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 font-medium mt-auto pt-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(unit.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {unit.fileCount} Files
                </span>
              </div>

              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${unit.data ? 'bg-indigo-500 w-full' : 'bg-slate-300 w-[10%]'}`} 
                  />
              </div>
            </motion.div>
          ))}
          
          {/* Add New Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: units.length * 0.05 }}
            onClick={onCreateUnit}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group min-h-[200px]"
          >
            <div className="bg-slate-50 p-4 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors">
                <Plus className="w-8 h-8" />
            </div>
            <span className="font-semibold">Create New Unit</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
