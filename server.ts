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

  // API: Download Proxy & Stream handler with standard Content-Disposition headers (100% in-app)
  app.get('/api/download', async (req: Request, res: Response) => {
    try {
      const { url, streamUrl, format, type = 'video', ext, title = 'clipflow_media', nowm } = req.query as Record<string, string>;

      const cleanTitle = (title || 'video')
        .replace(/[/\\?%*:|"<>]/g, '')
        .trim()
        .slice(0, 60);

      const fileExt = ext || (type === 'audio' ? 'mp3' : 'mp4');
      const filename = `${cleanTitle}${format ? `_${format}` : ''}.${fileExt}`;
      const safeAscii = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      // 1. Direct stream URL provided (e.g. TikTok CDN stream)
      if (streamUrl && streamUrl.startsWith('http')) {
        try {
          const fetchStream = await fetch(streamUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              Referer: 'https://www.tiktok.com/',
            },
          });

          if (fetchStream.ok && fetchStream.body) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
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
          console.log('Direct stream fetch error:', streamErr);
        }
      }

      // 2. If it is a TikTok URL, attempt real-time TikTok direct CDN resolution
      if (url && (url.includes('tiktok.com') || url.includes('douyin.com'))) {
        try {
          const tikRes = await fetch('https://www.tikwm.com/api/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            body: `url=${encodeURIComponent(url)}&hd=1`,
            signal: AbortSignal.timeout(6000),
          });

          if (tikRes.ok) {
            const tikData = await tikRes.json();
            if (tikData && tikData.code === 0 && tikData.data) {
              const directMediaUrl = type === 'audio'
                ? (tikData.data.music || tikData.data.music_info?.play)
                : (tikData.data.hdplay || tikData.data.play);

              if (directMediaUrl && directMediaUrl.startsWith('http')) {
                const cdnStream = await fetch(directMediaUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    Referer: 'https://www.tiktok.com/',
                  },
                });

                if (cdnStream.ok && cdnStream.body) {
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
                  res.setHeader('Content-Disposition', `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
                  const contentLength = cdnStream.headers.get('content-length');
                  if (contentLength) res.setHeader('Content-Length', contentLength);

                  const reader = cdnStream.body.getReader();
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
              }
            }
          }
        } catch (tikErr) {
          console.log('TikTok dynamic resolution error:', tikErr);
        }
      }

      // 3. If running locally with yt-dlp available, stream genuine media directly
      if (url && url.startsWith('http')) {
        try {
          const ytdlpArgs = type === 'audio'
            ? ['-o', '-', '-x', '--audio-format', 'mp3', url]
            : ['-o', '-', '-f', 'best[ext=mp4]/best', url];

          const ytdlp = spawn('yt-dlp', ytdlpArgs);
          let hasOutput = false;

          ytdlp.stdout.once('data', (chunk) => {
            hasOutput = true;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
            res.write(chunk);
          });

          ytdlp.stdout.on('data', (chunk) => {
            if (hasOutput) {
              res.write(chunk);
            }
          });

          ytdlp.stdout.on('end', () => {
            if (hasOutput) {
              res.end();
            }
          });

          ytdlp.on('error', (spawnError) => {
            console.log('yt-dlp error:', spawnError);
            if (!hasOutput && !res.headersSent) {
              res.status(500).json({ error: 'Processamento indisponível para este vídeo no momento.' });
            }
          });

          req.on('close', () => {
            ytdlp.kill('SIGKILL');
          });
          return;
        } catch (spawnErr) {
          console.log('yt-dlp spawn attempt failed:', spawnErr);
        }
      }

      if (!res.headersSent) {
        res.status(404).json({ error: 'Fluxo de mídia não encontrado para este link.' });
      }
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
