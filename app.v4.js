const weekdayMap = {
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: null,
  0: null,
};

const STORAGE_KEY_DATA = 'weeklyPlanData_v4';
const STORAGE_KEY_NAME = 'weeklyPlanFileName_v4';

const motivationByHour = [
  'Neue Stunde, neuer Fokus.',
  'Du bist auf dem richtigen Weg.',
  'Klein anfangen zählt auch.',
  'Bleib ruhig und mach weiter.',
  'Ein Schritt nach dem anderen.',
  'Heute darf leicht werden.',
  'Du kannst mehr, als du denkst.',
  'Konzentriert ist besser als perfekt.',
  'Jetzt kurz sammeln und los.',
  'Du machst das richtig gut.',
  'Bleib bei dir und zieh durch.',
  'Mit Ruhe klappt es am besten.',
  'Diese Stunde gehört dir.',
  'Du darfst stolz auf dich sein.',
  'Konstanz schlägt Hektik.',
  'Weiter so, du bist drin.',
  'Ein klarer Kopf schafft viel.',
  'Du bist stärker als der Stress.',
  'Nächster Schritt, nicht alles auf einmal.',
  'Bleib dran, es lohnt sich.',
  'Heute wächst du daran.',
  'Noch ein Stück, du packst das.',
  'Ruhig bleiben und weitergehen.',
  'Gut genug ist heute großartig.'
];

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
const countdownEl = document.getElementById('countdown');
const nextChangeEl = document.getElementById('nextChange');
const activeDayEl = document.getElementById('activeDay');
const nextBlockEl = document.getElementById('nextBlock');
const firstBlockEl = document.getElementById('firstBlock');
const lastBlockEl = document.getElementById('lastBlock');
const upcomingListEl = document.getElementById('upcomingList');
const motivationTextEl = document.getElementById('motivationText');

let planData = null;
let selectedDay = getTodayGermanWeekday() || 'Montag';
let isSetupOpen = true;
daySelect.value = selectedDay;

function getTodayGermanWeekday(date = new Date()) {
  return weekdayMap[date.getDay()] || null;
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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

function parseMinutes(timeValue) {
  const asString = String(timeValue || '').trim();
  const match = asString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function toTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatCountdown(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `-${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugifyLabel(label) {
  return String(label || 'freizeit')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'freizeit';
}

function setSetupVisibility(open) {
  isSetupOpen = open;
  toggleSetupBtn.setAttribute('aria-expanded', String(open));

  if (!planData) {
    setupCard.style.display = 'block';
    toggleSetupBtn.classList.add('hidden');
    toggleSetupBtn.textContent = 'Plan ändern';
    return;
  }

  if (open) {
    setupCard.style.display = 'block';
    toggleSetupBtn.classList.remove('hidden');
    toggleSetupBtn.textContent = 'Ansicht schließen';
  } else {
    setupCard.style.display = 'none';
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
      const minutes = parseMinutes(row[0]);
      if (minutes === null) continue;

      result[day].push({
        start: minutes,
        end: minutes + 5,
        label: normalizeValue(row[colIndex + 1]),
      });
    }
  });

  return result;
}

function groupEntries(entries) {
  if (!entries || entries.length === 0) return [];

  const groups = [];
  let current = { ...entries[0] };

  for (let i = 1; i < entries.length; i += 1) {
    const entry = entries[i];
    if (entry.label === current.label && entry.start === current.end) {
      current.end = entry.end;
    } else {
      groups.push(current);
      current = { ...entry };
    }
  }

  groups.push(current);
  return groups;
}

function renderUpcomingBlocks(upcomingBlocks) {
  if (!upcomingBlocks || upcomingBlocks.length === 0) {
    upcomingListEl.innerHTML = '<div class="empty-state">Heute kommen keine weiteren Blöcke mehr.</div>';
    return;
  }

  upcomingListEl.innerHTML = upcomingBlocks.map((block, index) => {
    const safeLabel = escapeHtml(block.label);
    const toneClass = `tone-${slugifyLabel(block.label)}`;
    return `
      <div class="upcoming-item ${toneClass}">
        <div class="upcoming-index">${index + 1}</div>
        <div class="upcoming-content">
          <div class="upcoming-title">${safeLabel}</div>
          <div class="upcoming-time">${toTime(block.start)}–${toTime(block.end)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getCurrentInfo(entries, now) {
  if (!entries || entries.length === 0) return null;

  const grouped = groupEntries(entries);
  const first = grouped[0];
  const last = grouped[grouped.length - 1];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowSeconds = nowMinutes * 60 + now.getSeconds();

  if (nowMinutes < first.start) {
    return {
      currentLabel: 'Noch kein Block aktiv',
      currentRange: `Erster Block beginnt um ${toTime(first.start)}`,
      countdown: formatCountdown((first.start * 60) - nowSeconds),
      nextChange: `${toTime(first.start)}`,
      nextBlock: `Danach startet ${first.label}`,
      firstBlock: `${toTime(first.start)}–${toTime(first.end)} · ${first.label}`,
      lastBlock: `${toTime(last.start)}–${toTime(last.end)} · ${last.label}`,
      upcomingBlocks: grouped.slice(0, 5),
    };
  }

  if (nowMinutes >= last.end) {
    return {
      currentLabel: 'Tagesplan beendet',
      currentRange: `Letzter Block endete um ${toTime(last.end)}`,
      countdown: '-00:00:00',
      nextChange: 'Kein weiterer Wechsel',
      nextBlock: 'Heute kommt nichts mehr',
      firstBlock: `${toTime(first.start)}–${toTime(first.end)} · ${first.label}`,
      lastBlock: `${toTime(last.start)}–${toTime(last.end)} · ${last.label}`,
      upcomingBlocks: [],
    };
  }

  const currentIndex = grouped.findIndex((entry) => nowMinutes >= entry.start && nowMinutes < entry.end);
  if (currentIndex === -1) {
    return {
      currentLabel: 'Gerade kein aktiver Block',
      currentRange: 'Bitte Tag prüfen',
      countdown: '-00:00:00',
      nextChange: '–',
      nextBlock: '–',
      firstBlock: `${toTime(first.start)}–${toTime(first.end)} · ${first.label}`,
      lastBlock: `${toTime(last.start)}–${toTime(last.end)} · ${last.label}`,
      upcomingBlocks: [],
    };
  }

  const current = grouped[currentIndex];
  const upcomingBlocks = grouped.slice(currentIndex + 1, currentIndex + 6);
  const nextBlock = grouped[currentIndex + 1] || null;
  const secondsLeft = (current.end * 60) - nowSeconds;

  return {
    currentLabel: current.label,
    currentRange: `${toTime(current.start)}–${toTime(current.end)}`,
    countdown: formatCountdown(secondsLeft),
    nextChange: nextBlock ? `${toTime(nextBlock.start)}` : 'Kein weiterer Wechsel',
    nextBlock: nextBlock ? `Danach: ${nextBlock.label}` : 'Heute kommt nichts mehr',
    firstBlock: `${toTime(first.start)}–${toTime(first.end)} · ${first.label}`,
    lastBlock: `${toTime(last.start)}–${toTime(last.end)} · ${last.label}`,
    upcomingBlocks,
  };
}

function applyCurrentTone(label) {
  const heroCard = document.querySelector('.hero-card');
  heroCard.className = 'card hero-card accent-card';

  if (!label) return;
  heroCard.classList.add(`tone-${slugifyLabel(label)}`);
}

function updateMotivation(now = new Date()) {
  motivationTextEl.textContent = motivationByHour[now.getHours()];
}

function updateView() {
  const now = new Date();
  todayLabel.textContent = formatDate(now);
  clockEl.textContent = formatClock(now);
  updateMotivation(now);

  if (!planData) return;

  const entries = planData[selectedDay];
  activeDayEl.textContent = selectedDay;

  if (!entries || entries.length === 0) {
    currentBlockEl.textContent = 'Kein passender Tag gefunden';
    currentRangeEl.textContent = 'Bitte Tag prüfen';
    countdownEl.textContent = '–';
    nextChangeEl.textContent = '–';
    nextBlockEl.textContent = '–';
    firstBlockEl.textContent = '–';
    lastBlockEl.textContent = '–';
    renderUpcomingBlocks([]);
    applyCurrentTone('');
    return;
  }

  const info = getCurrentInfo(entries, now);
  if (!info) return;

  currentBlockEl.textContent = info.currentLabel;
  currentRangeEl.textContent = info.currentRange;
  countdownEl.textContent = info.countdown;
  nextChangeEl.textContent = info.nextChange;
  nextBlockEl.textContent = info.nextBlock;
  firstBlockEl.textContent = info.firstBlock;
  lastBlockEl.textContent = info.lastBlock;
  renderUpcomingBlocks(info.upcomingBlocks);
  applyCurrentTone(info.currentLabel);
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
  const missingDays = expectedDays.filter((day) => !headers.includes(day));

  if (headers[0] !== 'Zeit') {
    throw new Error('Die erste Spalte muss „Zeit“ heißen.');
  }

  if (missingDays.length) {
    throw new Error(`Diese Tages-Spalten fehlen: ${missingDays.join(', ')}`);
  }

  planData = buildDayEntries(rows, headers);
  localStorage.setItem(STORAGE_KEY_NAME, fileName);
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(planData));

  const autoDay = getTodayGermanWeekday();
  selectedDay = autoDay && planData[autoDay] ? autoDay : 'Montag';
  daySelect.value = selectedDay;
  statusEl.textContent = `Datei geladen: ${fileName}. Aktiver Tag: ${selectedDay}.`;
  setSetupVisibility(false);
  updateView();
}

function restoreFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (!stored) return;

    planData = JSON.parse(stored);
    const autoDay = getTodayGermanWeekday();
    selectedDay = autoDay && planData[autoDay] ? autoDay : 'Montag';
    daySelect.value = selectedDay;

    const fileName = localStorage.getItem(STORAGE_KEY_NAME) || 'gespeicherte Datei';
    statusEl.textContent = `Gespeichert geladen: ${fileName}. Aktiver Tag: ${selectedDay}.`;
    setSetupVisibility(false);
    updateView();
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem(STORAGE_KEY_NAME);
    statusEl.textContent = 'Gespeicherter Plan konnte nicht geladen werden.';
    setSetupVisibility(true);
  }
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
  if (planData) setSetupVisibility(false);
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
  if (planData) setSetupVisibility(false);
});

toggleSetupBtn.addEventListener('click', () => {
  setSetupVisibility(!isSetupOpen);
});

setSetupVisibility(true);
restoreFromStorage();
updateView();
setInterval(updateView, 1000);
