import React from 'react';

interface FlagIconProps extends React.SVGProps<SVGSVGElement> {
  // Add any additional props specific to FlagIcon here
}

export default function FlagIcon({ ...props }: FlagIconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Flag pole */}
      <line x1="4" x2="4" y1="22" y2="15" />
      
      {/* Flag shape */}
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    </svg>
  );
}
