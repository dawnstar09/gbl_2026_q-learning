export function LogoMark({ size = 180 }: { size?: number }) {
  const h = (size * 310) / 340;
  return (
    <svg width={size} height={h} viewBox="0 0 340 310" xmlns="http://www.w3.org/2000/svg">
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

      <g stroke="#0d0d14" strokeWidth="9" fill="#ffffff" strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M70 300 C74 240, 110 200, 150 196 L180 226 L210 196
             C250 200, 286 240, 290 300 Z"
        />
      </g>

      {/* 왼쪽 말풍선: 협력 (악수) */}
      <g>
        <path
          d="M12 55 h108 a16 16 0 0 1 16 16 v46 a16 16 0 0 1 -16 16 h-46 l-20 22 v-22 h-42
             a16 16 0 0 1 -16 -16 v-46 a16 16 0 0 1 16 -16 z"
          fill="#12162a"
        />
        <g fill="#f3f4fb" stroke="none">
          <rect x="20" y="93" width="46" height="20" rx="10" transform="rotate(-18 43 103)" />
          <rect x="74" y="93" width="46" height="20" rx="10" transform="rotate(18 97 103)" />
          <circle cx="70" cy="103" r="13" />
        </g>
        <g stroke="#f3f4fb" strokeWidth="4" strokeLinecap="round">
          <path d="M22 64 L31 72" />
          <path d="M18 78 L29 78" />
          <path d="M25 91 L34 87" />
        </g>
      </g>

      {/* 오른쪽 말풍선: 배신 (손가락질) */}
      <g>
        <path
          d="M348 55 h-108 a16 16 0 0 0 -16 16 v46 a16 16 0 0 0 16 16 h46 l20 22 v-22 h42
             a16 16 0 0 0 16 -16 v-46 a16 16 0 0 0 -16 -16 z"
          fill="#12162a"
        />
        <g fill="#f3f4fb" stroke="none">
          <circle cx="316" cy="87" r="14" />
          <path d="M296 128 C296 108, 336 108, 336 128 Z" />
          <path
            d="M260 104 h30 c5 0 5 8 0 8 h6 c5 0 5 8 0 8 h-6 c4 0 4 7 0 7
             h-30 c-6 0 -10 -6 -10 -11.5 c0 -5.5 4 -11.5 10 -11.5 Z"
          />
        </g>
        <g stroke="#f3f4fb" strokeWidth="4" strokeLinecap="round">
          <path d="M252 92 L242 86" />
          <path d="M250 104 L239 104" />
        </g>
      </g>
    </svg>
  );
}
