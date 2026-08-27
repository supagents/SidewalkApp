// Parses a structured voter-list CSV (first_name, last_name, house_number,
// street, city, state, phone, email — column order and case don't matter,
// only house_number and street are required) into houses grouped by street
// and sorted by house number, ready for canvass-data.ts's importVoterList
// to write. Deliberately separate from lib/csv.ts, which only ever
// generates CSVs (export), never parses them.

export type ImportedHouseRow = {
  number: string;
  city: string;
  state: string;
  notes: string;
};

export type ParsedStreetGroup = { name: string; houses: ImportedHouseRow[] };

export type ParsedImport = {
  streets: ParsedStreetGroup[];
  skippedRows: number;
  totalRows: number;
};

// Minimal RFC4180 parser: handles quoted fields, embedded commas/newlines,
// and "" as an escaped quote. Good enough for spreadsheet-exported CSVs
// without pulling in a dependency for it.
function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ",") {
      row.push(field);
      field = "";
      i++;
    } else if (c === "\r") {
      i++;
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else {
      field += c;
      i++;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

const HEADER_ALIASES: Record<string, string[]> = {
  first_name: ["first_name", "firstname", "first"],
  last_name: ["last_name", "lastname", "last"],
  house_number: ["house_number", "housenumber", "number", "house_no", "address_number"],
  street: ["street", "street_name", "address_street"],
  city: ["city"],
  state: ["state"],
  phone: ["phone", "phone_number", "cell", "telephone"],
  email: ["email", "email_address"],
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function matchColumns(headerRow: string[]): Record<string, number> {
  const normalized = headerRow.map(normalizeHeader);
  const map: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx !== -1) map[key] = idx;
  }
  return map;
}

// Sorts "142" before "88" (numeric), and "150A" reasonably near "150".
function numericSortKey(num: string): [number, string] {
  const match = num.match(/^\d+/);
  return [match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER, num];
}

export function parseVoterListCSV(text: string): ParsedImport {
  const rows = parseCSVRows(text);
  if (rows.length === 0) return { streets: [], skippedRows: 0, totalRows: 0 };

  const cols = matchColumns(rows[0]);
  const dataRows = rows.slice(1);

  if (cols.house_number === undefined || cols.street === undefined) {
    throw new Error(
      'Needs at least a "house_number" and a "street" column. (first_name, last_name, phone, email, city, state are optional.)'
    );
  }

  const get = (row: string[], key: string) => (cols[key] !== undefined ? (row[cols[key]] ?? "").trim() : "");

  const byStreetKey = new Map<string, ImportedHouseRow[]>();
  const displayNames = new Map<string, string>();
  let skippedRows = 0;

  dataRows.forEach((row) => {
    const number = get(row, "house_number");
    const streetName = get(row, "street");
    if (!number || !streetName) {
      skippedRows++;
      return;
    }
    const key = streetName.toLowerCase();
    if (!displayNames.has(key)) displayNames.set(key, streetName);

    const name = [get(row, "first_name"), get(row, "last_name")].filter(Boolean).join(" ");
    const notes = [name, get(row, "phone"), get(row, "email")].filter(Boolean).join(" · ");

    const list = byStreetKey.get(key) ?? [];
    list.push({ number, city: get(row, "city"), state: get(row, "state"), notes });
    byStreetKey.set(key, list);
  });

  const streets = Array.from(byStreetKey.entries())
    .map(([key, houses]) => ({
      name: displayNames.get(key) as string,
      houses: houses.sort((a, b) => {
        const [an, as] = numericSortKey(a.number);
        const [bn, bs] = numericSortKey(b.number);
        return an - bn || as.localeCompare(bs);
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { streets, skippedRows, totalRows: dataRows.length };
}
