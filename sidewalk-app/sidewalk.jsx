import React, { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft, X, ChevronDown, ChevronUp, Download, Share2, Copy, Check, BarChart3, Flag, ListPlus, Upload } from 'lucide-react';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I, avoids ambiguity when read aloud
function generateShareCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const FACE_COLORS = {
  support: '#22C55E',
  undecided: '#EAB308',
  against: '#EF4444',
};

const STATUS_LABEL = {
  support: 'Supporter',
  undecided: 'Undecided',
  against: 'Not supporting',
  not_home: 'Not home',
};

const STATUS_COLORS = {
  support: '#22C55E',
  undecided: '#EAB308',
  against: '#EF4444',
  not_home: '#94A3B8',
};

const STATUS_ORDER = ['support', 'undecided', 'against', 'not_home'];

function computeStats(houses) {
  const counts = { support: 0, undecided: 0, against: 0, not_home: 0 };
  let lawnSign = 0;
  houses.forEach((h) => {
    if (h.status && counts.hasOwnProperty(h.status)) counts[h.status]++;
    if (h.lawnSign) lawnSign++;
  });
  const total = houses.length;
  const logged = STATUS_ORDER.reduce((sum, k) => sum + counts[k], 0);
  return { total, logged, counts, lawnSign };
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Custom icons (kept monochrome by default, colored only when active) ----------

function FaceIcon({ type, active, size = 22 }) {
  const fill = active ? FACE_COLORS[type] : '#F3F4F6';
  const stroke = active ? '#000' : '#D1D5DB';
  const feature = active ? '#000' : '#D1D5DB';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth="2" />
      <circle cx="8.6" cy="10" r="1.15" fill={feature} />
      <circle cx="15.4" cy="10" r="1.15" fill={feature} />
      {type === 'support' && (
        <path
          d="M7.6 14c1 1.4 2.6 2.2 4.4 2.2s3.4-.8 4.4-2.2"
          stroke={feature}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {type === 'undecided' && (
        <line x1="8" y1="15" x2="16" y2="15" stroke={feature} strokeWidth="1.8" strokeLinecap="round" />
      )}
      {type === 'against' && (
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

function LawnSignIcon({ active, size = 18 }) {
  const board = active ? '#000' : '#fff';
  const line = active ? '#fff' : '#9CA3AF';
  const stroke = active ? '#000' : '#D1D5DB';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="8.5" y1="13.5" x2="8.5" y2="21.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="15.5" y1="13.5" x2="15.5" y2="21.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <rect x="2.5" y="2.5" width="19" height="11.5" rx="1.5" fill={board} stroke={stroke} strokeWidth="1.8" />
      <line x1="6" y1="8.25" x2="18" y2="8.25" stroke={line} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function NotHomeIcon({ active, size = 20 }) {
  const fill = active ? '#000' : '#fff';
  const stroke = active ? '#000' : '#D1D5DB';
  const mark = active ? '#fff' : '#D1D5DB';
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

function StatsBar({ houses, label }) {
  const { total, logged, counts, lawnSign } = computeStats(houses);
  if (total === 0) {
    return <div className="text-xs text-gray-400 text-center py-4">No houses logged here yet.</div>;
  }
  const pct = (n) => Math.round((n / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold uppercase tracking-wide">{label}</div>
        <div className="text-xs text-gray-500">
          {total} door{total === 1 ? '' : 's'} · {logged} logged
        </div>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 border border-gray-200">
        {STATUS_ORDER.map(
          (key) =>
            counts[key] > 0 && (
              <div key={key} style={{ width: `${pct(counts[key])}%`, background: STATUS_COLORS[key] }} />
            )
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {STATUS_ORDER.map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[key] }} />
            <span className="font-bold">{counts[key]}</span>
            <span className="text-gray-500">
              {STATUS_LABEL[key]} ({pct(counts[key])}%)
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 border-black bg-white" />
          <span className="font-bold">{lawnSign}</span>
          <span className="text-gray-500">Lawn signs ({pct(lawnSign)}%)</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Layout helpers ----------

function ChunkyBox({ children, className = '', rounded = 'rounded-2xl', offset = 'translate-x-1 translate-y-1' }) {
  return (
    <div className="relative">
      <div className={`absolute inset-0 ${offset} bg-black ${rounded}`} />
      <div className={`relative bg-white border-2 border-black ${rounded} ${className}`}>{children}</div>
    </div>
  );
}

// ---------- CSV export ----------

function toCSV(canvass) {
  const rows = [['Street', 'House Number', 'Status', 'Lawn Sign', 'Follow-up', 'Notes']];
  canvass.streets.forEach((s) => {
    s.houses.forEach((h) => {
      rows.push([
        s.name,
        h.number,
        h.status ? STATUS_LABEL[h.status] : '',
        h.lawnSign ? 'Yes' : 'No',
        h.revisit ? 'Yes' : 'No',
        h.notes || '',
      ]);
    });
  });
  return rows
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

function toCSVAll(canvasses) {
  const rows = [['Canvass', 'Street', 'House Number', 'Status', 'Lawn Sign', 'Follow-up', 'Notes']];
  canvasses.forEach((c) => {
    c.streets.forEach((s) => {
      s.houses.forEach((h) => {
        rows.push([
          c.name,
          s.name,
          h.number,
          h.status ? STATUS_LABEL[h.status] : '',
          h.lawnSign ? 'Yes' : 'No',
          h.revisit ? 'Yes' : 'No',
          h.notes || '',
        ]);
      });
    });
  });
  return rows
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

function triggerDownload(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCSV(canvass) {
  const safeName = (canvass.name || 'sidewalk').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  triggerDownload(toCSV(canvass), `${safeName || 'sidewalk'}.csv`);
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [profile, setProfile] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [canvasses, setCanvasses] = useState([]);
  const [screen, setScreen] = useState('home');
  const [activeCanvass, setActiveCanvass] = useState(null);
  const [activeStreetId, setActiveStreetId] = useState(null);
  const [creatingCanvass, setCreatingCanvass] = useState(false);
  const [newCanvassName, setNewCanvassName] = useState('');
  const [addingStreet, setAddingStreet] = useState(false);
  const [newStreetName, setNewStreetName] = useState('');
  const [newHouseNumber, setNewHouseNumber] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [expandedHouseId, setExpandedHouseId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [error, setError] = useState('');
  const [exportingAll, setExportingAll] = useState(false);
  const [editingCanvassName, setEditingCanvassName] = useState(false);
  const [canvassNameDraft, setCanvassNameDraft] = useState('');
  const [editingStreetId, setEditingStreetId] = useState(null);
  const [streetNameDraft, setStreetNameDraft] = useState('');
  const [editingHouseId, setEditingHouseId] = useState(null);
  const [houseNumberDraft, setHouseNumberDraft] = useState('');
  const [authView, setAuthView] = useState('start'); // 'start' | 'join'
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [statsScope, setStatsScope] = useState('street'); // 'street' | 'canvass'
  const [showRevisitsOnly, setShowRevisitsOnly] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'house'|'street', id, label }
  const houseInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      let loadedProfile = null;
      try {
        const p = await window.storage.get('profile');
        if (p && p.value) {
          loadedProfile = JSON.parse(p.value);
          setProfile(loadedProfile);
        }
      } catch (e) {}
      try {
        const idx = await window.storage.get('canvasses-index');
        if (idx && idx.value) setCanvasses(JSON.parse(idx.value));
      } catch (e) {}
      if (loadedProfile && loadedProfile.isGuest && loadedProfile.guestCanvassId) {
        try {
          const res = await window.storage.get(`canvass:${loadedProfile.guestCanvassId}`, true);
          if (res && res.value) {
            const c = JSON.parse(res.value);
            setActiveCanvass(c);
            setActiveStreetId(c.streets[0] ? c.streets[0].id : null);
            setScreen('canvass');
          }
        } catch (e) {}
      }
      setBooting(false);
    })();
  }, []);

  const flashError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const saveProfile = async () => {
    if (!nameInput.trim()) return;
    const p = { name: nameInput.trim() };
    try {
      await window.storage.set('profile', JSON.stringify(p));
      setProfile(p);
    } catch (e) {
      flashError("Couldn't save your name. Try again.");
    }
  };

  const saveIndex = async (idx) => {
    setCanvasses(idx);
    try {
      await window.storage.set('canvasses-index', JSON.stringify(idx));
    } catch (e) {
      flashError("Couldn't save. Check your connection.");
    }
  };

  // Shareable canvasses live in shared storage (visible to anyone who joins
  // by code); private canvasses live in personal storage. Guests only ever
  // touch the shared copy.
  const saveCanvass = async (c) => {
    setActiveCanvass(c);
    const shared = !!c.shareable;
    try {
      await window.storage.set(`canvass:${c.id}`, JSON.stringify(c), shared);
    } catch (e) {
      flashError("Couldn't save. Check your connection.");
      return;
    }
    if (profile && profile.isGuest) return; // guests don't have a personal canvass index
    const doorCount = c.streets.reduce((sum, s) => sum + s.houses.length, 0);
    const idx = canvasses.map((item) =>
      item.id === c.id
        ? {
            ...item,
            name: c.name,
            streetCount: c.streets.length,
            doorCount,
            shareable: !!c.shareable,
            shareCode: c.shareCode || null,
            updatedAt: Date.now(),
          }
        : item
    );
    saveIndex(idx);
  };

  const createCanvass = async () => {
    const name = newCanvassName.trim();
    if (!name) return;
    const id = uid();
    const c = { id, name, streets: [], shareable: false, shareCode: null };
    try {
      await window.storage.set(`canvass:${id}`, JSON.stringify(c));
    } catch (e) {
      flashError("Couldn't create canvass.");
      return;
    }
    const summary = {
      id,
      name,
      streetCount: 0,
      doorCount: 0,
      shareable: false,
      shareCode: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveIndex([summary, ...canvasses]);
    setNewCanvassName('');
    setCreatingCanvass(false);
    openCanvass(id, c);
  };

  const openCanvass = async (id, preloaded, shared = false) => {
    try {
      let c = preloaded;
      if (!c) {
        const res = await window.storage.get(`canvass:${id}`, shared);
        c = res && res.value ? JSON.parse(res.value) : { id, name: '', streets: [], shareable: shared };
      }
      setActiveCanvass(c);
      setActiveStreetId(c.streets[0] ? c.streets[0].id : null);
      setExpandedHouseId(null);
      setSharePanelOpen(false);
      setScreen('canvass');
    } catch (e) {
      flashError("Couldn't open that canvass.");
    }
  };

  const toggleShareable = async () => {
    if (!activeCanvass || shareBusy) return;
    setShareBusy(true);
    try {
      if (!activeCanvass.shareable) {
        const code = generateShareCode();
        const c = { ...activeCanvass, shareable: true, shareCode: code };
        await window.storage.set(`canvass:${c.id}`, JSON.stringify(c), true);
        await window.storage.set(`sharecode:${code}`, JSON.stringify({ canvassId: c.id }), true);
        await saveCanvass(c);
      } else {
        const oldCode = activeCanvass.shareCode;
        const c = { ...activeCanvass, shareable: false, shareCode: null };
        await window.storage.set(`canvass:${c.id}`, JSON.stringify(c), false);
        try {
          await window.storage.delete(`canvass:${c.id}`, true);
        } catch (e) {}
        if (oldCode) {
          try {
            await window.storage.delete(`sharecode:${oldCode}`, true);
          } catch (e) {}
        }
        await saveCanvass(c);
      }
    } catch (e) {
      flashError("Couldn't update sharing.");
    } finally {
      setShareBusy(false);
    }
  };

  const copyShareCode = async () => {
    if (!activeCanvass || !activeCanvass.shareCode) return;
    try {
      await navigator.clipboard.writeText(activeCanvass.shareCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    } catch (e) {
      flashError('Could not copy. Long-press to copy manually.');
    }
  };

  const joinWithCode = async () => {
    const code = joinCode.trim().toUpperCase();
    const name = joinName.trim();
    if (!code || !name) return;
    try {
      const mapRes = await window.storage.get(`sharecode:${code}`, true);
      if (!mapRes || !mapRes.value) {
        flashError("That code doesn't match an active canvass.");
        return;
      }
      const { canvassId } = JSON.parse(mapRes.value);
      const canvassRes = await window.storage.get(`canvass:${canvassId}`, true);
      if (!canvassRes || !canvassRes.value) {
        flashError("That canvass isn't shared anymore.");
        return;
      }
      const c = JSON.parse(canvassRes.value);
      const p = { name, isGuest: true, guestCanvassId: canvassId };
      await window.storage.set('profile', JSON.stringify(p));
      setProfile(p);
      setActiveCanvass(c);
      setActiveStreetId(c.streets[0] ? c.streets[0].id : null);
      setScreen('canvass');
    } catch (e) {
      flashError('Could not join that canvass.');
    }
  };

  const goHome = () => {
    setScreen('home');
    setActiveCanvass(null);
    setActiveStreetId(null);
    setAddingStreet(false);
    setExpandedHouseId(null);
  };

  const logOut = async () => {
    try {
      await window.storage.delete('profile');
    } catch (e) {}
    setProfile(null);
    setScreen('home');
    setActiveCanvass(null);
    setActiveStreetId(null);
    setAuthView('start');
    setNameInput('');
    setJoinCode('');
    setJoinName('');
  };

  const addStreet = () => {
    const name = newStreetName.trim();
    if (!name || !activeCanvass) return;
    const street = { id: uid(), name, houses: [] };
    const c = { ...activeCanvass, streets: [...activeCanvass.streets, street] };
    setNewStreetName('');
    setAddingStreet(false);
    setActiveStreetId(street.id);
    saveCanvass(c);
  };

  const removeStreet = (streetId) => {
    if (!activeCanvass) return;
    const c = { ...activeCanvass, streets: activeCanvass.streets.filter((s) => s.id !== streetId) };
    if (activeStreetId === streetId) {
      setActiveStreetId(c.streets[0] ? c.streets[0].id : null);
    }
    saveCanvass(c);
  };

  // Accepts one number ("142") or many at once, comma/space/newline
  // separated or pasted straight from a list ("142, 144, 146").
  // Skips numbers already logged on this street.
  const addHouses = (raw) => {
    if (!activeCanvass || !activeStreetId) return;
    const tokens = raw
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const currentStreet = activeCanvass.streets.find((s) => s.id === activeStreetId);
    const existing = new Set((currentStreet ? currentStreet.houses : []).map((h) => h.number));
    const newHouses = [];
    tokens.forEach((number) => {
      if (!existing.has(number)) {
        existing.add(number);
        newHouses.push({ id: uid(), number, status: null, lawnSign: false, notes: '', revisit: false });
      }
    });
    if (newHouses.length === 0) {
      flashError('Those numbers are already logged on this street.');
      return;
    }

    const c = {
      ...activeCanvass,
      streets: activeCanvass.streets.map((s) =>
        s.id === activeStreetId ? { ...s, houses: [...s.houses, ...newHouses] } : s
      ),
    };
    setNewHouseNumber('');
    saveCanvass(c);
    if (newHouses.length > 1) flashError(`Added ${newHouses.length} houses.`);
    if (houseInputRef.current) houseInputRef.current.focus();
  };

  const handleHousePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (/[\s,]/.test(pasted.trim())) {
      e.preventDefault();
      addHouses(pasted);
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addHouses(String(ev.target.result || ''));
      setBulkImportOpen(false);
    };
    reader.onerror = () => flashError("Couldn't read that file.");
    reader.readAsText(file);
  };

  const updateHouse = (houseId, patch) => {
    if (!activeCanvass || !activeStreetId) return;
    const c = {
      ...activeCanvass,
      streets: activeCanvass.streets.map((s) =>
        s.id === activeStreetId
          ? { ...s, houses: s.houses.map((h) => (h.id === houseId ? { ...h, ...patch } : h)) }
          : s
      ),
    };
    saveCanvass(c);
  };

  const removeHouse = (houseId) => {
    if (!activeCanvass || !activeStreetId) return;
    const c = {
      ...activeCanvass,
      streets: activeCanvass.streets.map((s) =>
        s.id === activeStreetId ? { ...s, houses: s.houses.filter((h) => h.id !== houseId) } : s
      ),
    };
    if (expandedHouseId === houseId) setExpandedHouseId(null);
    saveCanvass(c);
  };

  const exportAll = async () => {
    if (canvasses.length === 0 || exportingAll) return;
    setExportingAll(true);
    try {
      const results = await Promise.all(
        canvasses.map(async (summary) => {
          try {
            const res = await window.storage.get(`canvass:${summary.id}`);
            return res && res.value ? JSON.parse(res.value) : { name: summary.name, streets: [] };
          } catch (e) {
            return { name: summary.name, streets: [] };
          }
        })
      );
      triggerDownload(toCSVAll(results), 'sidewalk-all-canvasses.csv');
    } catch (e) {
      flashError("Couldn't export. Try again.");
    } finally {
      setExportingAll(false);
    }
  };

  const startEditCanvassName = () => {
    if (!activeCanvass) return;
    setCanvassNameDraft(activeCanvass.name);
    setEditingCanvassName(true);
  };

  const commitCanvassName = () => {
    const name = canvassNameDraft.trim();
    setEditingCanvassName(false);
    if (!name || !activeCanvass || name === activeCanvass.name) return;
    saveCanvass({ ...activeCanvass, name });
  };

  const startEditStreet = (street) => {
    setStreetNameDraft(street.name);
    setEditingStreetId(street.id);
  };

  const commitStreetName = (streetId) => {
    const name = streetNameDraft.trim();
    setEditingStreetId(null);
    if (!name || !activeCanvass) return;
    const c = {
      ...activeCanvass,
      streets: activeCanvass.streets.map((s) => (s.id === streetId ? { ...s, name } : s)),
    };
    saveCanvass(c);
  };

  const startEditHouseNumber = (house) => {
    setHouseNumberDraft(house.number);
    setEditingHouseId(house.id);
  };

  const commitHouseNumber = (houseId) => {
    const number = houseNumberDraft.trim();
    setEditingHouseId(null);
    if (!number) return;
    updateHouse(houseId, { number });
  };

  const confirmDeleteNow = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'street') removeStreet(confirmDelete.id);
    if (confirmDelete.type === 'house') removeHouse(confirmDelete.id);
    setConfirmDelete(null);
  };

  const openNotes = (house) => {
    if (expandedHouseId === house.id) {
      setExpandedHouseId(null);
    } else {
      setExpandedHouseId(house.id);
      setNoteDraft(house.notes || '');
    }
  };

  const commitNotes = (houseId) => {
    updateHouse(houseId, { notes: noteDraft });
  };

  const shell = { fontFamily: FONT, minHeight: '100vh', background: '#FAFAFA', color: '#000' };

  if (booting) {
    return (
      <div style={shell} className="flex items-center justify-center">
        <div className="text-sm tracking-[0.2em] text-gray-400 font-semibold">LOADING</div>
      </div>
    );
  }

  // ---------- LOGIN ----------
  if (!profile) {
    return (
      <div style={shell} className="flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-black rounded-sm" />
            <div className="text-3xl font-extrabold tracking-tight">SIDEWALK</div>
          </div>
          <div className="text-sm text-gray-500 mb-9 ml-5">Doorknocking, simplified.</div>

          {authView === 'start' ? (
            <>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">
                Your name
              </label>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveProfile()}
                placeholder="Jamie Rivera"
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 mb-5"
              />
              <ChunkyBox rounded="rounded-xl">
                <button
                  onClick={saveProfile}
                  disabled={!nameInput.trim()}
                  className="w-full py-3.5 font-bold tracking-wide rounded-xl disabled:opacity-30"
                >
                  CONTINUE
                </button>
              </ChunkyBox>
              <button
                onClick={() => setAuthView('join')}
                className="w-full text-center text-sm font-semibold text-gray-500 mt-4 underline underline-offset-2"
              >
                Have a canvass code? Join instead
              </button>
              <div className="text-xs text-gray-400 mt-6 leading-relaxed">
                This just labels your data — there's no password. Everything you log stays tied to
                your account here.
              </div>
            </>
          ) : (
            <>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">
                Canvass code
              </label>
              <input
                autoFocus
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="4K7P2Q"
                maxLength={6}
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3.5 text-base tracking-[0.3em] font-bold outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 mb-4"
              />
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">
                Your name
              </label>
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinWithCode()}
                placeholder="Jamie Rivera"
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 mb-5"
              />
              <ChunkyBox rounded="rounded-xl">
                <button
                  onClick={joinWithCode}
                  disabled={!joinCode.trim() || !joinName.trim()}
                  className="w-full py-3.5 font-bold tracking-wide rounded-xl disabled:opacity-30"
                >
                  JOIN CANVASS
                </button>
              </ChunkyBox>
              <button
                onClick={() => setAuthView('start')}
                className="w-full text-center text-sm font-semibold text-gray-500 mt-4 underline underline-offset-2"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- HOME ----------
  if (screen === 'home') {
    return (
      <div style={shell} className="flex flex-col max-w-md mx-auto min-h-screen">
        <div className="px-5 pt-7 pb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black rounded-sm" />
              <div className="text-3xl font-extrabold tracking-tight">SIDEWALK</div>
            </div>
            <div className="text-xs text-gray-500 ml-5 mt-0.5">Hi {profile.name.split(' ')[0]}</div>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-shrink-0">
            {canvasses.length > 0 && (
              <button
                onClick={exportAll}
                disabled={exportingAll}
                title="Export all canvasses"
                className="p-1.5 border-2 border-black rounded-lg bg-white disabled:opacity-40"
              >
                <Download size={18} strokeWidth={2.5} />
              </button>
            )}
            <button onClick={logOut} title="Log out" className="text-xs font-semibold text-gray-500 underline underline-offset-2">
              Log out
            </button>
          </div>
        </div>

        <div className="px-5 pb-3">
          {!creatingCanvass ? (
            <ChunkyBox rounded="rounded-xl">
              <button
                onClick={() => setCreatingCanvass(true)}
                className="w-full py-3.5 font-bold tracking-wide rounded-xl flex items-center justify-center gap-2"
              >
                <Plus size={18} strokeWidth={3} /> NEW CANVASS
              </button>
            </ChunkyBox>
          ) : (
            <div className="bg-white border-2 border-black rounded-xl p-3">
              <input
                autoFocus
                value={newCanvassName}
                onChange={(e) => setNewCanvassName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCanvass()}
                placeholder="Name this canvass (e.g. Elm St loop)"
                className="w-full outline-none text-base mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={createCanvass}
                  disabled={!newCanvassName.trim()}
                  className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold disabled:opacity-30"
                >
                  START
                </button>
                <button
                  onClick={() => {
                    setCreatingCanvass(false);
                    setNewCanvassName('');
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
          {canvasses.length === 0 ? (
            <div className="text-sm text-gray-400 mt-10 text-center leading-relaxed">
              No canvasses yet.
              <br />
              Start one above and add your first street.
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {canvasses
                .slice()
                .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
                .map((c) => (
                  <button key={c.id} onClick={() => openCanvass(c.id)} className="text-left">
                    <ChunkyBox rounded="rounded-xl" offset="translate-x-1 translate-y-1">
                      <div className="px-4 py-3.5 flex items-center justify-between rounded-xl">
                        <div className="min-w-0">
                          <div className="font-bold truncate">{c.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">
                            {c.streetCount || 0} street{c.streetCount === 1 ? '' : 's'} · {c.doorCount || 0} door
                            {c.doorCount === 1 ? '' : 's'}
                          </div>
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

        {error && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ---------- CANVASS ----------
  const streets = activeCanvass ? activeCanvass.streets : [];
  const activeStreet = streets.find((s) => s.id === activeStreetId) || null;
  const totalDoors = streets.reduce((sum, s) => sum + s.houses.length, 0);

  const isGuest = !!(profile && profile.isGuest);

  return (
    <div style={shell} className="flex flex-col max-w-md mx-auto min-h-screen">
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        {!isGuest && (
          <button onClick={goHome} className="p-1.5 -ml-1.5 border-2 border-black rounded-lg bg-white">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {editingCanvassName ? (
            <input
              autoFocus
              value={canvassNameDraft}
              onChange={(e) => setCanvassNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCanvassName();
                if (e.key === 'Escape') setEditingCanvassName(false);
              }}
              onBlur={commitCanvassName}
              className="font-bold w-full outline-none border-b-2 border-black bg-transparent"
            />
          ) : (
            <button onClick={startEditCanvassName} className="font-bold truncate text-left block w-full">
              {activeCanvass.name}
            </button>
          )}
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {streets.length} street{streets.length === 1 ? '' : 's'} · {totalDoors} door{totalDoors === 1 ? '' : 's'}
          </div>
        </div>
        <button
          onClick={() => {
            setStatsPanelOpen((v) => !v);
            setSharePanelOpen(false);
          }}
          title="Results"
          className={
            'p-1.5 border-2 border-black rounded-lg flex-shrink-0 ' +
            (statsPanelOpen ? 'bg-black text-white' : 'bg-white')
          }
        >
          <BarChart3 size={18} strokeWidth={2.5} />
        </button>
        {!isGuest && (
          <button
            onClick={() => {
              setSharePanelOpen((v) => !v);
              setStatsPanelOpen(false);
            }}
            title="Share"
            className={
              'p-1.5 border-2 border-black rounded-lg flex-shrink-0 ' +
              (sharePanelOpen ? 'bg-black text-white' : 'bg-white')
            }
          >
            <Share2 size={18} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={() => downloadCSV(activeCanvass)}
          title="Export CSV"
          className="p-1.5 border-2 border-black rounded-lg bg-white flex-shrink-0"
        >
          <Download size={18} strokeWidth={2.5} />
        </button>
      </div>

      {sharePanelOpen && !isGuest && (
        <div className="mx-4 mb-3 p-3.5 border-2 border-black rounded-xl bg-white">
          {!activeCanvass.shareable ? (
            <>
              <div className="text-sm font-bold mb-1">Make this canvass shareable</div>
              <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                Anyone with the code can join and log houses straight into this same canvass — no
                account needed.
              </div>
              <button
                onClick={toggleShareable}
                disabled={shareBusy}
                className="w-full bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
              >
                {shareBusy ? 'WORKING…' : 'TURN ON SHARING'}
              </button>
            </>
          ) : (
            <>
              <div className="text-sm font-bold mb-1">Sharing is on</div>
              <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                Give volunteers this code. Everything they log lands right here.
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 border-2 border-black rounded-lg py-2.5 text-center font-extrabold text-lg tracking-[0.3em]">
                  {activeCanvass.shareCode}
                </div>
                <button
                  onClick={copyShareCode}
                  className="p-2.5 border-2 border-black rounded-lg bg-white flex-shrink-0"
                  title="Copy code"
                >
                  {codeCopied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <button
                onClick={toggleShareable}
                disabled={shareBusy}
                className="w-full border-2 border-black rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
              >
                {shareBusy ? 'WORKING…' : 'TURN OFF SHARING'}
              </button>
            </>
          )}
        </div>
      )}

      {statsPanelOpen && (
        <div className="mx-4 mb-3 p-3.5 border-2 border-black rounded-xl bg-white">
          <div className="flex border-2 border-black rounded-lg overflow-hidden mb-3.5 text-xs font-bold">
            <button
              onClick={() => setStatsScope('street')}
              className={'flex-1 py-2 ' + (statsScope === 'street' ? 'bg-black text-white' : 'bg-white')}
              disabled={!activeStreet}
            >
              THIS STREET
            </button>
            <button
              onClick={() => setStatsScope('canvass')}
              className={'flex-1 py-2 border-l-2 border-black ' + (statsScope === 'canvass' ? 'bg-black text-white' : 'bg-white')}
            >
              WHOLE CANVASS
            </button>
          </div>
          <StatsBar
            houses={statsScope === 'street' && activeStreet ? activeStreet.houses : streets.flatMap((s) => s.houses)}
            label={statsScope === 'street' && activeStreet ? activeStreet.name : activeCanvass.name}
          />
        </div>
      )}

      {/* Street chips */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto whitespace-nowrap">
        {streets.map((s) =>
          editingStreetId === s.id ? (
            <div
              key={s.id}
              className="flex-shrink-0 flex items-center gap-1 border-2 border-black rounded-full pl-3 pr-1.5 py-1 bg-white"
            >
              <input
                autoFocus
                value={streetNameDraft}
                onChange={(e) => setStreetNameDraft(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitStreetName(s.id);
                  if (e.key === 'Escape') setEditingStreetId(null);
                }}
                onBlur={() => commitStreetName(s.id)}
                className="outline-none text-sm w-28 bg-transparent font-bold"
              />
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setConfirmDelete({ type: 'street', id: s.id, label: s.name })}
                className="w-6 h-6 rounded-full text-gray-400 flex items-center justify-center flex-shrink-0"
                title="Delete street"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div key={s.id} className="relative inline-flex items-center flex-shrink-0">
              <button
                onClick={() => (activeStreetId === s.id ? startEditStreet(s) : setActiveStreetId(s.id))}
                className={
                  'px-3.5 py-2 text-sm font-bold rounded-full border-2 border-black flex items-center gap-1.5 ' +
                  (activeStreetId === s.id ? 'bg-black text-white' : 'bg-white text-black')
                }
              >
                {s.name}
                <span
                  className={
                    'text-xs font-semibold px-1.5 py-0.5 rounded-full ' +
                    (activeStreetId === s.id ? 'bg-white text-black' : 'bg-gray-100 text-gray-500')
                  }
                >
                  {s.houses.length}
                </span>
              </button>
            </div>
          )
        )}

        {!addingStreet ? (
          <button
            onClick={() => setAddingStreet(true)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-400"
          >
            <Plus size={16} />
          </button>
        ) : (
          <div className="flex-shrink-0 flex items-center gap-1 border-2 border-black rounded-full pl-3 pr-1.5 py-1 bg-white">
            <input
              autoFocus
              value={newStreetName}
              onChange={(e) => setNewStreetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addStreet();
                if (e.key === 'Escape') {
                  setAddingStreet(false);
                  setNewStreetName('');
                }
              }}
              placeholder="Street name"
              className="outline-none text-sm w-28 bg-transparent"
            />
            <button
              onClick={addStreet}
              disabled={!newStreetName.trim()}
              className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
            <button
              onClick={() => {
                setAddingStreet(false);
                setNewStreetName('');
              }}
              className="w-6 h-6 rounded-full text-gray-400 flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Houses */}
      <div className="flex-1 overflow-y-auto px-4 pb-36 pt-1">
        {!activeStreet ? (
          <div className="text-sm text-gray-400 text-center mt-10 px-6 leading-relaxed">
            Add a street above to start logging houses.
          </div>
        ) : activeStreet.houses.length === 0 ? (
          <div className="text-sm text-gray-400 text-center mt-10 px-6 leading-relaxed">
            No houses on {activeStreet.name} yet.
            <br />
            Add a house number below.
          </div>
        ) : (
          <>
            {activeStreet.houses.some((h) => h.revisit) && (
              <button
                onClick={() => setShowRevisitsOnly((v) => !v)}
                className={
                  'flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full border-2 border-black mb-2.5 ' +
                  (showRevisitsOnly ? 'bg-black text-white' : 'bg-white')
                }
              >
                <Flag size={13} strokeWidth={2.5} />
                {showRevisitsOnly ? 'SHOWING FOLLOW-UPS ONLY' : 'FILTER TO FOLLOW-UPS'}
                <span className={showRevisitsOnly ? 'text-gray-300' : 'text-gray-400'}>
                  ({activeStreet.houses.filter((h) => h.revisit).length})
                </span>
              </button>
            )}
            {(showRevisitsOnly ? activeStreet.houses.filter((h) => h.revisit) : activeStreet.houses).length ===
              0 && <div className="text-sm text-gray-400 text-center mt-8">No follow-ups flagged here.</div>}
            <div className="flex flex-col gap-2">
              {(showRevisitsOnly ? activeStreet.houses.filter((h) => h.revisit) : activeStreet.houses).map((h) => (
              <div key={h.id} className="bg-white border-2 border-black rounded-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-2.5 py-2.5">
                  {editingHouseId === h.id ? (
                    <input
                      autoFocus
                      value={houseNumberDraft}
                      onChange={(e) => setHouseNumberDraft(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitHouseNumber(h.id);
                        if (e.key === 'Escape') setEditingHouseId(null);
                      }}
                      onBlur={() => commitHouseNumber(h.id)}
                      inputMode="numeric"
                      className="w-9 h-9 flex-shrink-0 bg-gray-100 rounded-lg text-center font-extrabold text-sm outline-none border-2 border-black"
                    />
                  ) : (
                    <button
                      onClick={() => startEditHouseNumber(h)}
                      className="w-9 h-9 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center font-extrabold text-sm"
                    >
                      {h.number}
                    </button>
                  )}

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => updateHouse(h.id, { status: h.status === 'support' ? null : 'support' })}>
                      <FaceIcon type="support" active={h.status === 'support'} size={20} />
                    </button>
                    <button
                      onClick={() => updateHouse(h.id, { status: h.status === 'undecided' ? null : 'undecided' })}
                    >
                      <FaceIcon type="undecided" active={h.status === 'undecided'} size={20} />
                    </button>
                    <button onClick={() => updateHouse(h.id, { status: h.status === 'against' ? null : 'against' })}>
                      <FaceIcon type="against" active={h.status === 'against'} size={20} />
                    </button>
                    <button
                      onClick={() => updateHouse(h.id, { status: h.status === 'not_home' ? null : 'not_home' })}
                      title="Not home"
                    >
                      <NotHomeIcon active={h.status === 'not_home'} size={20} />
                    </button>
                  </div>

                  <button
                    onClick={() => updateHouse(h.id, { lawnSign: !h.lawnSign })}
                    title="Lawn sign"
                    className="flex-shrink-0 p-0.5"
                  >
                    <LawnSignIcon active={h.lawnSign} size={17} />
                  </button>

                  <button
                    onClick={() => updateHouse(h.id, { revisit: !h.revisit })}
                    title="Flag for follow-up"
                    className={'flex-shrink-0 p-0.5 ' + (h.revisit ? 'text-black' : 'text-gray-300')}
                  >
                    <Flag size={16} strokeWidth={2.5} fill={h.revisit ? '#000' : 'none'} />
                  </button>

                  <button onClick={() => openNotes(h)} className="ml-auto flex-shrink-0 p-0.5 text-gray-400">
                    {expandedHouseId === h.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </button>

                  <button
                    onClick={() => setConfirmDelete({ type: 'house', id: h.id, label: `house ${h.number}` })}
                    className="flex-shrink-0 p-0.5 text-gray-300"
                  >
                    <X size={15} />
                  </button>
                </div>

                {expandedHouseId === h.id && (
                  <div className="px-3 pb-3 pt-0.5 border-t border-gray-100">
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onBlur={() => commitNotes(h.id)}
                      placeholder="Notes — dog on porch, call back after 6pm, etc."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-black resize-none mt-2"
                    />
                  </div>
                )}
              </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add house bar */}
      {activeStreet && (
        <div className="fixed bottom-0 left-0 right-0">
          <div className="max-w-md mx-auto bg-white border-t-2 border-black px-3 pt-2.5 pb-3">
            {bulkImportOpen && (
              <div className="mb-2.5 border-2 border-black rounded-xl p-3 bg-white">
                <div className="text-xs font-bold mb-1.5">Import house numbers</div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-black rounded-lg py-2.5 font-bold text-sm mb-2.5"
                >
                  <Upload size={16} strokeWidth={2.5} /> UPLOAD A CSV OR TXT FILE
                </button>

                <div className="text-xs text-gray-400 text-center mb-2.5">or paste a list below</div>

                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder={'142\n144\n146  — or  142, 144, 146'}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-black resize-none mb-2.5"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addHouses(bulkImportText);
                      setBulkImportText('');
                      setBulkImportOpen(false);
                    }}
                    disabled={!bulkImportText.trim()}
                    className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-30"
                  >
                    ADD ALL
                  </button>
                  <button
                    onClick={() => {
                      setBulkImportOpen(false);
                      setBulkImportText('');
                    }}
                    className="px-4 py-2.5 border-2 border-black rounded-lg font-bold text-sm"
                  >
                    CANCEL
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Works with a plain list of house numbers, one per line or comma-separated — like a
                  single column exported from a spreadsheet or voter file.
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={houseInputRef}
                value={newHouseNumber}
                onChange={(e) => setNewHouseNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHouses(newHouseNumber)}
                onPaste={handleHousePaste}
                placeholder="House number"
                className="flex-1 border-2 border-black rounded-xl px-3.5 py-3 text-base outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
              />
              <button
                onClick={() => setBulkImportOpen((v) => !v)}
                title="Import a list"
                className={
                  'p-3 border-2 border-black rounded-xl flex-shrink-0 ' +
                  (bulkImportOpen ? 'bg-black text-white' : 'bg-white')
                }
              >
                <ListPlus size={20} strokeWidth={2.5} />
              </button>
              <ChunkyBox rounded="rounded-xl" offset="translate-x-1 translate-y-1">
                <button
                  onClick={() => addHouses(newHouseNumber)}
                  disabled={!newHouseNumber.trim()}
                  className="px-5 py-3 font-bold rounded-xl disabled:opacity-30"
                >
                  ADD
                </button>
              </ChunkyBox>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-50">
          <div className="bg-white border-2 border-black rounded-2xl p-5 w-full max-w-xs">
            <div className="font-bold text-base mb-1.5">
              Delete this {confirmDelete.type === 'street' ? 'street' : 'house'}?
            </div>
            <div className="text-sm text-gray-500 mb-5 leading-relaxed">
              {confirmDelete.type === 'street' ? (
                <>
                  This removes <span className="font-semibold text-black">{confirmDelete.label}</span>{' '}
                  and every house logged on it. This can't be undone.
                </>
              ) : (
                <>
                  This removes <span className="font-semibold text-black">{confirmDelete.label}</span> and
                  any notes on it. This can't be undone.
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border-2 border-black rounded-lg py-2.5 font-bold text-sm"
              >
                CANCEL
              </button>
              <button
                onClick={confirmDeleteNow}
                className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
