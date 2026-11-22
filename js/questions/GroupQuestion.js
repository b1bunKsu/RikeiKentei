
function validGroup(q) {
  if (
    q.type !== "GROUP" ||
    !q.groups ||
    typeof q.groups !== "object" ||
    Array.isArray(q.groups)
  ) {
    return false;
  }

  const ids = Object.keys(q.groups);

  if (ids.length < 2 || ids.length > 3) {
    return false;
  }

  const valid = ids.every(id =>
    q.groups[id] &&
    typeof q.groups[id].name === "string" &&
    Array.isArray(q.groups[id].choices)
  );

  if (!valid) return false;

  const items = ids.flatMap(id => q.groups[id].choices);

  return (
    items.length > 0 &&
    items.length <= 5 &&
    items.every(item => typeof item === "string") &&
    new Set(items).size === items.length
  );
}


// ============================================================
// GROUP クイズ UI
// ============================================================

function createGroupUI(q, ui) {

  // ----------------------------------------------------------
  // グループと選択肢の初期化
  // ----------------------------------------------------------

  // 実際のグループIDをシャッフル
  // 表示上のA/B/Cと色は固定
  const ids = shuffle(Object.keys(q.groups));
  const count = ids.length;

  // 選択肢をシャッフル
  const entries = shuffle(
    Object.keys(q.groups).flatMap(id =>
      q.groups[id].choices.map(choice => ({
        choice: String(choice),
        correct: id
      }))
    )
  );

  // 2グループ：中央の未分類から開始
  // 3グループ：Bグループから開始
  const locations = entries.map(() =>
    count === 3 ? 1 : -1
  );

  // ----------------------------------------------------------
  // レイアウト定数
  // ----------------------------------------------------------

  const groupWidth = count === 2 ? 450 : 300;
  const rowWidth = count === 2 ? 480 : 330;

  const groupGap = 0;

  const groupHeight = 320;
  const nameHeight = 40;

  const areaHeight = 245;
  const rowHeight = 46;

  const interval = entries.length > 1
    ? (areaHeight - rowHeight) / (entries.length - 1)
    : 0;

  const displayWidth =
    groupWidth * count +
    groupGap * (count - 1);

  // 移動中の操作を防ぐ
  let moving = false;

  // ----------------------------------------------------------
  // 選択肢のX座標
  // ----------------------------------------------------------

  function getChoiceX(location) {

    // 2グループの未分類位置
    if (location === -1) {
      return (displayWidth - rowWidth) / 2;
    }

    // 各グループの中央
    return (
      location * (groupWidth + groupGap) +
      (groupWidth - rowWidth) / 2
    );
  }

  // ----------------------------------------------------------
  // 選択肢のHTML
  // ----------------------------------------------------------

  function createChoiceHTML(entry, index) {

    const location = locations[index];

    const x = getChoiceX(location);

    // 全グループ共通のY座標
    const y = nameHeight + index * interval;

    const leftDisabled = location === 0;
    const rightDisabled = location === count - 1;

    return `
      <div
        class="group-java-choice"
        data-choice-index="${index}"
        style="
          position:absolute;
          left:${x}px;
          top:${y}px;
          width:${rowWidth}px;
          height:${rowHeight}px;
        "
      >

        <button
          class="group-java-move"
          type="button"
          data-group-move
          data-index="${index}"
          data-direction="-1"
          ${leftDisabled ? "disabled" : ""}
        >
          ◀
        </button>

        <span class="group-java-choice-label">
          ${esc(entry.choice)}
        </span>

        <button
          class="group-java-move"
          type="button"
          data-group-move
          data-index="${index}"
          data-direction="1"
          ${rightDisabled ? "disabled" : ""}
        >
          ▶
        </button>

      </div>
    `;
  }

  // ----------------------------------------------------------
  // グループ背景のHTML
  // ----------------------------------------------------------

  function createGroupHTML(id, index) {

    const visualId = "ABC"[index];

    const color = count === 2
      ? (index === 0 ? "red" : "blue")
      : ["red", "blue", "green"][index];

    return `
      <div
        class="group-java-box group-java-${color}"
        style="
          width:${groupWidth}px;
          height:${groupHeight}px;
        "
      >

        <div
          class="group-java-background group-java-id-${color}"
        >
          ${visualId}
        </div>

        <div class="group-java-foreground">

          <div class="group-java-name">
            ${esc(q.groups[id].name)}
          </div>

        </div>

      </div>
    `;
  }

  // ----------------------------------------------------------
  // 画面描画
  // ----------------------------------------------------------

  function render() {

    const groupHTML = ids.map((id, index) =>
      createGroupHTML(id, index)
    ).join("");

    const choiceHTML = entries.map((entry, index) =>
      createChoiceHTML(entry, index)
    ).join("");

    ui.innerHTML = `
      <div class="group-java-root">

        <div
          class="group-java-display group-java-display-${count}"
          style="
            position:relative;
            width:${displayWidth}px;
            height:${groupHeight}px;
            flex-shrink:0;
          "
        >

          <div class="group-java-columns">
            ${groupHTML}
          </div>

          <div class="group-java-choice-layer">
            ${choiceHTML}
          </div>

        </div>

        <div class="group-java-ok-area">

          <button
            class="btn group-java-ok"
            type="button"
          >
            OK
          </button>

        </div>

      </div>
    `;

    // 左右移動イベント
    ui.querySelectorAll("[data-group-move]").forEach(button => {

      button.addEventListener("click", () => {

        if (state.locked || moving) return;

        const index = Number(button.dataset.index);
        const direction = Number(button.dataset.direction);

        moveChoice(index, direction);
      });

    });

    // 回答確定
    const okButton = ui.querySelector(".group-java-ok");

    okButton.addEventListener("click", () => {

      if (state.locked || moving) return;

      const correct = entries.every((entry, index) => {

        const location = locations[index];

        return (
          location >= 0 &&
          ids[location] === entry.correct
        );
      });

      answer(correct);
    });
  }

  // ----------------------------------------------------------
  // 選択肢の移動
  // ----------------------------------------------------------

  function moveChoice(index, direction) {

    SoundManager.playSe("slot");

    if (state.locked || moving) return;

    const current = locations[index];

    let next;

    if (current === -1) {
      next = direction < 0 ? 0 : count - 1;
    } else {
      next = current + direction;
    }

    if (next < 0 || next >= count) return;

    const element = ui.querySelector(
      `[data-choice-index="${index}"]`
    );

    if (!element) return;

    // X座標だけを変更する
    const oldX = getChoiceX(current);
    const newX = getChoiceX(next);

    const deltaX = newX - oldX;

    moving = true;

    // アニメーション中は位置を変更せず、
    // transformで水平移動する
    const animation = element.animate(
      [
        {
          transform: "translateX(0px)"
        },
        {
          transform: `translateX(${deltaX}px)`
        }
      ],
      {
        duration: 100,
        easing: "linear",
        fill: "forwards"
      }
    );

    animation.addEventListener("finish", () => {

      // 移動先を確定
      locations[index] = next;

      // 再描画して正しい矢印状態を反映
      render();

      moving = false;

    }, { once: true });

    animation.addEventListener("cancel", () => {
      moving = false;
    }, { once: true });
  }

  // ----------------------------------------------------------
  // 初回描画
  // ----------------------------------------------------------

  render();
}


// ============================================================
// GROUP クイズクラス
// ============================================================

class GroupQuestion extends BaseQuestion {

  render() {
    createGroupUI(this.question, this.container);
  }

}
