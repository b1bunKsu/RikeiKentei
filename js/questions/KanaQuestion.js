// KANA: extracted from Phase 9, behavior preserved.

class KanaQuestion extends BaseQuestion {
  render() { const q=this.question, ui=this.container; createTypingUI(q,ui); }
}
