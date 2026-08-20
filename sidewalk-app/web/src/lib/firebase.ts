import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js server-renders "use client" pages too (at build time for static
// routes, at request time for dynamic ones), so this module evaluates in
// Node as well as the browser. The Auth/Firestore client SDKs are only
// ever used from client components after mount, so skip initializing them
// outside the browser rather than crashing SSR/build on missing env vars.
const app: FirebaseApp | undefined =
  typeof window !== "undefined" ? (getApps()[0] ?? initializeApp(firebaseConfig)) : undefined;

export const auth = app ? getAuth(app) : (undefined as unknown as Auth);
export const db = app ? getFirestore(app) : (undefined as unknown as Firestore);
export default app;
