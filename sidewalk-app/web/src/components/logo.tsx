export function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size decorative mark, not worth next/image's config for a single local asset */}
      <img src="/logo-mark.png" alt="" width={28} height={28} className="flex-shrink-0" />
      <div className="text-3xl font-extrabold tracking-tight">SIDEWALK</div>
    </div>
  );
}
