import React from 'react';
import { Film, Music2, FileText, Sparkles, Shield, Zap } from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  const features = [
    {
      icon: Film,
      title: 'YouTube 4K & 1080p Full HD',
      description: 'Baixe vídeos com a mais alta definição visual, taxa de quadros a 60fps e áudio cristalino em formato MP4.',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      icon: Sparkles,
      title: 'TikTok Sem Marca D\'água',
      description: 'Remova automaticamente o logotipo flutuante do TikTok e obtenha o arquivo limpo pronto para republicação.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      icon: Music2,
      title: 'Conversor MP3 de Alta Resolução',
      description: 'Extraia o áudio em 320 kbps (Qualidade de Estúdio), 256 kbps e 192 kbps com tags ID3 e prévia em tempo real.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      icon: FileText,
      title: 'Transcrição & Legendas .SRT',
      description: 'Puxe o texto falado e baixe arquivos .SRT e .VTT sincronizados para Premiere, CapCut, DaVinci e VLC.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Recursos Completos para Criadores de Conteúdo
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          Interface intuitiva projetada para downloads ultrarrápidos, conversão de áudio e legendagem precisa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-xl ${feat.bg} ${feat.border} border flex items-center justify-center mb-4`}
              >
                <Icon className={`w-5 h-5 ${feat.color}`} />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-zinc-100">
                {feat.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
