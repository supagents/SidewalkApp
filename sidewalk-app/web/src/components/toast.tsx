export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    // z-[2000]: same reasoning as ConfirmDeleteModal — must beat Leaflet's own z-index range.
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-lg max-w-[90vw] text-center z-[2000]">
      {message}
    </div>
  );
}
