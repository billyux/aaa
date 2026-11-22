'use strict';

// ---------- 레벨 설정 ----------
const LEVELS = [
  { count: 6, digits: 2, hint: true },
  { count: 8, digits: 2, hint: true },
  { count: 8, digits: 3, hint: true },
  { count: 10, digits: 3, hint: true },
  { count: 12, digits: 3, hint: false },
  { count: 12, digits: 4, hint: true },
  { count: 14, digits: 4, hint: false },
];
const MAX_LIVES = 3;
const PLACE_NAMES = ['1의 자리', '10의 자리', '100의 자리', '1000의 자리', '10000의 자리'];

function levelConfig(i) {
  if (i < LEVELS.length) return LEVELS[i];
  const extra = i - LEVELS.length;
  return { count: Math.min(14 + extra, 20), digits: 5, hint: false };
}

// ---------- 상태 ----------
const state = {
  level: 0,
  pass: 0,
  queue: [],
  buckets: [],
  score: 0,
  levelStartScore: 0,
  combo: 0,
  maxCombo: 0,
  lives: MAX_LIVES,
  mistakes: 0,
  phase: 'distribute', // distribute | collect | over
  busy: false,
  startTime: 0,
};

const $ = (id) => document.getElementById(id);
const el = {
  level: $('level'), score: $('score'), combo: $('combo'), best: $('best'), lives: $('lives'),
  passList: $('passList'), instruction: $('instruction'), queue: $('queue'), queueCount: $('queueCount'),
  buckets: $('buckets'), collectBtn: $('collectBtn'), restartBtn: $('restartBtn'),
  overlay: $('overlay'), modalTitle: $('modalTitle'), modalBody: $('modalBody'), modalBtn: $('modalBtn'),
};

// ---------- 저장 ----------
function loadBest() {
  try { return Number(localStorage.getItem('radix-best')) || 0; } catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('radix-best', String(v)); } catch { /* 무시 */ }
}
let best = loadBest();

// ---------- 유틸 ----------
const digitOf = (n, p) => Math.floor(n / 10 ** p) % 10;
const cfg = () => levelConfig(state.level);

function makeNumbers(count, digits) {
  const max = 10 ** digits;
  const min = 10 ** (digits - 1);
  const set = new Set();
  // 최고 자리가 0이 아닌 숫자를 하나 이상 보장
  set.add(min + Math.floor(Math.random() * (max - min)));
  while (set.size < count) set.add(Math.floor(Math.random() * max));
  const arr = [...set];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- 레벨 진행 ----------
function startLevel(levelIndex) {
  state.level = levelIndex;
  const { count, digits } = cfg();
  state.pass = 0;
  state.queue = makeNumbers(count, digits);
  state.buckets = Array.from({ length: 10 }, () => []);
  state.combo = 0;
  state.maxCombo = 0;
  state.lives = MAX_LIVES;
  state.mistakes = 0;
  state.phase = 'distribute';
  state.busy = false;
  state.levelStartScore = state.score;
  state.startTime = performance.now();
  buildBuckets();
  render({ enterQueue: true });
}

function place(b) {
  if (state.phase !== 'distribute' || state.busy || !state.queue.length) return;
  const n = state.queue[0];
  const bucketEl = el.buckets.children[b];

  if (digitOf(n, state.pass) === b) {
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.score += 10 * Math.min(state.combo, 5);
    state.busy = true;
    flash(bucketEl, 'good');
    flyCard(el.queue.querySelector('.card.current'), bucketEl.querySelector('.stack'), () => {
      state.queue.shift();
      state.buckets[b].push(n);
      if (!state.queue.length) state.phase = 'collect';
      state.busy = false;
      render();
    });
    updateStats();
  } else {
    state.combo = 0;
    state.lives--;
    state.mistakes++;
    flash(bucketEl, 'bad');
    shake(bucketEl);
    shake(el.queue.querySelector('.card.current'));
    updateStats();
    if (state.lives <= 0) {
      state.phase = 'over';
      setTimeout(showFail, 450);
    } else {
      el.instruction.innerHTML =
        `틀렸어요! <b>${pad(n)}</b>의 ${PLACE_NAMES[state.pass]} 숫자는 <b>${digitOf(n, state.pass)}</b>입니다.`;
    }
  }
}

function collect() {
  if (state.phase !== 'collect' || state.busy) return;
  // 0번 버킷부터 순서대로, 각 버킷은 먼저 들어온 카드부터 (FIFO)
  state.queue = state.buckets.flat();
  state.buckets = Array.from({ length: 10 }, () => []);
  state.pass++;
  if (state.pass >= cfg().digits) {
    state.phase = 'over';
    render({ enterQueue: true });
    setTimeout(showClear, 500);
  } else {
    state.phase = 'distribute';
    render({ enterQueue: true });
  }
}

// ---------- 렌더링 ----------
function pad(n) { return String(n).padStart(cfg().digits, '0'); }

function cardHTML(n, isCurrent) {
  const { digits, hint } = cfg();
  const s = pad(n);
  const leading = digits - String(n).length;
  let html = '';
  for (let i = 0; i < digits; i++) {
    const place = digits - 1 - i; // 오른쪽부터 0
    const cls = ['d'];
    if (i < leading) cls.push('pad');
    if (state.phase !== 'over') {
      if (place < state.pass) cls.push('done');
      if (place === state.pass && (hint || isCurrent)) cls.push('active');
    }
    html += `<span class="${cls.join(' ')}">${s[i]}</span>`;
  }
  return html;
}

function buildBuckets() {
  el.buckets.innerHTML = '';
  for (let b = 0; b < 10; b++) {
    const btn = document.createElement('button');
    btn.className = 'bucket';
    btn.type = 'button';
    btn.setAttribute('aria-label', `${b}번 버킷`);
    btn.innerHTML = `<span class="num">${b}</span><div class="stack"></div>`;
    btn.addEventListener('click', () => place(b));
    el.buckets.appendChild(btn);
  }
}

function render({ enterQueue = false } = {}) {
  const { digits } = cfg();

  // 단계 표시
  el.passList.innerHTML = '';
  for (let p = 0; p < digits; p++) {
    const li = document.createElement('li');
    li.textContent = PLACE_NAMES[p];
    if (p < state.pass) li.className = 'finished';
    else if (p === state.pass && state.phase !== 'over') li.className = 'current';
    el.passList.appendChild(li);
  }

  // 안내 문구
  if (state.phase === 'distribute') {
    el.instruction.innerHTML = `<b>${PLACE_NAMES[state.pass]}</b> 숫자를 보고 카드를 버킷에 넣으세요.`;
  } else if (state.phase === 'collect') {
    el.instruction.innerHTML = `모두 넣었어요! 0번 버킷부터 순서대로 <b>모아서</b> 다음 자리로 넘어가세요.`;
  } else {
    el.instruction.innerHTML = '';
  }

  // 대기열
  el.queue.innerHTML = '';
  if (!state.queue.length) {
    el.queue.innerHTML = '<span class="empty-note">대기열이 비었습니다.</span>';
  }
  state.queue.forEach((n, i) => {
    const c = document.createElement('div');
    const isCurrent = i === 0 && state.phase === 'distribute';
    c.className = 'card' + (isCurrent ? ' current' : '') + (enterQueue ? ' enter' : '');
    if (enterQueue) c.style.animationDelay = `${i * 35}ms`;
    c.innerHTML = cardHTML(n, isCurrent);
    el.queue.appendChild(c);
  });
  el.queueCount.textContent = `${state.queue.length}장 남음`;

  // 버킷
  state.buckets.forEach((items, b) => {
    const stack = el.buckets.children[b].querySelector('.stack');
    stack.innerHTML = items.map((n) => `<div class="mini">${pad(n)}</div>`).join('');
  });

  // 버튼
  const canCollect = state.phase === 'collect';
  el.collectBtn.disabled = !canCollect;
  el.collectBtn.classList.toggle('pulse', canCollect);

  updateStats();
}

function updateStats() {
  el.level.textContent = state.level + 1;
  el.score.textContent = state.score;
  el.combo.textContent = state.combo;
  el.best.textContent = Math.max(best, state.score);
  el.lives.textContent = '♥'.repeat(Math.max(state.lives, 0)) + '♡'.repeat(MAX_LIVES - Math.max(state.lives, 0));
}

// ---------- 효과 ----------
function flash(node, cls) {
  node.classList.remove('good', 'bad');
  void node.offsetWidth;
  node.classList.add(cls);
  setTimeout(() => node.classList.remove(cls), 260);
}

function shake(node) {
  if (!node) return;
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
  node.addEventListener('animationend', () => node.classList.remove('shake'), { once: true });
}

function flyCard(cardEl, targetEl, done) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!cardEl || !targetEl || reduce || !cardEl.animate) { done(); return; }
  const from = cardEl.getBoundingClientRect();
  const to = targetEl.getBoundingClientRect();
  const clone = cardEl.cloneNode(true);
  clone.classList.add('fly');
  clone.classList.remove('current');
  Object.assign(clone.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px` });
  document.body.appendChild(clone);
  cardEl.style.visibility = 'hidden';
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.bottom - (from.top + from.height / 2);
  const anim = clone.animate(
    [
      { transform: 'translate(0,0) scale(1.1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(.45)`, opacity: .6 },
    ],
    { duration: 260, easing: 'cubic-bezier(.3,.7,.3,1)' }
  );
  anim.onfinish = () => { clone.remove(); done(); };
}

// ---------- 모달 ----------
let modalAction = null;
function showModal(title, bodyHTML, btnText, action) {
  el.modalTitle.textContent = title;
  el.modalBody.innerHTML = bodyHTML;
  el.modalBtn.textContent = btnText;
  modalAction = action;
  el.overlay.hidden = false;
  el.modalBtn.focus();
}
function closeModal() {
  el.overlay.hidden = true;
  const a = modalAction;
  modalAction = null;
  if (a) a();
}

function showIntro() {
  showModal(
    '기수정렬 버킷 퍼즐',
    `<p>기수정렬(LSD)은 <b>가장 낮은 자리부터</b> 숫자를 버킷에 나눠 담고, 0번 버킷부터 다시 모으는 걸 반복해서 정렬합니다.</p>
     <ol>
       <li>맨 앞 카드의 <b>현재 자리 숫자</b>와 같은 버킷을 누르세요.</li>
       <li>카드를 모두 넣으면 <b>버킷 모으기</b>로 0→9 순서로 모읍니다.</li>
       <li>모든 자리를 끝내면 정렬 완성!</li>
     </ol>
     <p class="muted">틀리면 목숨이 줄어요. 연속으로 맞히면 콤보 점수가 올라갑니다.</p>`,
    '시작하기',
    () => startLevel(0)
  );
}

function showClear() {
  const secs = Math.round((performance.now() - state.startTime) / 1000);
  const { count, digits } = cfg();
  const par = count * digits * 2;
  const timeBonus = Math.max(0, par - secs) * 5;
  const lifeBonus = state.lives * 50;
  const perfect = state.mistakes === 0 ? 100 : 0;
  state.score += timeBonus + lifeBonus + perfect;
  if (state.score > best) { best = state.score; saveBest(best); }
  updateStats();
  const sorted = state.queue.map(pad).join(' ');
  showModal(
    `레벨 ${state.level + 1} 클리어!`,
    `<p class="muted" style="font-family:ui-monospace,monospace;word-break:break-word">${sorted}</p>
     <table>
       <tr><td>걸린 시간</td><td>${secs}초</td></tr>
       <tr><td>최대 콤보</td><td>${state.maxCombo}</td></tr>
       <tr><td>시간 보너스</td><td>+${timeBonus}</td></tr>
       <tr><td>남은 목숨 보너스</td><td>+${lifeBonus}</td></tr>
       ${perfect ? `<tr><td>무실수 보너스</td><td>+${perfect}</td></tr>` : ''}
       <tr><td>총점</td><td>${state.score}</td></tr>
     </table>`,
    '다음 레벨',
    () => startLevel(state.level + 1)
  );
}

function showFail() {
  if (state.score > best) { best = state.score; saveBest(best); }
  showModal(
    '목숨을 모두 잃었어요',
    `<p>레벨 ${state.level + 1}을(를) 다시 시도합니다. 이번 레벨에서 얻은 점수는 취소돼요.</p>`,
    '다시 하기',
    () => { state.score = state.levelStartScore; startLevel(state.level); }
  );
}

// ---------- 입력 ----------
el.collectBtn.addEventListener('click', collect);
el.restartBtn.addEventListener('click', () => {
  if (state.busy) return;
  state.score = state.levelStartScore;
  startLevel(state.level);
});
el.modalBtn.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!el.overlay.hidden) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(); }
    return;
  }
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); place(Number(e.key)); }
  else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); collect(); }
});

// ---------- 시작 ----------
state.buckets = Array.from({ length: 10 }, () => []);
buildBuckets();
updateStats();
showIntro();
