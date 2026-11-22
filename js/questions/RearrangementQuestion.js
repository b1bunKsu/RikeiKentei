// REARRANGEMENT: extracted from Phase 9, behavior preserved.

// ========================================
// バリデーション
// ========================================

function validRearrangement(q) {
  if (
    q.type !== 'REARRANGEMENT' ||
    typeof q.answer !== 'string'
  ) return false;

  const letters = Array.from(q.answer);

  return letters.length >= 3
    && letters.length <= 9
    && new Set(letters).size > 1;
}

// ========================================
// UI生成
// ========================================

function createRearrangementUI(q, ui) {

  // ========================================
  // 文字のシャッフル
  // ========================================

  const original = Array.from(q.answer);
  const letters = shuffle([...original]);

  // 最初から正解の並びにならないようにする
  if (letters.every((x, i) => x === original[i])) {
    const i = letters.findIndex(x => x !== letters[0]);

    [letters[0], letters[i]] = [letters[i], letters[0]];
  }

  let selected = -1;
  let swapping = false;

  // ========================================
  // UI生成
  // ========================================

  ui.innerHTML = `
    <div class="rearrange-cards">
      ${letters.map((x, i) => `
        <button class="rearrange-card" data-card="${i}">
          ${esc(x)}
        </button>
      `).join('')}
    </div>

    <button class="btn rearrange-ok" id="rearrange-ok">
      OK
    </button>
  `;

  const cards = [...ui.querySelectorAll('[data-card]')];

  // ========================================
  // カード表示更新
  // ========================================

  const render = () => {
    cards.forEach((el, i) => {
      el.textContent = letters[i];
      el.classList.toggle('selected', i === selected);
    });
  };

  // ========================================
  // カードクリック処理
  // ========================================

  cards.forEach((card, i) => {

    card.addEventListener('click', () => {

      if (state.locked || swapping) return;

      // ========================================
      // 同じカードをクリック：選択解除
      // ========================================

      if (selected === i) {

        SoundManager.playSe("click");

        selected = -1;
        render();
        return;
      }

      // ========================================
      // 1枚目のカードを選択
      // ========================================

      if (selected === -1) {

        SoundManager.playSe("click");

        selected = i;
        render();
        return;
      }

      // ========================================
      // 2枚目のカードを選択：交換開始
      // ========================================
      SoundManager.playSe("click");
      SoundManager.playSe("shuffle");

      const a = selected;
      const b = i;

      swapping = true;
      selected = -1;

      // カード間の距離
      const distance = cards[b].offsetLeft - cards[a].offsetLeft;

      // アニメーション設定
      const animationOpts = {
        duration: 180,
        easing: 'ease-in-out'
      };

      // ========================================
      // 1枚目のカードの移動
      // ========================================

      const aAnim = cards[a].animate(
        [
          {
            transform: 'translate(0,0)'
          },
          {
            transform: `translate(${distance / 2}px,-42px)`,
            offset: 0.5
          },
          {
            transform: `translate(${distance}px,0)`
          }
        ],
        animationOpts
      );

      // ========================================
      // 2枚目のカードの移動
      // ========================================

      const bAnim = cards[b].animate(
        [
          {
            transform: 'translate(0,0)'
          },
          {
            transform: `translate(${-distance / 2}px,42px)`,
            offset: 0.5
          },
          {
            transform: `translate(${-distance}px,0)`
          }
        ],
        animationOpts
      );

      // ========================================
      // アニメーション終了後に文字を交換
      // ========================================

      Promise.allSettled([
        aAnim.finished,
        bAnim.finished
      ]).then(() => {

        [letters[a], letters[b]] = [letters[b], letters[a]];

        swapping = false;

        if (
          state.questions[state.index] === q &&
          !state.locked
        ) {
          render();
        }
      });

    });
  });

  // ========================================
  // OKボタン
  // ========================================

  ui.querySelector('#rearrange-ok').addEventListener('click', () => {

    if (swapping || state.locked) return;

    answer(letters.join(''));
  });
}

// ========================================
// REARRANGEMENTクラス
// ========================================

class RearrangementQuestion extends BaseQuestion {

  render() {
    const q = this.question;
    const ui = this.container;

    createRearrangementUI(q, ui);
  }
}