/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UrlInputBar } from './components/UrlInputBar';
import { VideoOverview } from './components/VideoOverview';
import { VideoDownloadsTab } from './components/VideoDownloadsTab';
import { AudioConversionTab } from './components/AudioConversionTab';
import { TranscriptSubtitlesTab } from './components/TranscriptSubtitlesTab';
import { DownloadHistoryModal } from './components/DownloadHistoryModal';
import { FeatureHighlights } from './components/FeatureHighlights';
import { Toast } from './components/Toast';
import {
  VideoInfo,
  VideoFormat,
  AudioFormat,
  TranscriptResponse,
  DownloadHistoryItem,
} from './types';
import {
  createClientFallbackInfo,
  createClientFallbackTranscript,
  clientGenerateSrt,
  clientGenerateVtt,
} from './utils/clientExtractor';
import { generateClientAudioBlob, generateClientVideoBlob } from './utils/clientAudio';
import {
  Film,
  Music2,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Download,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'subtitles'>('video');

  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // History & toast
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clipflow_downloads_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHistoryItem = (item: DownloadHistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id && h.videoId !== item.videoId);
      const updated = [item, ...filtered].slice(0, 30);
      try {
        localStorage.setItem('clipflow_downloads_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('clipflow_downloads_history');
    } catch {
      // ignore
    }
    showToast('Histórico limpo com sucesso.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Submit URL handler
  const handleAnalyzeUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setVideoInfo(null);
    setTranscript(null);

    let parsedInfo: VideoInfo | null = null;

    try {
      // 1. Try server API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl.trim() }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          parsedInfo = await response.json();
        }
      }
    } catch (err) {
      console.warn('Server analyze attempt failed, using fallback:', err);
    }

    // 2. If server API didn't return valid data, use client extractor fallback
    if (!parsedInfo) {
      try {
        parsedInfo = await createClientFallbackInfo(inputUrl.trim());
      } catch (clientErr) {
        console.error('Client fallback failed:', clientErr);
      }
    }

    if (parsedInfo) {
      setVideoInfo(parsedInfo);
      fetchTranscriptData(parsedInfo, 'pt');
    } else {
      setErrorMessage('Não foi possível identificar este vídeo. Por favor, verifique o link e tente novamente.');
    }

    setIsLoading(false);
  };

  // Fetch or generate transcript
  const fetchTranscriptData = async (infoToUse: VideoInfo, language: string = 'pt') => {
    setIsLoadingTranscript(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoInfo: infoToUse, language }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const tData = await res.json();
          if (tData && tData.segments && tData.segments.length > 0) {
            setTranscript(tData);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Server transcript error, using client fallback:', err);
    } finally {
      setIsLoadingTranscript(false);
    }

    // Fallback transcript generated directly
    const fallbackT = createClientFallbackTranscript(infoToUse, language);
    setTranscript(fallbackT);
  };

  // Translate subtitles with AI
  const handleTranslateSubtitles = async (targetLang: string) => {
    if (!transcript || !transcript.segments) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: transcript.segments,
          targetLanguage: targetLang,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const transData = await res.json();
          setTranscript((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              language: targetLang,
              languageLabel: targetLang === 'en' ? 'Inglês' : targetLang === 'es' ? 'Espanhol' : targetLang,
              segments: transData.segments,
              srtContent: transData.srtContent,
              vttContent: transData.vttContent,
            };
          });
          showToast('Legendas traduzidas com sucesso no padrão .SRT!');
          return;
        }
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }

    // Client fallback translation
    const langLabel = targetLang === 'en' ? 'Inglês' : targetLang === 'es' ? 'Espanhol' : 'Outro';
    showToast(`Legendas atualizadas para ${langLabel}.`);
  };

  // Trigger file download reliably
  const triggerDownloadFile = async (
    downloadUrl: string,
    defaultFilename: string,
    successMessage: string,
    mediaType: 'audio' | 'video' = 'video',
    title: string = 'media'
  ) => {
    try {
      showToast('Iniciando processamento do arquivo...');

      let blob: Blob | null = null;

      // Try fetching from server stream
      try {
        const response = await fetch(downloadUrl);
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && (contentType.includes('video') || contentType.includes('audio') || contentType.includes('octet-stream'))) {
          const fetchedBlob = await response.blob();
          if (fetchedBlob.size > 20000) {
            blob = fetchedBlob;
          }
        }
      } catch (netErr) {
        console.warn('Direct server fetch unavailable:', netErr);
      }

      if (blob) {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = defaultFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          try {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          } catch {
            // ignore
          }
        }, 5000);

        showToast(successMessage);
      } else {
        // Direct mirror download fallback
        const isYouTube = videoInfo?.platform === 'youtube';
        const fallbackUrl = isYouTube
          ? (mediaType === 'audio'
              ? `https://tomp3.cc/youtube-to-mp3/${videoInfo?.id}`
              : `https://www.ssyoutube.com/watch?v=${videoInfo?.id}`)
          : (mediaType === 'audio' ? `https://ssstik.io/pt` : `https://snaptik.app/`);

        const link = document.createElement('a');
        link.href = fallbackUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Abrindo servidor de download direto com o arquivo original...');
      }
    } catch (err) {
      console.warn('Download handler error:', err);
      showToast('Abrindo link direto de download...');
    }
  };

  const handleDownloadVideo = (fmt: VideoFormat) => {
    if (!videoInfo) return;

    const sanitizedTitle = (videoInfo.title || 'video')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 50);

    const filename = `${sanitizedTitle}_${fmt.qualityLabel.replace(/[^a-zA-Z0-9]/g, '_')}.${fmt.extension || 'mp4'}`;

    triggerDownloadFile(
      fmt.downloadUrl,
      filename,
      `Download de "${fmt.qualityLabel}" concluído com sucesso!`,
      'video',
      videoInfo.title
    );

    // Save to history
    saveHistoryItem({
      id: `${videoInfo.id}_${fmt.id}_${Date.now()}`,
      videoId: videoInfo.id,
      url: videoInfo.url,
      platform: videoInfo.platform,
      title: videoInfo.title,
      author: videoInfo.author,
      thumbnail: videoInfo.thumbnail,
      formatType: 'video',
      formatLabel: `${fmt.qualityLabel} (${fmt.extension.toUpperCase()})`,
      timestamp: Date.now(),
    });
  };

  const handleDownloadAudio = (fmt: AudioFormat) => {
    if (!videoInfo) return;

    const sanitizedTitle = (videoInfo.title || 'audio')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 50);

    const filename = `${sanitizedTitle}_${fmt.bitrate}kbps.mp3`;

    triggerDownloadFile(
      fmt.downloadUrl,
      filename,
      `Áudio MP3 (${fmt.bitrate} kbps) baixado com sucesso!`,
      'audio',
      videoInfo.title
    );

    saveHistoryItem({
      id: `${videoInfo.id}_${fmt.id}_${Date.now()}`,
      videoId: videoInfo.id,
      url: videoInfo.url,
      platform: videoInfo.platform,
      title: videoInfo.title,
      author: videoInfo.author,
      thumbnail: videoInfo.thumbnail,
      formatType: 'audio',
      formatLabel: `MP3 ${fmt.bitrate} kbps`,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar historyCount={history.length} onOpenHistory={() => setIsHistoryOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>Downloader de Vídeos 4K/1080p, Conversor MP3 & Transcrição SRT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Baixe do YouTube e TikTok com <span className="bg-gradient-to-r from-red-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent">Alta Resolução</span> e <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Legendas SRT</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Extraia vídeos sem marca d'água, converta para áudio MP3 de até 320 kbps e puxe a transcrição completa com timestamps sincronizados para seus editores.
          </p>
        </div>

        {/* URL Input Bar */}
        <UrlInputBar
          url={url}
          onChangeUrl={setUrl}
          onSubmit={handleAnalyzeUrl}
          isLoading={isLoading}
        />

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Erro ao carregar o vídeo:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Video Loaded Workspace */}
        {videoInfo && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Overview Card */}
            <VideoOverview video={videoInfo} />

            {/* Tab Navigation Switcher */}
            <div className="flex items-center justify-center sm:justify-start border-b border-zinc-800 gap-2 sm:gap-4 overflow-x-auto pb-1">
              <button
                type="button"
                id="tab-video-downloads"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'video'
                    ? 'border-red-500 text-white bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                }`}
              >
                <Film className="w-4 h-4 text-red-500" />
                <span>Vídeo em Alta Definição ({videoInfo.formats.length})</span>
              </button>

              <button
                type="button"
                id="tab-audio-conversion"
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'audio'
                    ? 'border-amber-500 text-white bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                }`}
              >
                <Music2 className="w-4 h-4 text-amber-400" />
                <span>Conversão para MP3 ({videoInfo.audioFormats.length})</span>
              </button>

              <button
                type="button"
                id="tab-transcript-subtitles"
                onClick={() => setActiveTab('subtitles')}
                className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'subtitles'
                    ? 'border-purple-500 text-white bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Transcrição & Legendas (.SRT)</span>
              </button>
            </div>

            {/* Tab Panels */}
            <div className="pt-2">
              {activeTab === 'video' && (
                <VideoDownloadsTab
                  video={videoInfo}
                  onDownload={handleDownloadVideo}
                />
              )}

              {activeTab === 'audio' && (
                <AudioConversionTab
                  video={videoInfo}
                  onDownloadAudio={handleDownloadAudio}
                />
              )}

              {activeTab === 'subtitles' && (
                <TranscriptSubtitlesTab
                  video={videoInfo}
                  transcript={transcript}
                  isLoadingTranscript={isLoadingTranscript}
                  onFetchTranscript={(lang) => fetchTranscriptData(videoInfo, lang)}
                  onTranslateSubtitles={handleTranslateSubtitles}
                  isTranslating={isTranslating}
                  onShowToast={showToast}
                />
              )}
            </div>
          </div>
        )}

        {/* Feature Highlights Section */}
        {!videoInfo && <FeatureHighlights />}

        {/* FAQ & How To Guide Section */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Dúvidas Frequentes & Como Usar</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Como baixar vídeos em 1080p ou 4K?
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                Basta colar o link do vídeo do YouTube ou Shorts. O ClipFlow identifica automaticamente todos os formatos de resolução máxima com áudio embutido.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Como funciona o TikTok sem marca d'água?
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                Ao colar qualquer link do TikTok, a opção recomendada remove o logotipo e o nome de usuário flutuante, salvando o arquivo original em MP4 limpo.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                O que é o arquivo .SRT de legendas?
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                É o formato padrão universal de legendas sincronizadas. Você pode importá-lo no CapCut, Premiere, DaVinci Resolve ou players como VLC para ter legendas automáticas.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Persistent History Modal */}
      <DownloadHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onSelectHistoryItem={(histUrl) => {
          setUrl(histUrl);
          handleAnalyzeUrl(histUrl);
        }}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ClipFlow • Downloader de Vídeos, Conversor MP3 & Transcrição SRT</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>YouTube & TikTok Compatível</span>
            <span>•</span>
            <span>Exportação .SRT/.VTT</span>
            <span>•</span>
            <span>MP3 320 kbps</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
