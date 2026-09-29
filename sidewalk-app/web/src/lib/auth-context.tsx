"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // reload()/getIdToken(true) (see verify-email-screen.tsx) mutate the SDK's
  // existing User instance in place rather than handing back a new one, so
  // the `u` that onIdTokenChanged fires with here is often the exact same
  // object reference already in `user` state, just with a field like
  // emailVerified flipped on it. setUser(u) alone would then be a no-op —
  // React bails out of re-rendering (and so never re-runs anything gated on
  // user.emailVerified, like HomeClient/useAuthGate) when the new state is
  // reference-equal to the old one. This tick forces a real state change on
  // every callback firing so that bailout can never suppress the update.
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  // onIdTokenChanged (not onAuthStateChanged) — it fires on sign-in/out
  // just like onAuthStateChanged, but ALSO whenever the current session's
  // auth token is refreshed, including an explicit forced refresh (see
  // verify-email-screen.tsx). That matters because the properties on
  // `user` here (like emailVerified) only ever update in this context via
  // a fresh callback firing — onAuthStateChanged wouldn't refire just
  // because some other code mutated auth.currentUser in place.
  useEffect(() => {
    return onIdTokenChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      forceUpdate();
    });
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
