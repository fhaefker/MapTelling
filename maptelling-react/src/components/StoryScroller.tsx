import React from 'react';
import { useInView } from 'react-intersection-observer';
import { config } from '../config/mapConfig';

interface StoryScrollerProps {
  currentChapter: number;
  onEnterChapter: (index: number) => void;
  disabled?: boolean; // when true, ignore scroll-based chapter changes
}

const StoryScroller: React.FC<StoryScrollerProps> = ({ currentChapter, onEnterChapter, disabled }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        pointerEvents: 'auto',
        zIndex: 5,
        padding: '16px',
      }}
    >
      {/* Header */}
      <div style={{
        maxWidth: 720,
        margin: '16px auto',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 8px 0' }}>Cape Wrath Trail</h1>
        <p style={{ margin: 0 }}>Scroll durch die Kapitel oder nutze die Navigation.</p>
      </div>

      {/* Chapters */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {config.chapters.map((ch, idx) => (
          <ChapterStep
            key={ch.id}
            index={idx}
            active={idx === currentChapter}
            title={ch.title}
            description={ch.description}
            onEnter={() => { if (!disabled) onEnterChapter(idx); }}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{ height: '30vh' }} />
    </div>
  );
};

const ChapterStep: React.FC<{
  index: number;
  active: boolean;
  title: string;
  description: string;
  onEnter: () => void;
}> = ({ active, title, description, onEnter }) => {
  const { ref } = useInView({
    threshold: 0.6,
    onChange: (inView) => {
      if (inView) onEnter();
    },
  });

  return (
    <div ref={ref} style={{ margin: '48vh 0' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 10,
          padding: 20,
          boxShadow: active
            ? '0 6px 16px rgba(63,177,206,0.4)'
            : '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: active ? '4px solid #3FB1CE' : '4px solid transparent',
        }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginBottom: 0 }}>{description}</p>
      </div>
    </div>
  );
};

export default StoryScroller;
