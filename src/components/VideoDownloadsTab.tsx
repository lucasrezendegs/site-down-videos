import React, { useState } from 'react';
import { Download, Check, Sparkles, Film, HardDrive, Zap, ShieldCheck } from 'lucide-react';
import { VideoInfo, VideoFormat } from '../types';

interface VideoDownloadsTabProps {
  video: VideoInfo;
  onDownload: (format: VideoFormat, type: 'video') => void;
}

export const VideoDownloadsTab: React.FC<VideoDownloadsTabProps> = ({ video, onDownload }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Record<string, boolean>>({});

  const handleStartDownload = (format: VideoFormat) => {
    setDownloadingId(format.id);
    onDownload(format, 'video');

    // Simulate direct browser download trigger
    setTimeout(() => {
      setDownloadingId(null);
      setDownloadedIds((prev) => ({ ...prev, [format.id]: true }));
    }, 1200);
  };

  const bestFormat = video.formats[0];

  return (
    <div className="space-y-6">
      {/* Top Banner for Best Quality */}
      {bestFormat && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/60 via-zinc-900 to-zinc-900 border border-red-500/30 p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  {video.platform === 'tiktok' ? 'Sem Marca D\'água' : 'Melhor Qualidade'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{bestFormat.resolution}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {bestFormat.qualityLabel}
              </h3>
              <p className="text-xs text-zinc-400">
                Tamanho aproximado: <strong className="text-zinc-200">{bestFormat.filesizeApprox}</strong> • Formato: <span className="uppercase text-zinc-300 font-semibold">{bestFormat.extension}</span>
              </p>
            </div>
          </div>

          <button
            id="download-best-video-btn"
            type="button"
            onClick={() => handleStartDownload(bestFormat)}
            disabled={downloadingId === bestFormat.id}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            {downloadingId === bestFormat.id ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Iniciando Download...</span>
              </>
            ) : downloadedIds[bestFormat.id] ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Baixar Novamente ({bestFormat.qualityLabel})</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar em Alta Resolução</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Formats Grid / Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Film className="w-4 h-4 text-red-500" />
            Todos os Formatos e Resoluções Disponíveis:
          </h3>
          <span className="text-xs text-zinc-400">Áudio e vídeo combinados em alta fidelidade</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {video.formats.map((fmt) => {
            const isDownloading = downloadingId === fmt.id;
            const isDone = downloadedIds[fmt.id];

            return (
              <div
                key={fmt.id}
                className="group relative bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
                      {fmt.qualityLabel}
                    </span>
                    {fmt.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap">
                        {fmt.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                      {fmt.resolution}
                    </span>
                    <span className="uppercase text-zinc-300 font-semibold">{fmt.extension}</span>
                    <span>{fmt.filesizeApprox}</span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`download-format-${fmt.id}`}
                  onClick={() => handleStartDownload(fmt)}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-100 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700 hover:border-red-500"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Baixando...</span>
                    </>
                  ) : isDone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Salvo! Baixar de novo</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Vídeo (.MP4)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Quality Notice */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>
          Downloads diretos sem anúncios invasivos e sem perda de qualidade de áudio ou vídeo. Compatível com VLC, QuickTime, Smart TVs e editores de vídeo.
        </span>
      </div>
    </div>
  );
};
