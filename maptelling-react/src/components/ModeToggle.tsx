import React from 'react';
import { useT } from '../i18n/I18nProvider';

interface ModeToggleProps {
  isInteractive: boolean;
  onToggle: () => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ isInteractive, onToggle }) => {
  const t = useT();
  // Position top-right below the terrain toggle (terrain button at top:8,right:8) to avoid inset map (bottom-right)
  return (
    <div style={{ position: 'fixed', top: 56, right: 8, zIndex: 10 }}>
      <button
        onClick={onToggle}
        style={{
          padding: '8px 14px',
          borderRadius: 20,
          border: '1px solid #999',
          background: isInteractive ? '#222' : '#3FB1CE',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 13,
          letterSpacing: 0.5,
          fontWeight: 500,
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          minWidth: 170,
          textAlign: 'center'
        }}
        aria-pressed={isInteractive}
        aria-label={isInteractive ? t('mode.toStory.aria') : t('mode.toFree.aria')}
        title={isInteractive ? t('mode.toStory') : t('mode.toFree')}
      >
        {isInteractive ? t('mode.toStory') : t('mode.toFree')}
      </button>
    </div>
  );
};

export default ModeToggle;
