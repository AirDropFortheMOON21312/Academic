import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Download, Wand2, AlertCircle } from 'lucide-react';

interface ImageGeneratorProps {
  onClose?: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ prompt, aspectRatio })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.image) {
        setGeneratedImage(data.image);
      } else {
        throw new Error('No image data received');
      }
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || 'An error occurred while generating the image.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `academic-grip-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-indigo-600" />
          AI Image Studio
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Describe your image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A detailed diagram of a plant cell structure, labeled, educational style..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 h-32 resize-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Aspect Ratio
              </label>
              <div className="flex gap-3 flex-wrap">
                {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      aspectRatio === ratio
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="border-t border-slate-100 pt-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {generatedImage ? (
              <div className="space-y-4 animate-fade-in">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 group">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto object-contain max-h-[500px]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={handleDownload}
                        className="bg-white text-slate-800 px-4 py-2 rounded-lg font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2"
                      >
                          <Download className="w-4 h-4" /> Download
                      </button>
                  </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={handleDownload}
                        className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                    >
                        <Download className="w-4 h-4" /> Save to Device
                    </button>
                </div>
              </div>
            ) : (
              !loading && !error && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Your generated image will appear here</p>
                </div>
              )
            )}
            
            {loading && !generatedImage && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Creating your masterpiece...</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
