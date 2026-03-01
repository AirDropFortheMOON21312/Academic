import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Lightbulb, 
  ClipboardList, 
  Zap, 
  Layers, 
  Headphones,
  GraduationCap,
  Settings,
  FolderOpen,
  PlusCircle,
  ChevronLeft,
  X,
  Image as ImageIcon,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { TabConfig, TabId, Unit } from '../types';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  disabled: boolean;
  onOpenSettings: () => void;
  
  // Unit Props
  units: Unit[];
  activeUnitId: string | null;
  onSelectUnit: (id: string) => void;
  onCreateUnit: () => void;
  onBackToDashboard: () => void;

  // Mobile Props
  isOpen: boolean;
  onClose: () => void;

  // Auth Props
  user: any;
  onLogin: () => void;
  onLogout: () => void;
}

export const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'files', label: 'Materials', icon: FolderOpen },
  { id: 'concepts', label: 'Concepts', icon: Lightbulb },
  { id: 'quiz', label: 'Recall', icon: ClipboardList },
  { id: 'feynman', label: 'Feynman', icon: Zap },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'script', label: 'Script', icon: Headphones },
  { id: 'image-gen', label: 'AI Images', icon: ImageIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  disabled, 
  onOpenSettings,
  units,
  activeUnitId,
  onSelectUnit,
  onCreateUnit,
  onBackToDashboard,
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout
}) => {
  const activeUnit = units.find(u => u.id === activeUnitId);

  // Mobile Navigation Handler
  const handleNavClick = (callback: () => void) => {
    callback();
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:shadow-none shrink-0 flex flex-col h-full border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick(onBackToDashboard)}>
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg text-white tracking-tight">Academic Grip</h1>
                <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider">Study Companion</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
          
          {activeUnitId ? (
            // VIEW: Active Unit Navigation
            <div className="space-y-1 animate-fade-in">
              <div className="px-3 mb-2 flex items-center gap-2">
                <button 
                  onClick={() => handleNavClick(onBackToDashboard)}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Back to Dashboard"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-sm text-white truncate">{activeUnit?.title}</span>
              </div>

              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isTabDisabled = disabled || !activeUnit?.data;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavClick(() => !isTabDisabled && onTabChange(tab.id))}
                    disabled={isTabDisabled}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }
                      ${isTabDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="font-medium text-sm">{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute left-0 w-1 h-6 bg-white rounded-r-full" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // VIEW: Dashboard (Unit List)
            <div className="space-y-4 animate-fade-in">
              <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Your Units
              </div>
              
              <div className="space-y-1">
                {units.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => handleNavClick(() => onSelectUnit(unit.id))}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group"
                  >
                    <FolderOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    <div className="flex-1 text-left overflow-hidden">
                      <span className="font-medium text-sm block truncate">{unit.title}</span>
                    </div>
                    {unit.data && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleNavClick(onCreateUnit)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200 group mt-2"
              >
                <PlusCircle className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
                <span className="font-medium text-sm">Create Unit</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">{user.email.split('@')[0]}</span>
                  <span className="text-[10px] text-slate-500 truncate">Pro Plan</span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => handleNavClick(onLogin)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-900/20"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          <button 
            onClick={() => handleNavClick(onOpenSettings)}
            className="w-full flex items-center gap-2 mt-4 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Application Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;