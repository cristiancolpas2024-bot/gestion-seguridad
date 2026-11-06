import React from 'react';

export function HeroCamion() {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 120 }}>
      <style>{`
        @keyframes drive { 0%{transform:translateX(-200px)} 100%{transform:translateX(calc(100% + 1200px))} }
        @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.2px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .lg-truck{position:absolute;left:0;bottom:22px;width:168px;animation:drive 9s linear infinite;will-change:transform}
        .lg-bob{animation:bob 1.1s ease-in-out infinite}
        .lg-spin{animation:spin .9s linear infinite;transform-origin:center;transform-box:fill-box}
        @media (prefers-reduced-motion:reduce){.lg-truck{animation-duration:16s}.lg-bob,.lg-spin{animation:none}}
      `}</style>

      {/* carretera */}
      <div className="absolute left-0 w-full" style={{ bottom: 26, height: 2,
        background: "linear-gradient(90deg,transparent,#2A3550 8%,#2A3550 92%,transparent)" }} />

      <svg className="lg-truck" viewBox="0 0 220 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className="lg-bob">
          <ellipse cx="108" cy="90" rx="92" ry="4" fill="#000" opacity="0.28"/>
          <rect x="6" y="20" width="132" height="56" rx="5" fill="#F4F6F5" stroke="#C8D0CC" strokeWidth="1.5"/>
          <rect x="6" y="58" width="132" height="8" fill="#85D60F"/>
          <text x="20" y="42" fontFamily="Inter,Arial,sans-serif" fontSize="15" fontWeight="800" fill="#1F2937">
            logisticos<tspan fill="#5F9A0A" fontSize="10">.co</tspan>
          </text>
          <g fill="#85D60F">
            <path d="M104 30 l9 9 l-9 9 l-4 0 l9 -9 l-9 -9 z"/>
            <path d="M114 30 l9 9 l-9 9 l-4 0 l9 -9 l-9 -9 z"/>
          </g>
          <path d="M138 36 L160 36 L186 60 L186 76 L138 76 Z" fill="#E7ECEA" stroke="#C8D0CC" strokeWidth="1.5"/>
          <path d="M143 41 L158 41 L176 59 L143 59 Z" fill="#1F2937"/>
          <rect x="181" y="63" width="5" height="7" rx="1.5" fill="#85D60F"/>
          <rect x="10" y="76" width="176" height="5" rx="2" fill="#374151"/>
          <g><circle cx="52" cy="82" r="13" fill="#1F2937"/>
            <g className="lg-spin"><circle cx="52" cy="82" r="5.5" fill="#9CA3AF"/>
              <rect x="51" y="70" width="2" height="24" fill="#4B5563"/><rect x="40" y="81" width="24" height="2" fill="#4B5563"/></g></g>
          <g><circle cx="158" cy="82" r="13" fill="#1F2937"/>
            <g className="lg-spin"><circle cx="158" cy="82" r="5.5" fill="#9CA3AF"/>
              <rect x="157" y="70" width="2" height="24" fill="#4B5563"/><rect x="146" y="81" width="24" height="2" fill="#4B5563"/></g></g>
        </g>
      </svg>
    </div>
  );
}
