
import React from 'react';

interface LEDProgressBarProps {
  progress: number; // 0 to 100
  segments?: number;
  className?: string;
  color?: string;
}

const LEDProgressBar: React.FC<LEDProgressBarProps> = ({ 
  progress, 
  segments = 20, 
  className = "",
  color 
}) => {
  const activeSegments = Math.floor((progress / 100) * segments);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: segments }).map((_, i) => (
        <div 
          key={i}
          className={`h-2 flex-1 rounded-[2px] transition-all duration-300 ${
            i < activeSegments 
              ? 'bg-accent shadow-[0_0_10px_var(--accent)] opacity-100' 
              : 'bg-slate-200 dark:bg-white/10 opacity-30'
          }`}
          style={i < activeSegments && color ? { backgroundColor: color, boxShadow: `0 0 10px ${color}` } : {}}
        />
      ))}
    </div>
  );
};

export default LEDProgressBar;
