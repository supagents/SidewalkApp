export function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size decorative mark, not worth next/image's config for a single local asset */}
      <img src="/logo-mark.png" alt="" width={28} height={28} className="flex-shrink-0" />
      <div className="text-3xl font-extrabold tracking-tight">
        SIDEWALK
        <span className="inline-block align-top text-[10px] font-bold tracking-normal text-gray-400 ml-1 -translate-y-0.5">
          BETA
        </span>
      </div>
    </div>
  );
}
