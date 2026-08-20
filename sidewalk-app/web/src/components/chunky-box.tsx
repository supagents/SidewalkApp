export function ChunkyBox({
  children,
  className = "",
  rounded = "rounded-2xl",
  offset = "translate-x-1 translate-y-1",
}: {
  children: React.ReactNode;
  className?: string;
  rounded?: string;
  offset?: string;
}) {
  return (
    <div className="relative">
      <div className={`absolute inset-0 ${offset} bg-black ${rounded}`} />
      <div className={`relative bg-white border-2 border-black ${rounded} ${className}`}>{children}</div>
    </div>
  );
}
