// ORDER-A: extracted from Phase 9, behavior preserved.

class OrderAQuestion extends BaseQuestion {
  render() { const q=this.question, ui=this.container; createOrderingUI(q,ui); }
}
