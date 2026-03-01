import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, Image as ImageIcon } from 'lucide-react';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FilePreviewProps {
  file: Blob;
  mimeType: string;
  name: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, mimeType, name }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mimeType.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (mimeType === 'application/pdf') {
      renderPdfPreview();
    }
  }, [file, mimeType]);

  const renderPdfPreview = async () => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      } as any).promise;
      
      setLoading(false);
    } catch (error) {
      console.error("Error rendering PDF preview:", error);
      setLoading(false);
    }
  };

  if (mimeType.startsWith('image/') && previewUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 overflow-hidden rounded-lg">
        <img src={previewUrl} alt={name} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  if (mimeType === 'application/pdf') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 overflow-hidden rounded-lg relative">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50">Loading...</div>}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
      <FileText className="w-12 h-12 text-slate-400" />
    </div>
  );
};

export default FilePreview;
