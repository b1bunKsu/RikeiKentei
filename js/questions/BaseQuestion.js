// Shared interface. Each quiz type owns its rendering and input handlers.
class BaseQuestion {
  constructor(question, container) { this.question = question; this.container = container; }
  render() { throw new Error('render() is required'); }
  dispose() { } // Future per-question cleanup hooks.
}
