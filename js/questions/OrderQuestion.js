// ORDER: extracted from Phase 9, behavior preserved.

// ========================================
// バリデーション
// ========================================

function validOrdering(q) {
  if (
    !['ORDER', 'ORDER-A'].includes(q.type) ||
    !Array.isArray(q.choices)
  ) return false;

  const choices = q.choices;

  return choices.length >= 3
    && choices.every(
      x => typeof x === 'string' && !x.includes(',')
    )
    && new Set(choices).size === choices.length;
}

// ========================================
// UI生成
// ========================================

function createOrderingUI(q, ui) {

  const all = q.choices.map(String);

  const showAll =
    q.type === 'ORDER-A' ||
    q.showAllChoices === true;

  // ========================================
  // 表示する選択肢の数
  // ========================================

  const count = showAll
    ? all.length
    : Math.min(
        all.length,
        3 + Math.floor(
          Math.random() * (Math.min(5, all.length) - 2)
        )
      );

  const displayed = shuffle(
    showAll
      ? [...all]
      : shuffle([...all]).slice(0, count)
  );

  const selected = [];

  // ========================================
  // 表示更新
  // ========================================

  const render = () => {

    const slots = ui.querySelector('#order-slots');

    slots.innerHTML = displayed.map((_, i) => `
      <button
        class="order-slot"
        data-slot="${i}"
        title="クリックでこの位置の選択を解除"
      >
        ${
          i < selected.length
            ? String.fromCharCode(
                65 + displayed.indexOf(selected[i])
              )
            : '　'
        }
      </button>

      ${
        i < displayed.length - 1
          ? '<span class="order-arrow">▶</span>'
          : ''
      }
    `).join('');

    // ========================================
    // 解答欄のクリック：選択解除
    // ========================================

    slots.querySelectorAll('[data-slot]').forEach(el => {

      el.addEventListener('click', () => {

        if (state.locked) return;

        const i = Number(el.dataset.slot);

        if (i < selected.length) {

          // クリック効果音
          SoundManager.playSe("click");

          selected.splice(i, 1);
          render();
        }
      });
    });

    // ========================================
    // 選択済みの表示更新
    // ========================================

    ui.querySelectorAll('[data-order]').forEach(el => {

      el.classList.toggle(
        'selected',
        selected.includes(
          displayed[Number(el.dataset.order)]
        )
      );
    });
  };

  // ========================================
  // UI生成
  // ========================================

  ui.innerHTML = `
    <div class="order-slots" id="order-slots"></div>

    <div class="order-choices">
      ${displayed.map((x, i) => `
        <div class="order-row">
          <span class="order-number">
            ${String.fromCharCode(65 + i)}
          </span>

          <button class="btn order-choice" data-order="${i}">
            ${esc(x)}
          </button>
        </div>
      `).join('')}
    </div>
  `;

  // ========================================
  // 選択肢クリック処理
  // ========================================

  ui.querySelectorAll('[data-order]').forEach(el => {

    el.addEventListener('click', () => {

      if (state.locked) return;

      // クリック効果音
      SoundManager.playSe("click");

      const choice = displayed[Number(el.dataset.order)];
      const i = selected.indexOf(choice);

      if (i >= 0) {
        selected.splice(i, 1);
      } else {
        selected.push(choice);
      }

      render();

      // ========================================
      // すべて選択したら自動解答
      // ========================================

      if (selected.length === displayed.length) {

        // Java model:
        // selected.equals(allChoices.retainAll(selected))
        const expected = all.filter(
          c => selected.includes(c)
        );

        answer(
          selected.length === expected.length &&
          selected.every(
            (x, j) => x === expected[j]
          )
        );
      }
    });
  });

  // 初期表示
  render();
}

// ========================================
// ORDERクラス
// ========================================

class OrderQuestion extends BaseQuestion {

  render() {
    const q = this.question;
    const ui = this.container;

    createOrderingUI(q, ui);
  }
}