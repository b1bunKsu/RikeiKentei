
// IMAGE_TOUCH: normalized polygon coordinates and one or more accepted regions.
function validImageTouch(q) {
   const areas = q.answerAreas ?? (q.answerArea ? [q.answerArea] : []);

   return q.type === 'IMAGE_TOUCH'
      && typeof (q.imagePath ?? q.image) === 'string'
      && (q.imagePath ?? q.image).length > 0
      && Array.isArray(areas)
      && areas.length > 0
      && areas.every(a =>
         Array.isArray(a)
         && a.length >= 3
         && a.every(p =>
            p
            && Number.isFinite(p.x)
            && Number.isFinite(p.y)
            && p.x >= 0
            && p.x <= 1
            && p.y >= 0
            && p.y <= 1
         )
      );
}

function imageTouchInside(x, y, area) {
   let inside = false;

   for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
      const a = area[j];
      const b = area[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;

      const cross = (x - a.x) * dy - (y - a.y) * dx;

      if (
         Math.abs(cross) < 1e-9
         && x >= Math.min(a.x, b.x) - 1e-9
         && x <= Math.max(a.x, b.x) + 1e-9
         && y >= Math.min(a.y, b.y) - 1e-9
         && y <= Math.max(a.y, b.y) + 1e-9
      ) {
         return true;
      }

      if (
         (a.y > y) !== (b.y > y)
         && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x
      ) {
         inside = !inside;
      }
   }

   return inside;
}

// The browser cache is reused across questions, just like JavaFX's image cache.
// Failed images are evicted so a subsequent question can retry loading.
const imageTouchCache = new Map();

function preloadImageTouch(url) {
   if (imageTouchCache.has(url)) {
      return imageTouchCache.get(url);
   }

   const entry = {
      image: new Image(),
      status: 'loading',
      listeners: new Set()
   };

   imageTouchCache.set(url, entry);

   entry.image.onload = () => {
      entry.status = 'loaded';

      for (const fn of entry.listeners) {
         fn(true);
      }

      entry.listeners.clear();
   };

   entry.image.onerror = () => {
      entry.status = 'error';
      imageTouchCache.delete(url);

      for (const fn of entry.listeners) {
         fn(false);
      }

      entry.listeners.clear();
   };

   entry.image.src = url;

   return entry;
}

class ImageTouchQuestion extends BaseQuestion {

   render() {
      const q = this.question;
      const ui = this.container;

      const path = q.imagePath ?? q.image;

      const url = /^https?:\/\//i.test(path)
         ? path
         : 'https://raw.githubusercontent.com/b1bunKsu/QuizQuestions/main/'
         + path.replace(/^\/+/, '');

      ui.innerHTML = `
            <div class="image-touch-root">
                <div class="image-touch-row">
                    <div class="image-touch-frame">
                        <span class="image-touch-loading">
                            画像を読み込んでいます…
                        </span>

                        <img
                            class="image-touch-image"
                            alt="画像タッチクイズの画像"
                        >

                        <svg
                            class="image-touch-debug-overlay"
                            viewBox="0 0 1000 1000"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        ></svg>

                        <span
                            class="image-touch-marker"
                            aria-hidden="true"
                        >+</span>
                    </div>

                    <button
                        type="button"
                        class="btn image-touch-ok"
                        disabled
                    >OK</button>
                </div>
            </div>
        `;

      const frame = ui.querySelector('.image-touch-frame');
      const img = ui.querySelector('img');
      const marker = ui.querySelector('.image-touch-marker');
      const loading = ui.querySelector('.image-touch-loading');
      const ok = ui.querySelector('button');
      const overlay = ui.querySelector('svg');

      this.disposed = false;

      let selected = null;
      let loaded = false;
      let confirmed = false;

      const entry = preloadImageTouch(url);

      // ========================================
      // マーカーの位置更新
      // ========================================

      const updateMarker = () => {
         if (!selected) return;

         marker.style.left =
            `${img.offsetLeft + selected.x * img.offsetWidth}px`;

         marker.style.top =
            `${img.offsetTop + selected.y * img.offsetHeight}px`;
      };

      // ========================================
      // 画像読み込み完了処理
      // ========================================

      const onLoad = success => {
         if (this.disposed) return;

         if (!success) {
            loaded = false;
            loading.textContent = '画像の読み込みに失敗しました';
            loading.classList.add('image-touch-error');
            ok.disabled = true;
            return;
         }

         loaded = true;
         img.src = url;
         loading.hidden = true;
         ok.disabled = false;

         if (state.mode === 'DEBUG' && state.debug.showAnswer) {
            const areas = q.answerAreas ?? [q.answerArea];

            overlay.style.left = img.offsetLeft + 'px';
            overlay.style.top = img.offsetTop + 'px';
            overlay.style.width = img.offsetWidth + 'px';
            overlay.style.height = img.offsetHeight + 'px';

            overlay.innerHTML = areas.map(a => `
                    <polygon points="${a.map(p =>
               `${p.x * 1000},${p.y * 1000}`
            ).join(' ')
               }"/>
                `).join('');

            overlay.style.display = 'block';
         }

         updateMarker();
      };

      this.cacheEntry = entry;
      this.cacheListener = onLoad;

      if (entry.status === 'loaded') {
         onLoad(true);
      } else if (entry.status === 'error') {
         onLoad(false);
      } else {
         entry.listeners.add(onLoad);
      }

      // ========================================
      // 画像タッチ時の処理
      // ========================================

      frame.addEventListener('click', e => {
         if (!loaded || state.locked || confirmed) return;

         const r = img.getBoundingClientRect();

         const x = (e.clientX - r.left) / r.width;
         const y = (e.clientY - r.top) / r.height;

         if (x < 0 || x > 1 || y < 0 || y > 1) return;

         selected = { x, y };

         updateMarker();

         marker.style.display = 'block';

         // ○・×のクラスを解除して＋に戻す
         marker.classList.remove(
            'image-touch-correct',
            'image-touch-incorrect'
         );

         marker.textContent = '+';
         marker.style.color = '#111';
      });

      // ========================================
      // OKボタン押下時の処理
      // ========================================

      ok.addEventListener('click', () => {
         if (!loaded || state.locked || confirmed) return;

         confirmed = true;
         ok.disabled = true;

         const areas = q.answerAreas ?? [q.answerArea];

         const correct =
            selected !== null
            && areas.some(a =>
               imageTouchInside(selected.x, selected.y, a)
            );

         if (selected) {
            this.markerTimer = setTimeout(() => {
               if (!this.disposed && marker.isConnected) {

                  // 正誤に応じてマーカーを変更
                  marker.textContent = correct ? '○' : '×';

                  marker.style.color =
                     correct ? '#e22' : '#2563eb';

                  // ○・×の専用クラスを切り替える
                  marker.classList.toggle(
                     'image-touch-correct',
                     correct
                  );

                  marker.classList.toggle(
                     'image-touch-incorrect',
                     !correct
                  );
               }
            }, 1000);
         }

         answer(correct);
      });
   }

   dispose() {
      this.disposed = true;

      if (this.markerTimer) {
         clearTimeout(this.markerTimer);
      }

      if (this.cacheEntry && this.cacheListener) {
         this.cacheEntry.listeners.delete(this.cacheListener);
      }
   }
}
