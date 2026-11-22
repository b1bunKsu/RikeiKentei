
function validRensou(q) {
  return (
    q.type === "RENSOU" &&
    Array.isArray(q.hints) &&
    q.hints.length === 4 &&
    q.hints.every(x => typeof x === "string") &&
    Array.isArray(q.choices) &&
    q.choices.length === 4 &&
    q.choices.every(x => typeof x === "string")
  );
}


// ============================================================
// RENSOU クイズ
// ============================================================

function createRensouUI(q, ui) {

  // 選択肢をシャッフル
  const options = shuffle([...q.choices]);

  // 既存のタイマー管理に登録
  const timers = state.hintTimers = [];

  // ========================================
  // 連想クイズのフェード速度
  // ========================================

  // 通常モード：0.5秒
  // ハイスピードモード：0.1秒
  const hintFadeDuration =
    state.mode === 'HIGH_SPEED' ? 0.1 : 0.5;

  // CSS変数に反映
  ui.style.setProperty(
    '--rensou-hint-fade-duration',
    `${hintFadeDuration}s`
  );

  // ----------------------------------------------------------
  // ヒント・選択肢のHTML
  // ----------------------------------------------------------

  ui.innerHTML = `
    <div class="rensou-java-root">

<div class="rensou-java-hints" style="visibility: hidden;">
        ${q.hints.map((_, i) => `
          <div
            class="rensou-java-hint-row"
            data-hint="${i}"
          >
            <div class="rensou-java-placeholder">
              ヒント${i + 1}
            </div>

            <div class="rensou-java-hint-text">
              ${esc(q.hints[i])}
            </div>
          </div>
        `).join("")}
      </div>

      <div class="rensou-java-choices">
        ${options.map((choice, i) => `
          <div class="rensou-java-choice-row">

            <div class="rensou-java-number">
              ${"ABCD"[i]}
            </div>

            <button
              class="rensou-java-choice"
              type="button"
              data-rensou="${i}"
            >
              ${esc(choice)}
            </button>

          </div>
        `).join("")}
      </div>

    </div>
  `;

  // ----------------------------------------------------------
  // 回答処理
  // ----------------------------------------------------------

  ui.querySelectorAll("[data-rensou]").forEach(button => {

    button.addEventListener("click", () => {

      const index = Number(button.dataset.rensou);

      // 選択中の表示
      button.classList.add("selected");

      const number = button.previousElementSibling;

      if (number) {
        number.classList.add("selected");
      }

      answer(options[index]);
    });
  });

  // ----------------------------------------------------------
  // ヒントの表示
  // ----------------------------------------------------------

  function revealHint(index) {

    if (state.locked) return;

    // 別の問題へ移動していたら終了
    if (
      state.questions[state.index] !==
      (q._originalQuestion || q)
    ) {
      return;
    }

    const row = ui.querySelector(
      `[data-hint="${index}"]`
    );

    if (!row) return;

    row.classList.add("revealed");
  }

  // ----------------------------------------------------------
  // タイマー
  // ----------------------------------------------------------

  // ========================================
  // ヒント表示開始（遅延実行）
  // ========================================

  let started = false;

  return function startHints() {

    if (started || !ui.isConnected) return;
    started = true;

    // ========================================
    // ヒント欄を一斉に表示
    // ========================================

    const hintsContainer = ui.querySelector(
      '.rensou-java-hints'
    );

    if (hintsContainer) {
      hintsContainer.style.visibility = 'visible';
    }

    // ========================================
    // ヒント1をすぐに解放
    // ========================================

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (ui.isConnected) {
          revealHint(0);
        }
      });
    });

    // ========================================
    // ヒント2以降の表示間隔
    // ========================================

    // ハイスピードモードでは約1秒間隔
    const isHighSpeed = state.mode === 'HIGH_SPEED';

    // 通常モードでは従来の文字数依存
    function getHintDelay(hint) {

      if (isHighSpeed) {
        return (1 + Array.from(hint).length * 0.003) * 1000;
      }

      return (3 + Array.from(hint).length * 0.1) * 1000;
    }

    // ヒント2の表示時刻
    let delay = getHintDelay(q.hints[0]);

    q.hints.slice(1).forEach((hint, i) => {

      const index = i + 1;

      timers.push(setTimeout(() => {
        revealHint(index);
      }, delay));

      // 次のヒントの表示時刻
      delay += getHintDelay(hint);
    });
  };
}


// ============================================================
// RENSOU クイズクラス
// ============================================================

class RensouQuestion extends BaseQuestion {

  render() {
    this.startHints = createRensouUI(
      this.question,
      this.container
    );
  }

  startAnimation() {
    if (this.startHints) {
      this.startHints();
      this.startHints = null;
    }
  }
}
