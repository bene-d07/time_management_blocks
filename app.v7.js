const weekdayMap = {
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: null,
  0: null,
};

const STORAGE_KEY_DATA = 'weeklyPlanData_v7';
const STORAGE_KEY_NAME = 'weeklyPlanFileName_v7';
const STORAGE_KEY_TASKS = 'bigTasks_v7';
const STORAGE_KEY_SETTINGS = 'viewSettings_v7';

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
const brandLabel = document.getElementById('brandLabel');
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

const taskListEl = document.getElementById('taskList');
const openTaskModalBtn = document.getElementById('openTaskModalBtn');
const taskModal = document.getElementById('taskModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const taskForm = document.getElementById('taskForm');
const taskFormStatus = document.getElementById('taskFormStatus');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDateInput = document.getElementById('taskDateInput');
const taskIdInput = document.getElementById('taskIdInput');
const deleteTaskBtn = document.getElementById('deleteTaskBtn');
const taskModalEyebrow = document.getElementById('taskModalEyebrow');
const taskModalTitle = document.getElementById('taskModalTitle');
const saveTaskBtn = document.getElementById('saveTaskBtn');

const openSettingsBtn = document.getElementById('openSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const settingsForm = document.getElementById('settingsForm');
const titlePrefixInput = document.getElementById('titlePrefixInput');
const settingsStatus = document.getElementById('settingsStatus');

let planData = null;
let selectedDay = getTodayGermanWeekday() || 'Montag';
let isSetupOpen = true;
let bigTasks = [];
let openModalName = null;
let settings = {
  titlePrefix: 'Mag‘s',
  theme: 'pink',
};

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

function getDisplayTitle() {
  const prefix = String(settings.titlePrefix || 'Mag‘s').trim() || 'Mag‘s';
  return `${prefix} Zeitplan`;
}

function applySettingsToUi() {
  document.documentElement.setAttribute('data-theme', settings.theme || 'pink');
  const title = getDisplayTitle();
  brandLabel.textContent = title;
  document.title = title;
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

function normalizeTaskDateToMidnight(dateString) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function daysUntil(dateString) {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = normalizeTaskDateToMidnight(dateString);
  const diffMs = target.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / 86400000);
}

function formatTaskCountdown(dateString) {
  const diffDays = daysUntil(dateString);
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Noch 1 Tag';
  if (diffDays > 1) return `Noch ${diffDays} Tage`;
  if (diffDays === -1) return 'Seit 1 Tag vorbei';
  return `Seit ${Math.abs(diffDays)} Tagen vorbei`;
}

function sortTasks(list) {
  return [...list].sort((a, b) => {
    const diff = normalizeTaskDateToMidnight(a.date) - normalizeTaskDateToMidnight(b.date);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title, 'de');
  });
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(bigTasks));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

function renderTasks() {
  const sortedTasks = sortTasks(bigTasks);

  if (!sortedTasks.length) {
    taskListEl.innerHTML = '<div class="empty-state">Noch keine Big Tasks angelegt.</div>';
    return;
  }

  taskListEl.innerHTML = sortedTasks.map((task) => {
    const safeTitle = escapeHtml(task.title);
    const safeDate = escapeHtml(task.date);
    const diffDays = daysUntil(task.date);
    const badgeClass = diffDays < 0 ? 'task-badge overdue' : diffDays === 0 ? 'task-badge today' : 'task-badge';
    const prettyDate = new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(normalizeTaskDateToMidnight(task.date));

    return `
      <article class="task-item">
        <div class="task-item-main">
          <div class="task-title-row">
            <h3 class="task-title">${safeTitle}</h3>
          </div>
          <div class="task-meta">
            <span class="task-date">${prettyDate}</span>
          </div>
        </div>
        <div class="task-side">
          <div class="${badgeClass}" data-date="${safeDate}">
            <span class="task-badge-label">Verbleibend</span>
            <strong>${escapeHtml(formatTaskCountdown(task.date))}</strong>
          </div>
          <div class="task-actions">
            <button class="mini-action-btn" type="button" data-action="edit-task" data-id="${escapeHtml(task.id)}">Bearbeiten</button>
            <button class="mini-action-btn danger-outline" type="button" data-action="delete-task" data-id="${escapeHtml(task.id)}">Löschen</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function resetTaskForm() {
  taskForm.reset();
  taskIdInput.value = '';
  taskFormStatus.textContent = '\u00A0';
  taskModalEyebrow.textContent = 'Neue Big Task';
  taskModalTitle.textContent = 'Was steht an?';
  saveTaskBtn.textContent = 'Speichern';
  deleteTaskBtn.classList.add('hidden');
}

function openModal(name) {
  openModalName = name;
  modalBackdrop.classList.remove('hidden');
  document.body.classList.add('modal-open');

  taskModal.classList.toggle('hidden', name !== 'task');
  settingsModal.classList.toggle('hidden', name !== 'settings');
}

function closeModals() {
  openModalName = null;
  modalBackdrop.classList.add('hidden');
  taskModal.classList.add('hidden');
  settingsModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function openTaskModal(task = null) {
  resetTaskForm();
  if (task) {
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDateInput.value = task.date;
    taskModalEyebrow.textContent = 'Big Task bearbeiten';
    taskModalTitle.textContent = 'Task anpassen';
    saveTaskBtn.textContent = 'Änderungen speichern';
    deleteTaskBtn.classList.remove('hidden');
  }
  openModal('task');
  setTimeout(() => taskTitleInput.focus(), 10);
}

function openSettingsModal() {
  titlePrefixInput.value = settings.titlePrefix || 'Mag‘s';
  const themeInput = settingsForm.querySelector(`input[name="theme"][value="${settings.theme}"]`);
  if (themeInput) themeInput.checked = true;
  settingsStatus.textContent = '\u00A0';
  openModal('settings');
  setTimeout(() => titlePrefixInput.focus(), 10);
}

function restoreTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!raw) {
      bigTasks = [];
      renderTasks();
      return;
    }

    const parsed = JSON.parse(raw);
    bigTasks = Array.isArray(parsed)
      ? parsed.filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.date === 'string')
      : [];

    renderTasks();
  } catch (error) {
    bigTasks = [];
    localStorage.removeItem(STORAGE_KEY_TASKS);
    renderTasks();
  }
}

function restoreSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      applySettingsToUi();
      return;
    }

    const parsed = JSON.parse(raw);
    settings = {
      titlePrefix: typeof parsed.titlePrefix === 'string' && parsed.titlePrefix.trim() ? parsed.titlePrefix.trim() : 'Mag‘s',
      theme: ['pink', 'blue', 'violet', 'mint'].includes(parsed.theme) ? parsed.theme : 'pink',
    };
  } catch (error) {
    settings = { titlePrefix: 'Mag‘s', theme: 'pink' };
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  }
  applySettingsToUi();
}

function updateView() {
  const now = new Date();
  todayLabel.textContent = formatDate(now);
  clockEl.textContent = formatClock(now);
  updateMotivation(now);
  renderTasks();

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

openTaskModalBtn.addEventListener('click', () => openTaskModal(null));
closeTaskModalBtn.addEventListener('click', closeModals);
cancelTaskBtn.addEventListener('click', closeModals);
openSettingsBtn.addEventListener('click', openSettingsModal);
closeSettingsModalBtn.addEventListener('click', closeModals);
cancelSettingsBtn.addEventListener('click', closeModals);
modalBackdrop.addEventListener('click', closeModals);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openModalName) {
    closeModals();
  }
});

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const id = taskIdInput.value.trim();
  const title = taskTitleInput.value.trim();
  const date = taskDateInput.value;

  if (!title) {
    taskFormStatus.textContent = 'Bitte einen Titel eingeben.';
    return;
  }

  if (!date) {
    taskFormStatus.textContent = 'Bitte ein Datum auswählen.';
    return;
  }

  if (id) {
    const taskIndex = bigTasks.findIndex((task) => task.id === id);
    if (taskIndex !== -1) {
      bigTasks[taskIndex] = { ...bigTasks[taskIndex], title, date };
    }
  } else {
    bigTasks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`,
      title,
      date,
    });
  }

  saveTasks();
  renderTasks();
  closeModals();
});

deleteTaskBtn.addEventListener('click', () => {
  const id = taskIdInput.value.trim();
  if (!id) return;
  bigTasks = bigTasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
  closeModals();
});

taskListEl.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.dataset.id;
  const task = bigTasks.find((entry) => entry.id === id);
  if (!task) return;

  if (button.dataset.action === 'edit-task') {
    openTaskModal(task);
    return;
  }

  if (button.dataset.action === 'delete-task') {
    bigTasks = bigTasks.filter((entry) => entry.id !== id);
    saveTasks();
    renderTasks();
  }
});

settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const prefix = titlePrefixInput.value.trim() || 'Mag‘s';
  const checkedTheme = settingsForm.querySelector('input[name="theme"]:checked');

  settings = {
    titlePrefix: prefix,
    theme: checkedTheme ? checkedTheme.value : 'pink',
  };

  saveSettings();
  applySettingsToUi();
  settingsStatus.textContent = 'Gespeichert.';
  closeModals();
});

setSetupVisibility(true);
restoreSettings();
restoreTasks();
restoreFromStorage();
updateView();
setInterval(updateView, 1000);
