import React, { useState, useEffect, useRef } from 'react';
import { Music, Download, Check, Volume2, Play, Pause, Disc, Sparkles, Sliders, Zap, ShieldCheck } from 'lucide-react';
import { VideoInfo, AudioFormat } from '../types';

interface AudioConversionTabProps {
  video: VideoInfo;
  onDownloadAudio: (format: AudioFormat) => void;
}

export const AudioConversionTab: React.FC<AudioConversionTabProps> = ({ video, onDownloadAudio }) => {
  const [selectedBitrate, setSelectedBitrate] = useState<number>(320);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Record<string, boolean>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsPlayingAudio(false);
  }, [video.id]);

  const activeFormat =
    video.audioFormats.find((f) => f.bitrate === selectedBitrate) || video.audioFormats[0];

  const handleDownload = (fmt: AudioFormat) => {
    setDownloadingId(fmt.id);
    onDownloadAudio(fmt);

    setTimeout(() => {
      setDownloadingId(null);
      setDownloadedIds((prev) => ({ ...prev, [fmt.id]: true }));
    }, 2000);
  };

  const togglePlayAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const isYouTube = video.platform === 'youtube';

  return (
    <div className="space-y-6">
      {/* Hidden Real Audio Stream / Player */}
      {isYouTube && isPlayingAudio && (
        <div className="hidden">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&enablejsapi=1`}
            title="Audio stream preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* MP3 Converter Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Spinning Disc / Icon */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center overflow-hidden">
                <Disc className={`w-8 h-8 text-amber-400 ${isPlayingAudio ? 'animate-spin' : ''}`} />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Conversor MP3
                </span>
                <span className="text-xs text-zinc-400 font-mono">Alta Fidelidade</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 truncate max-w-md">
                {video.title}
              </h3>
              <p className="text-xs text-zinc-400">
                Artista/Canal: <span className="text-zinc-200 font-medium">{video.author}</span> • Duração: <span className="font-mono text-zinc-300">{video.durationFormatted}</span>
              </p>
            </div>
          </div>

          {/* Quick Player & Prominent Download Action */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              id="audio-preview-toggle-btn"
              type="button"
              onClick={togglePlayAudio}
              className={`px-4 py-3 rounded-xl font-medium text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4 text-zinc-950 fill-current" />
                  <span>Tocando Áudio Real (Pausar)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Ouvir Música Real</span>
                </>
              )}
            </button>

            {activeFormat && (
              <button
                id="convert-and-download-mp3-btn"
                type="button"
                onClick={() => handleDownload(activeFormat)}
                disabled={downloadingId === activeFormat.id}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                {downloadingId === activeFormat.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando Download...</span>
                  </>
                ) : downloadedIds[activeFormat.id] ? (
                  <>
                    <Check className="w-4 h-4 text-zinc-950" />
                    <span>Salvo! Baixar de novo</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Baixar MP3 ({activeFormat.bitrate} kbps)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center gap-1.5 h-10 px-2 bg-zinc-950/40 rounded-xl overflow-hidden">
          {Array.from({ length: 48 }).map((_, i) => {
            const heights = [20, 35, 60, 80, 45, 90, 70, 40, 65, 85, 30, 95, 50, 75, 40, 60];
            const baseH = heights[i % heights.length];
            const isHighlighted = isPlayingAudio ? (i % 4 === 0 ? 'bg-amber-400' : 'bg-amber-500/70') : 'bg-zinc-700';

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-200 ${isHighlighted}`}
                style={{
                  height: isPlayingAudio ? `${Math.max(20, Math.sin(i * 0.5 + Date.now() / 150) * 45 + 50)}%` : `${baseH * 0.5}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Bitrate Selection Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Escolha a Taxa de Bits (Bitrate) para Conversão:
          </h3>
          <span className="text-xs text-zinc-400">Qualidade de áudio ajustável</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {video.audioFormats.map((fmt) => {
            const isSelected = selectedBitrate === fmt.bitrate;
            const isDownloading = downloadingId === fmt.id;
            const isDone = downloadedIds[fmt.id];

            return (
              <div
                key={fmt.id}
                onClick={() => setSelectedBitrate(fmt.bitrate)}
                className={`relative rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className={`font-bold text-sm ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                      {fmt.qualityLabel}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>

                  {fmt.badge && (
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 mb-2">
                      {fmt.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mb-4">
                    <span>Taxa: <strong>{fmt.bitrate} kbps</strong></span>
                    <span>•</span>
                    <span>{fmt.filesizeApprox}</span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`download-audio-${fmt.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(fmt);
                  }}
                  disabled={isDownloading}
                  className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold'
                      : 'bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200'
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Baixando...</span>
                    </>
                  ) : isDone ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvo! Baixar de novo</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar MP3</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
        <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          O áudio é extraído mantendo as frequências e estéreo originais do vídeo.
        </span>
      </div>
    </div>
  );
};
