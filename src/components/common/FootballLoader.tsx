'use client';

import React from 'react';

export function FootballLoader({
  caption,
  title,
}: {
  caption?: string;
  title?: string;
}) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative flex flex-col items-center justify-center">
        {/* Subtle, calm ambient aura */}
        <div className="absolute -inset-10 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* The Constructing Soccer Ball */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <svg
            className="h-full w-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_8px_24px_rgba(249,115,22,0.25)]"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <style>
              {`
                @keyframes drawOutline {
                  0% { stroke-dashoffset: 280; opacity: 0.3; }
                  30% { stroke-dashoffset: 0; opacity: 1; }
                  85% { stroke-dashoffset: 0; opacity: 1; }
                  100% { stroke-dashoffset: 0; opacity: 0.4; }
                }

                @keyframes drawPentagon {
                  0%, 15% { stroke-dashoffset: 90; fill-opacity: 0; transform: scale(0.6); }
                  45% { stroke-dashoffset: 0; fill-opacity: 0.85; transform: scale(1); }
                  85% { stroke-dashoffset: 0; fill-opacity: 0.85; transform: scale(1); }
                  100% { stroke-dashoffset: 90; fill-opacity: 0; transform: scale(0.6); }
                }

                @keyframes drawSeams {
                  0%, 30% { stroke-dashoffset: 60; opacity: 0; }
                  60% { stroke-dashoffset: 0; opacity: 1; }
                  85% { stroke-dashoffset: 0; opacity: 1; }
                  100% { stroke-dashoffset: 60; opacity: 0; }
                }

                @keyframes drawOuterPanels {
                  0%, 45% { opacity: 0; transform: scale(0.8); }
                  70% { opacity: 1; transform: scale(1); }
                  85% { opacity: 1; transform: scale(1); }
                  100% { opacity: 0; transform: scale(0.8); }
                }

                @keyframes gentleFloat {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-6px) rotate(4deg); }
                }

                .anim-outline {
                  stroke-dasharray: 280;
                  animation: drawOutline 3.6s ease-in-out infinite;
                }

                .anim-center-pentagon {
                  stroke-dasharray: 90;
                  transform-origin: 50px 48px;
                  animation: drawPentagon 3.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                .anim-seam {
                  stroke-dasharray: 60;
                  animation: drawSeams 3.6s ease-in-out infinite;
                }

                .anim-outer-panels {
                  transform-origin: 50px 50px;
                  animation: drawOuterPanels 3.6s ease-in-out infinite;
                }

                .ball-float {
                  animation: gentleFloat 3.6s ease-in-out infinite;
                }
              `}
            </style>

            <defs>
              <radialGradient id="calmBallGlow" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#f1f5f9" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.2" />
              </radialGradient>
              <linearGradient id="calmPanelDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            <g className="ball-float">
              {/* Step 1: Base Sphere Outline (Constructs first) */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="url(#calmBallGlow)"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground/80 anim-outline"
              />

              {/* Step 2: Center Pentagon Panel (Constructs second) */}
              <polygon
                points="50,33 63,42 58,58 42,58 37,42"
                fill="url(#calmPanelDark)"
                stroke="currentColor"
                strokeWidth="1.8"
                className="text-primary anim-center-pentagon"
              />

              {/* Step 3: Seam Lines radiating outward (Constructs third) */}
              <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-foreground/75 anim-seam">
                {/* Top seam */}
                <line x1="50" y1="33" x2="50" y2="14" />
                {/* Top right seam */}
                <line x1="63" y1="42" x2="80" y2="33" />
                {/* Bottom right seam */}
                <line x1="58" y1="58" x2="73" y2="73" />
                {/* Bottom left seam */}
                <line x1="42" y1="58" x2="27" y2="73" />
                {/* Top left seam */}
                <line x1="37" y1="42" x2="20" y2="33" />
              </g>

              {/* Step 4: Outer Panels & Contours (Constructs fourth) */}
              <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60 anim-outer-panels">
                {/* Perimeter Curves connecting the seams */}
                <path d="M50 14 C65 15 76 22 80 33" />
                <path d="M80 33 C88 45 87 60 73 73" />
                <path d="M73 73 C59 87 41 87 27 73" />
                <path d="M27 73 C13 60 12 45 20 33" />
                <path d="M20 33 C24 22 35 15 50 14" />

                {/* Outer corner dark panel patches */}
                <polygon points="50,14 59,9 66,19 50,33" fill="url(#calmPanelDark)" fillOpacity="0.4" />
                <polygon points="80,33 87,43 82,55 63,42" fill="url(#calmPanelDark)" fillOpacity="0.4" />
                <polygon points="73,73 70,85 57,81 58,58" fill="url(#calmPanelDark)" fillOpacity="0.4" />
                <polygon points="27,73 30,85 43,81 42,58" fill="url(#calmPanelDark)" fillOpacity="0.4" />
                <polygon points="20,33 13,43 18,55 37,42" fill="url(#calmPanelDark)" fillOpacity="0.4" />
              </g>

              {/* Subtle Gloss Light Curve */}
              <path
                d="M32 20 C42 15 58 15 68 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>
          </svg>
        </div>

        {/* Soft, calm shadow underneath */}
        <div className="mt-3 h-1.5 w-14 rounded-full bg-black/20 dark:bg-white/10 blur-sm animate-pulse" />

        {/* Optional Clean Title / Caption */}
        {(title || caption) && (
          <div className="mt-4 flex flex-col items-center gap-1">
            {title && <h3 className="text-sm font-bold text-foreground">{title}</h3>}
            {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
