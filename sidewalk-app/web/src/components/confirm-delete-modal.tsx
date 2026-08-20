export type ConfirmDeleteTarget = { type: "street" | "house"; id: string; label: string };

export function ConfirmDeleteModal({
  target,
  onCancel,
  onConfirm,
}: {
  target: ConfirmDeleteTarget;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-50">
      <div className="bg-white border-2 border-black rounded-2xl p-5 w-full max-w-xs">
        <div className="font-bold text-base mb-1.5">Delete this {target.type === "street" ? "street" : "house"}?</div>
        <div className="text-sm text-gray-500 mb-5 leading-relaxed">
          {target.type === "street" ? (
            <>
              This removes <span className="font-semibold text-black">{target.label}</span> and every house
              logged on it. This can&apos;t be undone.
            </>
          ) : (
            <>
              This removes <span className="font-semibold text-black">{target.label}</span> and any notes on
              it. This can&apos;t be undone.
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border-2 border-black rounded-lg py-2.5 font-bold text-sm">
            CANCEL
          </button>
          <button onClick={onConfirm} className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm">
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}
