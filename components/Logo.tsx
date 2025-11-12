import React from 'react';

export const Logo: React.FC<{ className?: string, variant?: 'login' | 'sidebar' }> = ({ className, variant = 'sidebar' }) => {
    if (variant === 'login') {
        return (
            <div className={`font-sans ${className}`}>
                <svg width="42" height="18" viewBox="0 0 42 18" className="mb-2">
                    <path d="M9.3,2 C6.3,2 4,4.3 4,7.3 C4,10.3 6.3,12.6 9.3,12.6 H14 V14.8 C14,16.8 12.2,18 10.2,18 C8.2,18 6.4,16.8 6.4,14.8 V13.4 C6.4,11.4 8.2,9.6 10.2,9.6 H14 V12.6 H9.3 C7.4,12.6 6.1,11.3 6.1,9.4 C6.1,7.5 7.4,6.2 9.3,6.2 H14 V2 Z" fill="#E53935"/>
                    <path d="M17 2 H21 V18 H17 Z" fill="#212121"/>
                    <path d="M29.3,2 C26.3,2 24,4.3 24,7.3 V12.6 C24,15.7 26.3,18 29.3,18 C32.3,18 34.6,15.7 34.6,12.6 V7.3 C34.6,4.3 32.3,2 29.3,2 M32.5,7.3 V12.6 C32.5,14.6 31.2,15.9 29.3,15.9 C27.4,15.9 26.1,14.6 26.1,12.6 V7.3 C26.1,5.4 27.4,4.1 29.3,4.1 C31.2,4.1 32.5,5.4 32.5,7.3 Z M34.6,11 H30.3" fill="#212121" stroke="none"/>
                    <text x="36" y="14" fill="#212121" fontSize="12" fontWeight="bold">SIG</text>
                </svg>

                <div className="flex items-center space-x-2">
                     <svg width="32" height="32" viewBox="0 0 32 32">
                        <path d="M4 28 L16 4 L28 28" stroke="#212121" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                        <path d="M10 18 L22 18" stroke="#212121" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                         <path d="M24 8 L8 24" stroke="#E53935" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
                    </svg>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                        SIMP
                    </h1>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-1">Sistem Informasi & manajemen POS Unit QC</p>
            </div>
        );
    }
    
    // Default sidebar logo
    const logoBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjEwIDUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzdHlsZT4udGV4dCB7IGZvbnQtZmFtaWx5OiAnU2Vnb2UgVUknLCBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC1zaXplOiA0NnB4OyBmb250LXdlaWdodDogODAwOyBmaWxsOiByZ2IoMjA5LCAzMywgNDgpOyBsZXR0ZXItc3BhY2luZzogLTFweDsgfTwvc3R5bGU+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0idGV4dCI+U0lNUDwvdGV4dD48L3N2Zz4=';
    return <img src={logoBase64} alt="SIMP Logo" className={className} />;
};
