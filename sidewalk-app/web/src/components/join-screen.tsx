"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { ChunkyBox } from "@/components/chunky-box";
import { Logo } from "@/components/logo";
import { Toast } from "@/components/toast";
import { joinCanvassByCode } from "@/lib/share";

const inputClass =
  "w-full bg-white border-2 border-black rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 mb-5";
const labelClass = "block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold";

export function JoinScreen({ onBack }: { onBack: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const submit = async () => {
    if (!code.trim() || !name.trim()) return;
    setBusy(true);
    try {
      await joinCanvassByCode(code.trim(), name.trim());
      // onAuthStateChanged picks up the new anonymous session; page.tsx
      // routes to the guest canvass automatically once it fires.
    } catch (err) {
      const message =
        err instanceof FirebaseError && err.code === "functions/not-found"
          ? "That code doesn't match an active canvass."
          : err instanceof FirebaseError && err.code === "functions/failed-precondition"
            ? "That canvass isn't shared anymore."
            : "Couldn't join. Check the code and try again.";
      flashError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 flex-1">
      <div className="w-full max-w-sm">
        <div className="mb-1">
          <Logo />
        </div>
        <div className="text-sm text-gray-500 mb-9 ml-5">Doorknocking, simplified.</div>

        <label className={labelClass}>Canvass code</label>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="4K7P2Q"
          maxLength={6}
          className={inputClass.replace("mb-5", "mb-4") + " tracking-[0.3em] font-bold"}
        />

        <label className={labelClass}>Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Jamie Rivera"
          className={inputClass}
        />

        <ChunkyBox rounded="rounded-xl">
          <button
            onClick={submit}
            disabled={busy || !code.trim() || !name.trim()}
            className="w-full py-3.5 font-bold tracking-wide rounded-xl disabled:opacity-30"
          >
            {busy ? "..." : "JOIN CANVASS"}
          </button>
        </ChunkyBox>

        <button
          onClick={onBack}
          className="w-full text-center text-sm font-semibold text-gray-500 mt-4 underline underline-offset-2"
        >
          Back
        </button>
      </div>
      <Toast message={error} />
    </div>
  );
}
