// LINE_MATCHING: extracted from Phase 9, behavior preserved.

function validLineMatching(q) {
  return q.type === 'LINE_MATCHING'
    && Array.isArray(q.leftChoices)
    && Array.isArray(q.rightChoices)
    && q.leftChoices.length >= 3
    && q.leftChoices.length <= 5
    && q.leftChoices.length === q.rightChoices.length
    && q.leftChoices.every(x => typeof x === 'string')
    && q.rightChoices.every(x => typeof x === 'string')
    && new Set(q.leftChoices).size === q.leftChoices.length
    && new Set(q.rightChoices).size === q.rightChoices.length;
}

function createLineMatchingUI(q, ui) {
  const n = q.leftChoices.length;

  const left = shuffle(
    q.leftChoices.map((text, original) => ({ text, original }))
  );

  const right = shuffle(
    q.rightChoices.map((text, original) => ({ text, original }))
  );

  const matches = new Map();

  let activeLeft = null;
  let activeRight = null;

  // ========================================
  // UI生成
  // ========================================

  ui.innerHTML = `
    <div class="line-area">
      <svg
        class="line-svg"
        viewBox="0 0 900 270"
        preserveAspectRatio="none"
      ></svg>

      <div class="line-side line-left">
        ${left.map((v, i) => `
          <div class="line-row" data-left-row="${i}">
            <button class="line-text" data-left="${i}">
              ${esc(v.text)}
            </button>
            <span class="line-key" data-left-key="${i}">
              ${'ABCDE'[i]}
            </span>
          </div>
        `).join('')}
      </div>

      <div class="line-side line-right">
        ${right.map((v, i) => `
          <div class="line-row" data-right-row="${i}">
            <span class="line-key" data-right-key="${i}">
              ${i + 1}
            </span>
            <button class="line-text" data-right="${i}">
              ${esc(v.text)}
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const area = ui.querySelector('.line-area');
  const svg = ui.querySelector('.line-svg');

  // ========================================
  // 表示更新
  // ========================================

  function render() {
    // 左側の選択状態・接続状態
    ui.querySelectorAll('[data-left-row]').forEach((row, i) => {
      row.classList.toggle('active', i === activeLeft);
      row.classList.toggle('connected', matches.has(i));
    });

    // 右側の選択状態・接続状態
    ui.querySelectorAll('[data-right-row]').forEach((row, i) => {
      row.classList.toggle('active', i === activeRight);
      row.classList.toggle(
        'connected',
        [...matches.values()].includes(i)
      );
    });

    // ========================================
    // 接続線の描画
    // ========================================

    const bounds = area.getBoundingClientRect();

    const scaleX = 900 / bounds.width;
    const scaleY = 270 / bounds.height;

    svg.innerHTML = [...matches].map(([l, r]) => {
      const a = ui.querySelector(
        `[data-left-key="${l}"]`
      ).getBoundingClientRect();

      const b = ui.querySelector(
        `[data-right-key="${r}"]`
      ).getBoundingClientRect();

      const x1 = (a.right - bounds.left) * scaleX;
      const y1 = (a.top + a.height / 2 - bounds.top) * scaleY;

      const x2 = (b.left - bounds.left) * scaleX;
      const y2 = (b.top + b.height / 2 - bounds.top) * scaleY;

      return `
        <line
          x1="${x1}"
          y1="${y1}"
          x2="${x2}"
          y2="${y2}"
          stroke="#ff4747"
          stroke-width="4"
        />
      `;
    }).join('');
  }

  // ========================================
  // 左右の選択肢を接続
  // ========================================

  function connect(l, r) {
    // 左側の既存接続を解除
    matches.delete(l);

    // 右側の既存接続を解除
    for (const [oldL, oldR] of matches) {
      if (oldR === r) {
        matches.delete(oldL);
      }
    }

    // 新しい接続を登録
    matches.set(l, r);

    activeLeft = null;
    activeRight = null;

    render();

    // すべて接続されたら自動解答
    if (matches.size === n) {
      answer(
        [...matches].every(
          ([li, ri]) =>
            left[li].original === right[ri].original
        )
      );
    }
  }

  // ========================================
  // 左側の選択肢
  // ========================================

  ui.querySelectorAll('[data-left]').forEach(b => {
    b.addEventListener('click', () => {
      if (state.locked) return;

      SoundManager.playSe("click");

      const i = +b.dataset.left;

      if (activeRight !== null) {
        connect(i, activeRight);
      } else {
        activeLeft = activeLeft === i ? null : i;
        render();
      }
    });
  });

  // ========================================
  // 右側の選択肢
  // ========================================

  ui.querySelectorAll('[data-right]').forEach(b => {
    b.addEventListener('click', () => {
      if (state.locked) return;

      SoundManager.playSe("click");

      const i = +b.dataset.right;

      if (activeLeft !== null) {
        connect(activeLeft, i);
      } else {
        activeRight = activeRight === i ? null : i;
        render();
      }
    });
  });

  // 初期描画
  render();
}

// ========================================
// LINE_MATCHING クラス
// ========================================

class LineMatchingQuestion extends BaseQuestion {
  render() {
    const q = this.question;
    const ui = this.container;

    createLineMatchingUI(q, ui);
  }
}