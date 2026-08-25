import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Search,
  Languages,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  FileCode,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';
import { VideoInfo, TranscriptResponse, TranscriptSegment } from '../types';

interface TranscriptSubtitlesTabProps {
  video: VideoInfo;
  transcript: TranscriptResponse | null;
  isLoadingTranscript: boolean;
  onFetchTranscript: (language?: string) => void;
  onTranslateSubtitles: (targetLanguage: string) => Promise<void>;
  isTranslating: boolean;
  onShowToast: (msg: string) => void;
}

export const TranscriptSubtitlesTab: React.FC<TranscriptSubtitlesTabProps> = ({
  video,
  transcript,
  isLoadingTranscript,
  onFetchTranscript,
  onTranslateSubtitles,
  isTranslating,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [targetTranslateLang, setTargetTranslateLang] = useState('en');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Trigger initial fetch if not yet loaded
  useEffect(() => {
    if (!transcript && !isLoadingTranscript) {
      onFetchTranscript('pt');
    }
  }, [video.id]);

  const filteredSegments = transcript?.segments.filter((seg) =>
    seg.text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Download helper for text files (.srt, .vtt, .txt)
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast(`Arquivo "${filename}" baixado com sucesso!`);
  };

  const handleDownloadSrt = () => {
    if (!transcript) return;
    const cleanTitle = video.title.replace(/[/\\?%*:|"<>]/g, '').trim().slice(0, 50);
    const filename = `${cleanTitle}_legendas_${transcript.language || 'pt'}.srt`;
    downloadFile(transcript.srtContent, filename, 'application/x-subrip');
  };

  const handleDownloadVtt = () => {
    if (!transcript) return;
    const cleanTitle = video.title.replace(/[/\\?%*:|"<>]/g, '').trim().slice(0, 50);
    const filename = `${cleanTitle}_legendas_${transcript.language || 'pt'}.vtt`;
    downloadFile(transcript.vttContent, filename, 'text/vtt');
  };

  const handleDownloadTxt = () => {
    if (!transcript) return;
    const cleanTitle = video.title.replace(/[/\\?%*:|"<>]/g, '').trim().slice(0, 50);
    const filename = `${cleanTitle}_transcricao_${transcript.language || 'pt'}.txt`;
    const formattedTxt = `TRANSCRICAO DO VIDEO\nTitulo: ${video.title}\nCanal: ${video.author}\nPlataforma: ${video.platform.toUpperCase()}\nData de Extracao: ${new Date().toLocaleString()}\n\n` +
      transcript.segments.map((s) => `[${s.startTime} --> ${s.endTime}] ${s.text}`).join('\n\n') +
      `\n\n--- TEXTO COMPLETO CONTINUO ---\n\n${transcript.rawText}`;
    downloadFile(formattedTxt, filename, 'text/plain;charset=utf-8');
  };

  const handleCopyFullText = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript.rawText);
      setCopiedType('raw');
      onShowToast('Transcrição copiada para a área de transferência!');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      onShowToast('Erro ao copiar texto.');
    }
  };

  const handleCopySrt = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript.srtContent);
      setCopiedType('srt');
      onShowToast('Conteúdo do arquivo SRT copiado com sucesso!');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      onShowToast('Erro ao copiar SRT.');
    }
  };

  const availableLanguages = [
    { code: 'pt', name: 'Português (Brasil)' },
    { code: 'en', name: 'Inglês (English)' },
    { code: 'es', name: 'Espanhol (Español)' },
    { code: 'fr', name: 'Francês (Français)' },
    { code: 'de', name: 'Alemão (Deutsch)' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: 'Japonês (日本語)' },
    { code: 'zh', name: 'Chinês (中文)' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Subtitle Formats & Action Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/30 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Legendas & Transcrição
              </span>
              <span className="text-xs text-zinc-400 font-mono">Formatos SRT, VTT & TXT</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Extração Completa com Timestamps Sincronizados
            </h3>
            <p className="text-xs text-zinc-400">
              Pronto para importação direta no Premiere, CapCut, DaVinci Resolve, VLC e YouTube Studio.
            </p>
          </div>
        </div>

        {/* Primary Download Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            id="download-srt-btn"
            type="button"
            onClick={handleDownloadSrt}
            disabled={!transcript || isLoadingTranscript}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            title="Baixar arquivo de legenda .SRT compatível com editores de vídeo"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Legendas (.SRT)</span>
          </button>

          <button
            id="download-vtt-btn"
            type="button"
            onClick={handleDownloadVtt}
            disabled={!transcript || isLoadingTranscript}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-semibold text-xs border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Baixar formato WebVTT"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400" />
            <span>.VTT</span>
          </button>

          <button
            id="download-txt-btn"
            type="button"
            onClick={handleDownloadTxt}
            disabled={!transcript || isLoadingTranscript}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-semibold text-xs border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Baixar texto completo em formato .TXT"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* AI Subtitle Translation and Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Subtitles AI Translator */}
        <div className="md:col-span-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-200 font-semibold text-xs">
              <Languages className="w-4 h-4 text-purple-400" />
              <span>Traduzir Legendas com Inteligência Artificial:</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Gera um novo arquivo .SRT com timestamps idênticos traduzidos para o idioma escolhido.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              id="translate-lang-select"
              value={targetTranslateLang}
              onChange={(e) => setTargetTranslateLang(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

            <button
              id="execute-translation-btn"
              type="button"
              onClick={() => onTranslateSubtitles(targetTranslateLang)}
              disabled={isTranslating || !transcript}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-purple-600 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 hover:border-purple-500"
            >
              {isTranslating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Traduzindo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Traduzir SRT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions / Copy Toolbar */}
        <div className="md:col-span-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-zinc-200 font-semibold text-xs">
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>Ações Rápidas de Cópia:</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Copie o texto para a área de transferência para usar em anotações ou relatórios.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-transcript-text-btn"
              type="button"
              onClick={handleCopyFullText}
              disabled={!transcript}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
            >
              {copiedType === 'raw' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Texto Completo</span>
                </>
              )}
            </button>

            <button
              id="copy-raw-srt-btn"
              type="button"
              onClick={handleCopySrt}
              disabled={!transcript}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
            >
              {copiedType === 'srt' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SRT Copiado!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copiar Código SRT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Summary Box if available */}
      {transcript?.summary && (
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Resumo Inteligente do Vídeo:</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 mb-2 leading-relaxed">
            {transcript.summary}
          </p>

          {transcript.keyPoints && transcript.keyPoints.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-800/80">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Tópicos Principais:
              </span>
              <ul className="space-y-1 text-xs text-zinc-300">
                {transcript.keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Transcript Segments Interactive Viewer */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Linhas da Transcrição ({filteredSegments.length} falas)
            </h4>
            {transcript?.languageLabel && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {transcript.languageLabel}
              </span>
            )}
          </div>

          {/* Search inside transcript */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              id="search-transcript-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar palavra na fala..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoadingTranscript && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-zinc-200">Extraindo áudio e gerando transcrição precisa...</p>
            <p className="text-xs text-zinc-500 mt-1">Calculando sincronização de timestamps e legendas SRT.</p>
          </div>
        )}

        {/* Loaded Segment List */}
        {!isLoadingTranscript && transcript && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredSegments.length > 0 ? (
              filteredSegments.map((seg) => (
                <div
                  key={seg.id}
                  className="group flex flex-col sm:flex-row sm:items-baseline gap-2 p-2.5 rounded-xl hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-zinc-700/50"
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500 w-5 text-right">
                      #{seg.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-purple-400 font-semibold select-all">
                      {seg.startTime.split(',')[0]}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed group-hover:text-white">
                    {seg.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nenhuma fala encontrada com o termo "{searchTerm}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Educational Box on how to use .SRT */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/70 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>Como utilizar arquivos de legenda (.SRT)?</span>
        </div>
        <p>
          1. <strong>No CapCut / Premiere / DaVinci Resolve:</strong> Arraste o arquivo <code className="text-purple-300">.srt</code> diretamente para a timeline do seu projeto. O software sincronizará automaticamente todas as legendas com os cortes de fala.
        </p>
        <p>
          2. <strong>No VLC Media Player:</strong> Reproduza o vídeo e vá em <span className="text-zinc-200 font-medium">Legendas &gt; Adicionar Arquivo de Legenda</span> e selecione o <code className="text-purple-300">.srt</code> baixado.
        </p>
      </div>
    </div>
  );
};
