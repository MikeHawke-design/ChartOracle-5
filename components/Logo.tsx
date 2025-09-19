

import React from 'react';

interface LogoProps {
  className?: string;
  isLoading?: boolean; // New prop for loading state
}

const Logo: React.FC<LogoProps> = ({ className = "w-16 h-16", isLoading = false }) => ( 
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
    {isLoading ? (
      <g>
        <circle 
          cx="30" 
          cy="20" 
          r="13.25" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeDasharray="20 10" // Creates dashed effect, adjust as needed
          fill="none"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 30 20"
            to="360 30 20"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    ) : (
      <>
        {/* Iris: Enlarged radius to 13.25 to meet inner top of eye path */}
        <circle cx="30" cy="20" r="13.25" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Bar 1 (Left) - Moved closer to center (x=26) */}
        <line x1="26" y1="15" x2="26" y2="25" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Wicks for Bar 1 */}
        <line x1="26" y1="13" x2="26" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="25" x2="26" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        {/* Bar 2 (Center) - Remains at x=30 */}
        <line x1="30" y1="12" x2="30" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Wicks for Bar 2 */}
        <line x1="30" y1="10" x2="30" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="28" x2="30" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        {/* Bar 3 (Right) - Moved closer to center (x=34) */}
        <line x1="34" y1="16" x2="34" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Wicks for Bar 3 */}
        <line x1="34" y1="14" x2="34" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="34" y1="24" x2="34" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )}
  </svg>
);

export default Logo;