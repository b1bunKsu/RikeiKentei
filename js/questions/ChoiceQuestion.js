class ChoiceQuestion extends BaseQuestion {
 render(){const q=this.question,ui=this.container,choices=shuffle([...q.choices]);
 ui.innerHTML=`<div class="fx-choice-area">${choices.map((c,i)=>`<div class="fx-choice-row"><button class="fx-choice-number" data-choice="${i}" aria-label="選択肢${i+1}">${i+1}</button><button class="fx-choice-button" data-choice="${i}">${esc(c)}</button></div>`).join('')}</div>`;
 ui.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('click',()=>{if(state.locked)return;const i=Number(el.dataset.choice);const row=ui.querySelectorAll('.fx-choice-row')[i];row.querySelectorAll('button').forEach(b=>b.classList.add('selected'));answer(choices[i]);}));
 }
}
