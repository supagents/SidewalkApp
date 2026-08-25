import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

function profileRef(uid: string) {
  return doc(db, "profiles", uid);
}

export type NewProfileData = {
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  organization: string;
  role: string;
};

export async function createProfile(uid: string, data: NewProfileData) {
  await setDoc(profileRef(uid), { ...data, createdAt: serverTimestamp() });
}

// Live, not a one-time read: the dashboard header (campaign-screen.tsx)
// showing "Hi {firstName}" mounts right as the signup flow's own profile
// write is landing, so a plain getDoc could easily race it and show the
// email fallback on first paint. A subscription just catches up the
// moment the write commits, no timing coordination needed.
export function subscribeProfile(uid: string, cb: (profile: UserProfile | null) => void) {
  return onSnapshot(profileRef(uid), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const data = snap.data();
    cb({
      uid: snap.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      phone: data.phone ?? "",
      birthday: data.birthday ?? "",
      organization: data.organization ?? "",
      role: data.role ?? "",
      createdAt: data.createdAt?.toMillis?.() ?? 0,
    });
  });
}
