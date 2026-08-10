// 타이틀 화면의 LogoMark와 동일한 얼굴 데이터를 재사용한 소형 아바타
export function Mascot({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="98 36 164 164"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g stroke="#0d0d14" strokeWidth="9" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx="180" cy="120" rx="92" ry="15" fill="#ffffff" />
        <path
          d="M120 118 C118 78, 138 48, 180 48 C222 48, 242 78, 240 118
             C240 118, 210 108, 180 112 C150 108, 120 118, 120 118 Z"
          fill="#ffffff"
        />
        <path d="M126 106 C150 100, 210 100, 234 106" strokeWidth="7" />
      </g>
      <g fill="#0d0d14" stroke="none">
        <rect x="126" y="128" width="108" height="24" rx="12" />
      </g>
      <g fill="#0d0d14" stroke="none">
        <path
          d="M180 158 C172 150, 158 148, 148 154 C138 160, 134 172, 140 180
             C144 186, 152 186, 156 181 C150 181, 146 176, 148 170
             C150 163, 160 159, 170 162 C175 163, 178 161, 180 158 Z"
        />
        <path
          d="M180 158 C188 150, 202 148, 212 154 C222 160, 226 172, 220 180
             C216 186, 208 186, 204 181 C210 181, 214 176, 212 170
             C210 163, 200 159, 190 162 C185 163, 182 161, 180 158 Z"
        />
      </g>
    </svg>
  );
}

export function MascotAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-full border border-border-soft bg-white flex items-center justify-center shadow-sm overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Mascot size={size * 1.35} />
    </div>
  );
}
