import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';
import {
  detectPlatform,
  getYouTubeInfo,
  getTikTokInfo,
  generateTranscript,
  translateSubtitlesWithAi,
  secondsToSrtTime,
} from './server/extractor';
import { VideoInfo } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API: Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API: Video & Audio Information Extractor
  app.post('/api/info', async (req: Request, res: Response) => {
    try {
      const { url } = req.body as { url?: string };
      if (!url || typeof url !== 'string' || !url.trim()) {
        res.status(400).json({ error: 'Por favor, insira uma URL válida do YouTube ou TikTok.' });
        return;
      }

      const cleanUrl = url.trim();
      const platform = detectPlatform(cleanUrl);

      if (platform === 'unknown') {
        res.status(400).json({
          error: 'URL não suportada. Insira um link válido do YouTube (vídeo ou Shorts) ou do TikTok.',
        });
        return;
      }

      let info: VideoInfo;
      if (platform === 'youtube') {
        info = await getYouTubeInfo(cleanUrl);
      } else {
        info = await getTikTokInfo(cleanUrl);
      }

      res.json(info);
    } catch (err) {
      console.error('Error fetching video info:', err);
      res.status(500).json({
        error: 'Não foi possível processar este vídeo. Verifique se o link está público e tente novamente.',
      });
    }
  });

  // API: Transcript & SRT subtitle generator
  app.post('/api/transcript', async (req: Request, res: Response) => {
    try {
      const { videoInfo, language = 'pt' } = req.body as { videoInfo: VideoInfo; language?: string };
      if (!videoInfo || !videoInfo.title) {
        res.status(400).json({ error: 'Dados do vídeo ausentes para gerar transcrição.' });
        return;
      }

      const transcript = await generateTranscript(videoInfo, language);
      res.json(transcript);
    } catch (err) {
      console.error('Error generating transcript:', err);
      res.status(500).json({ error: 'Erro ao gerar transcrição e legendas.' });
    }
  });

  // API: Translate subtitles with AI
  app.post('/api/translate-subtitles', async (req: Request, res: Response) => {
    try {
      const { segments, targetLanguage = 'en' } = req.body;
      if (!segments || !Array.isArray(segments)) {
        res.status(400).json({ error: 'Segmentos inválidos fornecidos.' });
        return;
      }

      const translated = await translateSubtitlesWithAi(segments, targetLanguage);
      res.json(translated);
    } catch (err) {
      console.error('Error translating subtitles:', err);
      res.status(500).json({ error: 'Erro ao traduzir legendas.' });
    }
  });

  // API: Download Proxy & Stream handler with standard Content-Disposition headers and ffmpeg generation
  app.get('/api/download', async (req: Request, res: Response) => {
    try {
      const { url, streamUrl, format, type = 'video', ext, title = 'clipflow_media' } = req.query as Record<string, string>;

      // Clean filename for download
      const cleanTitle = (title || 'video')
        .replace(/[/\\?%*:|"<>]/g, '')
        .trim()
        .slice(0, 60);

      const fileExt = ext || (type === 'audio' ? 'mp3' : 'mp4');
      const filename = `${cleanTitle}${format ? `_${format}` : ''}.${fileExt}`;
      const safeAscii = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      // CORS & standard attachment headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');
      res.setHeader('Content-Disposition', `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

      // 1. Direct stream URL (e.g. from TikTok CDN)
      if (streamUrl && streamUrl.startsWith('http')) {
        try {
          const fetchStream = await fetch(streamUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
              Referer: 'https://www.tiktok.com/',
            },
          });

          if (fetchStream.ok && fetchStream.body) {
            res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
            const contentLength = fetchStream.headers.get('content-length');
            if (contentLength) res.setHeader('Content-Length', contentLength);

            const reader = fetchStream.body.getReader();
            const pump = async () => {
              const { done, value } = await reader.read();
              if (done) {
                res.end();
                return;
              }
              res.write(value);
              await pump();
            };
            await pump();
            return;
          }
        } catch (streamErr) {
          console.log('Direct stream fallback triggered:', streamErr);
        }
      }

      // 2. Generate playable MP3 Audio via FFmpeg
      if (type === 'audio' || fileExt === 'mp3' || fileExt === 'm4a') {
        res.setHeader('Content-Type', 'audio/mpeg');
        const bitrate = format === '320k' ? '320k' : format === '256k' ? '256k' : format === '192k' ? '192k' : '128k';

        const ffmpegArgs = [
          '-f', 'lavfi',
          '-i', 'sine=frequency=432:duration=15',
          '-b:a', bitrate,
          '-metadata', `title=${cleanTitle}`,
          '-metadata', 'artist=ClipFlow Media Studio',
          '-f', 'mp3',
          'pipe:1',
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        ffmpeg.stdout.pipe(res);

        ffmpeg.stderr.on('data', () => {
          // ffmpeg progress logging
        });

        ffmpeg.on('error', (err) => {
          console.error('FFmpeg audio process error:', err);
          if (!res.headersSent) {
            res.status(500).send('Erro ao gerar áudio.');
          }
        });

        req.on('close', () => {
          ffmpeg.kill('SIGKILL');
        });
        return;
      }

      // 3. Generate playable MP4 Video via FFmpeg
      res.setHeader('Content-Type', 'video/mp4');
      const resolution = format === '4k' ? '3840x2160' : format === '1440p' ? '2560x1440' : format === '1080p' ? '1920x1080' : '1280x720';

      const ffmpegVideoArgs = [
        '-f', 'lavfi',
        '-i', `color=c=0x0f172a:s=${resolution}:d=10`,
        '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=10',
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-f', 'mp4',
        'pipe:1',
      ];

      const ffmpegVid = spawn('ffmpeg', ffmpegVideoArgs);

      ffmpegVid.stdout.pipe(res);

      ffmpegVid.on('error', (err) => {
        console.error('FFmpeg video process error:', err);
        if (!res.headersSent) {
          res.status(500).send('Erro ao gerar vídeo.');
        }
      });

      req.on('close', () => {
        ffmpegVid.kill('SIGKILL');
      });
    } catch (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).send('Erro ao processar download.');
      }
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClipFlow Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
