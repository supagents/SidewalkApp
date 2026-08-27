"use client";

import { useState } from "react";
import { ChunkyBox } from "@/components/chunky-box";
import { Logo } from "@/components/logo";
import { Toast } from "@/components/toast";
import { JoinScreen } from "@/components/join-screen";
import { authErrorMessage, logIn, signUp } from "@/lib/auth";

const inputClass =
  "w-full bg-white border-2 border-black rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 mb-5";
const labelClass = "block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold";

const ROLE_OPTIONS = ["Candidate", "Campaign Manager", "Volunteer Coordinator", "Volunteer", "Other"];

// Self-attested, like age gates on virtually every consumer platform — there's
// no ID-verification step here, just a hard block on the birthdate the person
// themselves entered. Computed by calendar date (not just year subtraction) so
// someone whose 18th birthday hasn't happened yet this year is still blocked.
function isAtLeast18(birthday: string): boolean {
  const dob = new Date(birthday);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 18;
}

function eighteenYearsAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function AuthScreen({
  initialMode = "login",
  initialScreen = "auth",
  onBack,
}: {
  initialMode?: "login" | "signup";
  initialScreen?: "auth" | "join";
  onBack?: () => void;
}) {
  const [screen, setScreen] = useState<"auth" | "join">(initialScreen);
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    setAgreedToTerms(false);
  };

  const signupReady =
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    birthday &&
    organization.trim() &&
    role &&
    confirmPassword &&
    agreedToTerms;

  const submit = async () => {
    if (!email.trim() || !password) return;
    if (mode === "signup") {
      if (!signupReady) return;
      if (password !== confirmPassword) {
        flashError("Passwords don't match.");
        return;
      }
      if (!isStrongPassword(password)) {
        flashError("Password must be 8+ characters with a number and a symbol.");
        return;
      }
      if (!isAtLeast18(birthday)) {
        flashError("You must be 18 or older to create an account.");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          birthday,
          organization: organization.trim(),
          role,
        });
      } else {
        await logIn(email.trim(), password);
      }
    } catch (err) {
      flashError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (screen === "join") {
    return <JoinScreen onBack={() => setScreen("auth")} />;
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 flex-1">
      {/* max-w-sm keeps the phone layout exactly as it was — one column,
          full-width fields. md:max-w-2xl only kicks in on wider screens,
          giving the paired-up fields below room to sit side by side
          instead of stretching one field across the whole viewport. */}
      <div className="w-full max-w-sm md:max-w-2xl">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-400 underline underline-offset-2 mb-5 ml-5"
          >
            ‹ Back to home
          </button>
        )}
        <div className="mb-1">
          <Logo />
        </div>
        <div className="text-sm text-gray-500 mb-9 ml-5">Doorknocking, simplified.</div>

        {mode === "signup" && (
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <label className={labelClass}>First name</label>
              <input
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Jamie"
                className={inputClass}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className={labelClass}>Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Rivera"
                className={inputClass}
              />
            </div>
          </div>
        )}

        <label className={labelClass}>Email</label>
        <input
          autoFocus={mode === "login"}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="jamie@example.com"
          className={inputClass}
        />

        {mode === "signup" && (
          <>
            {/* Stacked on mobile (matches every other field there), paired
                side by side from md: up — that's the "computer" layout
                fix: these used to run one-per-row all the way down a wide
                screen for no reason. */}
            <div className="flex flex-col md:flex-row gap-0 md:gap-3">
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="(555) 123-4567"
                  className={inputClass}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  max={eighteenYearsAgo()}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-0 md:gap-3">
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Organization / campaign name</label>
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Rivera for City Council"
                  className={inputClass}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className={labelClass}>Your role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass + " appearance-none"}
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {mode === "signup" ? (
          <div className="flex flex-col md:flex-row gap-0 md:gap-3">
            <div className="flex-1 min-w-0">
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="8+ chars, 1 number, 1 symbol"
                className={inputClass}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className={labelClass}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className={inputClass}
            />
          </>
        )}

        {mode === "signup" && (
          <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-[18px] h-[18px] flex-shrink-0 accent-black border-2 border-black rounded cursor-pointer"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to Sidewalk&rsquo;s{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="underline underline-offset-2 font-semibold text-gray-700"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="underline underline-offset-2 font-semibold text-gray-700"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
        )}

        <ChunkyBox rounded="rounded-xl">
          <button
            onClick={submit}
            disabled={
              busy ||
              !email.trim() ||
              !password ||
              (mode === "signup" && !signupReady)
            }
            className="w-full py-3.5 font-bold tracking-wide rounded-xl disabled:opacity-30"
          >
            {busy ? "..." : mode === "signup" ? "SIGN UP" : "LOG IN"}
          </button>
        </ChunkyBox>

        <button
          onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
          className="w-full text-center text-sm font-semibold text-gray-500 mt-4 underline underline-offset-2"
        >
          {mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>

        {mode === "signup" && (
          <div className="text-xs text-gray-400 mt-6 leading-relaxed">
            We&apos;ll send a verification link to your email — you&apos;ll need to confirm it before
            you can start canvassing.
          </div>
        )}

        <button
          onClick={() => setScreen("join")}
          className="w-full text-center text-sm text-gray-400 mt-6 underline underline-offset-2"
        >
          Have a canvass code? Join instead
        </button>
      </div>
      <Toast message={error} />
    </div>
  );
}
