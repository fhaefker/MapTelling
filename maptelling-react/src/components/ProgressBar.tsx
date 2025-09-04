import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps { current: number; total: number; }
const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  return (
    <motion.div
      className="progress-bar"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: total > 0 ? (current + 1) / total : 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Story progress"
    />
  );
};
export default React.memo(ProgressBar);
