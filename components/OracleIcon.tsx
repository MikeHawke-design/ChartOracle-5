
import React from 'react';

interface OracleIconProps {
  className?: string;
}

const OracleIcon: React.FC<OracleIconProps> = ({ className = "w-8 h-8" }) => (
    <svg 
    className={`${className} text-yellow-400`} 
    viewBox="0 0 60 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path 
      d="M30 4C18.954 4 9.472 10.957 3 20C9.472 29.043 18.954 36 30 36C41.046 36 50.528 29.043 57 20C50.528 10.957 41.046 4 30 4Z" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Stylized camera shutter/iris */}
    <circle cx="30" cy="20" r="12" stroke="currentColor" strokeWidth="2" />
    <circle cx="30" cy="20" r="5" fill="currentColor" />
    <g transform="translate(30,20)">
        {[0, 60, 120, 180, 240, 300].map(angle => (
             <line 
                key={angle}
                x1="5" 
                y1="0" 
                x2="12" 
                y2="0" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
                transform={`rotate(${angle})`}
            />
        ))}
    </g>
  </svg>
);

export default OracleIcon;