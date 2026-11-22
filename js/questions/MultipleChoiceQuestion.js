// ========================================
// MULTIPLE_CHOICE：一問多答クイズ
// ========================================

class MultipleChoiceQuestion extends BaseQuestion {

    render() {

        const q = this.question;
        const ui = this.container;

        // ========================================
        // 正解候補を取得
        // ========================================

        const candidates = shuffle([
            ...new Set(q.answers.map(String))
        ]);

        const count =
            1 + Math.floor(Math.random() * candidates.length);

        state.activeAnswers = candidates.slice(0, count);

        // ========================================
        // 不正解の選択肢を取得
        // ========================================

        const wrong = shuffle(
            [...new Set(q.choices.map(String))]
                .filter(c => !candidates.includes(c))
        );

        // ========================================
        // 表示する選択肢を決定
        // ========================================

        const minCount = Math.max(3, count);
        const maxCount = 5;

        const desired =
            minCount +
            Math.floor(Math.random() * (maxCount - minCount + 1));

        const display = shuffle([
            ...state.activeAnswers,
            ...wrong.slice(0, desired - count)
        ]);

        state.selectedAnswers = new Set();

        // ========================================
        // 選択肢の間隔
        // ========================================

        const spacing = display.length > 1
            ? (270 - 50 * display.length) / (display.length - 1)
            : 0;

        // ========================================
        // UI生成
        // ========================================

        ui.innerHTML = `
      <div class="fx-multiple-choice">

        <div class="fx-multi-rows" style="gap:${spacing}px">

          ${display.map((c, i) => `
            <div class="fx-multi-row">

              <button
                class="fx-multi-number"
                data-multi="${i}"
                aria-label="選択肢${i + 1}"
              >
                ${i + 1}
              </button>

              <button
                class="fx-multi-choice"
                data-multi="${i}"
                aria-pressed="false"
              >
                ${esc(c)}
              </button>

            </div>
          `).join('')}

        </div>

        <button class="fx-multi-ok" id="confirm">
          OK
        </button>

      </div>
    `;

        // ========================================
        // 選択肢の選択・解除
        // ========================================

        const toggle = i => {

            if (state.locked) return;

            // クリック効果音
            SoundManager.playSe("click");

            const val = display[i];

            if (state.selectedAnswers.has(val)) {
                state.selectedAnswers.delete(val);
            } else {
                state.selectedAnswers.add(val);
            }

            const active = state.selectedAnswers.has(val);

            // 番号ボタン・文章ボタンの表示を更新
            ui.querySelectorAll(`[data-multi="${i}"]`).forEach(el => {

                el.classList.toggle('selected', active);

                el.setAttribute(
                    'aria-pressed',
                    String(active)
                );
            });
        };

        // ========================================
        // 選択肢クリックイベント
        // ========================================

        ui.querySelectorAll('[data-multi]').forEach(el => {

            el.addEventListener('click', () => {
                toggle(Number(el.dataset.multi));
            });
        });

        // ========================================
        // OKボタン
        // ========================================

        ui.querySelector('#confirm').addEventListener('click', () => {

            answer([...state.selectedAnswers]);

        });
    }
}