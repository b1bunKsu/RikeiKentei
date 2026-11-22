
class SoundManager {

    static unlocked = false;
    static audioContext = null;

    static effects = new Map();
    static bgmCache = new Map();

    static seLoading = new Map();
    static bgmLoading = new Map();

    static preloadPromise = null;

    static bgm = null;
    static bgmGain = null;
    static currentBgmMode = null;

    static bgmRequestId = 0;

    // ========================================
    // 音声ファイル
    // ========================================

    static music = {
        STANDARD: 'quiz_bgm.mp3',
        HIGH_SPEED: 'high_speed.mp3',
        HUNDRED_CHALLENGE: 'hundred_bgm.mp3',
        TITLE: 'title.mp3'
    };

    // ========================================
    // BGMループ範囲
    //
    // start: ループ開始位置（秒）
    // end:   ループ終了位置（秒）
    //
    // end: null なら曲の最後まで再生
    // ========================================

    static bgmLoopPoints = {
        STANDARD: {
            start: 0,
            end: null
        },
        HIGH_SPEED: {
            start: 0,
            end: null
        },
        HUNDRED_CHALLENGE: {
            start: 0,
            end: null
        },
        TITLE: {
            start: 0,
            end: null
        }
    };

    static seNames = new Set([
        'click',
        'correct',
        'incorrect',
        'timeout',
        'kaitou',
        'syutsudai',
        'final',
        'slot',
        'shuffle',
        'countdown',
        'oneUp',
        'applause'
    ]);

    // ========================================
    // 初期化
    // ========================================

    static init() {

        if (!this.audioContext) {

            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContextClass) {
                console.warn('Web Audio APIが利用できません');
                return;
            }

            this.audioContext =
                new AudioContextClass();
        }

        this.unlocked = true;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume()
                .catch(console.warn);
        }
    }

    // ========================================
    // 音声ファイル読み込み
    // ========================================

    static async loadAudioBuffer(url) {

        if (!this.audioContext) {
            this.init();
        }

        if (!this.audioContext) {
            throw new Error(
                'AudioContextを初期化できません'
            );
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `${url}: HTTP ${response.status}`
            );
        }

        const arrayBuffer =
            await response.arrayBuffer();

        return await this.audioContext.decodeAudioData(
            arrayBuffer
        );
    }

    // ========================================
    // 全音声プリロード
    // ========================================

    static preloadAll() {

        if (this.preloadPromise) {
            return this.preloadPromise;
        }

        this.preloadPromise = Promise.all([
            ...Array.from(
                this.seNames,
                name => this.preloadSe(name)
            ),
            ...Object.keys(this.music).map(
                mode => this.preloadBgm(mode)
            )
        ]).then(() => {

            console.log('全音声のプリロード完了');

        }).finally(() => {
            this.preloadPromise = null;
        });

        return this.preloadPromise;
    }

    // ========================================
    // SEプリロード
    // ========================================

    static preloadSe(name) {

        if (!this.seNames.has(name)) {
            return Promise.resolve();
        }

        if (this.effects.has(name)) {
            return Promise.resolve();
        }

        if (this.seLoading.has(name)) {
            return this.seLoading.get(name);
        }

        const promise = this.loadAudioBuffer(
            'assets/sounds/se/' + name + '.wav'
        ).then(buffer => {

            this.effects.set(name, buffer);

        }).catch(error => {

            console.warn(
                'SEの読み込みに失敗:',
                name,
                error
            );

        }).finally(() => {

            this.seLoading.delete(name);

        });

        this.seLoading.set(name, promise);

        return promise;
    }

    // ========================================
    // BGMプリロード
    // ========================================

    static preloadBgm(mode) {

        if (this.bgmCache.has(mode)) {
            return Promise.resolve();
        }

        if (this.bgmLoading.has(mode)) {
            return this.bgmLoading.get(mode);
        }

        const file = this.music[mode];

        if (!file) {
            return Promise.resolve();
        }

        const promise = this.loadAudioBuffer(
            'assets/sounds/bgm/' + file
        ).then(buffer => {

            this.bgmCache.set(mode, buffer);

            console.log(
                `BGM読み込み完了: ${mode}`,
                `再生時間: ${buffer.duration.toFixed(3)}秒`
            );

        }).catch(error => {

            console.warn(
                'BGMの読み込みに失敗:',
                mode,
                error
            );

        }).finally(() => {

            this.bgmLoading.delete(mode);

        });

        this.bgmLoading.set(mode, promise);

        return promise;
    }

    // ========================================
    // BGM音量
    // ========================================

    static setBgmVolume(v) {

        const volume = Math.max(
            0,
            Math.min(1, Number(v) || 0)
        );

        if (this.bgmGain) {
            this.bgmGain.gain.value = volume;
        }
    }

    // ========================================
    // BGM再生
    // ========================================

    static async playBgm(mode) {

        if (!this.unlocked) return;

        if (!this.music[mode]) return;

        // 同じBGMなら再生位置を維持
        if (
            this.currentBgmMode === mode
        ) {

            this.setBgmVolume(state.bgmVolume);
            return;
        }

        // 前のBGMを停止
        this.stopBgm();

        // 非同期読み込み中の競合を防止
        const requestId = this.bgmRequestId;

        // 読み込み中も現在のモードを記録
        this.currentBgmMode = mode;

        await this.preloadBgm(mode);

        // 読み込み中に別のBGMへ切り替わった場合
        if (
            requestId !== this.bgmRequestId ||
            this.currentBgmMode !== mode
        ) {
            return;
        }

        const buffer = this.bgmCache.get(mode);

        if (!buffer || !this.audioContext) {
            this.currentBgmMode = null;
            return;
        }

        const context = this.audioContext;

        if (context.state === 'suspended') {
            try {
                await context.resume();
            } catch (error) {
                console.warn(error);
                if (requestId === this.bgmRequestId) {
                    this.currentBgmMode = null;
                }
                return;
            }
        }

        if (
            requestId !== this.bgmRequestId ||
            this.currentBgmMode !== mode
        ) {
            return;
        }

        // ====================================
        // AudioBufferSourceNode生成
        // ====================================

        const source =
            context.createBufferSource();

        const gain =
            context.createGain();

        source.buffer = buffer;
        source.loop = true;

        // ====================================
        // ループ範囲
        // ====================================

        const config = this.bgmLoopPoints[mode] || {};

        const duration = buffer.duration;

        const start = Math.max(
            0,
            Math.min(
                duration,
                Number(config.start) || 0
            )
        );

        const end = config.end == null
            ? duration
            : Math.max(
                0,
                Math.min(duration, Number(config.end))
            );

        if (end > start) {
            source.loopStart = start;
            source.loopEnd = end;
        } else {
            source.loopStart = 0;
            source.loopEnd = duration;

            console.warn(
                `BGMのループ範囲が不正: ${mode}`
            );
        }

        // ====================================
        // 音量
        // ====================================

        gain.gain.value = Math.max(
            0,
            Math.min(1, state.bgmVolume)
        );

        source.connect(gain);
        gain.connect(context.destination);

        this.bgm = source;
        this.bgmGain = gain;

        // 初回再生は曲の先頭から
        source.start(0, 0);

        console.log(
            `BGM再生: ${mode}`,
            `ループ: ${source.loopStart.toFixed(3)} ～ ${source.loopEnd.toFixed(3)}秒`
        );
    }

    // ========================================
    // BGM停止
    // ========================================

    static stopBgm() {

        // 非同期の再生予約も無効化
        this.bgmRequestId++;

        if (this.bgm) {

            try {
                this.bgm.stop();
            } catch (error) {
                // 停止済みの場合は無視
            }

            this.bgm.disconnect();
            this.bgm = null;
        }

        if (this.bgmGain) {
            this.bgmGain.disconnect();
            this.bgmGain = null;
        }

        this.currentBgmMode = null;
    }

    // ========================================
    // SE再生
    // ========================================

    static playSe(name) {

        if (!this.seNames.has(name)) return;
        if (!this.unlocked) return;

        const buffer = this.effects.get(name);

        if (!buffer || !this.audioContext) {

            // 未読み込み時のフォールバック
            const audio = new Audio(
                'assets/sounds/se/' + name + '.wav'
            );

            audio.volume = state.seVolume;
            audio.play().catch(() => { });

            return;
        }

        const context = this.audioContext;

        if (context.state === 'suspended') {
            context.resume().catch(console.warn);
        }

        const source =
            context.createBufferSource();

        const gain =
            context.createGain();

        source.buffer = buffer;

        gain.gain.value = Math.max(
            0,
            Math.min(1, state.seVolume)
        );

        source.connect(gain);
        gain.connect(context.destination);

        source.onended = () => {
            source.disconnect();
            gain.disconnect();
        };

        source.start(0);
    }
}
