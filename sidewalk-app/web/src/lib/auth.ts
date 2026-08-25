import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function signUp(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function logIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logOut() {
  await signOut(auth);
}

// Used to gate destructive actions (deleting a campaign or canvass) behind
// re-entering the account password, even though the user is already signed
// in. This isn't just a client-side confirmation dialog: Firestore rules
// independently check request.auth.token.auth_time (which reauthentication
// updates) before allowing those deletes, so a hijacked/stolen session
// can't just skip the password prompt and delete directly through the SDK.
// The explicit getIdToken(true) forces a fresh token carrying that updated
// auth_time immediately — without it, the very next Firestore call could
// still be using the old cached token and get denied.
export async function reauthenticate(password: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Not signed in.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  await user.getIdToken(true);
}

export async function resendVerificationEmail() {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export function authErrorMessage(err: unknown): string {
  const code = (err as AuthError)?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    default:
      return "Something went wrong. Try again.";
  }
}
