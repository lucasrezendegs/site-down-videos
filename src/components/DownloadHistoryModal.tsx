import React from 'react';
import { X, Trash2, Download, ExternalLink, Film, Music, FileText, Youtube, Video } from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface DownloadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DownloadHistoryItem[];
  onClearHistory: () => void;
  onSelectHistoryItem: (url: string) => void;
}

export const DownloadHistoryModal: React.FC<DownloadHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectHistoryItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Histórico de Downloads Recentes</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                id="clear-all-history-btn"
                onClick={onClearHistory}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Limpar todo o histórico salvo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Tudo</span>
              </button>
            )}

            <button
              type="button"
              id="close-history-modal-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Nenhum download registrado ainda. Ao baixar vídeos, MP3 ou legendas SRT, eles aparecerão aqui.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 hover:bg-zinc-800/60 border border-zinc-800/80 transition-colors group"
              >
                <div className="relative w-16 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute bottom-0 right-0 p-0.5 bg-black/80 rounded-tl text-[9px] text-white">
                    {item.platform === 'youtube' ? (
                      <Youtube className="w-2.5 h-2.5 text-red-500" />
                    ) : (
                      <Video className="w-2.5 h-2.5 text-cyan-400" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <span>{item.author}</span>
                    <span>•</span>
                    <span className="text-red-400 font-medium">{item.formatLabel}</span>
                    <span>•</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`reload-history-${item.id}`}
                  onClick={() => {
                    onSelectHistoryItem(item.url);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Abrir</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
