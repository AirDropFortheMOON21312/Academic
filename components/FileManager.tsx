import React, { useState, useEffect } from 'react';
import { getFilesForUnit, updateFileFolder, deleteFile, updateFileOrder } from '../services/storage';
import { FileText, Image as ImageIcon, Folder, Calendar, Trash2, ArrowUpDown, Filter, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import FilePreview from './FilePreview';

interface FileRecord {
  index: number;
  file: Blob;
  name: string;
  createdAt: number;
  folder?: string;
  mimeType: string;
  order?: number;
}

interface FileManagerProps {
  unitId: string;
}

const FileManager: React.FC<FileManagerProps> = ({ unitId }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type' | 'manual'>('manual');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<'none' | 'folder' | 'type'>('folder');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [hoveredFile, setHoveredFile] = useState<FileRecord | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadFiles();
  }, [unitId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getFilesForUnit(unitId);
      // Ensure we have a stable sort by order if manual
      const sorted = data.sort((a, b) => (a.order ?? a.index) - (b.order ?? b.index));
      setFiles(sorted);
    } catch (e) {
      console.error("Failed to load files", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (newOrderFiles: FileRecord[]) => {
      setFiles(newOrderFiles);
      // Persist new order
      newOrderFiles.forEach((file, idx) => {
          if (file.order !== idx) {
              updateFileOrder(unitId, file.index, idx);
              file.order = idx;
          }
      });
  };

  const handleGroupReorder = (groupName: string, newGroupFiles: FileRecord[]) => {
      // We need to merge this reordered group back into the main files array
      // This is tricky because 'files' contains all files, but we are only reordering a subset.
      // Strategy: Find the indices of these files in the main array and swap them?
      // Or better: Just update the 'order' of these files to be sequential within their group, 
      // but relative to the whole list?
      
      // Simpler approach for "within folder":
      // Just update the local state for the group, and update the DB order.
      // But we need to keep the global 'files' state consistent.
      
      const otherFiles = files.filter(f => !newGroupFiles.find(nf => nf.index === f.index));
      const updatedFiles = [...otherFiles, ...newGroupFiles].sort((a, b) => (a.order ?? a.index) - (b.order ?? b.index));
      
      // Actually, if we reorder within a folder, we just want to change the visual order.
      // But if we want to persist "manual order within folder", we need a global order that reflects that.
      // Let's just update the 'order' field based on the new visual sequence.
      
      // For simplicity in this prototype, let's just update the state and DB for the reordered items
      // to have a new order index.
      
      // Let's assume global order is what matters.
      // If we reorder within a group, we are essentially swapping their global order values?
      // No, that might mix them with other groups if we are not careful.
      
      // Let's just update the local state to reflect the visual change, 
      // and update the DB with the new index in the list.
      
      // To make it robust:
      // 1. Get all files in the current group.
      // 2. Assign them new order values based on their new position.
      // 3. Update state.
      
      // Map the new group files to the main files array
      const newFilesState = files.map(f => {
          const reorderedFile = newGroupFiles.find(nf => nf.index === f.index);
          return reorderedFile || f;
      });
      
      setFiles(newFilesState);
      
      // Persist
      newGroupFiles.forEach((file, idx) => {
           // We need a way to determine the absolute order. 
           // If we just use the index in the group, it might conflict.
           // Let's just use the current timestamp or something? No.
           
           // If we are in "manual" sort mode, we trust the array order.
           // But here we are splitting the array.
           
           // Let's just update the order in the DB to match the new index in the *group* + some offset?
           // Or just update the 'order' field to be the index in the *entire* list if we could?
           
           // Let's try a simpler approach:
           // When reordering in a group, we just update the 'files' state by replacing the items.
           // But 'Reorder.Group' needs the full list to be consistent?
           // No, it takes 'values'.
           
           // Let's just update the order of the *specific items* in the DB to be sequential.
           // But that might overlap with other items.
           
           // Okay, "Reorder within folder" implies the folder has its own order.
           // But our DB schema has a global 'order'.
           // Maybe we should just sort by 'order' globally, and when grouping, we just filter.
           // If we reorder within a group, we are just swapping the 'order' values of the items involved?
           // Yes, that preserves the relative order of other items.
           
           // Implementation:
           // 1. Get the original 'order' values of the items in this group.
           // 2. Sort these values.
           // 3. Assign the sorted values to the items in their new order.
           
           // This keeps them in the same "slots" in the global list, just shuffled amongst themselves.
      });
      
      const originalOrders = newGroupFiles.map(f => f.order ?? f.index).sort((a, b) => a - b);
      
      newGroupFiles.forEach((file, idx) => {
          const newOrder = originalOrders[idx];
          if (file.order !== newOrder) {
              updateFileOrder(unitId, file.index, newOrder);
              file.order = newOrder; // Update local object
          }
      });
      
      // Force update state
      setFiles([...files]);
  };

  const handleDelete = async (index: number) => {
    if (window.confirm("Delete this file? This cannot be undone.")) {
      await deleteFile(unitId, index);
      setFiles(prev => prev.filter(f => f.index !== index));
      setSelectedFiles(prev => prev.filter(id => id !== index));
    }
  };

  const handleMoveToFolder = async (folderName: string) => {
    for (const index of selectedFiles) {
      await updateFileFolder(unitId, index, folderName);
    }
    await loadFiles();
    setSelectedFiles([]);
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (name.endsWith('.docx')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === 'manual') return (a.order ?? a.index) - (b.order ?? b.index);
    
    let valA, valB;
    switch (sortBy) {
      case 'date':
        valA = a.createdAt;
        valB = b.createdAt;
        break;
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'type':
        valA = a.mimeType;
        valB = b.mimeType;
        break;
      default:
        return 0;
    }
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const groupedFiles = () => {
    if (groupBy === 'none') return { 'All Files': sortedFiles };
    
    const groups: Record<string, FileRecord[]> = {};
    sortedFiles.forEach(file => {
      const key = groupBy === 'folder' ? (file.folder || 'Unsorted') : file.mimeType.split('/')[0].toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(file);
    });
    return groups;
  };

  const groups = groupedFiles();

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in relative">
      {/* Hover Preview Portal */}
      {hoveredFile && (
        <div 
            className="fixed z-50 pointer-events-none bg-white p-2 rounded-xl shadow-2xl border border-slate-200 w-64 h-64 flex flex-col"
            style={{ 
                left: hoverPosition.x + 20, 
                top: hoverPosition.y - 100,
            }}
        >
            <div className="flex-1 overflow-hidden relative rounded-lg bg-slate-50">
                <FilePreview file={hoveredFile.file} mimeType={hoveredFile.mimeType} name={hoveredFile.name} />
            </div>
            <div className="mt-2 px-1">
                <p className="text-xs font-bold text-slate-700 truncate">{hoveredFile.name}</p>
                <p className="text-[10px] text-slate-400">{(hoveredFile.file.size / 1024).toFixed(1)} KB</p>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-600" />
            Source Materials
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage and organize your uploaded documents.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="none">No Grouping</option>
              <option value="folder">By Folder</option>
              <option value="type">By Type</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 px-3">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="manual">Manual Order</option>
              <option value="date">Date Uploaded</option>
              <option value="name">File Name</option>
              <option value="type">File Type</option>
            </select>
            {sortBy !== 'manual' && (
                <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-slate-100 rounded text-xs font-bold text-indigo-600"
                >
                {sortOrder.toUpperCase()}
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6 flex items-center justify-between"
        >
          <span className="text-indigo-900 font-medium text-sm">{selectedFiles.length} files selected</span>
          <div className="flex items-center gap-3">
            {isCreatingFolder ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder Name"
                  className="px-3 py-1.5 rounded-lg border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
                <button onClick={() => handleMoveToFolder(newFolderName)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold">Save</button>
                <button onClick={() => setIsCreatingFolder(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button 
                onClick={() => setIsCreatingFolder(true)}
                className="text-xs font-bold text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Move to Folder
              </button>
            )}
            <button 
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading files...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([groupName, groupFiles]) => (
            <div key={groupName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                {groupBy === 'folder' ? <Folder className="w-4 h-4 text-slate-400" /> : <Filter className="w-4 h-4 text-slate-400" />}
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{groupName}</h3>
                <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{groupFiles.length}</span>
              </div>
              
              <Reorder.Group 
                axis="y" 
                values={groupFiles} 
                onReorder={(newOrder) => handleGroupReorder(groupName, newOrder)}
                className="divide-y divide-slate-100"
              >
                {groupFiles.map((file) => (
                  <Reorder.Item 
                    key={file.index} 
                    value={file}
                    className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group ${selectedFiles.includes(file.index) ? 'bg-indigo-50/50' : ''}`}
                    onMouseEnter={(e) => {
                        setHoveredFile(file);
                        setHoverPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                        setHoverPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredFile(null)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedFiles.includes(file.index)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedFiles(prev => [...prev, file.index]);
                          else setSelectedFiles(prev => prev.filter(id => id !== file.index));
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getFileIcon(file.mimeType, file.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-800 truncate text-sm">{file.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(file.createdAt).toLocaleDateString()}</span>
                          <span>{(file.file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(file.index)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No files found in this unit.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileManager;
