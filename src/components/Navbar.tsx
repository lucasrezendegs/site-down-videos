import React from 'react';
import { Video, Youtube, Download, History, Sparkles, FileText, Music2 } from 'lucide-react';

interface NavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ historyCount, onOpenHistory }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-pink-600 to-cyan-400 p-[1.5px] shadow-lg shadow-red-500/10 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-sans">
                Clip<span className="text-red-500">Flow</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                HD & SRT
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Downloader de YouTube & TikTok com Conversão MP3 e Legendas
            </p>
          </div>
        </div>

        {/* Supported badges & history button */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <div className="flex items-center gap-1.5 text-red-400">
              <Youtube className="w-4 h-4" />
              <span>YouTube 4K</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Video className="w-4 h-4" />
              <span>TikTok Sem Marca</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Music2 className="w-4 h-4" />
              <span>MP3 320k</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5 text-purple-400">
              <FileText className="w-4 h-4" />
              <span>SRT</span>
            </div>
          </div>

          {/* History Button */}
          <button
            id="open-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-sm font-medium transition-colors relative"
            title="Ver histórico de downloads"
          >
            <History className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">Histórico</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold leading-none text-white bg-red-600 rounded-full">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
