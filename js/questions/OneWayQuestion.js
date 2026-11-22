// ========================================
// ONE_WAY：一方通行クイズ
// ========================================

class OneWayQuestion extends BaseQuestion {

    render() {

        const q = this.question;
        const ui = this.container;

        const choices = shuffle([...q.choices]);

        state.oneWayChoices = choices;
        state.oneWayIndex = 0;

        // ========================================
        // UI生成
        // ========================================

        ui.innerHTML = `
      <div class="one-way-rows">

        ${choices.map((c, i) => `
          <div
            class="one-way-row ${i > 0 ? 'one-way-pending' : ''}"
            data-row="${i}"
          >

            <span class="row-num">
              ${i + 1}
            </span>

            <button
              class="btn one-way-choice"
              data-choose="${i}"
              ${i ? 'disabled' : ''}
            >
              ${i === 0 ? esc(c) : '？？？'}
            </button>

            ${i < choices.length - 1
                ? `
                  <button
                    class="btn reject"
                    data-reject="${i}"
                    ${i ? 'disabled' : ''}
                  >
                    不適
                  </button>
                `
                : '<span class="reject-placeholder"></span>'
            }

          </div>
        `).join('')}

      </div>
    `;

        // ========================================
        // 選択肢ボタン
        // ========================================

        ui.querySelectorAll('[data-choose]').forEach(el => {

            el.addEventListener('click', () => {

                if (
                    state.locked ||
                    Number(el.dataset.choose) !== state.oneWayIndex
                ) return;

                const row = el.closest('.one-way-row');

                // 選択した行を黄色にする
                row.classList.add('one-way-selected');

                // 解答確定
                answer(choices[state.oneWayIndex]);

            });
        });

        // ========================================
        // 不適ボタン
        // ========================================

        ui.querySelectorAll('[data-reject]').forEach(el => {

            el.addEventListener('click', () => {

                const i = Number(el.dataset.reject);

                if (
                    state.locked ||
                    i !== state.oneWayIndex
                ) return;

                // 効果音
                SoundManager.playSe("shuffle");

                const row = ui.querySelector(`[data-row="${i}"]`);

                // 不適状態
                row.classList.add('rejected');

                row.querySelectorAll('button').forEach(button => {
                    button.disabled = true;
                });

                // 次の行へ
                state.oneWayIndex++;

                const next = ui.querySelector(
                    `[data-row="${state.oneWayIndex}"]`
                );

                if (next) {

                    // 半透明状態を解除
                    next.classList.remove('one-way-pending');

                    const btn = next.querySelector('[data-choose]');

                    btn.textContent = choices[state.oneWayIndex];
                    btn.disabled = false;

                    const reject = next.querySelector('[data-reject]');

                    if (reject) {
                        reject.disabled = false;
                    }
                }
            });
        });
    }
}