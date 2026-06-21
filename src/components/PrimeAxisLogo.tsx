import React from 'react';

interface PrimeAxisLogoProps {
  className?: string;
}

export function PrimeAxisLogo({ className = "w-full h-full" }: PrimeAxisLogoProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bar 1 (Vibrant Blue) */}
      <rect 
        x="16" 
        y="60" 
        width="11" 
        height="20" 
        rx="2" 
        fill="#0d74ce" 
      />
      
      {/* Bar 2 (Vibrant Green) */}
      <rect 
        x="32" 
        y="54" 
        width="11" 
        height="26" 
        rx="2" 
        fill="#0fa24e" 
      />
      
      {/* Bar 3 (Vibrant Blue) */}
      <rect 
        x="48" 
        y="45" 
        width="11" 
        height="35" 
        rx="2" 
        fill="#0d74ce" 
      />
      
      {/* Bar 4 (Vibrant Red) */}
      <rect 
        x="64" 
        y="32" 
        width="11" 
        height="48" 
        rx="2" 
        fill="#f32230" 
      />
      
      {/* Forest Green Curved Arrow */}
      {/* Arrow shaft using bezier curve to show perfect fluid growth */}
      <path 
        d="M20 52 C 34 46, 52 30, 78 7" 
        stroke="#005537" 
        strokeWidth="6" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Arrow head pointing up-right matching the slope */}
      <path 
        d="M65 8 L 79 7 L 77 21" 
        stroke="#005537" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />
    </svg>
  );
}
