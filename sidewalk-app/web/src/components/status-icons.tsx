import type { HouseStatus } from "@/lib/types";

export const FACE_COLORS: Record<Exclude<HouseStatus, "not_home">, string> = {
  support: "#22C55E",
  undecided: "#EAB308",
  against: "#EF4444",
};

export const STATUS_LABEL: Record<HouseStatus, string> = {
  support: "Supporter",
  undecided: "Undecided",
  against: "Not supporting",
  not_home: "Not home",
};

export const STATUS_COLORS: Record<HouseStatus, string> = {
  support: "#22C55E",
  undecided: "#EAB308",
  against: "#EF4444",
  not_home: "#94A3B8",
};

export const STATUS_ORDER: HouseStatus[] = ["support", "undecided", "against", "not_home"];

export function FaceIcon({
  type,
  active,
  size = 22,
}: {
  type: "support" | "undecided" | "against";
  active: boolean;
  size?: number;
}) {
  const fill = active ? FACE_COLORS[type] : "#F3F4F6";
  const stroke = active ? "#000" : "#D1D5DB";
  const feature = active ? "#000" : "#D1D5DB";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth="2" />
      <circle cx="8.6" cy="10" r="1.15" fill={feature} />
      <circle cx="15.4" cy="10" r="1.15" fill={feature} />
      {type === "support" && (
        <path
          d="M7.6 14c1 1.4 2.6 2.2 4.4 2.2s3.4-.8 4.4-2.2"
          stroke={feature}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {type === "undecided" && (
        <line x1="8" y1="15" x2="16" y2="15" stroke={feature} strokeWidth="1.8" strokeLinecap="round" />
      )}
      {type === "against" && (
        <path
          d="M7.6 16.3c1-1.4 2.6-2.2 4.4-2.2s3.4.8 4.4 2.2"
          stroke={feature}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

export function LawnSignIcon({ active, size = 18 }: { active: boolean; size?: number }) {
  const board = active ? "#000" : "#fff";
  const line = active ? "#fff" : "#9CA3AF";
  const stroke = active ? "#000" : "#D1D5DB";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="8.5" y1="13.5" x2="8.5" y2="21.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="15.5" y1="13.5" x2="15.5" y2="21.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <rect x="2.5" y="2.5" width="19" height="11.5" rx="1.5" fill={board} stroke={stroke} strokeWidth="1.8" />
      <line x1="6" y1="8.25" x2="18" y2="8.25" stroke={line} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function NotHomeIcon({ active, size = 20 }: { active: boolean; size?: number }) {
  const fill = active ? "#000" : "#fff";
  const stroke = active ? "#000" : "#D1D5DB";
  const mark = active ? "#fff" : "#D1D5DB";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12.5 12 5l8 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="8" y1="10.5" x2="16" y2="18.5" stroke={mark} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="10.5" x2="8" y2="18.5" stroke={mark} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
