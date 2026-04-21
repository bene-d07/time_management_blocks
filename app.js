const weekdayMap = {
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: null,
  0: null,
};

const fileInput = document.getElementById('fileInput');
const daySelect = document.getElementById('daySelect');
const useTodayBtn = document.getElementById('useTodayBtn');
const toggleSetupBtn = document.getElementById('toggleSetupBtn');
const setupCard = document.getElementById('setupCard');
const todayLabel = document.getElementById('todayLabel');
const clockEl = document.getElementById('clock');
const statusEl = document.getElementById('status');
const currentBlockEl = document.getElementById('currentBlock');
const currentRangeEl = document.getElementById('currentRange');
const nextChangeEl = document.getElementById('nextChange');
const activeDayEl = document.getElementById('activeDay');
const nextBlockEl = document.getElementById('nextBlock');
const firstBlockEl = document.getElementById('firstBlock');
const lastBlockEl = document.getElementById('lastBlock');

let planData = null;
let selectedDay = getTodayGermanWeekday() || 'Montag';
let isSetupOpen = true;
daySelect.value = selectedDay;

function getTodayGermanWeekday(date = new Date()) {
  return weekdayMap[date.getDay()] || null;
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(date);
}

function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(date);
}

function normalizeValue(value) {
  if (value === null || value === undefined) return 'Freizeit';
  const cleaned = String(value).trim();
  return cleaned === '' ? 'Freizeit' : cleaned;
}

function normalizeHeader(value) {
  return String(value || '').trim();
}

function parseMinutes(timeString) {
  const match = String(timeString || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function toTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function setSetupVisibility(open) {
  isSetupOpen = open;

  if (!planData) {
    setupCard.classList.remove('collapsed');
    toggleSetupBtn.classList.add('hidden');
    toggleSetupBtn.textContent = 'Plan ändern';
    return;
  }

  if (open) {
    setupCard.classList.remove('collapsed');
    toggleSetupBtn.classList.remove('hidden');
    toggleSetupBtn.textContent = 'Ansicht schließen';
  } else {
    setupCard.classList.add('collapsed');
    toggleSetupBtn.classList.remove('hidden');
    toggleSetupBtn.textContent = 'Plan ändern';
  }
}

function buildDayEntries(rows, headers) {
  const result = {};
  headers.slice(1).forEach((dayName, colIndex) => {
    const day = normalizeHeader(dayName);
    result[day] = [];
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const time = row[0];
      const minutes = parseMinutes(time);
      if (minutes === null) continue;
      const rawValue = row[colIndex + 1];
      result[day].push({
        start: minutes,
        end: minutes + 5,
        label: normalizeValue(rawValue),
      });
    }
  });
  return result;
}

function getCurrentInfo(entries, nowMinutes) {
  if (!entries || entries.length === 0) return null;

  const first = entries[0];
  const last = entries[entries.length - 1];

  if (nowMinutes < first.start) {
    return {
      currentLabel: 'Noch kein Block aktiv',
      currentRange: `Erster Block beginnt um ${toTime(first.start)}`,
      nextChange: `${toTime(first.start)} → ${first.label}`,
      nextBlock: first.label,
      firstBlock: `${toTime(first.start)} → ${first.label}`,
      lastBlock: `${toTime(last.start)}–${toTime(last.end)} → ${last.label}`,
    };
  }

  if (nowMinutes >= last.end) {
    return {
      currentLabel: 'Tagesplan beendet',
      currentRange: `Letzter Block endete um ${toTime(last.end)}`,
      nextChange: 'Heute kein weiterer Wechsel',
      nextBlock: 'Keiner',
      firstBlock: `${toTime(first.start)} → ${first.label}`,
      lastBlock: `${toTime(last.start)}–${toTime(last.end)} → ${last.label}`,
    };
  }

  const current = entries.find(entry => nowMinutes >= entry.start && nowMinutes < entry.end);
  if (!current) return null;

  let nextDifferent = null;
  for (const entry of entries) {
    if (entry.start >= current.end && entry.label !== current.label) {
      nextDifferent = entry;
      break;
    }
  }

  let blockEnd = current.end;
  for (const entry of entries) {
    if (entry.start === blockEnd && entry.label === current.label) {
      blockEnd = entry.end;
    }
  }

  return {
    currentLabel: current.label,
    currentRange: `${toTime(current.start)}–${toTime(blockEnd)}`,
    nextChange: nextDifferent ? `${toTime(nextDifferent.start)} → ${nextDifferent.label}` : 'Heute kein weiterer Wechsel',
    nextBlock: nextDifferent ? nextDifferent.label : 'Keiner',
    firstBlock: `${toTime(first.start)} → ${first.label}`,
    lastBlock: `${toTime(last.start)}–${toTime(last.end)} → ${last.label}`,
  };
}

function updateView() {
  const now = new Date();
  todayLabel.textContent = formatDate(now);
  clockEl.textContent = formatClock(now);

  if (!planData) return;

  const day = selectedDay;
  const entries = planData[day];
  activeDayEl.textContent = day;

  if (!entries) {
    currentBlockEl.textContent = 'Kein passender Tag gefunden';
    currentRangeEl.textContent = 'Bitte Tag prüfen';
    nextChangeEl.textContent = '–';
    nextBlockEl.textContent = '–';
    firstBlockEl.textContent = '–';
    lastBlockEl.textContent = '–';
    return;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const info = getCurrentInfo(entries, nowMinutes);
  if (!info) return;

  currentBlockEl.textContent = info.currentLabel;
  currentRangeEl.textContent = info.currentRange;
  nextChangeEl.textContent = info.nextChange;
  nextBlockEl.textContent = info.nextBlock;
  firstBlockEl.textContent = info.firstBlock;
  lastBlockEl.textContent = info.lastBlock;
}

function parseWorkbook(arrayBuffer, fileName) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  if (!rows.length || rows[0].length < 2) {
    throw new Error('Die Tabelle ist leer oder hat nicht genug Spalten.');
  }

  const headers = rows[0].map(normalizeHeader);
  const expectedDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  const missingDays = expectedDays.filter(day => !headers.includes(day));
  if (headers[0] !== 'Zeit') {
    throw new Error('Die erste Spalte muss "Zeit" heißen.');
  }
  if (missingDays.length) {
    throw new Error(`Diese Tages-Spalten fehlen: ${missingDays.join(', ')}`);
  }

  planData = buildDayEntries(rows, headers);
  localStorage.setItem('weeklyPlanFileName', fileName);
  localStorage.setItem('weeklyPlanData', JSON.stringify(planData));

  const autoDay = getTodayGermanWeekday();
  if (autoDay && planData[autoDay]) {
    selectedDay = autoDay;
  } else {
    selectedDay = 'Montag';
  }
  daySelect.value = selectedDay;

  statusEl.textContent = `Datei geladen: ${fileName}. Aktiver Tag: ${selectedDay}.`;
  setSetupVisibility(false);
  updateView();
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const buffer = await file.arrayBuffer();
    parseWorkbook(buffer, file.name);
  } catch (error) {
    statusEl.textContent = `Fehler: ${error.message}`;
    setSetupVisibility(true);
  }
});

daySelect.addEventListener('change', (event) => {
  selectedDay = event.target.value;
  statusEl.textContent = `Manuell auf ${selectedDay} gesetzt.`;
  updateView();

  if (planData) {
    setSetupVisibility(false);
  }
});

useTodayBtn.addEventListener('click', () => {
  const autoDay = getTodayGermanWeekday();
  if (!autoDay) {
    statusEl.textContent = 'Heute ist Wochenende. Bitte einen Wochentag manuell auswählen.';
    return;
  }
  selectedDay = autoDay;
  daySelect.value = selectedDay;
  statusEl.textContent = `Automatisch auf ${selectedDay} gesetzt.`;
  updateView();

  if (planData) {
    setSetupVisibility(false);
  }
});

toggleSetupBtn.addEventListener('click', () => {
  setSetupVisibility(!isSetupOpen);
});

(function initFromStorage() {
  const saved = localStorage.getItem('weeklyPlanData');
  const savedName = localStorage.getItem('weeklyPlanFileName');
  if (saved) {
    try {
      planData = JSON.parse(saved);
      statusEl.textContent = `Zuletzt geladene Datei aktiv: ${savedName || 'Unbekannt'}.`;
      const autoDay = getTodayGermanWeekday();
      if (autoDay && planData[autoDay]) {
        selectedDay = autoDay;
      }
      daySelect.value = selectedDay;
      setSetupVisibility(false);
    } catch {
      localStorage.removeItem('weeklyPlanData');
      localStorage.removeItem('weeklyPlanFileName');
      setSetupVisibility(true);
    }
  } else {
    setSetupVisibility(true);
  }
})();

updateView();
setInterval(updateView, 1000);
