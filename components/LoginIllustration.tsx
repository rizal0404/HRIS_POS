import React from 'react';

export const LoginIllustration: React.FC = () => {
    return (
        <svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
            <defs>
                <filter id="paper-texture" x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
                </filter>
                <mask id="texture-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" filter="url(#paper-texture)"/>
                </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="#f1f5f9"/>

            {/* Main shapes */}
            <g fill="#d1d5db" stroke="#e5e7eb" strokeWidth="0.5">
                <path d="M -50 650 L 150 450 L 150 200 L -50 400 Z" />
                <path d="M 160 550 L 360 350 L 360 100 L 160 300 Z" />
                <path d="M 120 250 L 320 50 L 370 75 L 170 275 Z" />
                <path d="M 370 75 L 320 50 L 320 -150 L 370 -125 Z" />
            </g>

            {/* Red highlight shape */}
            <g>
                <path d="M 120 250 L 320 50 L 370 75 L 170 275 Z" fill="none" stroke="#ef4444" strokeWidth="4" />
            </g>

            {/* Apply paper texture overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="black" opacity="0.05" mask="url(#texture-mask)"/>
        </svg>
    );
};
