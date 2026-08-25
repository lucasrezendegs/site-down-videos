export type Platform = 'youtube' | 'tiktok' | 'unknown';

export interface VideoFormat {
  id: string;
  qualityLabel: string; // e.g. "1080p Full HD", "720p HD", "4K Ultra HD"
  resolution: string; // e.g. "1920x1080"
  extension: 'mp4' | 'webm' | 'm4v';
  filesizeApprox: string; // e.g. "45.2 MB"
  hasAudio: boolean;
  fps?: number;
  downloadUrl: string;
  directUrl?: string;
  badge?: string; // e.g. "Sem Marca D'água", "60 FPS", "Mais Popular", "Melhor Qualidade"
  isNoWatermark?: boolean;
}

export interface AudioFormat {
  id: string;
  qualityLabel: string; // e.g. "320 kbps (Ultra HQ)", "256 kbps (HQ)"
  bitrate: number; // 320, 256, 192, 128
  extension: 'mp3' | 'm4a' | 'wav';
  filesizeApprox: string;
  downloadUrl: string;
  directUrl?: string;
  badge?: string;
}

export interface TranscriptSegment {
  id: number;
  start: number; // in seconds, e.g. 12.5
  end: number; // in seconds, e.g. 16.8
  startTime: string; // e.g. "00:00:12,500"
  endTime: string; // e.g. "00:00:16,800"
  text: string;
}

export interface VideoInfo {
  id: string;
  url: string;
  platform: Platform;
  title: string;
  author: string;
  authorUrl?: string;
  authorAvatar?: string;
  thumbnail: string;
  durationSeconds: number;
  durationFormatted: string; // e.g. "04:32"
  viewsCount?: number;
  viewsFormatted?: string;
  likesCount?: number;
  likesFormatted?: string;
  publishDate?: string;
  description?: string;
  formats: VideoFormat[];
  audioFormats: AudioFormat[];
  availableSubtitleLanguages: Array<{ code: string; name: string }>;
  samplePreviewUrl?: string;
}

export interface TranscriptResponse {
  language: string;
  languageLabel: string;
  isAiGenerated: boolean;
  rawText: string;
  srtContent: string;
  vttContent: string;
  segments: TranscriptSegment[];
  summary?: string;
  keyPoints?: string[];
}

export interface DownloadHistoryItem {
  id: string;
  videoId: string;
  url: string;
  platform: Platform;
  title: string;
  author: string;
  thumbnail: string;
  formatType: 'video' | 'audio' | 'srt';
  formatLabel: string;
  timestamp: number;
}
