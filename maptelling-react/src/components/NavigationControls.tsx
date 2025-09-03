import React from 'react';
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
  return (
    <motion.div 
      className="navigation-controls"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <div className="nav-buttons">
        <button 
          className="nav-btn"
          onClick={onPrevious}
          disabled={currentChapter === 0}
        >
          ◀
        </button>
        
        <button 
          className="play-pause-btn"
          onClick={onPlayPause}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button 
          className="nav-btn"
          onClick={onNext}
          disabled={currentChapter === totalChapters - 1}
        >
          ▶
        </button>
      </div>
      
      <div className="chapter-dots">
        {Array.from({ length: totalChapters }, (_, index) => (
          <button
            key={index}
            className={`chapter-dot ${index === currentChapter ? 'active' : ''}`}
            onClick={() => onChapterSelect(index)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default NavigationControls;
