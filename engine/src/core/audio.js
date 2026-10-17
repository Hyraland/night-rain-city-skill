// The sound of the street, synthesised with the Web Audio API: the rain all around, made as rain is, of countless
// drops, each a tiny tick, some of them falling into puddles with the little rising "plink" of the bubble each
// leaves (worked out once into two loops of sound, near and far, of different lengths, each ear its own drops);
// its low roar off the towers, rising and falling with the gusts; drips and drops close by, the city's deep hum, and a
// splash at each footstep; indoors, the rain heard through the roof, low and muffled; and, if the district has a
// place for it (a concert hall), music (music.js: setMusic, by how near it the viewer is; setTrack), fading in and out.

import { ConcertMusic } from './music.js';

const VOLUME = 0.55;
const MUSIC_EVEN = 2;   // (the music's gain at the slider's middle: twice as it was made, clearly heard at the hall)

export class Soundscape {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.rainLevel = 1;
    this.indoors = false;
    try { this.muted = localStorage.getItem('night-rain-city-muted') === '1'; } catch { /* storage unavailable */ }
    this.musicVolume = 0.5;   // (the music's slider, 0..1; main.js keeps it)
  }

  start() {
    if (this.ctx) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === 'suspended') {
      const resume = () => { ctx.resume(); removeEventListener('pointerdown', resume); removeEventListener('keydown', resume); };
      addEventListener('pointerdown', resume);
      addEventListener('keydown', resume);
    }
    this.master = new GainNode(ctx, { gain: 0 });
    this.master.connect(new DynamicsCompressorNode(ctx, { threshold: -18, ratio: 3 })).connect(ctx.destination);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : VOLUME, ctx.currentTime + 4);
    this.level = new GainNode(ctx, { gain: 1 }); // follows how hard it rains
    // (indoors: through the roof, the high of it gone)
    this.muffle = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 18000, Q: 0.5 });
    this.level.connect(this.muffle).connect(this.master);
    // the gusts: the rain's loudness rising and falling slowly, now more, now less
    this.gust = new GainNode(ctx, { gain: 1 });
    this.gust.connect(this.level);
    for (const [f, k] of [[0.043, 0.12], [0.11, 0.06]]) { const o = new OscillatorNode(ctx, { frequency: f }); o.connect(new GainNode(ctx, { gain: k })).connect(this.gust.gain); o.start(); }

    const noise = this.noiseBuffer(4);
    const loop = (filters, gain, pan = 0, buffer = noise, to = this.gust) => {
      const src = new AudioBufferSourceNode(ctx, { buffer, loop: true });
      let node = src;
      for (const f of filters) node = node.connect(new BiquadFilterNode(ctx, f));
      node.connect(new GainNode(ctx, { gain })).connect(new StereoPannerNode(ctx, { pan })).connect(to);
      src.start(0, Math.random() * buffer.duration);
    };
    // the rain: near, its drops pattering; far, a wash of them, darker; the roar; the hum
    // (filtered as they are made, and no longer than 8 s: a long loop through a filter node can run away)
    // (and under them a soft wash, the rain too many and too far to tell apart)
    // (no clicks, no tones: drops a little soft at their start, so that many of them do not crackle like static)
    loop([], 0.12, 0, this.rainBuffer(6.1, { drops: 80, size: [0.012, 0.035], bright: 2000, hp: 300, lp: 6000 }));
    loop([], 0.18, 0, this.rainBuffer(7.7, { drops: 2000, size: [0.012, 0.03], bright: 1300, hp: 150, lp: 3000 }));
    loop([], 0.28, 0, this.rainBuffer(5.3, { bed: true, hp: 150, lp: 6000 }));
    loop([{ type: 'bandpass', frequency: 700, Q: 0.6 }], 0.1);
    loop([{ type: 'lowpass', frequency: 160 }], 0.35);                          // (the city's deep hum, in this)
    this.noise = noise;
    this.dripTimer = setInterval(() => this.drip(), 90);
    this.music = new ConcertMusic(ctx, this.master);
    this.setMusicVolume(this.musicVolume);
    if (this.track) this.music.setTrack(this.track);
    this.rainGain();
  }

  noiseBuffer(secs) {
    const ctx = this.ctx, n = ctx.sampleRate * secs;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // A loop of rain secs long, stereo, each ear its own drops, wrapping round so that it runs on without a seam:
  // drops a second, each a burst of noise secs size[0]..size[1] long, its top taken off at about bright Hz (more or
  // less: one of three), rising over 2 ms and dying away; bed: a wash of pink noise under it all, the rain too far to
  // tell apart. hp, lp: what is cut below and above (Hz; two-pole, run twice round so the loop's seam does not show).
  // Brought to one loudness.
  rainBuffer(secs, { drops = 0, size = [0.01, 0.03], bright = 2000, bed = false, hp = 0, lp = 0 }) {
    const ctx = this.ctx, sr = ctx.sampleRate, n = Math.round(secs * sr), buf = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      if (bed) {                                                                // (pink: Paul Kellet's filter)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
        for (let i = 0; i < n; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = b0 + b1 + b2 + b3 + b4 + b5 + w * 0.5362;
        }
      }
      // (each drop read from noise already softened, one of three brightnesses: made once, not drop by drop)
      const tables = drops ? [0.65, 1, 1.4].map((f) => {
        const t = new Float32Array(n), a = 1 - Math.exp(-2 * Math.PI * bright * f / sr);
        let y1 = 0, y2 = 0;
        for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) { y1 += (Math.random() * 2 - 1 - y1) * a; y2 += (y1 - y2) * a; t[i] = y2; }
        return t;
      }) : [];
      const rise = Math.round(sr * 0.002), on = Float32Array.from({ length: rise }, (_, j) => 0.5 - 0.5 * Math.cos(Math.PI * j / rise));
      for (let k = 0, m = Math.round(drops * secs); k < m; k++) {
        const t = tables[Math.floor(Math.random() * 3)], amp = 0.15 + Math.pow(Math.random(), 2) * 0.85;
        const len = Math.round(sr * (size[0] + Math.random() * (size[1] - size[0]))), fall = Math.exp(-4 / len), step = 1 / len;
        let p = Math.floor(Math.random() * n), o = Math.floor(Math.random() * (n - len)), env = amp, left = 1;
        for (let j = 0; j < len; j++, o++, left -= step, env *= fall) {
          d[p] += env * (j < rise ? on[j] : 1) * t[o] * left;
          if (++p === n) p = 0;
        }
      }
      if (hp || lp) {
        const ah = hp ? Math.exp(-2 * Math.PI * hp / sr) : 0, al = lp ? 1 - Math.exp(-2 * Math.PI * lp / sr) : 1;
        let x0 = 0, yh = 0, yl = 0, yl2 = 0;
        for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
          const x = d[i];
          yh = hp ? ah * (yh + x - x0) : x; x0 = x;
          yl = lp ? yl + al * (yh - yl) : yh; yl2 = lp ? yl2 + al * (yl - yl2) : yl;
          if (pass) d[i] = yl2;
        }
      }
      let ss = 0;
      for (let i = 0; i < n; i++) ss += d[i] * d[i];
      const k = 0.2 / Math.sqrt(ss / n || 1);
      for (let i = 0; i < n; i++) d[i] *= k;
    }
    return buf;
  }

  // a short tick of water: a drop on metal, an awning, a puddle
  burst({ freq, q = 4, dur, gain, pan = 0, at = 0 }) {
    const ctx = this.ctx, t = ctx.currentTime + at;
    const src = new AudioBufferSourceNode(ctx, { buffer: this.noise });
    const g = new GainNode(ctx, { gain: 0 });
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(new BiquadFilterNode(ctx, { type: 'bandpass', frequency: freq, Q: q })).connect(g)
      .connect(new StereoPannerNode(ctx, { pan })).connect(this.level);
    src.start(t, Math.random() * 3, dur + 0.05);
  }

  drip() {
    if (!this.ctx || document.hidden) return;
    const r = Math.random();
    if (this.indoors) return;
    // (broad, not ringing: a narrow filter on them rang like a beep)
    if (r < 0.25 * this.rainLevel) this.burst({ freq: 1400 + Math.random() * 1600, q: 1.4, dur: 0.07, gain: 0.03 + Math.random() * 0.04, pan: Math.random() * 2 - 1 });
    else if (r < 0.3) this.burst({ freq: 500 + Math.random() * 400, q: 1.6, dur: 0.14, gain: 0.04, pan: Math.random() * 2 - 1 });
  }

  // the music: how loud (0..1, by how near its place the viewer is; 0: none)
  setMusic(level) { this.music?.setLevel(level); }
  // which of its pieces ('galaxy' 银河列车, 'summer' 夏夜, 'isle' 星屿夜雨, 'fields' 萤火原野)
  setTrack(name) { this.track = name; this.music?.setTrack(name); }
  // and how loud it is just now, as heard (0..1): for lights to move with it
  musicLoudness() { return this.music?.loudness() ?? 0; }

  // the music's slider (0..1): silent at 0, MUSIC_EVEN at 0.5, three times that at 1
  setMusicVolume(v) {
    this.musicVolume = v;
    this.music?.setVolume(MUSIC_EVEN * Math.pow(2 * v, 1.6));
  }

  setRain(i) {
    this.rainIndex = i;
    this.rainLevel = [0.5, 1, 1.6][i];
    this.rainGain();
  }

  // indoors (a shop, a station below the street): the rain heard through the roof, low and muffled; its drips gone
  setIndoors(on) {
    if (on === this.indoors) return;
    this.indoors = on;
    this.rainGain();
  }

  rainGain() {
    if (!this.ctx) return;
    this.level.gain.setTargetAtTime([0.55, 1, 1.5][this.rainIndex ?? 1] * (this.indoors ? 0.15 : 1), this.ctx.currentTime, 0.8);
    this.muffle.frequency.setTargetAtTime(this.indoors ? 520 : 18000, this.ctx.currentTime, 0.6);   // (indoors: the rain on the roof)
  }

  step(run) {
    if (!this.ctx) return;
    const g = 0.12 + run * 0.08;
    this.burst({ freq: 600 + Math.random() * 300, q: 1.2, dur: 0.16, gain: g });
    this.burst({ freq: 2200 + Math.random() * 800, q: 2, dur: 0.09, gain: g * 0.5, at: 0.01 });
  }

  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem('night-rain-city-muted', this.muted ? '1' : '0'); } catch { /* storage unavailable */ }
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : VOLUME, this.ctx.currentTime, 0.3);
    return this.muted;
  }
}
