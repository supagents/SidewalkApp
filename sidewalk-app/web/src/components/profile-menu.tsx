"use client";

import { useEffect, useRef, useState } from "react";
import { logOut } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";

function initials(profile: UserProfile | null, email: string | null | undefined): string {
  if (profile?.firstName) {
    return (profile.firstName[0] + (profile.lastName?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export function ProfileMenu({ profile, email }: { profile: UserProfile | null; email: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  const fullName = profile?.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : null;

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Account"
        className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-bold text-sm flex-shrink-0"
      >
        {initials(profile, email)}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[2000] bg-white border-2 border-black rounded-xl overflow-hidden w-56 shadow-sm">
          <div className="px-3.5 py-3 border-b border-gray-200">
            <div className="font-bold text-sm truncate">{fullName || email}</div>
            {fullName && <div className="text-xs text-gray-500 truncate mt-0.5">{email}</div>}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              logOut();
            }}
            className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-gray-600"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
