function acceptedAnswers(q) {
    return Array.isArray(q.answers) && q.answers.length
        ? q.answers.map(String)
        : [String(q.answer ?? '')];
}

function visualInputType(answer) {
    return /^[ァ-ヶー]+$/.test(answer)
        ? 'KATAKANA'
        : /^[A-Za-z0-9]+$/.test(answer)
            ? 'NUMBER'
            : 'KANA';
}

function createVisualTypingUI(q, ui) {

    const board = ui.closest('.quiz-shell')
        ?.querySelector('.question-center .board');

    const visual = document.createElement('div');
    visual.className = 'visual-quiz visual-board-overlay';

    (board || ui).append(visual);

    const input = document.createElement('div');
    input.className = 'visual-input';
    ui.append(input);

    const kind = visualInputType(acceptedAnswers(q)[0]);

    createTypingUI({
        ...q,
        type: kind,
        hint: null,
        _originalQuestion: q
    }, input);

    // 以前はここで直ちにアニメーションを開始していた。
    // 今回は開始用の関数を返す。
    let started = false;

    return function startVisual() {

        if (started || !visual.isConnected) return;

        started = true;

        if (q.type === 'EFFECT') {
            setupEffect(q.hint, visual);
        } else {
            setupPolyhedron(q.answer, visual);
        }
    };
}