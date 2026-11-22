
// Phase 11: answer feedback timing and screen transitions.

const BASE = 'https://raw.githubusercontent.com/b1bunKsu/STEMQuestion/refs/heads/main/questions/';

const app = document.querySelector('#app');
const stage = document.querySelector('#stage');

const state = {
  name: 'PLAYER',
  questions: [],
  index: 0,
  score: 0,
  correct: 0,
  remaining: 20,
  deadline: 0,
  timer: null,
  locked: false,
  mode: 'STANDARD',
  history: [],
  advanceTimer: null,
  feedbackTimer: null,
  scoreAnimation: null,
  lives: 5,
  streak: 0,
  questionPool: [],
  debug: {
    type: 'EFFECT',
    id: '',
    effect: 'RANDOM',
    disableTimer: false,
    showAnswer: false
  },
  qwerty: false,
  bgmVolume: 0.5,
  seVolume: 0.5,
  lastCountdownSecond: null,
  inputEnabled: false
};

const MODE_BACKGROUNDS = {
  STANDARD: 'assets/images/background.jpg',
  HIGH_SPEED: 'assets/images/high_speed.jpg',
  HUNDRED_CHALLENGE: 'assets/images/hundred.jpg'
};

function updateModeBackground() {
  const background =
    MODE_BACKGROUNDS[state.mode] ||
    'assets/images/background.png';

  document.documentElement.style.setProperty(
    '--game-background',
    `url("${background}")`
  );
}

function setQuestionInputEnabled(enabled) {
  state.inputEnabled = enabled;

  const ui = app.querySelector('#question-ui');

  if (ui) {
    ui.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

// 出題アニメーション中は物理キーボード入力を遮断
document.addEventListener('keydown', event => {
  if (!app.querySelector('.quiz-shell')) return;
  if (state.inputEnabled) return;

  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

// マウスやタッチ操作も遮断
for (const type of ['pointerdown', 'click']) {
  document.addEventListener(type, event => {
    if (state.inputEnabled) return;

    const ui = app.querySelector('#question-ui');
    if (!ui || !ui.contains(event.target)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}


// 1280×720のゲーム画面を、スマホ横画面を含む表示領域内に収める。
// visualViewportでモバイルブラウザのアドレスバー変化にも追従する。
const rotateNotice = document.querySelector('#rotate-notice');
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

function resize() {
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  const offsetLeft = viewport ? viewport.offsetLeft : 0;
  const offsetTop = viewport ? viewport.offsetTop : 0;

  const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
  stage.style.transform = `scale(${scale})`;
  // スマホなどのタッチ端末ではゲーム画面を左寄せ
  const isMobile = window.matchMedia('(pointer: coarse)').matches;

  stage.style.left = isMobile
    ? `${offsetLeft}px`
    : `${offsetLeft + (width - GAME_WIDTH * scale) / 2}px`;

  // 縦方向は中央配置を維持
  stage.style.top = `${offsetTop + (height - GAME_HEIGHT * scale) / 2}px`;

  // タッチ主体の小型端末だけ縦向き案内を表示。PCの縦長ウィンドウは対象外。
  const mobile = window.matchMedia('(pointer: coarse)').matches
    && Math.min(window.screen.width, window.screen.height) <= 600;
  const portrait = height > width;
  const showNotice = mobile && portrait;
  rotateNotice.hidden = !showNotice;
  stage.style.visibility = showNotice ? 'hidden' : 'visible';
}

addEventListener('resize', resize);
addEventListener('orientationchange', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
  window.visualViewport.addEventListener('scroll', resize);
}
resize();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const button = (label, action, extra = '') =>
  `<button class="btn ${extra}" data-action="${action}">${esc(label)}</button>`;

function bind(actions) {
  app.querySelectorAll('[data-action]').forEach(el =>
    el.addEventListener('click', () => actions[el.dataset.action]?.(el))
  );
}

const FILES = [
  'choice.json',
  'ox.json',
  'multiple_choice.json',
  'one_way.json',
  'number.json',
  'kana.json',
  'katakana.json',
  'character_panel.json',
  'slot.json',
  'group.json',
  'order.json',
  'rearrangement.json',
  'line_matching.json',
  'rensou.json',
  'effect.json',
  'polyhedron.json',
  'image_touch.json'
];

const HIGHSPEED_TYPES = new Set([
  'OX',
  'CHOICE',
  'ONE_WAY',
  'RENSOU',
  'IMAGE_TOUCH',
  'MULTIPLE_CHOICE'
]);

function readSettings() {
  try {
    const x = JSON.parse(
      localStorage.getItem('quizgame_web_settings') || '{}'
    );

    state.qwerty = Boolean(x.qwerty);
    state.bgmVolume = Number.isFinite(x.bgmVolume)
      ? x.bgmVolume
      : 0.5;
    state.seVolume = Number.isFinite(x.seVolume)
      ? x.seVolume
      : 0.5;

  } catch (e) {
    console.warn(e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      'quizgame_web_settings',
      JSON.stringify({
        qwerty: state.qwerty,
        bgmVolume: state.bgmVolume,
        seVolume: state.seVolume
      })
    );
  } catch (e) {
    console.warn(e);
  }
}

function title(message = '') {

  SoundManager.playBgm('TITLE');
  clearTimer();

  if (state.activeQuestion) {
    state.activeQuestion.dispose();
    state.activeQuestion = null;
  }

  if (state.typingKeyHandler) {
    document.removeEventListener('keydown', state.typingKeyHandler);
    state.typingKeyHandler = null;
  }

  app.innerHTML = `
    <div class="center title-screen screen-enter">
      <div class="title">理系検定</div>
      <div class="subtitle">理系学問に関するクイズが出題されるゲームです</div>

      <input
        id="name"
        class="name"
        maxlength="8"
        placeholder="名前を入力"
        value="${esc(state.name === 'PLAYER' ? '' : state.name)}"
      >

      <div class="btns mode-buttons">
        ${button('スタート', 'standard')}
      </div>

      ${button('設定', 'settings', 'settings-button')}
      ${button('DEBUG MODE', 'debug', 'debug-entry')}

      ${message ? `<div id="message">${esc(message)}</div>` : ''}
    </div>
  `;

  bind({
    standard: () => startFromTitle('STANDARD'),
    highspeed: () => startFromTitle('HIGH_SPEED'),
    hundred: () => startFromTitle('HUNDRED_CHALLENGE'),

    settings: () => {
      state.name = document.querySelector('#name').value.trim() || 'PLAYER';
      settings();
    },

    debug: () => {
      state.name = document.querySelector('#name').value.trim() || 'PLAYER';
      debugSettings();
    }
  });
}


const QUIZ_INTRO_DURATION = 3000;
const QUIZ_WHITE_FADE_DURATION = 1000;

const QUIZ_MODE_NAMES = {
  STANDARD: 'スタンダード',
  HIGH_SPEED: 'ハイスピード',
  HUNDRED_CHALLENGE: '100問チャレンジ'
};



async function startFromTitle(mode) {

  SoundManager.init();
  SoundManager.stopBgm();

  state.name =
    document.querySelector('#name').value.trim() || 'PLAYER';

  state.mode = mode;

  // 連打防止
  app.querySelectorAll('button').forEach(btn => {
    btn.disabled = true;
  });

  // 白フェード用レイヤー
  const fade = document.createElement('div');
  fade.className = 'quiz-white-fade';
  stage.appendChild(fade);

  // 1回目：タイトル画面 → 完全な白画面
  const fadeOut = fade.animate(
    [
      { opacity: 0 },
      { opacity: 1 }
    ],
    {
      duration: QUIZ_WHITE_FADE_DURATION,
      easing: 'ease-in-out',
      fill: 'forwards'
    }
  );

  await fadeOut.finished;

  // 完全に白くなった状態を固定
  fade.style.opacity = '1';
  fadeOut.cancel();

  // ★ 画面が完全に白くなった瞬間に背景を切り替える
  updateModeBackground();

  // イントロ画面へ切り替え
  showQuizIntro(mode);

  // 2回目：白画面 → イントロ画面
  const fadeIn = fade.animate(
    [
      { opacity: 1 },
      { opacity: 0 }
    ],
    {
      duration: QUIZ_WHITE_FADE_DURATION,
      easing: 'ease-in-out',
      fill: 'forwards'
    }
  );

  await fadeIn.finished;

  // 白いレイヤーを削除
  fade.remove();

  // ★ 2回目のフェード完了直後にクイズBGMを再生！
  SoundManager.playBgm(mode);
}



function showQuizIntro(mode) {
  const modeName = QUIZ_MODE_NAMES[mode] || mode;

  app.innerHTML = `
        <div class="quiz-intro-screen">
            <div class="quiz-intro-box">
                <div class="quiz-intro-mode">
                    ${esc(modeName)}
                </div>
            </div>
        </div>
    `;

  // イントロ表示中に問題を読み込む
  loadAndStart(true);
}


function settings() {
  clearTimer();

  app.innerHTML = `
    <div class="center settings-screen screen-enter">
      <div class="settings-title">設定</div>

      <label class="settings-label" for="bgm-volume">
        BGM音量
        <output id="bgm-value">${Math.round(state.bgmVolume * 100)}%</output>
      </label>

      <input
        id="bgm-volume"
        type="range"
        min="0"
        max="100"
        value="${Math.round(state.bgmVolume * 100)}"
      >

      <label class="settings-label" for="se-volume">
        SE音量
        <output id="se-value">${Math.round(state.seVolume * 100)}%</output>
      </label>

      <input
        id="se-volume"
        type="range"
        min="0"
        max="100"
        value="${Math.round(state.seVolume * 100)}"
      >

      <label class="settings-check">
        <input
          id="qwerty"
          type="checkbox"
          ${state.qwerty ? 'checked' : ''}
        >
        英数字キーボードをQWERTY配列にする
      </label>

      ${button('戻る', 'back', 'settings-button')}

    </div>
  `;

  app.querySelector('#bgm-volume').addEventListener('input', e => {
    state.bgmVolume = Number(e.target.value) / 100;
    SoundManager.setBgmVolume(state.bgmVolume);
    app.querySelector('#bgm-value').textContent = e.target.value + '%';
    saveSettings();
  });

  app.querySelector('#se-volume').addEventListener('input', e => {
    state.seVolume = Number(e.target.value) / 100;
    app.querySelector('#se-value').textContent = e.target.value + '%';
    saveSettings();
  });

  app.querySelector('#qwerty').addEventListener('change', e => {
    state.qwerty = e.target.checked;
    saveSettings();
  });

  bind({
    back: () => title()
  });
}

function debugSettings(message = '') {
  clearTimer();

  const opts = ['ALL', ...QuestionManager.types.keys()];
  const d = state.debug;

  app.innerHTML = `
    <div class="center debug-screen screen-enter">
      <div class="settings-title">デバッグモード</div>

      <label for="debug-type">問題形式</label>

      <select id="debug-type">
        ${opts.map(t => `
          <option
            value="${esc(t)}"
            ${d.type === t ? 'selected' : ''}
          >
            ${t === 'ALL' ? 'すべて' : esc(t)}
          </option>
        `).join('')}
      </select>

      <label for="debug-effect">
        EFFECTの演出（EFFECT選択時のみ）
      </label>

      <select id="debug-effect">
        ${[
      'RANDOM',
      'ROTATING',
      'MOSAIC',
      'ZOOM_OUT',
      'SLIDING_PUZZLE'
    ].map(t => `
          <option
            value="${t}"
            ${d.effect === t ? 'selected' : ''}
          >
            ${t === 'RANDOM' ? 'ランダム' : t}
          </option>
        `).join('')}
      </select>

      <label for="debug-id">
        問題ID（空欄ならID順に1から出題）
      </label>

      <input
        id="debug-id"
        type="number"
        min="1"
        step="1"
        placeholder="1"
        value="${esc(d.id)}"
      >

      <label class="settings-check">
        <input
          id="debug-no-timer"
          type="checkbox"
          ${d.disableTimer ? 'checked' : ''}
        >
        制限時間を無効化
      </label>

      <label class="settings-check">
        <input
          id="debug-show-answer"
          type="checkbox"
          ${d.showAnswer ? 'checked' : ''}
        >
        正解を表示
      </label>

      <div class="debug-buttons">
        ${button('デバッグ開始', 'debug-start')}
        ${button('タイトルへ戻る', 'debug-back')}
      </div>

      ${message ? `
        <div class="debug-error" role="alert">${esc(message)}</div>
      ` : ''}
    </div>
  `;

  const typeInput = app.querySelector('#debug-type');
  const effectInput = app.querySelector('#debug-effect');

  const syncEffect = () => {
    effectInput.disabled = typeInput.value !== 'EFFECT';
    effectInput.title = effectInput.disabled
      ? 'EFFECTを選択すると指定できます'
      : '';
  };

  typeInput.addEventListener('change', syncEffect);
  syncEffect();

  bind({
    'debug-start': () => {
      const type = app.querySelector('#debug-type').value;
      const id = app.querySelector('#debug-id').value.trim();
      const effect = app.querySelector('#debug-effect').value;

      if (
        id &&
        (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
      ) {
        debugSettings('問題IDには1以上の整数を指定してください。');
        return;
      }

      state.debug = {
        type,
        id,
        effect,
        disableTimer: app.querySelector('#debug-no-timer').checked,
        showAnswer: app.querySelector('#debug-show-answer').checked
      };

      state.mode = 'DEBUG';
      loadAndStart();
    },

    'debug-back': () => title()
  });
}

function debugAnswerText(q) {
  if (q.type === 'OX') return q.answer;

  if (q.type === 'MULTIPLE_CHOICE') {
    return Array.isArray(state.activeAnswers)
      ? state.activeAnswers.join(' / ')
      : JSON.stringify(q.answers ?? q.choices?.[0] ?? '');
  }

  if (q.type === 'LINE_MATCHING') {
    return 'JSONの対応順: ' +
      (q.left?.map((v, i) => `${i + 1} → ${i + 1}`).join('、')
        || '元データ参照');
  }

  if (
    q.type === 'RENSOU' ||
    q.type === 'CHOICE' ||
    q.type === 'ONE_WAY' ||
    q.type === 'SLOT'
  ) {
    return q.choices?.[0] ?? q.answer ?? '';
  }

  if (q.type === 'GROUP') {
    return '元データのグループ分類を参照';
  }

  return (
    Array.isArray(q.answers)
      ? q.answers.join(' / ')
      : q.answer
  ) ?? q.choices?.[0] ?? '元データ参照';
}


function debugMove(direction) {

  if (state.mode !== 'DEBUG') return;
  if (!state.questions.length) return;

  clearTimer();

  if (state.activeQuestion) {
    state.activeQuestion.dispose();
    state.activeQuestion = null;
  }

  if (state.typingKeyHandler) {
    document.removeEventListener(
      'keydown',
      state.typingKeyHandler
    );
    state.typingKeyHandler = null;
  }

  state.locked = false;

  // 前後に移動（端では反対側へループ）
  state.index = (
    state.index + direction + state.questions.length
  ) % state.questions.length;

  showQuestion();
}

function debugNext() {
  debugMove(1);
}

function debugPrevious() {
  debugMove(-1);
}


function loading() {
  app.innerHTML = `
    <div class="center">
      <div class="title" style="font-size:50px">
        問題を読み込み中…
      </div>
      <div class="note">
        GitHubから問題を取得しています。
      </div>
    </div>
  `;
}

async function loadAndStart(fromIntro = false) {
  const introStart = performance.now();

  // イントロ経由の場合はBGMを停止しない
  if (!fromIntro) {
    SoundManager.stopBgm();
    loading();
  }

  try {
    const sets = await Promise.all(
      FILES.map(async f => {
        const r = await fetch(BASE + f, { cache: 'no-store' });

        if (!r.ok) {
          throw Error(`${f}: HTTP ${r.status}`);
        }

        const data = await r.json();

        if (!Array.isArray(data)) {
          throw Error(`${f}: 配列ではありません`);
        }

        return data;
      })
    );

    const supported = sets.flat()
      .map(q => {
        if (!q) return q;

        const type = q.type === 'CUBE'
          ? 'POLYHEDRON'
          : q.type === 'MULTI_CHOICE'
            ? 'MULTIPLE_CHOICE'
            : q.type;

        const answers = type === 'MULTIPLE_CHOICE'
          ? (
            Array.isArray(q.answers)
              ? q.answers
              : Array.isArray(q.answer)
                ? q.answer
                : typeof q.answer === 'string'
                  ? [q.answer]
                  : []
          )
          : q.answers;

        return {
          ...q,
          type,
          answers,
          imagePath: q.imagePath ?? q.image
        };
      })
      .filter(q =>
        (q.type === 'CHOICE' &&
          Array.isArray(q.choices) &&
          q.choices.length >= 2) ||

        (q.type === 'OX' &&
          ['O', 'X'].includes(String(q.answer).toUpperCase())) ||

        (q.type === 'MULTIPLE_CHOICE' &&
          Array.isArray(q.answers) &&
          q.answers.length >= 1 &&
          q.answers.length <= 5 &&
          Array.isArray(q.choices)) ||

        (q.type === 'ONE_WAY' &&
          Array.isArray(q.choices) &&
          q.choices.length >= 2) ||

        validCharacter(q) ||
        validSlot(q) ||
        validGroup(q) ||
        validOrdering(q) ||
        validRearrangement(q) ||
        validLineMatching(q) ||
        validRensou(q) ||
        validEffect(q) ||
        validPolyhedron(q) ||
        validImageTouch(q) ||

        (
          ['NUMBER', 'KANA', 'KATAKANA'].includes(q.type) &&
          (
            typeof q.answer === 'string' ||
            (Array.isArray(q.answers) && q.answers.length > 0)
          )
        )
      );


    const filtered = state.mode === 'DEBUG'
      ? supported.filter(q =>
        state.debug.type === 'ALL' ||
        q.type === state.debug.type
      )
      : state.mode === 'HIGH_SPEED'
        ? supported.filter(q => HIGHSPEED_TYPES.has(q.type))
        : supported;

    if (!filtered.length) {
      throw Error(
        state.mode === 'DEBUG'
          ? '指定した形式の問題が見つかりません'
          : '対応形式の問題がありません'
      );
    }

    // デバッグはID順、通常プレイはランダム
    if (state.mode === 'DEBUG') {

      filtered.sort((a, b) => {
        const aId = Number(a.id);
        const bId = Number(b.id);

        if (Number.isFinite(aId) && Number.isFinite(bId)) {
          return aId - bId;
        }

        return String(a.id).localeCompare(
          String(b.id),
          'ja',
          { numeric: true }
        );
      });

    } else {
      shuffle(filtered);
    }

    const count = state.mode === 'DEBUG'
      ? filtered.length
      : state.mode === 'HIGH_SPEED'
        ? 15
        : state.mode === 'HUNDRED_CHALLENGE'
          ? filtered.length
          : 25;

    state.questionPool = filtered;
    state.questions = filtered.slice(0, count);
    state.index = 0;

    // デバッグでIDが指定されていれば、その問題から開始
    if (state.mode === 'DEBUG' && state.debug.id) {

      const targetIndex = state.questions.findIndex(
        q => String(q.id) === state.debug.id
      );

      if (targetIndex === -1) {
        throw Error(
          `指定した問題ID ${state.debug.id} が見つかりません`
        );
      }

      state.index = targetIndex;
    }

    state.score = 0;
    state.correct = 0;
    state.history = [];
    state.lives = 5;
    state.streak = 0;

    // イントロ画面は最低2秒間表示する
    if (fromIntro) {
      const elapsed = performance.now() - introStart;
      const remaining = Math.max(
        0,
        QUIZ_INTRO_DURATION - elapsed
      );

      if (remaining > 0) {
        await new Promise(resolve => {
          setTimeout(resolve, remaining);
        });
      }
    }

    // イントロ経由の場合は既にBGMが再生されている
    if (!fromIntro) {
      SoundManager.playBgm(state.mode);
    }

    showQuestion();

  } catch (e) {
    console.error(e);

    if (state.mode === 'DEBUG') {
      debugSettings('問題の読み込みに失敗しました: ' + e.message);
    } else {
      title(
        '問題の読み込みに失敗しました。ネット接続とGitHubのJSON公開状態を確認してください。詳細: ' +
        e.message
      );
    }
  }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearHintTimers() {
  if (state.hintTimers) {
    state.hintTimers.forEach(clearTimeout);
    state.hintTimers = [];
  }
}

function clearTimer() {
  if (state.feedbackTimer !== null) {
    clearTimeout(state.feedbackTimer);
    state.feedbackTimer = null;
  }

  if (state.scoreAnimation !== null) {
    cancelAnimationFrame(state.scoreAnimation);
    state.scoreAnimation = null;
  }

  clearHintTimers();

  if (state.visualCleanup) {
    state.visualCleanup();
    state.visualCleanup = null;
  }

  if (state.timer !== null) {
    clearInterval(state.timer);
    state.timer = null;
  }

  if (state.advanceTimer !== null) {
    clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
  }

  // 問題文ワイプを停止
  if (state.questionWipeCleanup) {
    state.questionWipeCleanup();
    state.questionWipeCleanup = null;
  }
}

function nextRankTarget(score) {
  return score < 500 ? 500
    : score < 1000 ? 1000
      : score < 1500 ? 1500
        : score < 2000 ? 2000
          : score < 3000 ? 3000
            : score < 4000 ? 4000
              : 'BEST';
}

function progressMarkup() {
  return Array.from(
    { length: state.questions.length },
    (_, i) => {
      const h = state.history[i];

      return `
        <span class="progress-mark ${!h ? 'pending' : h.correct ? 'correct' : 'incorrect'
        }">
          ${!h ? '・' : h.correct ? '○' : '×'}
        </span>
      `;
    }
  ).join('');
}

// ========================================
// 問題文ワイプ設定
// ========================================

const QUESTION_WIPE = {
  maxWidth: 640,
  font: 'bold 25px "Noto Sans JP", sans-serif',
  msPerPixel: 2,
  waitMs: 1000,
  pageWaitMs: 1000,
  pageFadeMs: 500,
  specialFadeMs: 1000,
  specialOpacity: 0.5,
  lineHeight: 1.45
};

// ========================================
// 問題文を非表示にする
// ========================================


function hideQuestionText() {

  // ========================================
  // 問題文ワイプを停止
  // ========================================

  if (state.questionWipeCleanup) {
    state.questionWipeCleanup();
    state.questionWipeCleanup = null;
  }

  // ========================================
  // 通常の問題文を非表示
  // ========================================

  const question = app.querySelector(
    '.quiz-shell .question-center .question'
  );

  if (question) {
    question.style.visibility = 'hidden';
  }

  // ========================================
  // 連想クイズのヒントを非表示
  // ========================================

  const rensouHints = app.querySelector(
    '.quiz-shell .rensou-java-hints'
  );

  if (rensouHints) {
    rensouHints.style.visibility = 'hidden';
  }
}


// ========================================
// 問題文ワイプ
// ========================================

function startQuestionWipe() {

  const wipeSpeed = state.mode === 'HIGH_SPEED' ? 3 : 1;

  const question = app.querySelector(
    '.quiz-shell .question-center .question'
  );

  if (!question) return;

  // ========================================
  // ワイプ開始と同時に操作受付開始
  // ========================================

  setQuestionInputEnabled(true);


  const q = state.questions[state.index];

  // 前回のアニメーションを停止
  if (state.questionWipeCleanup) {
    state.questionWipeCleanup();
    state.questionWipeCleanup = null;
  }

  const source = String(q.question ?? '');

  // JavaFX版と同様に制御文字を解釈
  const pages = source.split('\\c');

  const measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');

  ctx.font = QUESTION_WIPE.font;

  const textWidth = text => ctx.measureText(text).width;

  // 既存のCSSアニメーションがあれば無効化
  question.classList.remove('question-wipe-active');

  question.style.animation = 'none';
  question.style.clipPath = 'none';
  question.style.opacity = '1';

  question.replaceChildren();

  question.classList.add('question-wipe-container');

  let cancelled = false;
  let activeAnimation = null;
  let pendingTimeout = null;

  const sleep = ms => new Promise(resolve => {

    if (cancelled) {
      resolve();
      return;
    }

    pendingTimeout = setTimeout(() => {
      pendingTimeout = null;
      resolve();
    }, ms / wipeSpeed);
  });


  function animate(element, keyframes, duration) {

    if (cancelled) return Promise.resolve();

    const animation = element.animate(keyframes, {
      duration: Math.max(0, duration / wipeSpeed),
      easing: 'linear',
      fill: 'forwards'
    });

    activeAnimation = animation;

    return animation.finished
      .then(() => {

        if (cancelled) return;

        // 最終フレームのスタイルを通常のCSSに反映
        const lastFrame = keyframes[keyframes.length - 1];

        for (const [property, value] of Object.entries(lastFrame)) {
          if (property !== 'offset' && property !== 'easing') {
            element.style[property] = value;
          }
        }

        // アニメーションを残さず終了
        animation.cancel();

      })
      .catch(() => { })
      .finally(() => {

        if (activeAnimation === animation) {
          activeAnimation = null;
        }

      });
  }


  // ========================================
  // ページを行と待機位置に分解
  // ========================================

  function parsePage(page) {

    const lines = [{ text: '', waits: [] }];

    let current = lines[0];

    // \n（文字列）と実際の改行を統一
    const normalized = page
      .replace(/\\n/g, '\n')
      .replace(/\r\n?/g, '\n');

    const tokens = normalized.split(/(\\w|\n)/);

    for (const token of tokens) {

      if (token === '\\w') {

        current.waits.push(current.text.length);
        continue;
      }

      if (token === '\n') {

        current = { text: '', waits: [] };
        lines.push(current);
        continue;
      }

      // 結合文字や絵文字を途中で分割しない
      const characters =
        typeof Intl.Segmenter === 'function'
          ? Array.from(
            new Intl.Segmenter('ja', {
              granularity: 'grapheme'
            }).segment(token),
            item => item.segment
          )
          : Array.from(token);

      for (const char of characters) {

        const candidate = current.text + char;

        if (
          current.text.length > 0 &&
          textWidth(candidate) > QUESTION_WIPE.maxWidth - 10
        ) {

          current = { text: '', waits: [] };
          lines.push(current);
        }

        current.text += char;
      }
    }

    return lines;
  }

  // ========================================
  // 1行のワイプ
  // ========================================

  async function wipeLine(lineData, element) {

    const fullText = lineData.text;
    const fullWidth = textWidth(fullText);

    const positions = lineData.waits;

    let previousPosition = 0;

    // ワイプ開始前は完全に非表示
    element.style.clipPath = 'inset(0 100% 0 0)';

    // 以下、既存処理

    for (const position of positions) {

      if (cancelled) return;

      if (position > previousPosition) {

        const fromWidth = textWidth(
          fullText.slice(0, previousPosition)
        );

        const toWidth = textWidth(
          fullText.slice(0, position)
        );

        await animate(element, [
          {
            clipPath:
              `inset(0 ${Math.max(0, fullWidth - fromWidth)}px 0 0)`
          },
          {
            clipPath:
              `inset(0 ${Math.max(0, fullWidth - toWidth)}px 0 0)`
          }
        ], (toWidth - fromWidth) * QUESTION_WIPE.msPerPixel);

      }

      if (cancelled) return;

      // \w：1秒停止
      await sleep(QUESTION_WIPE.waitMs);

      previousPosition = position;
    }

    if (cancelled) return;

    const fromWidth = textWidth(
      fullText.slice(0, previousPosition)
    );

    await animate(element, [
      {
        clipPath:
          `inset(0 ${Math.max(0, fullWidth - fromWidth)}px 0 0)`
      },
      {
        clipPath: 'inset(0 0px 0 0)'
      }
    ], (fullWidth - fromWidth) * QUESTION_WIPE.msPerPixel);

    if (!cancelled) {
      element.style.clipPath = 'none';
    }
  }

  // ========================================
  // ページ表示
  // ========================================

  async function showPage(page) {

    const lines = parsePage(page);

    const pageWidth = Math.max(
      1,
      ...lines.map(line => textWidth(line.text) + 10)
    );

    question.innerHTML = '';
    question.style.opacity = '1';

    const pageElement = document.createElement('div');

    pageElement.className = 'question-wipe-page';
    pageElement.style.width = `${pageWidth}px`;

    question.append(pageElement);

    const elements = [];

    for (const line of lines) {

      const row = document.createElement('div');

      row.className = 'question-wipe-line';
      row.textContent = line.text || '\u00a0';
      row.style.clipPath = 'inset(0 100% 0 0)';

      pageElement.append(row);
      elements.push(row);
    }

    // 行ごとに順番に表示
    for (let i = 0; i < lines.length; i++) {

      if (cancelled) return;

      await wipeLine(lines[i], elements[i]);
    }
  }

  // ========================================
  // アニメーション本体
  // ========================================

  async function run() {

    for (let i = 0; i < pages.length; i++) {

      if (cancelled) return;

      await showPage(pages[i]);

      if (cancelled) return;

      // 最終ページ以外はページチェンジ
      if (i < pages.length - 1) {

        await sleep(QUESTION_WIPE.pageWaitMs);

        if (cancelled) return;

        await animate(question, [
          { opacity: 1 },
          { opacity: 0 }
        ], QUESTION_WIPE.pageFadeMs);

        if (cancelled) return;
      }
    }

    if (cancelled) return;


    // EFFECT / POLYHEDRON限定
    // 問題文を表示し終えたら半透明にする
    if (['EFFECT', 'POLYHEDRON'].includes(q.type)) {

      await animate(question, [
        { opacity: 1 },
        { opacity: QUESTION_WIPE.specialOpacity }
      ], QUESTION_WIPE.specialFadeMs);

    }

  }


  // ========================================
  // 終了処理
  // ========================================

  state.questionWipeCleanup = () => {

    cancelled = true;

    if (pendingTimeout !== null) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }

    if (activeAnimation) {
      activeAnimation.cancel();
      activeAnimation = null;
    }
  };

  run().catch(console.error);
}

// 全国正解率：取得済みの値を解答時に固定して表示する
const NATIONAL_RATE_API = "https://rikeikentei-api.netlify.app/.netlify/functions/correct-rate"; // GitHub Pages test: API not configured yet
let nationalRateRequestSequence = 0;
let nationalRateSnapshot = null;
let nationalRateSubmitted = false;

function nationalRateKey(q) {
  const type = String(q?.type ?? '');
  const id = String(q?.id ?? '');
  return /^[A-Z][A-Z0-9_-]{0,39}$/.test(type) && /^[1-9]\d{0,11}$/.test(id)
    ? { type, id } : null;
}

async function loadNationalRate(q) {
  nationalRateSubmitted = false;

  if (!NATIONAL_RATE_API) {
    nationalRateSnapshot = null;
    return;
  }

  const seq = ++nationalRateRequestSequence;
  nationalRateSnapshot = null;

  const key = nationalRateKey(q);
  if (!key) return;
  try {
    const query = new URLSearchParams(key);
    const response = await fetch(`${NATIONAL_RATE_API}?${query}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (seq === nationalRateRequestSequence && !state.locked && data.success) {
      nationalRateSnapshot = Number.isInteger(data.rate) ? data.rate : null;
    }
  } catch (error) {
    console.warn('全国正解率の取得に失敗:', error);
  }
}

function finalizeNationalRate(q, correct, timeout) {
  if (!NATIONAL_RATE_API) return;
  // 先にスナップショットを確定。送信後の集計結果は画面に反映しない。
  const frozenRate = nationalRateSnapshot;
  ++nationalRateRequestSequence;
  const label = app.querySelector('#national-rate');
  if (label) {
    const rateValue = label.querySelector('.national-rate-value');
    if (rateValue) rateValue.textContent = frozenRate === null ? '-' : String(frozenRate);
  }
  if (state.mode === 'DEBUG') return;

  const key = nationalRateKey(q);
  if (!key) return;

  // 同じ出題に対する二重送信を防止
  if (nationalRateSubmitted) return;
  nationalRateSubmitted = true;

  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fetch(NATIONAL_RATE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...key, correct: Boolean(correct), timeout: Boolean(timeout), requestId }),
    keepalive: true
  }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }).catch(error => console.warn('全国正解率の送信に失敗:', error));
}

function showQuestion() {

  // ========================================
  // 最終問題の出題開始SE
  // ========================================

  if (
    state.mode !== 'DEBUG' &&
    state.mode !== 'HUNDRED_CHALLENGE' &&
    state.index === state.questions.length - 1
  ) {
    SoundManager.playSe('final');
  }

  clearTimer();

  if (state.activeQuestion) {
    state.activeQuestion.dispose();
    state.activeQuestion = null;
  }

  if (state.typingKeyHandler) {
    document.removeEventListener('keydown', state.typingKeyHandler);
    state.typingKeyHandler = null;
  }

  state.locked = false;

  // 新しい問題の出題中は入力禁止
  state.inputEnabled = false;
  const q = state.questions[state.index];

  if (!q) {
    result();
    return;
  }

  void loadNationalRate(q);

  const names = {
    OX: 'OXクイズ',
    CHOICE: '四択クイズ',
    MULTIPLE_CHOICE: '一問多答クイズ',
    ONE_WAY: '一方通行クイズ',
    NUMBER: 'タイピングクイズ',
    KANA: 'タイピングクイズ',
    KATAKANA: 'タイピングクイズ',
    CHARACTER_PANEL: '文字パネルクイズ',
    SLOT: 'スロットクイズ',
    GROUP: 'グループ分けクイズ',
    ORDER: '順番当てクイズ',
    'ORDER-A': '順番当てクイズ',
    REARRANGEMENT: '並べ替えクイズ',
    LINE_MATCHING: '線結びクイズ',
    RENSOU: '連想クイズ',
    EFFECT: 'エフェクトクイズ',
    POLYHEDRON: 'キューブクイズ',
    IMAGE_TOUCH: '画像タッチクイズ'
  };

  const limit = state.mode === 'HIGH_SPEED' ? 5 : 20;

  state.remaining = limit;
  state.timeLimit = limit;
  state.lastCountdownSecond = null;

  app.innerHTML = `
    <div class="quiz-shell screen-enter options-concealed">
      <header class="quiz-header">

        <div class="hud-panel rank-panel-web">
          <div class="hud-caption" id="rank-name">
            ${state.mode === 'DEBUG'
      ? 'デバッグ'
      : state.mode === 'HUNDRED_CHALLENGE'
        ? 'ライフ'
        :
        rankDisplayName(state.score)

    }
          </div>

          <div class="hud-number ${state.mode === 'HUNDRED_CHALLENGE' ? 'life-hearts' : ''}" id="rank-target">
            ${state.mode === 'DEBUG'
      ? 'ID: ' + esc(q.id)
      : state.mode === 'HUNDRED_CHALLENGE'
        ? '♥'.repeat(state.lives) + '♡'.repeat(5 - state.lives)
        : nextRankTarget(state.score)
    }
          </div>
        </div>

        <div class="quiz-heading">
          <div class="question-count">
            ${state.mode === 'HUNDRED_CHALLENGE'
      ? `第 ${state.index + 1} 問`
      : state.index === state.questions.length - 1
        ? '最終問題'
        : `第 ${state.index + 1} 問`
    }
          </div>

          <div class="qtype">
            ${names[q.type] || esc(q.type)}
          </div>
          <div class="national-rate" id="national-rate"><span>正解率</span><span class="national-rate-value">？</span><span>%</span></div>
        </div>

        <div class="hud-panel player-panel-web">
          <div class="hud-caption">
            ${state.mode === 'DEBUG'
      ? 'DEBUG'
      : state.mode === 'HUNDRED_CHALLENGE'
        ? '正解数'
        : esc(state.name)
    }
          </div>

          <div class="hud-number" id="player-score">
            ${state.mode === 'HUNDRED_CHALLENGE'
      ? state.correct + '問'
      : state.score
    }
          </div>
        </div>

      </header>

      <section class="question-center">
        <div class="board">
          <div class="question question-wipe-container"></div>
        </div>

        <div class="timer-area-web">
          <span id="clock">${limit.toFixed(2)}</span>
          <div class="bar">
            <div class="fill" id="fill"></div>
          </div>
        </div>
      </section>

      <section class="answer-bottom">

        ${state.mode !== 'DEBUG' &&
      state.mode !== 'HUNDRED_CHALLENGE'
      ? `
              <div class="progress-web" id="progress-web">
                ${progressMarkup()}
              </div>
            `
      : ''
    }

        <div id="question-ui"></div>

      </section>

      ${state.mode === 'DEBUG'
      ? `
            <div class="debug-toolbar">
              <span>
                DEBUG / ${esc(q.type)} / ID ${esc(q.id)}
              </span>
                <button id="debug-prev" type="button">
                  ◀ 前へ
                </button>

                <button id="debug-skip" type="button">
                  次へ ▶
                </button>
              <button id="debug-exit" type="button">
                終了
              </button>
            </div>

            ${state.debug.showAnswer
        ? `
                  <div class="debug-answer">
                    正解: ${esc(debugAnswerText(q))}
                  </div>
                `
        : ''
      }
          `
      : ''
    }

      <div class="feedback" id="feedback" role="status"></div>

    </div>
  `;

  const ui = app.querySelector('#question-ui');
  const questionInstance = QuestionManager.create(q, ui);

  questionInstance.render();
  state.activeQuestion = questionInstance;


  if (state.mode === 'DEBUG') {

    app.querySelector('#debug-prev')
      .addEventListener('click', debugPrevious);

    app.querySelector('#debug-skip')
      .addEventListener('click', debugNext);

    app.querySelector('#debug-exit')
      .addEventListener('click', () => title());
  }


  SoundManager.playSe('syutsudai');

  // ========================================
  // フェード終了後に出題開始
  // ========================================

  let questionStarted = false;

  const startQuestion = () => {

    if (questionStarted) return;

    // 別の問題へ移動していたら実行しない
    if (
      !ui.isConnected ||
      state.activeQuestion !== questionInstance ||
      state.locked
    ) {
      return;
    }

    questionStarted = true;

    // 問題文ワイプ開始と同時に選択肢の内容を公開
    ui.closest('.quiz-shell')?.classList.remove('options-concealed');

    // ========================================
    // キューブ・エフェクト・連想ヒント開始
    // ========================================

    if (typeof questionInstance.startAnimation === 'function') {
      questionInstance.startAnimation();
    }

    // ========================================
    // 問題文ワイプ開始
    // ========================================

    startQuestionWipe();

    // ========================================
    // タイマー開始
    // ========================================

    if (state.mode === 'DEBUG' && state.debug.disableTimer) {

      const clock = app.querySelector('#clock');
      if (clock) clock.textContent = '∞';

      const fill = app.querySelector('#fill');
      if (fill) fill.style.width = '100%';

    } else {

      state.deadline = performance.now() + limit * 1000;
      state.timer = setInterval(tick, 30);
      tick();
    }
  };

  // ========================================
  // フェード終了を待つ
  // ========================================

  ui.addEventListener('animationend', event => {

    if (
      event.target === ui &&
      event.animationName === 'question-ui-fade-in'
    ) {
      startQuestion();
    }

  });

  // CSSのフェード時間を取得
  const style = getComputedStyle(ui);

  const parseTime = value => {
    const s = value.trim();
    const n = parseFloat(s);
    if (!Number.isFinite(n)) return 0;
    return s.endsWith('ms') ? n : n * 1000;
  };

  const durations = style.animationDuration.split(',').map(parseTime);
  const delays = style.animationDelay.split(',').map(parseTime);

  const fadeIndex = style.animationName
    .split(',')
    .map(x => x.trim())
    .indexOf('question-ui-fade-in');

  if (fadeIndex === -1) {

    // フェード設定がない場合は即時開始
    startQuestion();

  } else {

    const duration = durations[fadeIndex % durations.length] || 0;
    const delay = delays[fadeIndex % delays.length] || 0;

    if (duration === 0) {
      startQuestion();
    } else {
      // animationend が発生しない場合の保険
      setTimeout(startQuestion, Math.max(0, duration + delay) + 100);
    }
  }
}


function tick() {
  if (state.locked) return;

  state.remaining = Math.max(
    0,
    (state.deadline - performance.now()) / 1000
  );

  const clock = document.querySelector('#clock');
  const fill = document.querySelector('#fill');

  if (clock) {
    clock.textContent = state.remaining.toFixed(2);
  }

  if (fill) {
    fill.style.width =
      (state.remaining / state.timeLimit * 100) + '%';


    fill.classList.toggle(
      'timer-yellow',
      state.remaining < 17.00 &&
      state.remaining >= 5
    );

    fill.classList.toggle(
      'timer-red',
      state.remaining < 5
    );

  }

  // ========================================
  // 残り5秒からカウントダウンSE
  // ========================================

  if (state.remaining > 0 && state.remaining <= 5) {

    const countdownSecond = Math.ceil(state.remaining);

    if (state.lastCountdownSecond !== countdownSecond) {

      state.lastCountdownSecond = countdownSecond;

      SoundManager.playSe('countdown');
    }
  }

  // ========================================
  // 時間切れ
  // ========================================

  if (state.remaining <= 0) {
    answer(null);
  }
}


function multiplier(d) {
  return ({
    EASY: 1,
    NORMAL: 1.1,
    HARD: 1.2
  })[String(d ?? '').toUpperCase()] ?? 1;
}

function points(q) {
  const elapsed = state.timeLimit - state.remaining;

  const rate = Math.max(
    0,
    Math.min(
      1,
      elapsed <= 3
        ? 1
        : .97 * (state.timeLimit - elapsed) /
        Math.max(1, state.timeLimit - 3)
    )
  );

  return Math.round(
    200 * multiplier(q.difficulty) * rate
  );
}


function disableQuestionButtons() {

  const quiz = app.querySelector('.quiz-shell');

  if (!quiz) return;

  // 解答後の見た目を、番号キーなどbutton以外にも適用する
  quiz.classList.add('answer-disabled');

  // 実際のボタン操作はすべて無効化
  quiz.querySelectorAll('button').forEach(button => {
    button.disabled = true;
  });

}



function answer(value) {

  if (state.locked || !state.inputEnabled) return;

  // 二重解答防止
  state.locked = true;

  // 入力禁止
  setQuestionInputEnabled(false);

  // すべてのボタンを無効化
  disableQuestionButtons();

  // 以下、既存の正誤判定処理


  state.locked = true;

  const visualCleanup = state.visualCleanup;
  const hintTimers = state.hintTimers;
  const questionWipeCleanup = state.questionWipeCleanup;

  state.visualCleanup = null;
  state.hintTimers = [];
  state.questionWipeCleanup = null;

  try {
    clearTimer();
  } finally {
    state.visualCleanup = visualCleanup;
    state.hintTimers = hintTimers;
    state.questionWipeCleanup = questionWipeCleanup;
  }

  if (value !== null) {
    SoundManager.playSe('kaitou');
  }

  const q = state.questions[state.index];

  const correct = value !== null && (
    q.type === 'OX'
      ? String(value).toUpperCase() === String(q.answer).toUpperCase()

      : q.type === 'LINE_MATCHING'
        ? value === true

        : q.type === 'IMAGE_TOUCH'
          ? value === true

          : q.type === 'GROUP'
            ? value === true

            : q.type === 'ORDER' || q.type === 'ORDER-A'
              ? value === true

              : q.type === 'REARRANGEMENT'
                ? String(value) === String(q.answer)

                : q.type === 'EFFECT'
                  ? acceptedAnswers(q).includes(String(value))

                  : q.type === 'POLYHEDRON'
                    ? String(value) === String(q.answer)

                    : q.type === 'MULTIPLE_CHOICE'
                      ? Array.isArray(value) &&
                      value.length === state.activeAnswers.length &&
                      value.every(v => state.activeAnswers.includes(v))

                      : ['NUMBER', 'KANA', 'KATAKANA'].includes(q.type)
                        ? (
                          Array.isArray(q.answers) && q.answers.length
                            ? q.answers
                            : [q.answer]
                        ).map(String).includes(String(value))

                        : q.type === 'CHARACTER_PANEL'
                          ? String(value) === String(q.answer)

                          : value === q.choices[0]
  );

  finalizeNationalRate(q, correct, value === null);

  const earned = correct ? points(q) : 0;

  if (correct) {
    state.correct++;

    if (state.mode !== 'DEBUG') {
      state.score += earned;
    }
  }

  if (state.mode === 'HUNDRED_CHALLENGE') {
    if (correct) {
      state.streak++;

      if (state.streak >= 7) {
        state.streak = 0;
        state.lives = Math.min(5, state.lives + 1);
      }

    } else {
      state.streak = 0;
      state.lives = Math.max(0, state.lives - 1);
    }
  }

  app.querySelectorAll('#question-ui button')
    .forEach(b => b.disabled = true);

  const feedback = document.querySelector('#feedback');

  if (feedback) {
    feedback.textContent = '';
    feedback.className = 'feedback';
  }

  // ========================================
  // 結果表示処理
  // ========================================

  const showFeedback = () => {

    state.feedbackTimer = null;

    SoundManager.playSe(
      value === null
        ? 'timeout'
        : correct
          ? 'correct'
          : 'incorrect'
    );


    const scoreEl = document.querySelector('#player-score');

    if (scoreEl) {

      if (state.mode === 'HUNDRED_CHALLENGE') {

        // 100問チャレンジ：正解数を即時更新
        scoreEl.textContent = state.correct + '問';

      } else {

        // 通常モード：従来どおりスコア加算アニメーション
        const displayed = Number(scoreEl.textContent) || 0;
        const target = state.score;

        animateScore(scoreEl, displayed, target);
      }
    }


    const rankEl = document.querySelector('#rank-name');

    if (rankEl) {
      rankEl.textContent = state.mode === 'DEBUG'
        ? 'デバッグ'
        : state.mode === 'HUNDRED_CHALLENGE'
          ? 'ライフ'
          :
          rankDisplayName(state.score)
        ;
    }

    const targetEl = document.querySelector('#rank-target');

    if (targetEl) {
      targetEl.textContent = state.mode === 'DEBUG'
        ? 'ID: ' + q.id
        : state.mode === 'HUNDRED_CHALLENGE'
          ? '♥'.repeat(state.lives) + '♡'.repeat(5 - state.lives)
          : nextRankTarget(state.score);
    }

    state.history.push({
      correct,
      timeout: value === null,
      earned
    });

    const progressEl = document.querySelector('#progress-web');

    if (progressEl) {
      progressEl.innerHTML = progressMarkup();
    }

    // ========================================
    // 問題文を消して結果を表示
    // ========================================

    hideQuestionText();

    if (feedback) {

      feedback.textContent = value === null
        ? '時間切れ'
        : correct
          ? '正解'
          : '不正解';

      feedback.classList.add(
        'feedback-visible',
        value === null
          ? 'feedback-timeout'
          : correct
            ? 'feedback-correct'
            : 'feedback-incorrect'
      );
    }

    const board = document.querySelector('.quiz-shell .board');

    if (board) {
      board.classList.add(
        correct ? 'board-correct' : 'board-incorrect'
      );
    }
  };

  // ========================================
  // 結果表示までの待機時間
  // ========================================

  if (value === null) {

    // 時間切れ：待機なしで即表示
    showFeedback();

  } else {

    // 正解・不正解：1秒待ってから表示
    state.feedbackTimer = setTimeout(
      showFeedback,
      1000
    );
  }

  // ========================================
  // 次の問題へ進む
  // ========================================

  const advanceDelay = value === null ? 2000 : 3000;

  state.advanceTimer = setTimeout(() => {
    state.advanceTimer = null;

    if (state.mode === 'DEBUG') {
      debugNext();
      return;
    }


    state.index++;

    // 100問チャレンジ
    if (state.mode === 'HUNDRED_CHALLENGE') {

      // ========================================
      // 100問チャレンジ終了判定
      // ========================================

      // 100問正解達成
      if (state.correct >= 100) {
        showHundredClear();
        return;
      }

      // ライフが0になった場合
      if (state.lives <= 0) {
        result();
        return;
      }

      // 問題をすべて出題したら再シャッフルして補充
      if (state.index >= state.questions.length) {
        const nextBatch = [...state.questionPool];

        shuffle(nextBatch);

        // 直前と同じ問題が連続しないようにする
        const previous = state.questions[state.index - 1];

        if (nextBatch.length > 1) {
          const first = nextBatch[0];

          if (first === previous) {
            [nextBatch[0], nextBatch[1]] =
              [nextBatch[1], nextBatch[0]];
          }
        }

        state.questions.push(...nextBatch);
      }

      showQuestion();
      return;
    }

    // 通常モード・ハイスピードモード
    showQuestion();


  }, advanceDelay);
}


function animateScore(el, from, to) {
  if (state.scoreAnimation !== null) {
    cancelAnimationFrame(state.scoreAnimation);
    state.scoreAnimation = null;
  }

  if (from === to) {
    el.textContent = String(to);
    return;
  }

  const start = performance.now();
  const duration = 600;

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);

    el.textContent = String(
      Math.round(from + (to - from) * ease)
    );

    if (t < 1) {
      state.scoreAnimation = requestAnimationFrame(frame);
    } else {
      state.scoreAnimation = null;
      el.textContent = String(to);
    }
  }

  state.scoreAnimation = requestAnimationFrame(frame);
}

function rank(score) {
  return score < 1000 ? 'C'
    : score < 2000 ? 'B'
      : score < 2500 ? 'A'
        : score < 3000 ? 'S'
          : score < 3500 ? 'SS'
            : score < 4000 ? 'SSS'
              : '自己ベスト';
}

function rankDisplayName(score) {
  const name = rank(score);

  return name === '自己ベスト'
    ? '自己ベスト'
    : name + 'ランク';
}

// ============================================================
// 100問チャレンジ達成演出
// ============================================================

// ============================================================
// 100問チャレンジ達成演出
// ============================================================

function showHundredClear() {

  SoundManager.playSe("applause");

  // タイマー停止
  clearTimer();

  // ========================================
  // 「正解」の判定表示を消す
  // ========================================

  const feedback = app.querySelector('#feedback');

  if (feedback) {

    feedback.textContent = '';
    feedback.className = 'feedback';
    feedback.style.display = 'none';

  }

  // ========================================
  // 問題板に達成メッセージを表示
  // ========================================

  const board = app.querySelector('.quiz-shell .board');

  if (!board) {
    result();
    return;
  }

  board.innerHTML = `
    <div class="hundred-clear-message">
      100問正解達成!!
    </div>
  `;

  // ========================================
  // 解答UIを非表示
  // ========================================

  const questionUI = app.querySelector('#question-ui');

  if (questionUI) {
    questionUI.style.visibility = 'hidden';
  }

  // ========================================
  // 3秒後にリザルト画面へ
  // ========================================

  setTimeout(() => {
    result();
  }, 3000);

}

function result() {
  if (state.mode === 'DEBUG') {
    debugSettings('デバッグセッションを終了しました。');
    return;
  }

  clearTimer();

  const challenge = state.mode === 'HUNDRED_CHALLENGE';
  const highSpeed = state.mode === 'HIGH_SPEED';
  const score = state.score;

  // ランク判定
  const resultRank = score < 500 ? 'D'
    : score < 1000 ? 'C'
      : score < 1500 ? 'B'
        : score < 2000 ? 'A'
          : score < 3000 ? 'S'
            : score < 4000 ? 'SS'
              : 'SSS';

  // 自己ベストの取得
  const key = 'quizgame_web_best_STANDARD';
  let previousBest = 0;

  try {
    previousBest = Number(localStorage.getItem(key)) || 0;
  } catch (e) {
    console.warn(e);
  }

  // スタンダードモードのみ自己ベストを更新
  if (!challenge && !highSpeed && score > previousBest) {
    try {
      localStorage.setItem(key, String(score));
    } catch (e) {
      console.warn(e);
    }
  }

  // リザルト画面

  app.innerHTML = `
    <div class="result-simple screen-enter">

        <div class="result-simple-title">RESULT</div>

        <div class="result-simple-board">

            ${challenge ? `
                <div class="result-simple-label">CORRECT</div>
                  <div class="result-simple-rank">
                      ${state.correct}問
                  </div>
            ` : `
                <div class="result-simple-label">RANK</div>
                <div class="result-simple-rank">
                    ${resultRank}
                </div>
            `}

            <div class="result-simple-label">SCORE</div>
            <div class="result-simple-score">
                ${score}
            </div>

        </div>

        <div class="result-simple-actions">
            ${button('タイトル画面へ', 'title')}
        </div>

    </div>
`;


  bind({
    title: () => title()
  });
}


// ============================================================
// 起動時ロード処理
// ============================================================

// 設定を読み込み
readSettings();


// ============================================================
// プリロード対象の背景画像
// ============================================================

const PRELOAD_IMAGES = [
  ...new Set(Object.values(MODE_BACKGROUNDS))
];


// ============================================================
// ロード画面表示
// ============================================================
function showStartupLoading() {

  app.innerHTML = `
    <div class="startup-loading">

      <div class="startup-loading-status">
        LOADING...
      </div>

      <div class="startup-loading-bar">
        <div
          class="startup-loading-progress"
          id="load-progress"
        ></div>
      </div>

      <div
        class="startup-loading-percent"
        id="load-percent"
      >
        0%
      </div>

      <div
        class="startup-loading-detail"
        id="load-detail"
      >
        読み込みを準備しています...
      </div>

    </div>
  `;
}


// ============================================================
// 画像プリロード
// ============================================================

function preloadImage(src) {

  return new Promise((resolve, reject) => {

    const image = new Image();

    image.onload = async () => {

      try {

        // 可能なら画像のデコードまで完了させる
        if (typeof image.decode === 'function') {
          await image.decode();
        }

        resolve(image);

      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(
        new Error(`画像の読み込みに失敗: ${src}`)
      );
    };

    image.src = src;

  });
}


// ============================================================
// 起動時ロード
// ============================================================

async function startup() {

  // ========================================
  // ロード画面表示
  // ========================================

  showStartupLoading();

  const progress = document.querySelector('#load-progress');
  const percent = document.querySelector('#load-percent');
  const detail = document.querySelector('#load-detail');


  // ========================================
  // 読み込み対象を登録
  // ========================================

  const tasks = [

    // 背景画像
    ...PRELOAD_IMAGES.map(src => ({

      label: `画像: ${src}`,

      load: () => preloadImage(src)

    })),


    // SE
    ...Array.from(SoundManager.seNames, name => ({

      label: `SE: ${name}`,

      load: async () => {

        await SoundManager.preloadSe(name);

        // 読み込みに成功したか確認
        if (!SoundManager.effects.has(name)) {
          throw new Error(
            `SEの読み込みに失敗: ${name}`
          );
        }

      }

    })),


    // BGM
    ...Object.keys(SoundManager.music).map(mode => ({

      label: `BGM: ${mode}`,

      load: async () => {

        await SoundManager.preloadBgm(mode);

        // 読み込みに成功したか確認
        if (!SoundManager.bgmCache.has(mode)) {
          throw new Error(
            `BGMの読み込みに失敗: ${mode}`
          );
        }

      }

    }))

  ];


  // ========================================
  // 進捗管理
  // ========================================

  const total = tasks.length;

  let completed = 0;

  const errors = [];


  function updateProgress() {

    const percentage = total === 0
      ? 100
      : Math.round(completed / total * 100);

    progress.style.width = `${percentage}%`;
    percent.textContent = `${percentage}%`;

  }

  // ========================================
  // 全素材を並列読み込み
  // ========================================

  let lastLoadingLabel = '';

  await Promise.all(

    tasks.map(async task => {

      // 現在読み込み中のファイル名を表示
      lastLoadingLabel = task.label;
      detail.textContent = `${task.label} を読み込み中...`;

      try {

        await task.load();

        console.log(`読み込み完了: ${task.label}`);

      } catch (error) {

        console.error(`読み込み失敗: ${task.label}`, error);
        errors.push(task.label);

      } finally {

        completed++;

        updateProgress();

        // 進捗表示
        if (completed < total) {
          detail.textContent =
            `${task.label} の処理が完了しました`;
        } else {
          detail.textContent = '読み込み完了！';
        }

      }

    })

  );


  // ========================================
  // 読み込み結果
  // ========================================

  if (errors.length > 0) {

    console.warn(
      `${errors.length}件の素材を読み込めませんでした`,
      errors
    );

  } else {

    console.log(
      'すべての素材の読み込みが完了しました'
    );

  }


  // ========================================
  // 100%表示を描画
  // ========================================

  progress.style.width = '100%';

  await new Promise(resolve => {

    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });

  });


  // ========================================
  // タイトル画面へ自動遷移
  // ========================================

  title();

}


// ============================================================
// 初回操作時に音声を有効化
// ============================================================

// ブラウザの自動再生制限への対応。
// ロード画面にクリック操作は要求しない。

function unlockStartupAudio() {

  document.removeEventListener(
    'pointerdown',
    unlockStartupAudio
  );

  document.removeEventListener(
    'keydown',
    unlockStartupAudio
  );

  SoundManager.init();

  // タイトル画面が表示されている場合はBGM再生
  if (
    app.querySelector('.title-screen') &&
    !SoundManager.bgm
  ) {

    SoundManager.playBgm('TITLE');

  }

}

document.addEventListener(
  'pointerdown',
  unlockStartupAudio
);

document.addEventListener(
  'keydown',
  unlockStartupAudio
);


// ============================================================
// ゲーム起動
// ============================================================

startup().catch(error => {

  console.error(
    '起動処理に失敗しました:',
    error
  );

  app.innerHTML = `
    <div class="startup-loading">
      <div class="startup-loading-status">
        LOADING ERROR
      </div>
    </div>
  `;

});
