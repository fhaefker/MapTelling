import React from 'react';
import { motion } from 'framer-motion';
import { Chapter } from '../config/mapConfig';
import './StoryOverlay.css';

interface StoryOverlayProps {
  chapter: Chapter;
  chapterIndex: number;
  totalChapters: number;
}

const StoryOverlay: React.FC<StoryOverlayProps> = ({
  chapter,
  chapterIndex,
  totalChapters,
}) => {
  return (
    <motion.div 
      className="story-overlay"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6 }}
      key={chapter.id}
    >
      <div className="story-content">
        <motion.div
          className="chapter-indicator"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {chapterIndex + 1} / {totalChapters}
        </motion.div>
        
        <motion.h2
          className="story-title"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {chapter.title}
        </motion.h2>
        
        {chapter.image && (
          <motion.img
            src={chapter.image}
            alt={chapter.title}
            className="story-image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: '8px 0' }}
            loading="lazy"
          />
        )}

        <motion.p
          className="story-description"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {chapter.description}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default StoryOverlay;
