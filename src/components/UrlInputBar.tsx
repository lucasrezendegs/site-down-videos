import React, { useState, useEffect } from 'react';
import { Search, Link2, Youtube, Video, Clipboard, X, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Platform } from '../types';

interface UrlInputBarProps {
  url: string;
  onChangeUrl: (url: string) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  onChangeUrl,
  onSubmit,
  isLoading,
}) => {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');

  useEffect(() => {
    const clean = url.trim().toLowerCase();
    if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
      setDetectedPlatform('youtube');
    } else if (clean.includes('tiktok.com') || clean.includes('douyin.com')) {
      setDetectedPlatform('tiktok');
    } else {
      setDetectedPlatform('unknown');
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onChangeUrl(text);
          onSubmit(text);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    onChangeUrl('');
    setDetectedPlatform('unknown');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const sampleLinks = [
    {
      label: 'YouTube (Vídeo / 4K)',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
    },
    {
      label: 'TikTok (Sem Marca D\'água)',
      url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
      platform: 'tiktok',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Input container */}
      <form onSubmit={handleFormSubmit} className="relative group">
        <div className="relative flex flex-col sm:flex-row items-stretch bg-zinc-900/90 border-2 border-zinc-800 focus-within:border-red-500/80 transition-all duration-200 rounded-2xl p-2 shadow-2xl shadow-black/40 backdrop-blur-xl gap-2">
          
          {/* Left Platform Icon Indicator */}
          <div className="flex items-center pl-3 pr-1 py-2 text-zinc-400">
            {detectedPlatform === 'youtube' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold animate-pulse">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>YouTube</span>
              </div>
            ) : detectedPlatform === 'tiktok' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold animate-pulse">
                <Video className="w-4 h-4 text-cyan-400" />
                <span>TikTok</span>
              </div>
            ) : (
              <Link2 className="w-5 h-5 text-zinc-500" />
            )}
          </div>

          {/* Main Input Text */}
          <input
            id="video-url-input"
            type="text"
            value={url}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="Cole o link do YouTube (Vídeo/Shorts) ou TikTok aqui..."
            className="flex-1 bg-transparent px-3 py-3 text-base text-zinc-100 placeholder-zinc-500 focus:outline-none w-full"
            disabled={isLoading}
          />

          {/* Buttons inside right */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
            {url && (
              <button
                type="button"
                id="clear-url-btn"
                onClick={handleClear}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
                title="Limpar link"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {!url && (
              <button
                type="button"
                id="paste-url-btn"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl border border-zinc-700/50 transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Colar</span>
              </button>
            )}

            <button
              id="analyze-video-btn"
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analisando...</span>
                </>
              ) : (
                <>
                  <span>Baixar & Transcrever</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Sample Links */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1 text-zinc-400 font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Testar exemplo:
        </span>
        {sampleLinks.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            id={`sample-link-${idx}`}
            onClick={() => {
              onChangeUrl(sample.url);
              onSubmit(sample.url);
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-all text-[11px]"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
