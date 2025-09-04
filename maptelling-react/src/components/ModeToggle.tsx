import React from 'react';
import { useT } from '../i18n/I18nProvider';

interface ModeToggleProps {
  isInteractive: boolean;
  onToggle: () => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ isInteractive, onToggle }) => {
  const t = useT();
  return (
    <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 10 }}>
      <button
        onClick={onToggle}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #ddd',
          background: isInteractive ? '#3FB1CE' : '#fff',
          color: isInteractive ? '#fff' : '#333',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}
  aria-pressed={isInteractive}
  aria-label={isInteractive ? t('mode.story.aria') : t('mode.free.aria')}
  title={isInteractive ? t('mode.story') : t('mode.free')}
      >
  {isInteractive ? t('mode.story') : t('mode.free')}
      </button>
    </div>
  );
};

export default ModeToggle;
