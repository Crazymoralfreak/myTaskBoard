import React from 'react';

const FlagRU: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
    <circle cx="12" cy="12" r="12" fill="#fff" />
    <rect y="8" width="24" height="8" fill="#0039A6" />
    <rect y="16" width="24" height="8" fill="#D52B1E" />
  </svg>
);

export default FlagRU; 