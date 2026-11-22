class OXQuestion extends BaseQuestion {
 render(){const ui=this.container;ui.innerHTML=`<div class="fx-ox-area"><button class="fx-ox-button fx-ox-o" data-ox="O" aria-label="まる"><svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="70" fill="none" stroke="#ff0000" stroke-width="20"/></svg></button><button class="fx-ox-button fx-ox-x" data-ox="X" aria-label="ばつ"><svg viewBox="0 0 180 180" aria-hidden="true"><path d="M30 30 L150 150 M150 30 L30 150" fill="none" stroke="#0000ff" stroke-width="20" stroke-linecap="round"/></svg></button></div>`;
 ui.querySelectorAll('[data-ox]').forEach(el=>el.addEventListener('click',()=>{if(state.locked)return;el.classList.add('selected');answer(el.dataset.ox);}));
 }
}
