"use client";

import { ChunkyBox } from "@/components/chunky-box";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { logOut } from "@/lib/auth";

export function SignedInHome() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center px-6 flex-1 text-center">
      <div className="mb-1">
        <Logo />
      </div>
      <div className="text-sm text-gray-500 mb-9">Doorknocking, simplified.</div>
      <div className="text-sm text-gray-500 mb-8">
        Signed in as <span className="font-semibold text-black">{user?.email}</span>
      </div>
      <ChunkyBox rounded="rounded-xl" className="w-full max-w-[200px]">
        <button
          onClick={() => logOut()}
          className="w-full py-3.5 font-bold tracking-wide rounded-xl"
        >
          LOG OUT
        </button>
      </ChunkyBox>
    </div>
  );
}
