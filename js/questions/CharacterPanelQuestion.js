// CHARACTER_PANEL: extracted from Phase 9, behavior preserved.

// ========================================
// バリデーション
// ========================================

function validCharacter(q) {
  if (
    q.type !== 'CHARACTER_PANEL' ||
    typeof q.answer !== 'string' ||
    !Array.isArray(q.choices) ||
    q.choices.length !== 10
  ) return false;

  const a = chars(q.answer);
  const pool = q.choices.map(String);

  return a.length >= 3
    && a.length <= 6
    && new Set(pool).size >= (a.length === 3 ? 8 : 10)
    && a.every(c => pool.includes(c));
}

// ========================================
// UI生成
// ========================================

function createCharacterPanelUI(q, ui) {

  const target = chars(q.answer);
  const count = target.length === 3 ? 8 : 10;

  // ========================================
  // パネルの準備
  // ========================================

  const needed = [...new Set(target)];

  const pool = shuffle(
    [...new Set(q.choices.map(String))]
      .filter(x => !needed.includes(x))
  );

  const panels = shuffle([
    ...needed,
    ...pool.slice(0, count - needed.length)
  ]);

  let typed = [];

  // ========================================
  // UI生成
  // ========================================

  ui.innerHTML = `
    <div class="character-answers">
      ${target.map(() => `
        <span class="character-answer"></span>
      `).join('')}
    </div>

    <div
      class="character-grid"
      style="grid-template-columns:repeat(${count === 8 ? 4 : 5},98px)"
    >
      ${panels.map((x, i) => `
        <button class="character-tile" data-panel="${i}">
          ${esc(x)}
        </button>
      `).join('')}
    </div>
  `;

  const boxes = ui.querySelectorAll('.character-answer');

  // ========================================
  // パネルクリック処理
  // ========================================

  ui.querySelectorAll('[data-panel]').forEach(el => {

    el.addEventListener('click', () => {

      if (state.locked || typed.length >= target.length) return;

      // クリック効果音
      SoundManager.playSe("click");

      // 選択した文字を追加
      typed.push(panels[Number(el.dataset.panel)]);

      // 解答欄に文字を表示
      boxes[typed.length - 1].textContent = typed.at(-1);

      // すべて入力したら自動解答
      if (typed.length === target.length) {
        answer(typed.join(''));
      }

    });
  });
}

// ========================================
// CHARACTER_PANELクラス
// ========================================

class CharacterPanelQuestion extends BaseQuestion {

  render() {
    const q = this.question;
    const ui = this.container;

    createCharacterPanelUI(q, ui);
  }
}