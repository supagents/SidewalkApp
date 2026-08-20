import { doc, serverTimestamp, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateShareCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export async function turnOnSharing(campaignId: string, canvassId: string, createdBy: string): Promise<string> {
  const code = generateShareCode();
  await setDoc(doc(db, "shareCodes", code), {
    campaignId,
    canvassId,
    createdBy,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "campaigns", campaignId, "canvasses", canvassId), {
    shareable: true,
    shareCode: code,
  });
  return code;
}

export async function turnOffSharing(campaignId: string, canvassId: string, shareCode: string) {
  await deleteDoc(doc(db, "shareCodes", shareCode));
  await updateDoc(doc(db, "campaigns", campaignId, "canvasses", canvassId), {
    shareable: false,
    shareCode: null,
  });
}

const GUEST_SESSION_KEY = "sidewalk-guest-session";

export type GuestSession = { campaignId: string; canvassId: string; canvassName: string; displayName: string };

export function getStoredGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    return raw ? (JSON.parse(raw) as GuestSession) : null;
  } catch {
    return null;
  }
}

export function clearGuestSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_SESSION_KEY);
}

export async function joinCanvassByCode(code: string, displayName: string): Promise<GuestSession> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const fn = httpsCallable<{ code: string; displayName: string }, { campaignId: string; canvassId: string; canvassName: string }>(
    getFunctions(auth.app),
    "joinCanvassByCode"
  );
  const result = await fn({ code, displayName });
  const session: GuestSession = { ...result.data, displayName };
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  return session;
}
