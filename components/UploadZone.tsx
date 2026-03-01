import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Languages, Files, FileText, X, File as FileIcon, Image as ImageIcon, Plus, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
  onFileSelect: (files: File[], translate: boolean) => void;
  isProcessing: boolean;
  error?: string | null;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing, error }) => {
  const [translate, setTranslate] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    setDragActive(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent flickering when dragging over children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) {
        e.dataTransfer.dropEffect = 'none';
        return;
    }
    setDragActive(true);
  }, [isProcessing]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (isProcessing) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setStagedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      }
    }, [isProcessing]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStagedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
    e.target.value = ''; // Reset
  };

  const removeFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    const blob = new Blob([pastedText], { type: 'text/plain' });
    const file = new File([blob], `Pasted Note ${stagedFiles.length + 1}.txt`, { type: 'text/plain' });
    setStagedFiles(prev => [...prev, file]);
    setPastedText('');
    setPasteModalOpen(false);
  };

  const processStagedFiles = () => {
    if (stagedFiles.length === 0) return;
    onFileSelect(stagedFiles, translate);
  };

  // --- RENDER HELPERS ---

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (file.name.endsWith('.docx')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto p-4 md:p-6 pb-24 relative"
    >
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3 tracking-tight">Upload Materials</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm md:text-base px-4 leading-relaxed">
          Drop PDFs, Word docs, images, or notes. We'll analyze everything for you.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT: Upload Area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
            <motion.div
                layout
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                animate={{
                  scale: dragActive ? 1.02 : 1,
                  borderColor: dragActive ? '#6366f1' : isProcessing ? '#c7d2fe' : '#cbd5e1',
                  backgroundColor: dragActive ? '#eef2ff' : isProcessing ? '#f8fafc' : '#ffffff'
                }}
                className={`
                w-full aspect-[4/3] md:aspect-video rounded-3xl border-2 border-dashed
                flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden group
                ${isProcessing 
                    ? 'cursor-wait' 
                    : 'cursor-pointer hover:border-indigo-500 hover:bg-slate-50 shadow-sm hover:shadow-md'
                }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileInput}
                    accept=".pdf,image/*,.txt,.md,.csv,.json,.docx"
                    multiple
                    disabled={isProcessing}
                />

                <AnimatePresence mode="wait">
                {isProcessing ? (
                     <motion.div 
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center z-10 p-6"
                     >
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <UploadCloud className="w-8 h-8 text-indigo-600 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-indigo-900 font-bold text-xl animate-pulse">Analyzing...</p>
                        <p className="text-slate-500 text-sm mt-2">Processing {stagedFiles.length} files</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className={`
                            bg-indigo-50 p-6 rounded-full mb-6 transition-transform duration-300
                            ${dragActive ? 'scale-110' : 'group-hover:scale-110'}
                        `}>
                            <UploadCloud className="w-10 h-10 text-indigo-600" />
                        </div>
                        <p className="text-lg font-bold text-slate-700 mb-1">Click to Upload</p>
                        <p className="text-sm text-slate-400 mb-6">or drag and drop</p>
                        
                        <div className="flex gap-3">
                             <button 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                             >
                                Browse Files
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setPasteModalOpen(true); }}
                                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all active:scale-95 text-sm flex items-center gap-2"
                             >
                                <Clipboard className="w-4 h-4" /> Paste Text
                             </button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-start p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100"
                >
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* RIGHT: Staging Area */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-full min-h-[300px] shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between items-center">
                <span>Selected ({stagedFiles.length})</span>
                {stagedFiles.length > 0 && (
                    <button onClick={() => setStagedFiles([])} className="text-xs text-red-500 hover:underline">Clear All</button>
                )}
            </h3>

            <button 
                onClick={processStagedFiles}
                disabled={stagedFiles.length === 0 || isProcessing}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
            >
                {isProcessing ? <span className="animate-pulse">Analyzing...</span> : <>Start Analysis <Plus className="w-4 h-4" /></>}
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4 -mx-2 px-2">
                <AnimatePresence>
                {stagedFiles.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl"
                    >
                        <Files className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-medium">No files selected</span>
                    </motion.div>
                ) : (
                    stagedFiles.map((file, idx) => (
                        <motion.div 
                            key={`${file.name}-${idx}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {getFileIcon(file)}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{file.name}</span>
                                    <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }} 
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                title="Remove file"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))
                )}
                </AnimatePresence>
            </div>

            {/* Translate Toggle */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-indigo-500" />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">English Output</span>
                        <span className="text-[10px] text-slate-400">Translate foreign text</span>
                    </div>
                </div>
                <button
                    onClick={() => setTranslate(!translate)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${translate ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${translate ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>
      </div>

      {/* Paste Modal */}
      <AnimatePresence>
      {pasteModalOpen && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Clipboard className="w-4 h-4" /> Paste Content</h3>
                    <button onClick={() => setPasteModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="p-4 flex-1">
                    <textarea 
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste lecture notes, essay drafts, or raw text here..."
                        className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm font-mono"
                    />
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                    <button onClick={() => setPasteModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
                    <button onClick={handlePasteSubmit} disabled={!pastedText.trim()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50">Add to Batch</button>
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadZone;