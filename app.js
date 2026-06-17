(() => {
  const RACE_DATE = new Date('2026-07-26T00:00:00');
  const STORAGE_KEY = 'trainplan_done';
  const TOTAL_SESSIONS = 18;

  const TYPE_LABELS = { f: 'Facile', q: 'Qualité', l: 'Longue', r: 'Course' };
  const DAY_FULL = { 'Mar': 'Mardi', 'Jeu': 'Jeudi', 'Sam': 'Samedi', 'Dim': 'Dimanche', 'Ven': 'Vendredi', 'Lun': 'Lundi', 'Mer': 'Mercredi' };

  const DAY_MAP = { 0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam' };

  const WEEK_STARTS = [
    new Date('2026-06-16'),
    new Date('2026-06-23'),
    new Date('2026-06-30'),
    new Date('2026-07-07'),
    new Date('2026-07-14'),
    new Date('2026-07-21'),
  ];

  const BRAVO_MESSAGES = [
    '🎉 Bravo, séance bouclée !',
    '💪 Bien joué !',
    '🔥 En feu !',
    '⭐ Une de plus au compteur !',
    '🏃‍♀️ Inarrêtable !',
    '✨ Tu gères !',
    '👏 Comme une pro !',
    '🚀 Encore plus proche du but !',
  ];

  const MOTIVATIONS = [
    'Chaque pas te rapproche de la ligne d\'arrivée.',
    'La régularité bat toujours l\'intensité.',
    'Tu ne le regretteras jamais après une sortie.',
    'Les jours difficiles te rendent plus forte.',
    'Fais confiance à ton plan, les résultats suivront.',
    'Le corps réalise ce que l\'esprit croit.',
    'Une séance à la fois. Tu gères.',
    'La course se gagne à l\'entraînement.',
    'Chaque kilomètre compte. Continue.',
    'Tu es plus forte que tu ne le penses.'
  ];

  let selectedWeekId = null;

  function randomBravo() {
    return BRAVO_MESSAGES[Math.floor(Math.random() * BRAVO_MESSAGES.length)];
  }

  function spawnConfetti(card) {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    card.appendChild(container);
    const colors = ['#E8458B', '#F06292', '#F48FB1', '#FFB74D', '#CE93D8', '#81D4FA'];
    for (let i = 0; i < 12; i++) {
      const dot = document.createElement('div');
      dot.className = 'confetti';
      const angle = (i / 12) * 360;
      const dist = 40 + Math.random() * 30;
      const x = Math.cos(angle * Math.PI / 180) * dist;
      const y = Math.sin(angle * Math.PI / 180) * dist;
      dot.style.setProperty('--confetti-end', `translate(${x}px, ${y}px)`);
      dot.style.background = colors[i % colors.length];
      dot.style.animationDelay = (Math.random() * 0.15) + 's';
      container.appendChild(dot);
    }
    setTimeout(() => container.remove(), 900);
  }

  // ── State ──
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ── Greeting ──
  function updateGreeting() {
    const h = new Date().getHours();
    let text;
    if (h < 6) text = 'Bonne nuit';
    else if (h < 12) text = 'Bonjour';
    else if (h < 18) text = 'Bon après-midi';
    else text = 'Bonsoir';
    document.getElementById('greeting').textContent = text;
  }

  // ── Motivation ──
  function showMotivation() {
    const el = document.getElementById('motivation');
    const today = new Date();
    const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % MOTIVATIONS.length;
    el.textContent = '« ' + MOTIVATIONS[idx] + ' »';
  }

  // ── Countdown ──
  function updateCountdown() {
    const now = new Date();
    const diff = RACE_DATE - now;
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    document.getElementById('countdown').textContent = days;
  }

  // ── Progress ──
  function updateProgress(state) {
    const done = Object.keys(state).filter(k => state[k]).length;
    document.getElementById('progress-count').textContent = done;
    document.getElementById('progress-fill').style.width =
      (done / TOTAL_SESSIONS * 100) + '%';
  }

  // ── Current week ──
  function getCurrentWeekId() {
    const now = new Date();
    let current = 1;
    for (let i = WEEK_STARTS.length - 1; i >= 0; i--) {
      if (now >= WEEK_STARTS[i]) { current = i + 1; break; }
    }
    return current;
  }

  // ── Today's session ──
  function getTodaySession() {
    const now = new Date();
    const todayDay = DAY_MAP[now.getDay()];
    const weekId = getCurrentWeekId();
    const week = PLAN.find(w => w.id === weekId);
    if (!week) return null;
    const session = week.sessions.find(s => s.day === todayDay);
    return session ? { session, week } : null;
  }

  // ── Build a session card ──
  function buildCard(session, isRaceSession) {
    const state = loadState();
    const isDone = !!state[session.id];

    const card = document.createElement('div');
    card.className = 'session-card' +
      (isDone ? ' done' : '') +
      (isRaceSession ? ' race-session' : '');

    card.innerHTML = `
      <div class="session-day-header">
        <span class="session-day-name">${DAY_FULL[session.day] || session.day}</span>
        <span class="badge badge-${session.type}">${TYPE_LABELS[session.type]}</span>
        <span class="session-details">${session.dur} · ${session.dist}</span>
      </div>
      <div class="session-title">${session.title}</div>
      <div class="pace-block">${session.pace}</div>
      <div class="session-desc">${session.desc}</div>
      <label class="session-check">
        <input type="checkbox" data-id="${session.id}" ${isDone ? 'checked' : ''}>
        <div class="check-btn">${isDone ? '✓  Fait !' : 'Marquer comme fait'}</div>
      </label>
      <div class="done-banner">${isDone ? randomBravo() : ''}</div>
    `;

    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      const s = loadState();
      if (checkbox.checked) { s[session.id] = true; }
      else { delete s[session.id]; }
      saveState(s);

      card.classList.toggle('done', checkbox.checked);
      card.querySelector('.check-btn').textContent =
        checkbox.checked ? '✓  Fait !' : 'Marquer comme fait';

      const banner = card.querySelector('.done-banner');
      if (checkbox.checked) {
        banner.textContent = randomBravo();
        card.classList.add('celebrate');
        spawnConfetti(card);
        setTimeout(() => card.classList.remove('celebrate'), 700);
      } else {
        banner.textContent = '';
      }

      updateProgress(loadState());
      // Refresh week picker counters if visible
      renderWeekPicker();
    });

    return card;
  }

  // ── Tab: Aujourd'hui ──
  function renderToday() {
    const container = document.getElementById('tab-today');
    container.innerHTML = '';

    const result = getTodaySession();

    if (result) {
      const { session, week } = result;
      const header = document.createElement('div');
      header.className = 'today-header';
      header.innerHTML = `<span class="today-week">${week.label}</span><span class="today-theme">${week.theme}</span>`;
      container.appendChild(header);
      container.appendChild(buildCard(session, session.type === 'r'));
    } else {
      const rest = document.createElement('div');
      rest.className = 'rest-day';
      rest.innerHTML = `
        <div class="rest-emoji">😴</div>
        <div class="rest-title">Jour de repos</div>
        <div class="rest-desc">Pas de séance prévue aujourd'hui. Profite pour récupérer !</div>
      `;
      container.appendChild(rest);
    }
  }

  // ── Tab: Programme — week picker ──
  function renderWeekPicker() {
    const picker = document.getElementById('week-picker');
    const state = loadState();
    picker.innerHTML = '';

    PLAN.forEach(week => {
      const btn = document.createElement('button');
      const doneCount = week.sessions.filter(s => state[s.id]).length;
      const allDone = doneCount === week.sessions.length;
      const isCurrent = week.id === getCurrentWeekId();
      const isSelected = week.id === selectedWeekId;
      const isRace = !!week.race;

      btn.className = 'week-pill' +
        (isSelected ? ' selected' : '') +
        (isCurrent ? ' current' : '') +
        (allDone ? ' complete' : '') +
        (isRace ? ' race' : '');

      btn.innerHTML = `
        <span class="pill-label">${isRace ? '🏁' : 'S' + week.id}</span>
        <span class="pill-count">${allDone ? '✓' : doneCount + '/' + week.sessions.length}</span>
      `;

      btn.addEventListener('click', () => {
        selectedWeekId = week.id;
        renderWeekPicker();
        renderWeekSessions();
      });

      picker.appendChild(btn);
    });
  }

  // ── Tab: Programme — sessions list ──
  function renderWeekSessions() {
    const container = document.getElementById('week-sessions');
    container.innerHTML = '';

    const week = PLAN.find(w => w.id === selectedWeekId);
    if (!week) return;

    const header = document.createElement('div');
    header.className = 'programme-header';
    header.innerHTML = `
      <div class="programme-title">${week.label} — ${week.theme}</div>
      <div class="programme-dates">${week.dates}</div>
    `;
    container.appendChild(header);

    week.sessions.forEach(session => {
      container.appendChild(buildCard(session, session.type === 'r'));
    });
  }

  // ── Tabs ──
  function setupTabs() {
    const btns = document.querySelectorAll('.segment-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

        if (btn.dataset.tab === 'today') renderToday();
        if (btn.dataset.tab === 'programme') {
          renderWeekPicker();
          renderWeekSessions();
        }
      });
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    updateCountdown();
    showMotivation();
    selectedWeekId = getCurrentWeekId();
    updateProgress(loadState());
    setupTabs();
    renderToday();
  });
})();
