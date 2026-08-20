import { STATUS_LABEL } from "@/components/status-icons";
import type { CanvassExport } from "@/lib/types";

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
  return rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\r\n");
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
  return rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\r\n");
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

export function downloadCanvassCSV(canvass: CanvassExport) {
  const safeName = (canvass.name || "sidewalk").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  triggerDownload(toCSV(canvass), `${safeName || "sidewalk"}.csv`);
}

export function downloadAllCSV(canvasses: CanvassExport[]) {
  triggerDownload(toCSVAll(canvasses), "sidewalk-all-canvasses.csv");
}
