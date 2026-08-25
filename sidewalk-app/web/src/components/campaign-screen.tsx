"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ChunkyBox } from "@/components/chunky-box";
import { Logo } from "@/components/logo";
import { Toast } from "@/components/toast";
import { createCampaign, subscribeCampaigns } from "@/lib/campaign";
import { logOut } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { subscribeProfile } from "@/lib/profile";
import type { Campaign, UserProfile } from "@/lib/types";

export function CampaignScreen({ onOpenCampaign }: { onOpenCampaign: (id: string) => void }) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    return subscribeCampaigns(user.uid, setCampaigns);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeProfile(user.uid, setProfile);
  }, [user]);

  // Accounts created before this feature shipped (or anyone whose
  // profile write is still in flight) won't have a firstName yet —
  // fall back to email rather than showing a blank greeting.
  const greetingName = profile?.firstName || user?.email;

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !user || saving) return;
    setSaving(true);
    try {
      const id = await createCampaign(user.uid, name);
      setNewName("");
      setCreating(false);
      onOpenCampaign(id);
    } catch {
      flashError("Couldn't create campaign. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
      <div className="px-5 pt-7 pb-5 flex items-start justify-between">
        <div>
          <Logo />
          <div className="text-xs text-gray-500 ml-5 mt-0.5">Hi {greetingName}</div>
        </div>
        <button
          onClick={() => logOut()}
          title="Log out"
          className="text-xs font-semibold text-gray-500 underline underline-offset-2 mt-1 flex-shrink-0"
        >
          Log out
        </button>
      </div>

      <div className="px-5 pb-3">
        {!creating ? (
          <ChunkyBox rounded="rounded-xl">
            <button
              onClick={() => setCreating(true)}
              className="w-full py-3.5 font-bold tracking-wide rounded-xl flex items-center justify-center gap-2"
            >
              <Plus size={18} strokeWidth={3} /> NEW CAMPAIGN
            </button>
          </ChunkyBox>
        ) : (
          <div className="bg-white border-2 border-black rounded-xl p-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Name this campaign (e.g. Jordan for City Council)"
              className="w-full outline-none text-base mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
                className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold disabled:opacity-30"
              >
                START
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
                className="px-4 py-2.5 border-2 border-black rounded-lg font-bold"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-5 pb-8">
        {campaigns === null ? (
          <div className="text-sm text-gray-400 mt-10 text-center">Loading…</div>
        ) : campaigns.length === 0 ? (
          <div className="text-sm text-gray-400 mt-10 text-center leading-relaxed">
            No campaigns yet.
            <br />
            Start one above to begin canvassing.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campaigns.map((c) => (
              <button key={c.id} onClick={() => onOpenCampaign(c.id)} className="text-left">
                <ChunkyBox rounded="rounded-xl" offset="translate-x-1 translate-y-1">
                  <div className="px-4 py-3.5 flex items-center justify-between rounded-xl">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{c.name}</div>
                    </div>
                    <div className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 ml-3">
                      ›
                    </div>
                  </div>
                </ChunkyBox>
              </button>
            ))}
          </div>
        )}
      </div>
      <Toast message={error} />
    </div>
  );
}
