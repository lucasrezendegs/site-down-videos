import React, { useState } from 'react';
import { Play, Pause, Eye, ThumbsUp, Clock, Youtube, Video, ExternalLink, Sparkles } from 'lucide-react';
import { VideoInfo } from '../types';

interface VideoOverviewProps {
  video: VideoInfo;
}

export const VideoOverview: React.FC<VideoOverviewProps> = ({ video }) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const isYouTube = video.platform === 'youtube';

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Thumbnail / Player Section */}
        <div className="lg:col-span-5 relative group overflow-hidden rounded-xl bg-zinc-950 aspect-video border border-zinc-800 flex items-center justify-center">
          {isPlayingPreview && isYouTube && video.samplePreviewUrl ? (
            <iframe
              src={`${video.samplePreviewUrl}?autoplay=1`}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={video.thumbnail}
                alt={video.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Play preview trigger button */}
              {isYouTube && (
                <button
                  type="button"
                  id="preview-player-toggle"
                  onClick={() => setIsPlayingPreview(true)}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transform hover:scale-110 active:scale-95 transition-all"
                  title="Reproduzir prévia do vídeo"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              )}

              {/* Platform tag */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
                {isYouTube ? (
                  <>
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>YouTube</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TikTok</span>
                  </>
                )}
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-mono font-medium text-zinc-200 border border-white/10">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>{video.durationFormatted}</span>
              </div>
            </>
          )}
        </div>

        {/* Video Info Details Section */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                Vídeo Identificado
              </span>
              <span className="text-xs text-zinc-400">• Alta Resolução Disponível</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
              {video.title}
            </h2>
          </div>

          {/* Author Channel info */}
          <div className="flex items-center gap-3 py-2 border-y border-zinc-800/80">
            {video.authorAvatar ? (
              <img
                src={video.authorAvatar}
                alt={video.author}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                {video.author.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-200 truncate">{video.author}</p>
                {video.authorUrl && (
                  <a
                    href={video.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-zinc-400">Criador de Conteúdo</p>
            </div>
          </div>

          {/* Stats Badges (Views, Likes, Duration) */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs mb-0.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Visualizações</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">{video.viewsFormatted || '-'}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs mb-0.5">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Curtidas</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">{video.likesFormatted || '-'}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs mb-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Duração</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">{video.durationFormatted}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
