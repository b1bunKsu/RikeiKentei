const HIRA_ROWS = [
  ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'ぁ', 'ゃ'],
  ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', '', 'り', '', 'ぃ', 'ゅ'],
  ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', 'を', 'ぅ', 'ょ'],
  ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', '', 'れ', '', 'ぇ', 'っ'],
  ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'ん', 'ぉ', 'ー']
];

const ROMAJI = {};

function initRomaji() {
  const groups = {
    '': ['あいうえお', 'aiueo'],
    k: ['かきくけこ', 'aiueo'],
    s: ['さしすせそ', 'aiueo'],
    t: ['たちつてと', 'aiueo'],
    n: ['なにぬねの', 'aiueo'],
    h: ['はひふへほ', 'aiueo'],
    m: ['まみむめも', 'aiueo'],
    y: ['や ゆ よ', 'a u o'],
    r: ['らりるれろ', 'aiueo'],
    w: ['わ   を', 'a   o'],
    g: ['がぎぐげご', 'aiueo'],
    z: ['ざじずぜぞ', 'aiueo'],
    d: ['だぢづでど', 'aiueo'],
    b: ['ばびぶべぼ', 'aiueo'],
    p: ['ぱぴぷぺぽ', 'aiueo']
  };

  for (const [prefix, [chars, vowels]] of Object.entries(groups)) {
    const cs = [...chars];
    const vs = [...vowels];

    for (let i = 0; i < Math.min(cs.length, vs.length); i++) {
      if (cs[i] !== ' ' && vs[i] !== ' ') {
        ROMAJI[prefix + vs[i]] = cs[i];
      }
    }
  }

  Object.assign(ROMAJI, {
    shi: 'し', chi: 'ち', tsu: 'つ', fu: 'ふ',
    ji: 'じ', si: 'し', ti: 'ち', tu: 'つ',
    hu: 'ふ', zi: 'じ', nn: 'ん',

    xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ',
    la: 'ぁ', li: 'ぃ', lu: 'ぅ', le: 'ぇ', lo: 'ぉ',
    xtu: 'っ', ltu: 'っ',

    xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ',
    lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ',

    kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
    sha: 'しゃ', shu: 'しゅ', sho: 'しょ',
    sya: 'しゃ', syu: 'しゅ', syo: 'しょ',

    cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ',
    tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',

    nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
    hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
    mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
    rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',

    gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',

    ja: 'じゃ', ju: 'じゅ', jo: 'じょ',
    jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',

    bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
    pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
    dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',

    fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ',
    wi: 'うぃ', we: 'うぇ',

    va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ',
    ve: 'ゔぇ', vo: 'ゔぉ',


    // 外来語の特殊なローマ字入力
    dha: 'でゃ', dhi: 'でぃ', dhu: 'でゅ',
    dhe: 'でぇ', dho: 'でょ',

    tha: 'てゃ', thi: 'てぃ', thu: 'てゅ',
    the: 'てぇ', tho: 'てょ',

    twa: 'とぁ', twi: 'とぃ', twu: 'とぅ',
    twe: 'とぇ', two: 'とぉ',

    dwa: 'どぁ', dwi: 'どぃ', dwu: 'どぅ',
    dwe: 'どぇ', dwo: 'どぉ',

    tsa: 'つぁ', tsi: 'つぃ', tse: 'つぇ', tso: 'つぉ',

    she: 'しぇ', je: 'じぇ', che: 'ちぇ',

    kwa: 'くぁ', kwi: 'くぃ', kwe: 'くぇ', kwo: 'くぉ',
    gwa: 'ぐぁ', gwi: 'ぐぃ', gwe: 'ぐぇ', gwo: 'ぐぉ',

    ye: 'いぇ',
    wha: 'うぁ', whi: 'うぃ', whe: 'うぇ', who: 'うぉ',

    fya: 'ふゃ', fyu: 'ふゅ', fyo: 'ふょ',
    vya: 'ゔゃ', vyu: 'ゔゅ', vyo: 'ゔょ',


    '-': 'ー'
  });
}

initRomaji();

const toKata = s =>
  s.replace(/[ぁ-ゖ]/g, c =>
    String.fromCharCode(c.charCodeAt(0) + 96)
  );


const voiced = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご',
  さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
  た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど',

  は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ',

  // 半濁音から濁音への変換
  ぱ: 'ば', ぴ: 'び', ぷ: 'ぶ', ぺ: 'べ', ぽ: 'ぼ',

  う: 'ゔ'
};

const semi = {
  // 清音から半濁音への変換
  は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ',

  // 濁音から半濁音への変換
  ば: 'ぱ', び: 'ぴ', ぶ: 'ぷ', べ: 'ぺ', ぼ: 'ぽ'
};

// ========================================
// タイピングUI生成
// ========================================

function createTypingUI(q, ui) {

  const isNum = q.type === 'NUMBER';
  const kata = q.type === 'KATAKANA';

  let input = '';
  let buffer = '';

  // ========================================
  // キーボード配列
  // ========================================

  const rows = isNum
    ? (
      state.qwerty
        ? ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
        : ['0123456789', 'ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ']
    ).map(x => [...x])
    : HIRA_ROWS.map(r =>
      r.map(c => kata ? toKata(c) : c)
    );

  // ========================================
  // 特殊ボタン生成
  // ========================================

  const specialButton = (name, label, extra = '') =>
    `<button class="typing-special ${extra}" data-special="${name}">${label}</button>`;

  // ========================================
  // キーボードHTML生成
  // ========================================

  const keyboardRows = rows.map((r, i) => {

    let cells = r.map(c =>
      c
        ? `<button class="typing-key" data-key="${esc(c)}">${esc(c)}</button>`
        : '<span class="typing-key blank"></span>'
    ).join('');

    if (isNum) {

      if (i === 2) {
        cells += specialButton('delete', '消す', 'typing-wide');
      }

      if (i === 3) {
        cells += specialButton('ok', 'OK', 'typing-wide');
      }

    } else {

      if (i === 0) {
        cells += specialButton('voice', '゛');
      } else if (i === 1) {
        cells += specialButton('semi', '゜');
      } else if (i === 2) {
        cells += '<span class="typing-key blank"></span>';
      } else if (i === 3) {
        cells += specialButton('delete', '消す', 'typing-wide');
      } else if (i === 4) {
        cells += specialButton('ok', 'OK', 'typing-wide');
      }
    }

    return `<div class="typing-row typing-row-${i}">${cells}</div>`;

  }).join('');

  // ========================================
  // UI表示
  // ========================================

  ui.innerHTML = `
    <div class="fx-typing-root ${isNum ? 'fx-number-typing' : 'fx-kana-typing'}">

      ${q.hint
      ? `<div class="typing-hint">${esc(q.hint)}</div>`
      : ''
    }

      <div class="typing-boxes">
        ${Array.from(
      { length: 8 },
      () => '<span class="typing-box"></span>'
    ).join('')
    }
      </div>

      <div class="typing-keys">
        ${keyboardRows}
      </div>

    </div>
  `;

  // ========================================
  // 入力内容の描画
  // ========================================
  const render = () => {

    // 確定済みのかな + 未確定のローマ字
    const display = [...input, ...buffer];

    ui.querySelectorAll('.typing-box').forEach((el, i) => {
      el.textContent = display[i] || '';
    });

  };

  // ========================================
  // 文字追加
  // ========================================

  const append = c => {

    if ([...input].length < 8) {
      input += c;
    }

    render();
  };

  // ========================================
  // 1文字削除
  // ========================================

  const remove = () => {

    if (buffer) {
      buffer = buffer.slice(0, -1);
    } else {
      input = [...input].slice(0, -1).join('');
    }

    render();
  };

  // ========================================
  // 濁点・半濁点変換
  // ========================================

  const change = map => {

    const chars = [...input];

    if (!chars.length) return;

    const last = chars.at(-1);

    const hir = kata
      ? last.replace(
        /[ァ-ヶ]/g,
        c => String.fromCharCode(c.charCodeAt(0) - 96)
      )
      : last;

    const next = map[hir];

    if (next) {

      chars[chars.length - 1] =
        kata ? toKata(next) : next;

      input = chars.join('');

      render();
    }
  };

  // ========================================
  // 解答確定
  // ========================================

  const submit = () => {

    if (buffer === 'n' && !isNum) {

      // 未確定の n を「ん」または「ン」に変換
      buffer = '';

      if ([...input].length < 8) {
        input += kata ? 'ン' : 'ん';
      }

      // 表示を更新して末尾の n を消す
      render();
    }

    answer(input);
  };


  // ========================================
  // ローマ字入力処理
  // ========================================

  const processRomaji = char => {

    buffer += char.toLowerCase();

    for (let step = 0; step < 10 && buffer; step++) {

      // 促音処理
      if (
        buffer.length >= 2 &&
        buffer[0] === buffer[1] &&
        /[bcdfghjklmpqrstvwxyz]/.test(buffer[0]) &&
        buffer[0] !== 'n'
      ) {

        append(kata ? 'ッ' : 'っ');

        buffer = buffer.slice(1);

        continue;
      }

      // 「ん」の処理
      if (
        buffer.startsWith('n') &&
        buffer.length > 1 &&
        (
          buffer[1] === "'" ||
          (!'aiueoyn'.includes(buffer[1]))
        )
      ) {

        append(kata ? 'ン' : 'ん');

        buffer = buffer.slice(
          buffer[1] === "'" ? 2 : 1
        );

        continue;
      }

      // ローマ字変換
      let match = '';

      for (const key of Object.keys(ROMAJI)) {

        if (
          buffer.startsWith(key) &&
          key.length > match.length
        ) {
          match = key;
        }
      }

      if (match) {

        append(
          kata
            ? toKata(ROMAJI[match])
            : ROMAJI[match]
        );

        buffer = buffer.slice(match.length);

        continue;
      }

      if (
        Object.keys(ROMAJI).some(key =>
          key.startsWith(buffer)
        ) ||
        buffer === 'n'
      ) {
        break;
      }

      buffer = buffer.slice(1);
    }

    render();
  };

  // ========================================
  // 画面上の文字キーボード
  // ========================================

  ui.querySelectorAll('[data-key]').forEach(b => {

    b.addEventListener('click', () => {

      if (state.locked) return;

      // 文字キーを押したときに効果音を再生
      SoundManager.playSe("click");

      append(b.dataset.key);

    });

  });

  // ========================================
  // 特殊ボタン
  // ========================================

  ui.querySelectorAll('[data-special]').forEach(b => {

    b.addEventListener('click', () => {

      if (state.locked) return;

      const a = b.dataset.special;

      if (a === 'delete') {

        SoundManager.playSe("click");
        remove();

      } else if (a === 'voice') {

        SoundManager.playSe("click");
        change(voiced);

      } else if (a === 'semi') {

        SoundManager.playSe("click");
        change(semi);

      } else {

        submit();

      }

    });

  });

  // ========================================
  // PC物理キーボード入力
  // ========================================

  const keyHandler = e => {

    if (
      state.locked ||
      state.questions[state.index] !== (q._originalQuestion || q)
    ) return;

    if (
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.target instanceof HTMLInputElement
    ) return;

    // Backspace
    if (e.key === 'Backspace') {

      e.preventDefault();

      SoundManager.playSe("click");

      remove();

      return;
    }

    // Enter
    if (e.key === 'Enter') {

      e.preventDefault();

      // OKは既存の解答効果音を使用
      submit();

      return;
    }

    // 英数字入力
    if (isNum) {

      if (/^[a-z0-9]$/i.test(e.key)) {

        e.preventDefault();

        SoundManager.playSe("click");

        append(e.key.toUpperCase());
      }

    } else if (/^[a-z'-]$/i.test(e.key)) {

      // ローマ字入力
      e.preventDefault();

      SoundManager.playSe("click");

      processRomaji(e.key);

    } else if (
      e.key.length === 1 &&
      (
        /[ぁ-ゖ]/.test(e.key) ||
        /[ァ-ヶー]/.test(e.key)
      )
    ) {

      // かな直接入力
      e.preventDefault();

      SoundManager.playSe("click");

      append(
        kata ? toKata(e.key) : e.key
      );
    }
  };

  // ========================================
  // キーボードイベントの登録
  // ========================================

  // 前の問題のイベントを削除
  if (state.typingKeyHandler) {

    document.removeEventListener(
      'keydown',
      state.typingKeyHandler
    );
  }

  // 新しいイベントを登録
  state.typingKeyHandler = keyHandler;

  document.addEventListener(
    'keydown',
    keyHandler
  );

  // 初期表示
  render();
}