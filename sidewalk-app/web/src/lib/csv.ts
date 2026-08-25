import { STATUS_LABEL } from "@/components/status-icons";
import type { CanvassExport, HouseStatus } from "@/lib/types";

export type ExportCategory = { key: string; label: string; statuses: HouseStatus[] | null };

export const EXPORT_CATEGORIES: ExportCategory[] = [
  { key: "all", label: "All data", statuses: null },
  { key: "support", label: "Supporters", statuses: ["support"] },
  { key: "undecided", label: "Undecided", statuses: ["undecided"] },
  { key: "against", label: "Not supporting", statuses: ["against"] },
  { key: "not_home", label: "Not home", statuses: ["not_home"] },
];

// Spreadsheet apps (Excel, Sheets) treat a cell starting with one of these
// characters as a formula, not text, when a CSV is opened — regardless of
// our own quoting, which only escapes commas/quotes, not what the
// receiving app does with the content once unquoted. Street names, house
// numbers, and especially notes (freely typed by any team member or
// guest, or pulled straight from an imported voter file) all end up in
// exported cells, so any of them could carry something like
// =HYPERLINK("http://evil.com") that runs the moment the file is opened.
// Prefixing with a leading quote (the standard OWASP-recommended
// mitigation) forces it to stay literal text.
const CSV_FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function csvSafeField(value: unknown): string {
  const str = String(value);
  return CSV_FORMULA_TRIGGER.test(str) ? `'${str}` : str;
}

function filterByStatus(canvass: CanvassExport, statuses: HouseStatus[] | null): CanvassExport {
  if (!statuses) return canvass;
  const allowed = new Set(statuses);
  return {
    name: canvass.name,
    streets: canvass.streets
      .map((s) => ({ name: s.name, houses: s.houses.filter((h) => h.status && allowed.has(h.status)) }))
      .filter((s) => s.houses.length > 0),
  };
}

function toCSV(canvass: CanvassExport): string {
  const rows: string[][] = [["Street", "House Number", "Status", "Lawn Sign", "Follow-up", "Notes"]];
  canvass.streets.forEach((s) => {
    s.houses.forEach((h) => {
      rows.push([
        s.name,
        h.number,
        h.status ? STATUS_LABEL[h.status] : "",
        h.lawnSign ? "Yes" : "No",
        h.revisit ? "Yes" : "No",
        h.notes || "",
      ]);
    });
  });
  return rows.map((row) => row.map((field) => `"${csvSafeField(field).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

function toCSVAll(canvasses: CanvassExport[]): string {
  const rows: string[][] = [["Canvass", "Street", "House Number", "Status", "Lawn Sign", "Follow-up", "Notes"]];
  canvasses.forEach((c) => {
    c.streets.forEach((s) => {
      s.houses.forEach((h) => {
        rows.push([
          c.name,
          s.name,
          h.number,
          h.status ? STATUS_LABEL[h.status] : "",
          h.lawnSign ? "Yes" : "No",
          h.revisit ? "Yes" : "No",
          h.notes || "",
        ]);
      });
    });
  });
  return rows.map((row) => row.map((field) => `"${csvSafeField(field).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCanvassCSV(canvass: CanvassExport, category: ExportCategory = EXPORT_CATEGORIES[0]) {
  const safeName = (canvass.name || "sidewalk").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const suffix = category.key === "all" ? "" : `-${category.key.replace(/_/g, "-")}`;
  triggerDownload(toCSV(filterByStatus(canvass, category.statuses)), `${safeName || "sidewalk"}${suffix}.csv`);
}

export function downloadAllCSV(canvasses: CanvassExport[]) {
  triggerDownload(toCSVAll(canvasses), "sidewalk-all-canvasses.csv");
}
