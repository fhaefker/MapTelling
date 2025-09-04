import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { motion } from 'framer-motion';

interface NavigationControlsProps {
  currentChapter: number;
  totalChapters: number;
  isPlaying: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onChapterSelect: (index: number) => void;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentChapter,
  totalChapters,
  isPlaying,
  onPrevious,
  onNext,
  onPlayPause,
  onChapterSelect,
}) => {
  const t = useT();
  return (
    <motion.div 
      className="navigation-controls"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
  <div className="nav-buttons" role="group" aria-label={t('nav.groupLabel')}>
        <button 
          className="nav-btn"
          onClick={onPrevious}
          disabled={currentChapter === 0}
          aria-label={t('nav.previous')}
        >
          ◀
        </button>
        
        <button 
          className="play-pause-btn"
          onClick={onPlayPause}
          aria-label={isPlaying ? t('nav.pause') : t('nav.play')}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button 
          className="nav-btn"
          onClick={onNext}
          disabled={currentChapter === totalChapters - 1}
          aria-label={t('nav.next')}
        >
          ▶
        </button>
      </div>
      
  <div className="chapter-dots" role="tablist" aria-label={t('nav.tablistLabel')}>
        {Array.from({ length: totalChapters }, (_, index) => (
          <button
            key={index}
            className={`chapter-dot ${index === currentChapter ? 'active' : ''}`}
            onClick={() => onChapterSelect(index)}
            role="tab"
            aria-selected={index === currentChapter}
            aria-label={t('chapter.position', { current: index + 1, total: totalChapters })}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default NavigationControls;
