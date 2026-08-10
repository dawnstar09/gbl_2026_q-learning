// 튜토리얼 전용 소형 라인 아이콘 (LogoMark와 같은 잉크 컬러 사용)

const INK = "#0d0d14";

export function IconDilemma({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="30" cy="40" r="20" />
        <circle cx="90" cy="40" r="20" />
        <path d="M30 65 L30 82" />
        <path d="M90 65 L90 82" />
      </g>
      <g fill="#2f9e5f">
        <path d="M20 40 C22 36, 27 36, 30 40 L34 34 C38 30, 44 30, 46 36 C48 42, 42 46, 38 48 L30 56 L22 48 C18 44, 18 42, 20 40 Z" />
      </g>
      <g fill="#7c3aed">
        <circle cx="90" cy="34" r="7" />
        <path d="M80 54 C80 46, 100 46, 100 54 Z" />
      </g>
    </svg>
  );
}

export function IconPersonalityToAgent({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="14" width="42" height="56" rx="6" />
        <path d="M18 28 h22" />
        <path d="M18 40 h22" />
        <path d="M18 52 h14" />
        <path d="M58 42 h20" />
        <path d="M70 34 l10 8 -10 8" />
        <circle cx="108" cy="42" r="26" />
        <path d="M96 42 h24 M108 30 v24" opacity="0" />
      </g>
      <g stroke="#3b5bdb" strokeWidth="4" strokeLinecap="round">
        <path d="M96 48 c2 -10 10 -16 20 -14" />
        <path d="M120 42 c-2 10 -10 16 -20 14" />
        <path d="M100 34 c4 -6 12 -8 18 -4" />
      </g>
      <circle cx="108" cy="42" r="3.5" fill="#7c3aed" />
    </svg>
  );
}

export function IconSteps({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="16" width="34" height="46" rx="5" />
        <path d="M14 28 h18 M14 38 h18 M14 48 h11" />
        <path d="M50 40 h14" />
        <circle cx="88" cy="40" r="22" />
        <path d="M120 40 h14" />
        <rect x="140" y="14" width="14" height="50" opacity="0" />
      </g>
      <g stroke="#3b5bdb" strokeWidth="4.5" strokeLinecap="round">
        <path d="M78 40 a10 10 0 1 1 6 9" />
        <path d="M78 40 l0 -6 M78 40 l-5 3" />
      </g>
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M134 62 v-30 l14 8 M134 46 h20" />
        <path d="M134 62 h26" />
      </g>
      <g fill="#2f9e5f">
        <rect x="140" y="50" width="4" height="12" />
      </g>
      <g fill="#7c3aed">
        <rect x="147" y="42" width="4" height="20" />
      </g>
      <g fill="#3b5bdb">
        <rect x="154" y="34" width="4" height="28" />
      </g>
    </svg>
  );
}
