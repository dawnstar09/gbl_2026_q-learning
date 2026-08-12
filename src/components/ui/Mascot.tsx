// 타이틀 로고(public/logo.png)에서 얼굴 부분만 잘라낸 실제 이미지 기반 아바타
export function MascotAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-full border border-border-soft bg-white overflow-hidden shadow-sm"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/avatar.png" alt="" className="w-full h-full object-cover" />
    </div>
  );
}
