'use strict';

// ---------- 레벨 & 스토리 ----------
const LEVELS = [
  { count: 6, digits: 2, hint: true, title: '1교시: 번호순 줄서기', room: '반',
    intro: '전학생들이 번호표를 받았는데 줄이 엉망이야! 번호 순서대로 세워 보자.',
    outro: '완벽해! 선생님이 출석 부르기 편하겠다.' },
  { count: 8, digits: 2, hint: true, title: '급식실 대기 줄', room: '줄',
    intro: '급식은 번호순! 배고픈 친구들이 꼬르륵거리며 기다리고 있어.',
    outro: '다들 밥 먹으러 갔어. 오늘 메뉴는 돈가스래!' },
  { count: 8, digits: 3, hint: true, title: '놀이공원 입장', room: '게이트',
    intro: '이번엔 세 자리 입장권이야. 1의 자리 → 10의 자리 → 100의 자리 순서로!',
    outro: '전원 입장 완료! 롤러코스터 줄은… 그건 다음에 정렬하자.' },
  { count: 10, digits: 3, hint: true, title: '수학여행 버스', room: '버스',
    intro: '좌석 번호대로 앉아야 버스가 출발할 수 있대. 기사님이 기다리셔!',
    outro: '부릉부릉~ 버스 출발! 멀미약은 챙겼지?' },
  { count: 12, digits: 3, hint: false, title: '깜깜한 영화관', room: '관',
    intro: '불이 꺼져서 맨 앞 사람 번호표만 보여! 집중해.',
    outro: '모두 자리에 앉았어. 팝콘 소리만 들린다…' },
  { count: 12, digits: 4, hint: true, title: '마라톤 출발선', room: '구역',
    intro: '네 자리 배번이야! 출발 총성이 울리기 전에 정렬하자.',
    outro: '탕! 다들 달려 나갔어. 우리도 숨 좀 돌리자.' },
  { count: 14, digits: 4, hint: false, title: '우주선 탑승', room: '도킹',
    intro: '마지막 관문! 힌트 없이 우주선에 태워 보내야 해.',
    outro: '3, 2, 1… 발사! 넌 이제 진짜 기수정렬 마스터야!' },
];
const MAX_LIVES = 3;
const PLACE_NAMES = ['1의 자리', '10의 자리', '100의 자리', '1000의 자리', '10000의 자리'];

function levelConfig(i) {
  if (i < LEVELS.length) return LEVELS[i];
  const k = i - LEVELS.length + 1;
  return {
    count: Math.min(14 + k, 20), digits: 5, hint: false, room: '방',
    title: `무한 대기열 #${k}`,
    intro: '다섯 자리 번호표를 든 사람들이 끝없이 몰려온다! 어디까지 갈 수 있을까?',
    outro: `무한 대기열 #${k} 돌파! 아직 더 온다…!`,
  };
}

// ---------- 캐릭터 ----------
const NAMES = [
  '민준', '서연', '도윤', '하은', '시우', '지아', '예준', '수아', '주원', '지우',
  '하준', '서윤', '은우', '채원', '건우', '다은', '유찬', '소율', '지호', '예린',
  '태오', '나은', '로이', '아린', '현우', '윤슬', '재민', '보라', '동훈', '루다',
];
const SKINS = ['#ffd9b8', '#f5c39a', '#e0a878', '#c68a5e', '#8d5a3b', '#ffe3cf'];
const HAIRS = ['#2b2118', '#5a3a22', '#a5642c', '#e2b86b', '#c94d3f', '#3d4a8f', '#7a7a7a', '#1d1d1d'];
const SHIRTS = ['#e85d75', '#4c8bf5', '#38b07a', '#f2a93b', '#9b6cf0', '#20b2c4', '#ef7d3c', '#6b7a8f'];
const ROOM_COLORS = ['#e85d75', '#ef7d3c', '#f2a93b', '#b9c23a', '#38b07a', '#20b2c4', '#4c8bf5', '#6b6cf0', '#9b6cf0', '#d65db1'];

const GREETINGS = [
  (c) => `안녕! 난 ${c.name}. 내 번호는 ${pad(c.n)}번!`,
  (c) => `${c.name} 등장! 어느 ${ro(cfg().room)} 가면 돼?`,
  (c) => `배고파… ${pad(c.n)}번 ${c.name}, 대기 중.`,
  (c) => `저 ${c.name}인데요, 빨리 보내 주세요~`,
  (c) => `음… 내 ${PLACE_NAMES[state.pass]} 숫자가 뭐였더라?`,
  (c) => `줄 서는 거 제일 싫어! …아, 안녕. ${iya(c.name)}.`,
  (c) => `${c.name} 왔어요! 오늘 컨디션 최고!`,
  (c) => `혹시 ${digitOf(c.n, state.pass)}번 ${cfg().room} 맞죠? 헷갈려서…`,
];

let charSeq = 0;
function makeCharacter(n, name) {
  const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return {
    id: ++charSeq, n, name,
    skin: r(SKINS), hair: r(HAIRS), shirt: r(SHIRTS),
    style: Math.floor(Math.random() * 5),
    greet: Math.floor(Math.random() * GREETINGS.length),
  };
}

const NARRATOR = { skin: '#ffd9b8', hair: '#2b2118', shirt: '#2f6fde', style: 0, glasses: true };

function avatarSVG(c, mood = 'normal') {
  const hair = c.hair;
  const hairShapes = [
    `<path d="M11 21Q11 8 24 8Q37 8 37 21Q33 14 24 14Q15 14 11 21Z" fill="${hair}"/>`,
    `<path d="M11 23Q9 7 24 8Q39 7 37 23L38 35Q33 31 34 22Q30 15 24 15Q18 15 14 22Q15 31 10 35Z" fill="${hair}"/>`,
    `<path d="M11 21L12 9L17 13L20 6L24 11L28 6L31 13L36 9L37 21L32 15L16 15Z" fill="${hair}"/>`,
    `<circle cx="12" cy="11" r="5" fill="${hair}"/><circle cx="36" cy="11" r="5" fill="${hair}"/><path d="M11 21Q11 8 24 8Q37 8 37 21Q33 14 24 14Q15 14 11 21Z" fill="${hair}"/>`,
    `<path d="M10 19Q10 6 24 6Q38 6 38 19Z" fill="${c.shirt}"/><path d="M24 17H40Q42 17 42 19H24Z" fill="${c.shirt}"/><circle cx="24" cy="7" r="2" fill="#fff" opacity=".7"/>`,
  ];
  const ink = '#2a1f1a';
  let eyes, mouth, brows = '';
  if (mood === 'happy') {
    eyes = `<path d="M16.5 23.5q2.5-3 5 0M26.5 23.5q2.5-3 5 0" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    mouth = `<path d="M19 28q5 6 10 0z" fill="${ink}"/><path d="M21 30.5q3 1.6 6 0" stroke="#e86a6a" stroke-width="1.5" fill="none"/>`;
  } else if (mood === 'sad') {
    eyes = `<circle cx="19" cy="24" r="1.8" fill="${ink}"/><circle cx="29" cy="24" r="1.8" fill="${ink}"/><path d="M30.5 26.5q.8 2.5 0 3.5q-.8-1 0-3.5z" fill="#6ab7ff"/>`;
    brows = `<path d="M16 19.5l5-1.5M32 19.5l-5-1.5" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`;
    mouth = `<path d="M20.5 31q3.5-3.5 7 0" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  } else {
    eyes = `<circle cx="19" cy="23" r="1.8" fill="${ink}"/><circle cx="29" cy="23" r="1.8" fill="${ink}"/>`;
    mouth = `<path d="M21 29q3 2 6 0" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  }
  const glasses = c.glasses
    ? `<g stroke="${ink}" stroke-width="1.3" fill="none"><circle cx="19" cy="23" r="3.8"/><circle cx="29" cy="23" r="3.8"/><path d="M22.8 23h2.4"/></g>`
    : '';
  const back = c.style === 1 ? hairShapes[1] : '';
  const front = c.style === 1 ? '' : hairShapes[c.style];
  return `<svg class="avatar" viewBox="0 0 48 48" aria-hidden="true">
    ${back}
    <path d="M8 48Q8 36 24 36Q40 36 40 48Z" fill="${c.shirt}"/>
    <circle cx="24" cy="22" r="13" fill="${c.skin}"/>
    ${c.style === 1 ? `<path d="M12 20Q12 9 24 9Q36 9 36 20Q31 15 24 15Q17 15 12 20Z" fill="${c.hair}"/>` : front}
    <circle cx="15.5" cy="27" r="2.2" fill="#ff7a8a" opacity=".35"/><circle cx="32.5" cy="27" r="2.2" fill="#ff7a8a" opacity=".35"/>
    ${brows}${eyes}${mouth}${glasses}
  </svg>`;
}

// ---------- 상태 ----------
const state = {
  level: 0, pass: 0, queue: [], buckets: [],
  score: 0, levelStartScore: 0, combo: 0, maxCombo: 0,
  lives: MAX_LIVES, mistakes: 0,
  phase: 'distribute', // distribute | collect | over
  busy: false, startTime: 0,
  bubble: null, sadId: null, lastPlacedId: null,
};

const $ = (id) => document.getElementById(id);
const el = {
  level: $('level'), score: $('score'), combo: $('combo'), best: $('best'), lives: $('lives'),
  storyTitle: $('storyTitle'), narratorFace: $('narratorFace'),
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
const pad = (n) => String(n).padStart(cfg().digits, '0');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// 받침에 맞는 조사
function batchim(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return 0;
  return code % 28; // 0 = 받침 없음, 8 = ㄹ
}
const ro = (w) => w + ([0, 8].includes(batchim(w)) ? '로' : '으로');
const iya = (w) => w + (batchim(w) ? '이야' : '야');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeCrowd(count, digits) {
  const max = 10 ** digits;
  const min = 10 ** (digits - 1);
  const set = new Set();
  set.add(min + Math.floor(Math.random() * (max - min))); // 최고 자리가 0이 아닌 수 보장
  while (set.size < count) set.add(Math.floor(Math.random() * max));
  const names = shuffle([...NAMES]);
  return shuffle([...set]).map((n, i) => makeCharacter(n, names[i % names.length]));
}

// ---------- 내레이터 ----------
function say(html, mood = 'normal') {
  el.instruction.innerHTML = html;
  el.narratorFace.innerHTML = avatarSVG(NARRATOR, mood);
  const bubble = el.instruction.parentElement;
  bubble.classList.remove('pop');
  void bubble.offsetWidth;
  bubble.classList.add('pop');
}

function passIntroLine() {
  const place = PLACE_NAMES[state.pass];
  if (state.pass === 0) return `먼저 <b>${place}</b>부터! 번호표의 ${place} 숫자와 같은 ${ro(cfg().room)} 보내 줘.`;
  return `이번엔 <b>${place}</b> 차례야. 흐린 숫자는 이미 정리한 자리니까 신경 쓰지 마!`;
}

// ---------- 레벨 진행 ----------
function startLevel(levelIndex) {
  state.level = levelIndex;
  const { count, digits } = cfg();
  Object.assign(state, {
    pass: 0, queue: makeCrowd(count, digits), buckets: Array.from({ length: 10 }, () => []),
    combo: 0, maxCombo: 0, lives: MAX_LIVES, mistakes: 0, phase: 'distribute', busy: false,
    levelStartScore: state.score, startTime: performance.now(), sadId: null, lastPlacedId: null,
  });
  setGreeting();
  buildBuckets();
  el.storyTitle.textContent = cfg().title;
  say(passIntroLine());
  render({ enterQueue: true });
}

function setGreeting() {
  const c = state.queue[0];
  state.bubble = c ? { id: c.id, text: GREETINGS[c.greet](c), bad: false } : null;
}

function place(b) {
  if (state.phase !== 'distribute' || state.busy || !state.queue.length) return;
  const c = state.queue[0];
  const bucketEl = el.buckets.children[b];
  const d = digitOf(c.n, state.pass);

  if (d === b) {
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.score += 10 * Math.min(state.combo, 5);
    state.busy = true;
    flash(bucketEl, 'good');
    flyCard(el.queue.querySelector('.card.current'), bucketEl.querySelector('.stack'), () => {
      state.queue.shift();
      state.buckets[b].push(c);
      state.lastPlacedId = c.id;
      state.sadId = null;
      if (!state.queue.length) {
        state.phase = 'collect';
        state.bubble = null;
        say(`다 들어갔다! 이제 <b>0번 ${cfg().room}부터</b>, 먼저 들어간 사람 순서대로 다시 줄 세우자.`, 'happy');
      } else {
        setGreeting();
        if (state.combo > 0 && state.combo % 5 === 0) say(`콤보 ${state.combo}! 손이 엄청 빠른데? 🔥`, 'happy');
      }
      state.busy = false;
      render();
    });
    updateStats();
  } else {
    state.combo = 0;
    state.lives--;
    state.mistakes++;
    state.sadId = c.id;
    state.bubble = { id: c.id, text: `앗, ${b}번 아니야! 내 ${PLACE_NAMES[state.pass]} 숫자는 <b>${d}</b>야.`, bad: true };
    flash(bucketEl, 'bad');
    shake(bucketEl);
    if (state.lives <= 0) {
      state.phase = 'over';
      say('으앗… 줄이 완전히 꼬여 버렸어.', 'sad');
      render();
      setTimeout(showFail, 600);
    } else {
      say(pick(['괜찮아, 번호표를 다시 잘 봐!', '침착하게! 오른쪽에서부터 세어 봐.', '아깝다! 다음엔 맞힐 수 있어.']), 'sad');
      render();
    }
    shake(el.queue.querySelector('.card.current'));
  }
}

function collect() {
  if (state.phase !== 'collect' || state.busy) return;
  // 0번 버킷부터 순서대로, 각 버킷은 먼저 들어온 사람부터 (FIFO)
  state.queue = state.buckets.flat();
  state.buckets = Array.from({ length: 10 }, () => []);
  state.lastPlacedId = null;
  state.pass++;
  if (state.pass >= cfg().digits) {
    state.phase = 'over';
    state.bubble = null;
    say('모든 자리 끝! 줄을 봐, 완벽하게 정렬됐어! 🎉', 'happy');
    render({ enterQueue: true });
    setTimeout(showClear, 700);
  } else {
    state.phase = 'distribute';
    setGreeting();
    const prev = PLACE_NAMES[state.pass - 1];
    say(`${prev}까지 끝! 아래 ${state.pass}자리만 보면 벌써 순서대로야. 이번엔 <b>${PLACE_NAMES[state.pass]}</b> 차례!`, 'happy');
    render({ enterQueue: true });
  }
}

// ---------- 렌더링 ----------
function tagHTML(n, isCurrent) {
  const { digits, hint } = cfg();
  const s = pad(n);
  const leading = digits - String(n).length;
  let html = '';
  for (let i = 0; i < digits; i++) {
    const placeIdx = digits - 1 - i; // 오른쪽부터 0
    const cls = ['d'];
    if (i < leading) cls.push('pad');
    if (state.phase !== 'over') {
      if (placeIdx < state.pass) cls.push('done');
      if (placeIdx === state.pass && (hint || isCurrent)) cls.push('active');
    }
    html += `<span class="${cls.join(' ')}">${s[i]}</span>`;
  }
  return `<span class="tag">${html}</span>`;
}

function buildBuckets() {
  el.buckets.innerHTML = '';
  for (let b = 0; b < 10; b++) {
    const btn = document.createElement('button');
    btn.className = 'bucket';
    btn.type = 'button';
    btn.style.setProperty('--room', ROOM_COLORS[b]);
    btn.setAttribute('aria-label', `${b}번 ${cfg().room}`);
    btn.innerHTML = `<span class="num">${b}</span><span class="room-label">${b}번 ${cfg().room}</span><div class="stack"></div>`;
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

  // 대기 줄
  el.queue.innerHTML = '';
  if (!state.queue.length) {
    el.queue.innerHTML = '<span class="empty-note">줄이 비었어요. 모두 방에 들어갔어요!</span>';
  }
  const cleared = state.phase === 'over' && state.lives > 0;
  state.queue.forEach((c, i) => {
    const card = document.createElement('div');
    const isCurrent = i === 0 && state.phase === 'distribute';
    card.className = 'card' + (isCurrent ? ' current' : '') + (enterQueue ? ' enter' : '');
    if (enterQueue) card.style.animationDelay = `${i * 35}ms`;
    const mood = cleared ? 'happy' : state.sadId === c.id ? 'sad' : 'normal';
    const bubble = state.bubble && state.bubble.id === c.id && isCurrent
      ? `<div class="bubble${state.bubble.bad ? ' bad' : ''}">${state.bubble.text}</div>` : '';
    card.innerHTML = `${bubble}${avatarSVG(c, mood)}<span class="name">${c.name}</span>${tagHTML(c.n, isCurrent)}`;
    el.queue.appendChild(card);
  });
  el.queueCount.textContent = `${state.queue.length}명 대기`;

  // 버킷(방)
  state.buckets.forEach((people, b) => {
    const stack = el.buckets.children[b].querySelector('.stack');
    stack.innerHTML = people.map((c) =>
      `<div class="mini${c.id === state.lastPlacedId ? ' enter' : ''}" title="${c.name}">${avatarSVG(c, 'happy')}<span class="n">${pad(c.n)}</span></div>`
    ).join('');
  });

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
  const l = Math.max(state.lives, 0);
  el.lives.textContent = '♥'.repeat(l) + '♡'.repeat(MAX_LIVES - l);
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
  Object.assign(clone.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px` });
  document.body.appendChild(clone);
  cardEl.style.visibility = 'hidden';
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.bottom - (from.top + from.height / 2);
  const anim = clone.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 30}px) scale(.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: .5 },
    ],
    { duration: 320, easing: 'ease-in-out' }
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
  const demo = makeCrowd(4, 2);
  showModal(
    '기수정렬 버킷 퍼즐',
    `<div class="modal-hero">${avatarSVG(NARRATOR, 'happy')}${demo.map((c) => avatarSVG(c)).join('')}</div>
     <p>안녕, 난 <b>기수 반장</b>이야! 번호표를 든 친구들을 순서대로 줄 세우는 걸 도와줘.</p>
     <p>방법은 <b>기수정렬</b>이야. 가장 낮은 자리부터 숫자별로 방에 나눠 넣고, 0번 방부터 다시 모으는 걸 반복하면 정렬이 끝나!</p>
     <ol>
       <li>맨 앞 친구 번호표의 <b>강조된 숫자</b>와 같은 방을 눌러.</li>
       <li>모두 넣으면 <b>다시 줄 세우기</b>로 0→9번 방 순서대로 모아.</li>
       <li>모든 자리를 끝내면 정렬 완성!</li>
     </ol>
     <p class="muted">틀리면 목숨이 줄어. 연속으로 맞히면 콤보 점수!</p>`,
    '시작하기',
    () => showLevelIntro(0)
  );
}

function showLevelIntro(levelIndex) {
  state.level = levelIndex;
  const c = cfg();
  showModal(
    `레벨 ${levelIndex + 1} · ${c.title}`,
    `<div class="modal-hero">${avatarSVG(NARRATOR)}</div>
     <p>${c.intro}</p>
     <p class="muted">${c.count}명 · ${c.digits}자리 번호표${c.hint ? '' : ' · 힌트는 맨 앞 사람만'}</p>`,
    '시작!',
    () => startLevel(levelIndex)
  );
}

function showClear() {
  const secs = Math.round((performance.now() - state.startTime) / 1000);
  const { count, digits, outro } = cfg();
  const par = count * digits * 2;
  const timeBonus = Math.max(0, par - secs) * 5;
  const lifeBonus = state.lives * 50;
  const perfect = state.mistakes === 0 ? 100 : 0;
  state.score += timeBonus + lifeBonus + perfect;
  if (state.score > best) { best = state.score; saveBest(best); }
  updateStats();
  const lineup = state.queue.map((c, i) =>
    `<div class="who" title="${c.name}">${avatarSVG(c, 'happy').replace('class="avatar"', `class="avatar" style="animation-delay:${i * 50}ms"`)}<span class="n">${pad(c.n)}</span></div>`
  ).join('');
  showModal(
    `레벨 ${state.level + 1} 클리어!`,
    `<div class="lineup">${lineup}</div>
     <p>${outro}</p>
     <table>
       <tr><td>걸린 시간</td><td>${secs}초</td></tr>
       <tr><td>최대 콤보</td><td>${state.maxCombo}</td></tr>
       <tr><td>시간 보너스</td><td>+${timeBonus}</td></tr>
       <tr><td>남은 목숨 보너스</td><td>+${lifeBonus}</td></tr>
       ${perfect ? `<tr><td>무실수 보너스</td><td>+${perfect}</td></tr>` : ''}
       <tr><td>총점</td><td>${state.score}</td></tr>
     </table>`,
    '다음 레벨',
    () => showLevelIntro(state.level + 1)
  );
}

function showFail() {
  if (state.score > best) { best = state.score; saveBest(best); }
  showModal(
    '목숨을 모두 잃었어요',
    `<div class="modal-hero">${avatarSVG(NARRATOR, 'sad')}</div>
     <p>줄이 꼬여 버렸어… 레벨 ${state.level + 1}을(를) 다시 해 보자. 이번 레벨에서 얻은 점수는 취소돼.</p>`,
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
el.narratorFace.innerHTML = avatarSVG(NARRATOR);
el.instruction.textContent = '안녕! 시작하기를 눌러 줘.';
updateStats();
showIntro();
