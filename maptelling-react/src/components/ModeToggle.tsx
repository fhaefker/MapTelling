import React from 'react';

interface ModeToggleProps {
  isInteractive: boolean;
  onToggle: () => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ isInteractive, onToggle }) => {
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
        aria-label={isInteractive ? 'Switch to story mode' : 'Switch to free navigation mode'}
        title={isInteractive ? 'Story Mode' : 'Free Navigation'}
      >
        {isInteractive ? 'Story Mode' : 'Free Navigation'}
      </button>
    </div>
  );
};

export default ModeToggle;
