// One class per question type; central registry keeps QuizGame independent of UI details.
class QuestionManager {
 static types = new Map([
  ['CHARACTER_PANEL', CharacterPanelQuestion],
  ['SLOT', SlotQuestion],
  ['GROUP', GroupQuestion],
  ['ORDER', OrderQuestion],
  ['ORDER-A', OrderAQuestion],
  ['REARRANGEMENT', RearrangementQuestion],
  ['LINE_MATCHING', LineMatchingQuestion],
  ['RENSOU', RensouQuestion],
  ['EFFECT', EffectQuestion],
  ['POLYHEDRON', PolyhedronQuestion],
  ['NUMBER', NumberQuestion],
  ['KANA', KanaQuestion],
  ['KATAKANA', KatakanaQuestion],
  ['CHOICE', ChoiceQuestion],
  ['OX', OXQuestion],
  ['MULTIPLE_CHOICE', MultipleChoiceQuestion],
  ['ONE_WAY', OneWayQuestion],
  ['IMAGE_TOUCH', ImageTouchQuestion],
 ]);
 static create(q, ui) {const Type=this.types.get(q.type);if(!Type)throw new Error(`Unsupported question type: ${q.type}`);return new Type(q,ui);}
}
