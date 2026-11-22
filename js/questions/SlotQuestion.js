
// SLOT: JavaFX-style reel rotation animation.

function validSlot(q) {
  if (
    q.type !== 'SLOT' ||
    !Array.isArray(q.choices) ||
    !q.choices.length
  ) return false;

  const n = chars(q.choices[0]).length;

  return n >= 2
    && n <= 6
    && q.choices.every(
      x => typeof x === 'string' && chars(x).length === n
    )
    && Array.from(
      { length: n },
      (_, i) => new Set(q.choices.map(x => chars(x)[i])).size
        === q.choices.length
    ).every(Boolean);
}

function createSlotUI(q, ui) {
  const n = chars(q.choices[0]).length;

  const reels = Array.from(
    { length: n },
    (_, i) => shuffle(q.choices.map(x => chars(x)[i]))
  );

  const positions = reels.map(
    r => Math.floor(Math.random() * r.length)
  );

  // ========================================
  // アニメーション設定
  // ========================================

  const ROTATE_DURATION = 100;
  const INTRO_DURATION = 150;
  const INTRO_STEPS = 3;

  let animating = false;
  let disposed = false;

  // ========================================
  // UI生成
  // ========================================

  ui.innerHTML = `
  <div class="slot-area">
    <div class="slot-reels">
      ${reels.map((r, i) => `
        <div class="slot-column">
          <button class="slot-arrow" data-up="${i}">▲</button>

          <div class="slot-window" data-reel="${i}"></div>

          <button class="slot-arrow" data-down="${i}">▼</button>
        </div>
      `).join('')}

      <!-- 中央の解答枠 -->
      <div class="slot-answer-frame"></div>
    </div>

    <button class="btn slot-confirm" id="slot-ok">OK</button>
  </div>
`;

  const windows = reels.map(
    (_, i) => ui.querySelector(`[data-reel="${i}"]`)
  );

  const okButton = ui.querySelector('#slot-ok');

  // ========================================
  // リール表示
  // ========================================

  function renderReel(i) {
    const reel = reels[i];
    const pos = positions[i];
    const size = reel.length;

    const prev = reel[(pos - 1 + size) % size];
    const current = reel[pos];
    const next = reel[(pos + 1) % size];

    windows[i].innerHTML = `
      <div class="slot-adjacent">${esc(prev)}</div>
      <div class="slot-current">${esc(current)}</div>
      <div class="slot-adjacent">${esc(next)}</div>
    `;
  }

  function render() {
    reels.forEach((_, i) => renderReel(i));
  }

  // ========================================
  // 回転中の操作制御
  // ========================================
  function setAnimating(value) {
    animating = value;

    ui.querySelectorAll('.slot-arrow').forEach(button => {
      button.disabled = value;
    });

    okButton.disabled = value;
  }

  // ========================================
  // リール1文字分の回転
  //
  // direction:
  //   +1 = 次の文字へ（▲）
  //   -1 = 前の文字へ（▼）
  // ========================================

  async function rotateReel(i, direction, duration = ROTATE_DURATION) {

    const reel = reels[i];
    const size = reel.length;
    const currentPos = positions[i];
    const nextPos = (currentPos + direction + size) % size;
    const window = windows[i];

    const ADJACENT_HEIGHT = 46;
    const CURRENT_HEIGHT = 46;
    const CELL_HEIGHT = 46;

    // 3行分の表示高さ
    const VIEW_HEIGHT = ADJACENT_HEIGHT * 2 + CURRENT_HEIGHT;

    window.style.height = `${VIEW_HEIGHT}px`;
    window.style.position = 'relative';
    window.style.overflow = 'hidden';

    const offsets = [-2, -1, 0, 1, 2];

    const strip = document.createElement('div');
    strip.className = 'slot-animation-strip';

    strip.innerHTML = offsets.map(offset => {
      const pos = (currentPos + offset + size * 3) % size;

      return `
      <div class="slot-spin-cell">
        ${esc(reel[pos])}
      </div>
    `;
    }).join('');

    window.replaceChildren(strip);

    // 開始位置：中央の文字が表示領域中央に来るように
    const startY = VIEW_HEIGHT / 2 - CELL_HEIGHT * 2.5;

    // direction=1 なら上へ、-1 なら下へ
    const endY = startY - direction * CELL_HEIGHT;

    strip.style.transform = `translateY(${startY}px)`;

    try {
      const animation = strip.animate(
        [
          { transform: `translateY(${startY}px)` },
          { transform: `translateY(${endY}px)` }
        ],
        {
          duration,
          easing: 'linear',
          fill: 'forwards'
        }
      );

      await animation.finished;
    } catch (error) {
      return;
    }

    if (!ui.isConnected || disposed) return;

    positions[i] = nextPos;
    renderReel(i);
  }

  // ========================================
  // 手動回転
  // ========================================

  async function rotate(i, direction) {
    if (state.locked || animating || disposed) return;

    setAnimating(true);
    SoundManager.playSe("slot");

    try {
      await rotateReel(i, direction);
    } finally {
      if (ui.isConnected && !disposed) {
        setAnimating(false);
      }
    }
  }

  // ========================================
  // 初回演出
  // 全リールを同時に3回転
  // ========================================

  async function startIntroSpin() {
    if (disposed || !ui.isConnected) return;

    setAnimating(true);

    try {
      for (let step = 0; step < INTRO_STEPS; step++) {
        if (
          disposed ||
          !ui.isConnected ||
          state.locked ||
          state.questions[state.index] !== q
        ) break;

        SoundManager.playSe("slot");

        await Promise.all(
          reels.map((_, i) =>
            rotateReel(i, -1, INTRO_DURATION)
          )
        );
      }
    } finally {
      if (ui.isConnected && !disposed) {
        setAnimating(false);
      }
    }
  }

  // ========================================
  // ▲ボタン
  // ========================================

  ui.querySelectorAll('[data-up]').forEach(button => {
    button.addEventListener('click', () => {
      const i = Number(button.dataset.up);
      rotate(i, 1);
    });
  });

  // ========================================
  // ▼ボタン
  // ========================================

  ui.querySelectorAll('[data-down]').forEach(button => {
    button.addEventListener('click', () => {
      const i = Number(button.dataset.down);
      rotate(i, -1);
    });
  });

  // ========================================
  // OKボタン
  // ========================================

  okButton.addEventListener('click', () => {
    if (state.locked || animating || disposed) return;

    const selectedAnswer = reels.map(
      (reel, i) => reel[positions[i]]
    ).join('');

    answer(selectedAnswer);
  });

  // ========================================
  // 初期描画・初回演出
  // ========================================

  render();

  startIntroSpin();
}

// ========================================
// SLOTクラス
// ========================================

class SlotQuestion extends BaseQuestion {
  render() {
    const q = this.question;
    const ui = this.container;

    createSlotUI(q, ui);
  }
}