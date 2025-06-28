import React from 'react';

const FlagUS: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
    <circle cx="12" cy="12" r="12" fill="#fff" />
    <g>
      <rect y="4" width="24" height="2" fill="#B22234" />
      <rect y="8" width="24" height="2" fill="#B22234" />
      <rect y="12" width="24" height="2" fill="#B22234" />
      <rect y="16" width="24" height="2" fill="#B22234" />
      <rect y="20" width="24" height="2" fill="#B22234" />
      <rect width="10" height="10" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="1.5" cy="1.5" r="0.5" />
        <circle cx="3.5" cy="1.5" r="0.5" />
        <circle cx="5.5" cy="1.5" r="0.5" />
        <circle cx="7.5" cy="1.5" r="0.5" />
        <circle cx="9.5" cy="1.5" r="0.5" />
        <circle cx="2.5" cy="3" r="0.5" />
        <circle cx="4.5" cy="3" r="0.5" />
        <circle cx="6.5" cy="3" r="0.5" />
        <circle cx="8.5" cy="3" r="0.5" />
        <circle cx="1.5" cy="4.5" r="0.5" />
        <circle cx="3.5" cy="4.5" r="0.5" />
        <circle cx="5.5" cy="4.5" r="0.5" />
        <circle cx="7.5" cy="4.5" r="0.5" />
        <circle cx="9.5" cy="4.5" r="0.5" />
        <circle cx="2.5" cy="6" r="0.5" />
        <circle cx="4.5" cy="6" r="0.5" />
        <circle cx="6.5" cy="6" r="0.5" />
        <circle cx="8.5" cy="6" r="0.5" />
        <circle cx="1.5" cy="7.5" r="0.5" />
        <circle cx="3.5" cy="7.5" r="0.5" />
        <circle cx="5.5" cy="7.5" r="0.5" />
        <circle cx="7.5" cy="7.5" r="0.5" />
        <circle cx="9.5" cy="7.5" r="0.5" />
        <circle cx="2.5" cy="9" r="0.5" />
        <circle cx="4.5" cy="9" r="0.5" />
        <circle cx="6.5" cy="9" r="0.5" />
        <circle cx="8.5" cy="9" r="0.5" />
      </g>
    </g>
  </svg>
);

export default FlagUS; 