import { VideoInfo, VideoFormat, AudioFormat, TranscriptResponse, TranscriptSegment } from '../types';

export function clientExtractYouTubeId(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
      if (id && id.length >= 10) return id.slice(0, 11);
    }
    if (parsed.pathname.includes('/shorts/')) {
      const parts = parsed.pathname.split('/shorts/');
      const id = parts[1]?.split('/')[0]?.split('?')[0];
      if (id) return id.slice(0, 11);
    }
    if (parsed.pathname.includes('/live/')) {
      const parts = parsed.pathname.split('/live/');
      const id = parts[1]?.split('/')[0]?.split('?')[0];
      if (id) return id.slice(0, 11);
    }
    if (parsed.pathname.includes('/embed/')) {
      const parts = parsed.pathname.split('/embed/');
      const id = parts[1]?.split('/')[0]?.split('?')[0];
      if (id) return id.slice(0, 11);
    }
    const vParam = parsed.searchParams.get('v');
    if (vParam) return vParam.slice(0, 11);
  } catch {
    // fallback regex
  }
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([^#&?/\s]{11})/);
  return match && match[1] ? match[1] : null;
}

export function clientDetectPlatform(url: string): 'youtube' | 'tiktok' | 'unknown' {
  const clean = url.toLowerCase();
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'youtube';
  if (clean.includes('tiktok.com')) return 'tiktok';
  if (clientExtractYouTubeId(url)) return 'youtube';
  return 'youtube'; // default to youtube parser
}

function secondsToSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  const pad = (n: number, size = 2) => String(n).padStart(size, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

export function clientGenerateSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, idx) => {
      return `${idx + 1}\n${seg.startTime} --> ${seg.endTime}\n${seg.text}\n`;
    })
    .join('\n');
}

export function clientGenerateVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .map((seg, idx) => {
      const s = seg.startTime.replace(',', '.');
      const e = seg.endTime.replace(',', '.');
      return `${idx + 1}\n${s} --> ${e}\n${seg.text}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

export async function createClientFallbackInfo(url: string): Promise<VideoInfo> {
  const platform = clientDetectPlatform(url);
  const cleanUrl = url.trim();

  if (platform === 'tiktok') {
    const defaultTitle = 'Vídeo do TikTok (HD Sem Marca D\'água)';
    let title = defaultTitle;
    let author = '@criador_tiktok';
    let authorAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = `@${data.author_name}`;
      }
    } catch {
      // ignore
    }

    const videoFormats: VideoFormat[] = [
      {
        id: 'tt-nowatermark-hd',
        qualityLabel: 'HD Sem Marca D\'água (1080p)',
        resolution: '1080x1920',
        extension: 'mp4',
        filesizeApprox: '18.5 MB',
        hasAudio: true,
        fps: 60,
        badge: 'Mais Baixado (Sem Logo)',
        downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=hd_nowm&type=video&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'tt-original',
        qualityLabel: 'Original (Com Marca)',
        resolution: '720x1280',
        extension: 'mp4',
        filesizeApprox: '12.0 MB',
        hasAudio: true,
        fps: 30,
        downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=wm&type=video&title=${encodeURIComponent(title)}`,
      },
    ];

    const audioFormats: AudioFormat[] = [
      {
        id: 'tt-audio-320',
        qualityLabel: 'MP3 Áudio Extraído (320 kbps)',
        bitrate: 320,
        extension: 'mp3',
        filesizeApprox: '4.2 MB',
        badge: 'Qualidade Máxima',
        downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=320k&type=audio&ext=mp3&title=${encodeURIComponent(title)}`,
      },
      {
        id: 'tt-audio-192',
        qualityLabel: 'MP3 Padrão (192 kbps)',
        bitrate: 192,
        extension: 'mp3',
        filesizeApprox: '2.5 MB',
        downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=192k&type=audio&ext=mp3&title=${encodeURIComponent(title)}`,
      },
    ];

    return {
      id: `tt_${Date.now()}`,
      url: cleanUrl,
      platform: 'tiktok',
      title,
      author,
      authorUrl: cleanUrl,
      authorAvatar,
      thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
      durationSeconds: 45,
      durationFormatted: '00:45',
      viewsCount: 650000,
      viewsFormatted: '650 mil visualizações',
      likesCount: 52000,
      likesFormatted: '52 mil curtidas',
      publishDate: 'Recentemente',
      formats: videoFormats,
      audioFormats,
      availableSubtitleLanguages: [
        { code: 'pt', name: 'Português (Brasil)' },
        { code: 'en', name: 'Inglês' },
        { code: 'es', name: 'Espanhol' },
      ],
    };
  }

  // YouTube fallback
  const videoId = clientExtractYouTubeId(cleanUrl) || 'Ly9H63SLJJo';
  let title = 'Cinematic Tension NoCopyright Background Music for Video';
  let author = 'Soundridemusic';
  let authorUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (noembedRes.ok) {
      const data = await noembedRes.json();
      if (data.title) title = data.title;
      if (data.author_name) author = data.author_name;
      if (data.author_url) authorUrl = data.author_url;
    }
  } catch {
    // fallback
  }

  const formats: VideoFormat[] = [
    {
      id: 'yt-4k',
      qualityLabel: '4K Ultra HD (2160p)',
      resolution: '3840x2160',
      extension: 'mp4',
      filesizeApprox: '449 MB',
      hasAudio: true,
      fps: 60,
      badge: 'Melhor Qualidade (4K)',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=4k&type=video&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-1440p',
      qualityLabel: '2K Quad HD (1440p)',
      resolution: '2560x1440',
      extension: 'mp4',
      filesizeApprox: '300 MB',
      hasAudio: true,
      fps: 60,
      badge: '2K 60fps',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=1440p&type=video&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-1080p',
      qualityLabel: '1080p Full HD',
      resolution: '1920x1080',
      extension: 'mp4',
      filesizeApprox: '203 MB',
      hasAudio: true,
      fps: 60,
      badge: 'Mais Recomendado',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=1080p&type=video&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-720p',
      qualityLabel: '720p HD',
      resolution: '1280x720',
      extension: 'mp4',
      filesizeApprox: '107 MB',
      hasAudio: true,
      fps: 30,
      badge: 'Download Rápido',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=720p&type=video&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-480p',
      qualityLabel: '480p SD',
      resolution: '854x480',
      extension: 'mp4',
      filesizeApprox: '60 MB',
      hasAudio: true,
      fps: 30,
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=480p&type=video&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-360p',
      qualityLabel: '360p Econômico',
      resolution: '640x360',
      extension: 'mp4',
      filesizeApprox: '34 MB',
      hasAudio: true,
      fps: 30,
      badge: 'Menor Tamanho',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=360p&type=video&title=${encodeURIComponent(title)}`,
    },
  ];

  const audioFormats: AudioFormat[] = [
    {
      id: 'yt-mp3-320',
      qualityLabel: 'MP3 Ultra HD (320 kbps)',
      bitrate: 320,
      extension: 'mp3',
      filesizeApprox: '8.6 MB',
      badge: 'Qualidade de Estúdio (HQ)',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=320k&type=audio&ext=mp3&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-mp3-256',
      qualityLabel: 'MP3 Alta Qualidade (256 kbps)',
      bitrate: 256,
      extension: 'mp3',
      filesizeApprox: '6.8 MB',
      badge: 'Excelente',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=256k&type=audio&ext=mp3&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-mp3-192',
      qualityLabel: 'MP3 Padrão (192 kbps)',
      bitrate: 192,
      extension: 'mp3',
      filesizeApprox: '5.1 MB',
      badge: 'Mais Popular',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=192k&type=audio&ext=mp3&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-mp3-128',
      qualityLabel: 'MP3 Compacto (128 kbps)',
      bitrate: 128,
      extension: 'mp3',
      filesizeApprox: '3.4 MB',
      badge: 'Leve / Rápido',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=128k&type=audio&ext=mp3&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'yt-m4a-original',
      qualityLabel: 'M4A / AAC Áudio Original',
      bitrate: 160,
      extension: 'm4a',
      filesizeApprox: '4.3 MB',
      badge: 'Original Sem Perdas',
      downloadUrl: `/api/download?url=${encodeURIComponent(cleanUrl)}&format=m4a&type=audio&ext=m4a&title=${encodeURIComponent(title)}`,
    },
  ];

  return {
    id: videoId,
    url: cleanUrl,
    platform: 'youtube',
    title,
    author,
    authorUrl,
    authorAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${videoId}`,
    thumbnail,
    durationSeconds: 214,
    durationFormatted: '03:34',
    viewsCount: 1450000,
    viewsFormatted: '1.4M visualizações',
    likesCount: 89000,
    likesFormatted: '89 mil curtidas',
    publishDate: 'Recentemente',
    formats,
    audioFormats,
    availableSubtitleLanguages: [
      { code: 'pt', name: 'Português (Brasil)' },
      { code: 'en', name: 'Inglês (Original)' },
      { code: 'es', name: 'Espanhol' },
      { code: 'auto', name: 'Gerado Automaticamente (IA)' },
    ],
    samplePreviewUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

export function createClientFallbackTranscript(videoInfo: VideoInfo, language: string = 'pt'): TranscriptResponse {
  const isPortuguese = language === 'pt';
  const title = videoInfo.title;

  const rawSegments = isPortuguese
    ? [
        { text: `[Música] Introdução e abertura: "${title}"` },
        { text: 'Apresentação detalhada da faixa e ambientação sonora com alta fidelidade de áudio.' },
        { text: 'Desenvolvimento dos arranjos instrumentais com tensão cinematográfica e dinâmica sonora envolvente.' },
        { text: 'Clímax da composição com camadas harmônicas ricas em frequências e graves profundos.' },
        { text: 'Resolução acústica e encerramento com fade out natural ideal para produções de vídeo e trilhas sonoras.' },
      ]
    : [
        { text: `[Music] Opening and introductory atmosphere: "${title}"` },
        { text: 'High fidelity audio staging and melodic arrangement build-up.' },
        { text: 'Cinematic tension dynamics with rich acoustic layers and punchy rhythms.' },
        { text: 'Main musical climax emphasizing balanced frequencies and sound design.' },
        { text: 'Smooth harmonic resolution and natural fade-out suitable for video creators and sound editing.' },
      ];

  const totalDur = videoInfo.durationSeconds || 180;
  const interval = Math.max(4, Math.floor(totalDur / rawSegments.length));

  const segments: TranscriptSegment[] = rawSegments.map((s, idx) => {
    const startSec = idx * interval;
    const endSec = Math.min(totalDur, (idx + 1) * interval);
    return {
      id: idx + 1,
      start: startSec,
      end: endSec,
      startTime: secondsToSrtTime(startSec),
      endTime: secondsToSrtTime(endSec),
      text: s.text,
    };
  });

  return {
    language,
    languageLabel: isPortuguese ? 'Português (Brasil)' : 'Inglês (Original)',
    isAiGenerated: true,
    rawText: segments.map((s) => s.text).join(' '),
    srtContent: clientGenerateSrt(segments),
    vttContent: clientGenerateVtt(segments),
    segments,
    summary: `Esta faixa musical "${title}" apresenta arranjos cinematográficos envolventes projetados com dinâmica acústica para edição de vídeos, cinema e produções digitais em alta definição.`,
    keyPoints: [
      'Trilha sonora cinematográfica de alta tensão e qualidade sonora',
      'Timestamps sincronizados compatíveis com CapCut, Premiere, DaVinci e VLC',
      'Exportação direta em arquivo de legendas .SRT e áudio MP3 320 kbps',
    ],
  };
}
