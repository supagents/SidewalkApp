"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
    });
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
