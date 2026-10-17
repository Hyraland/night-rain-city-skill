// Music for a concert hall (or any place of music) in the district, made live with the Web Audio API, four pieces to choose between (setTrack). 'galaxy' (银河列车): bright and driving, a train running out among the stars, in the manner of the old anime
// space-train songs (its tune its own): D major, 138 a minute, sixteen bars, a verse and a lift (D A Bm F#m G D Em A,
// then G A F#m Bm Em A D D); a bass running in eighths like wheels on rails, the chords struck on the offbeats, strings
// held under, a lead of synth brass singing the tune, a sparkle of stars going up in sixteenths at the turns, a
// shaker for the drive (no drums). 'summer' (夏夜): quiet, a summer night under the Milky Way, as in the night of the
// galactic railroad (its tune its own): a slow waltz in F, 84 a minute, sixteen bars (F Am Bb F, Dm Gm C C, F Am Bb Gm,
// F C F F); a celesta like a music box singing the tune, a harp turning the chords over in eighths, strings held
// softly under, a low note on each bar's first beat, and now and then crickets far off. 'isle' (星屿夜雨): a little
// island out in space where it is raining, in the same night of the galactic railroad (its tune its own): slow, E
// major, 66 a minute, eight bars (Emaj7 C#m7 Amaj7 Badd4, G#m7 C#m7 F#m9 B7sus); a soft flute singing the tune, an
// electric piano turning the chords over a quarter at a time, a deep pad, a long low note on each bar, and drops of
// rain in high notes of the scale falling at random about it all, now here, now there.
// 'fields' (萤火原野): running through the fields on a summer night, fireflies all about, the sky over it all without
// end (its tune its own): in six-eight, A major, 100 dotted quarters a minute, thirty-two bars: running (A B/A C#m7
// F#m7 D E A/C# E, the B over A for wonder), a chorus (D E C#m7 F#m7 Bm7 E A A), the sky opening (Dmaj7 E/D C#m7
// F#m7 Bm7, then F G A, rising to it), and the chorus again, all of it; strings running short and light in eighths, a
// bass a dotted quarter at a time, a whistle singing the tune (doubled an octave down at the last), a piano's chords
// in the choruses, voices held under the sky, and fireflies, soft high bells blinking here and there, most of all
// under the sky; light held high over it all, a slow arpeggio of glass under the sky; each bar its own strength, so
// that it rises and falls; in a wider room than the others (no drums).
// All of it through a room (a reverb made of fading noise). Its level is set from outside (setLevel, 0..1: how
// near the hall the viewer is); it only plays while it can be heard.

const hz = (n) => 440 * 2 ** ((n - 69) / 12);       // (a MIDI note's frequency)
// 星屿夜雨: its sixteenth; its chords, a bar each; its tune (as 银河列车's); its raindrops' notes (E major's
// pentatonic, high)
const I_SIX = 60 / 66 / 4;
const I_CHORDS = { Emaj7: [[64, 68, 71, 75], 40], 'C#m7': [[61, 64, 68, 71], 37], Amaj7: [[61, 64, 68, 69], 33], Badd4: [[59, 63, 64, 66], 35],
  'G#m7': [[56, 59, 63, 66], 32], 'F#m9': [[57, 61, 64, 68], 42], B7sus: [[59, 64, 66, 69], 35] };
const I_BARS = ['Emaj7', 'C#m7', 'Amaj7', 'Badd4', 'G#m7', 'C#m7', 'F#m9', 'B7sus'];
const I_TUNE = [
  [[0, 2, 83], [2, 1, 80], [3, 1, 78]], [[0, 3, 80], [3, 1, 76]], [[0, 1.5, 81], [1.5, 0.5, 80], [2, 2, 76]], [[0, 4, 78]],
  [[0, 1, 80], [1, 1, 83], [2, 2, 87]], [[0, 1.5, 85], [1.5, 0.5, 83], [2, 2, 80]], [[0, 1, 81], [1, 1, 80], [2, 1, 78], [3, 1, 76]], [[0, 3, 78], [3, 1, 71]],
];
const I_DROPS = [88, 90, 92, 95, 97, 100, 102, 104];
const VOLUME = 0.85;   // (over the rain: heard clearly at the hall, yet soft)
// 银河列车: its sixteenth; its chords a bar each (notes held, the bass's root); its tune, a bar at a time:
// [from the beat, how many beats, the note] (0: a rest)
// 夏夜: its eighth; its chords, a bar each; its tune, as 银河列车's (in beats of three to the bar)
const S_EIGHTH = 60 / 84 / 2;
const S_CHORDS = { F: [[65, 69, 72], 41], Am: [[64, 69, 72], 45], Bb: [[65, 70, 74], 46], Dm: [[65, 69, 74], 38],
  Gm: [[67, 70, 74], 43], C: [[64, 67, 72], 36] };
const S_BARS = ['F', 'Am', 'Bb', 'F', 'Dm', 'Gm', 'C', 'C', 'F', 'Am', 'Bb', 'Gm', 'F', 'C', 'F', 'F'];
const S_TUNE = [
  [[0, 2, 81], [2, 1, 77]], [[0, 1, 76], [1, 1, 77], [2, 1, 81]], [[0, 2, 82], [2, 1, 86]], [[0, 3, 84]],
  [[0, 2, 86], [2, 1, 84]], [[0, 1, 82], [1, 1, 81], [2, 1, 79]], [[0, 1, 79], [1, 1, 81], [2, 1, 82]], [[0, 3, 79]],
  [[0, 2, 81], [2, 1, 84]], [[0, 1, 88], [1, 1, 86], [2, 1, 84]], [[0, 2, 86], [2, 1, 82]], [[0, 1, 81], [1, 1, 79], [2, 1, 77]],
  [[0, 2, 76], [2, 1, 77]], [[0, 1, 79], [1, 2, 76]], [[0, 3, 77]], [],
];
const G_SIX = 60 / 138 / 4;
const G_CHORDS = { D: [[62, 66, 69, 74], 38], A: [[61, 64, 69, 73], 33], Bm: [[62, 66, 71, 74], 35], 'F#m': [[61, 66, 69, 73], 42],
  G: [[62, 67, 71, 74], 43], Em: [[64, 67, 71, 76], 40] };
const G_BARS = ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'Em', 'A', 'G', 'A', 'F#m', 'Bm', 'Em', 'A', 'D', 'D'];
const G_TUNE = [
  [[0, 1, 74], [1, 1, 78], [2, 1.5, 81], [3.5, 0.5, 79]],
  [[0, 1, 76], [1, 0.5, 73], [1.5, 0.5, 76], [2, 2, 81]],
  [[0, 1, 78], [1, 1, 74], [2, 1.5, 71], [3.5, 0.5, 74]],
  [[0, 3, 73], [3, 0.5, 76], [3.5, 0.5, 78]],
  [[0, 1, 79], [1, 1, 83], [2, 1, 86], [3, 1, 83]],
  [[0, 1.5, 81], [1.5, 0.5, 78], [2, 2, 74]],
  [[0, 1, 76], [1, 1, 79], [2, 1, 83], [3, 1, 81]],
  [[0, 2, 81], [2, 1, 85], [3, 1, 88]],
  [[0, 1.5, 86], [1.5, 0.5, 83], [2, 1, 79], [3, 1, 83]],
  [[0, 1.5, 85], [1.5, 0.5, 81], [2, 2, 76]],
  [[0, 1, 78], [1, 1, 81], [2, 1, 85], [3, 1, 81]],
  [[0, 3, 83], [3, 1, 81]],
  [[0, 1, 79], [1, 1, 83], [2, 1, 79], [3, 1, 76]],
  [[0, 1, 81], [1, 1, 85], [2, 2, 88]],
  [[0, 4, 86]],
  [[2, 0.5, 81], [2.5, 0.5, 83], [3, 0.5, 85], [3.5, 0.5, 88]],
];

// 萤火原野: its eighth; its chords a bar each (in the strings' reach; the bass's root); its tune, a bar of six eighths
// at a time: [from the eighth, how many eighths, the note]; its fireflies' notes (A major's pentatonic, high)
const F_EIGHTH = 60 / 100 / 3;
const F_CHORDS = { A: [[64, 69, 73, 76], 45], 'B/A': [[63, 66, 71, 75], 45], 'C#m7': [[64, 68, 71, 73], 49], 'F#m7': [[66, 69, 73, 76], 42],
  D: [[66, 69, 74, 78], 38], E: [[64, 68, 71, 76], 40], 'A/C#': [[64, 69, 73, 76], 37], Dmaj7: [[66, 69, 73, 74], 38], 'E/D': [[64, 68, 71, 74], 38],
  Bm7: [[66, 69, 71, 74], 35], F: [[65, 69, 72, 77], 41], G: [[67, 71, 74, 79], 43] };
const F_CHORUS = ['D', 'E', 'C#m7', 'F#m7', 'Bm7', 'E', 'A', 'A'];
const F_BARS = ['A', 'B/A', 'C#m7', 'F#m7', 'D', 'E', 'A/C#', 'E', ...F_CHORUS, 'Dmaj7', 'E/D', 'C#m7', 'F#m7', 'Bm7', 'F', 'G', 'A', ...F_CHORUS];
// (the tune: the strings below run as through the fields; the tune above them looks up: long notes after wide leaps,
// held on the open colours of the night sky, a fifth, a ninth, a major seventh, the B major over A's raised fourth)
const F_CHORUS_TUNE = [
  [[0, 2, 81], [2, 1, 85], [3, 3, 90]], [[0, 3, 88], [3, 3, 83]], [[0, 2, 85], [2, 1, 83], [3, 3, 80]], [[0, 3, 81], [3, 3, 88]],
  [[0, 3, 86], [3, 2, 85], [5, 1, 83]], [[0, 2, 83], [2, 1, 86], [3, 3, 92]], [[0, 6, 88]],
];
const F_TUNE = [
  [[0, 1, 76], [1, 1, 83], [2, 4, 81]], [[0, 1, 80], [1, 1, 83], [2, 4, 87]], [[0, 4, 85], [4, 1, 83], [5, 1, 80]], [[0, 4, 81], [4, 2, 76]],
  [[0, 1, 78], [1, 1, 81], [2, 4, 88]], [[0, 3, 86], [3, 3, 83]], [[0, 4, 85], [4, 1, 81], [5, 1, 83]], [[0, 4, 80], [4, 1, 83], [5, 1, 85]],
  ...F_CHORUS_TUNE, [[0, 4, 85], [4, 1, 81], [5, 1, 83]],
  [[0, 3, 85], [3, 3, 88]], [[0, 3, 83], [3, 3, 92]], [[0, 6, 88]], [[0, 3, 85], [3, 3, 81]],
  [[0, 3, 86], [3, 3, 88]], [[0, 3, 88], [3, 3, 93]], [[0, 3, 86], [3, 3, 91]], [[0, 6, 93]],
  ...F_CHORUS_TUNE, [[0, 4, 81], [4, 1, 73], [5, 1, 74]],
];
const F_FLIES = [81, 83, 85, 88, 90, 93, 95, 97];
// how strongly each bar is played: rising through the running, full in the chorus, hushed as the sky opens and
// swelling up through it to the last chorus, falling away at its end into the beginning again
const F_DYN = [0.4, 0.45, 0.55, 0.62, 0.7, 0.76, 0.82, 0.88, 0.9, 0.95, 0.92, 0.96, 1, 1, 0.97, 0.8,
  0.42, 0.45, 0.5, 0.56, 0.66, 0.78, 0.9, 1, 1, 1, 0.98, 1, 1, 0.95, 0.8, 0.55];

export class ConcertMusic {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.level = 0;
    this.out = new GainNode(ctx, { gain: 0 });
    this.vol = new GainNode(ctx, { gain: 1 });                     // (how loud one wants it: setVolume)
    this.out.connect(this.vol).connect(out);
    this.analyser = new AnalyserNode(ctx, { fftSize: 1024 });   // (how loud it is, for the hall's lights)
    this.out.connect(this.analyser);
    this.wave = new Float32Array(this.analyser.fftSize);
    // the room: a reverb of fading noise; a dry path and a wet one
    this.dry = new GainNode(ctx, { gain: 0.8 });
    this.wet = new GainNode(ctx, { gain: 0.45 });
    const verb = new ConvolverNode(ctx, { buffer: this.impulse(2.4) });
    this.dry.connect(this.out);
    this.wet.connect(verb).connect(this.out);
    // the piano's echoes: a dotted eighth, fading
    this.echo = new DelayNode(ctx, { delayTime: 0.6, maxDelayTime: 2 });
    const fb = new GainNode(ctx, { gain: 0.32 }), tone = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 2600 });
    this.echo.connect(tone).connect(fb).connect(this.echo);
    tone.connect(this.wet);
    this.noise = this.noiseBuffer(1);
    this.track = 'galaxy';   // (银河列车 unless another is chosen)
    this.playing = false;
    this.timer = null;
  }

  // which piece: 'galaxy', 'summer', 'isle' or 'fields' (from its start, at once)
  setTrack(name) {
    if (name === this.track) return;
    this.track = name;
    this.wet.gain.setTargetAtTime(name === 'fields' ? 0.75 : 0.45, this.ctx.currentTime, 0.5);   // (萤火原野 in a wider room)
    this.step = 0;
    this.next = this.ctx.currentTime + 0.15;
  }

  noiseBuffer(secs) {
    const ctx = this.ctx, n = ctx.sampleRate * secs, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  impulse(secs) {
    const ctx = this.ctx, n = Math.round(ctx.sampleRate * secs), buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
    }
    return buf;
  }


  // how loud it is just now, as it goes out (0..1, roughly)
  loudness() {
    if (!this.playing && this.out.gain.value < 0.001) return 0;
    this.analyser.getFloatTimeDomainData(this.wave);
    let s = 0;
    for (const v of this.wave) s += v * v;
    return Math.min(1, Math.sqrt(s / this.wave.length) * 6);
  }

  // how loud one wants it heard (a gain, 1 as it was made; after the analyser, so the lights move with it all the same)
  setVolume(k) { this.vol.gain.setTargetAtTime(k, this.ctx.currentTime, 0.1); }

  // how loud, 0..1 (eased toward it); plays only while above nothing
  setLevel(level) {
    if (Math.abs(level - this.level) < 0.002 && (level > 0) === this.playing) return;
    this.level = level;
    this.out.gain.setTargetAtTime(level * VOLUME, this.ctx.currentTime, 1.2);
    if (level > 0 && !this.playing) this.play();
    else if (level <= 0 && this.playing) this.stopSoon();
  }

  play() {
    clearTimeout(this.stopping);
    this.playing = true;
    if (this.timer) return;
    this.step = 0;
    this.next = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 50);
  }

  // (once it has faded out)
  stopSoon() {
    this.playing = false;
    clearTimeout(this.stopping);
    this.stopping = setTimeout(() => { if (!this.playing) { clearInterval(this.timer); this.timer = null; } }, 6000);
  }

  // what falls in the next fifth of a second, a step at a time (a sixteenth, or 夏夜's eighth)
  schedule() {
    // (the page held back, its timer late, as when its window is hidden: the steps already past skipped, not all
    // played at once)
    const [stepLen, steps] = { galaxy: [G_SIX, G_BARS.length * 16], summer: [S_EIGHTH, S_BARS.length * 6], fields: [F_EIGHTH, F_BARS.length * 6], isle: [I_SIX, I_BARS.length * 16] }[this.track];
    const late = this.ctx.currentTime - this.next;
    if (late > 0.05) {
      const skip = Math.ceil(late / stepLen);
      this.step = (this.step + skip) % steps;
      this.next += skip * stepLen;
    }
    if (this.track === 'galaxy') {
      while (this.next < this.ctx.currentTime + 0.2) {
        this.sixteenth(this.step, this.next);
        this.step = (this.step + 1) % (G_BARS.length * 16);
        this.next += G_SIX;
      }
      return;
    }
    if (this.track === 'fields') {
      while (this.next < this.ctx.currentTime + 0.2) {
        this.fields(this.step, this.next);
        this.step = (this.step + 1) % (F_BARS.length * 6);
        this.next += F_EIGHTH;
      }
      return;
    }
    if (this.track === 'summer') {
      while (this.next < this.ctx.currentTime + 0.2) {
        this.waltz(this.step, this.next + (this.step % 2 ? S_EIGHTH * 0.06 : 0));
        this.step = (this.step + 1) % (S_BARS.length * 6);
        this.next += S_EIGHTH;
      }
      return;
    }
    while (this.next < this.ctx.currentTime + 0.2) {                                // 星屿夜雨
      this.isle(this.step, this.next);
      this.step = (this.step + 1) % (I_BARS.length * 16);
      this.next += I_SIX;
    }
  }

  // 星屿夜雨, a sixteenth at a time
  isle(step, t) {
    const bar = Math.floor(step / 16), s = step % 16, beat = s / 4, [notes, root] = I_CHORDS[I_BARS[bar]], B = I_SIX * 4;
    if (s === 0) {
      this.pad(notes.map((n) => n - 12), t, B * 4, 650, 0.045);
      this.bass(root, t, 0.7);
    }
    if (s % 4 === 0) this.keys(notes[(s / 4 + bar) % notes.length] + 12, t, 0.35 + Math.random() * 0.25);
    for (const [at, len, n] of I_TUNE[bar]) if (Math.abs(at - beat) < 1e-6) this.flute(n, t, len * B);
    if (Math.random() < 0.16) this.drop(I_DROPS[Math.floor(Math.random() * I_DROPS.length)], t + Math.random() * I_SIX * 0.5);
  }

  // a soft flute: a sine and a little of its octave, breathing in, a slow vibrato coming
  flute(n, t, len) {
    const ctx = this.ctx, g = new GainNode(ctx, { gain: 0 }), vib = new OscillatorNode(ctx, { frequency: 4.8 }), vg = new GainNode(ctx, { gain: 0 });
    g.connect(this.dry); g.connect(this.echo); g.connect(this.wet);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.18);
    g.gain.setValueAtTime(0.055, t + Math.max(0.2, len - 0.1)); g.gain.setTargetAtTime(0, t + Math.max(0.2, len - 0.1), 0.25);
    vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(9, t + Math.min(0.8, len));
    vib.connect(vg);
    for (const [ratio, k, type] of [[1, 1, 'sine'], [2, 0.12, 'triangle']]) {
      const o = new OscillatorNode(ctx, { type, frequency: hz(n) * ratio });
      vg.connect(o.detune); o.connect(new GainNode(ctx, { gain: k })).connect(g); o.start(t); o.stop(t + len + 1.5);
    }
    vib.start(t); vib.stop(t + len + 1.5);
  }

  // a drop of rain: a high note, plucked short, somewhere about
  drop(n, t) {
    const ctx = this.ctx, o = new OscillatorNode(ctx, { frequency: hz(n) }), g = new GainNode(ctx, { gain: 0 }), pan = new StereoPannerNode(ctx, { pan: Math.random() * 1.6 - 0.8 });
    o.connect(g).connect(pan); pan.connect(this.dry); pan.connect(this.wet); pan.connect(this.echo);
    this.env(g, t, 0.002, 0.02 + Math.random() * 0.02, 0.005, 0.07);
    o.start(t); o.stop(t + 0.6);
  }

  env(g, t, a, peak, d, end) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(0, t + a + d, end);
  }

  // 银河列车, a sixteenth at a time
  sixteenth(step, t) {
    const bar = Math.floor(step / 16), s = step % 16, beat = s / 4, [notes, root] = G_CHORDS[G_BARS[bar]], B4 = G_SIX * 4;
    if (s === 0) this.pad(notes, t, B4 * 4, 1800, 0.035);
    if (s % 2 === 0) this.drive(s % 8 === 4 ? root + 12 : root, t);                          // (wheels on rails)
    if (s % 4 === 2) this.stab(notes, t);                                                    // (the chords, offbeat)
    for (const [at, len, n] of G_TUNE[bar]) if (n && Math.abs(at - beat) < 1e-6) this.brass(n, t, len * B4);
    if ((bar === 7 || bar === 15) && s >= 8) this.sparkle(notes[(s - 8) % notes.length] + 24 + (s >= 12 ? 12 : 0), t);   // (stars, at the turns)
    this.hit(t, { type: 'highpass', freq: 6500, gain: s % 2 ? 0.018 : 0.03, dur: 0.035 });  // (the shaker)
  }

  // 萤火原野, an eighth at a time (six to the bar: two dotted quarters)
  fields(step, t) {
    const bar = Math.floor(step / 6), e = step % 6, [notes, root] = F_CHORDS[F_BARS[bar]], E8 = F_EIGHTH;
    const sky = bar >= 16 && bar < 24, chorus = (bar >= 8 && bar < 16) || bar >= 24, last = bar >= 24, dyn = F_DYN[bar];
    if (e === 0) {
      this.pad(notes, t, E8 * 6, chorus ? 2000 : sky ? 1400 : 1100, (chorus ? 0.034 : sky ? 0.03 : 0.024) * dyn);
      if (sky) this.choir(notes, t, E8 * 6, 0.026 * dyn);
      else if (last) this.choir(notes, t, E8 * 6, 0.016 * dyn);
      this.shimmer(notes, t, E8 * 6, (sky ? 0.012 : 0.006) * (0.6 + 0.4 * dyn));   // (light high over it all, slowly breathing)
    }
    // the bass: the root on the first of the two beats, its fifth on the second (under the sky, the root held)
    if (e === 0) this.bass(root, t, (sky ? 0.5 : chorus ? 0.45 : 0.38) * (0.5 + 0.5 * dyn));
    else if (e === 3 && !sky) this.bass(root + 7, t, (chorus ? 0.3 : 0.24) * (0.5 + 0.5 * dyn));
    // the strings running: the chord's notes, short, the first of each beat leaning; coming in a little at a time at
    // the start (none, then the beats, then all); under the sky, instead, a slow arpeggio of glass going up
    if (sky) { if (e % 2 === 0) this.glass(notes[e / 2 + (bar % 2)] + 24 - (e === 0 ? 12 : 0), t, 0.7 + 0.3 * dyn); }
    else if (bar >= 2 && (bar >= 4 || e % 3 === 0)) this.bow(notes[[0, 1, 2, 1, 2, 3][e]], t, (e % 3 === 0 ? 1 : 0.6) * dyn);
    if (chorus && e % 3 === 0) this.keys(notes[e === 0 ? 3 : 2] + 12, t, (e === 0 ? 0.55 : 0.4) * dyn);
    for (const [at, len, n] of F_TUNE[bar]) {
      if (at !== e) continue;
      this.whistle(n, t, len * E8, 0.75 + 0.25 * dyn);
      if (last || sky) this.whistle(n - 12, t, len * E8, 0.4 * dyn);
      if (last && bar < 31) this.glass(n + 12 > 100 ? n : n + 12, t, 0.5);   // (and lifted above, in the last chorus)
    }
    if (Math.random() < (sky ? 0.3 : chorus ? 0.12 : 0.08)) this.firefly(F_FLIES[Math.floor(Math.random() * F_FLIES.length)], t + Math.random() * E8);
  }

  // light high over it all: two of the chord's notes two octaves up, soft sines, each swelling and fading on its own
  // slow breath, far to either side
  shimmer(notes, t, len, level) {
    const ctx = this.ctx;
    [notes[1], notes[3]].forEach((n, i) => {
      const o = new OscillatorNode(ctx, { frequency: hz(n + 24) }), g = new GainNode(ctx, { gain: 0 }), pan = new StereoPannerNode(ctx, { pan: i ? 0.7 : -0.7 });
      const lfo = new OscillatorNode(ctx, { frequency: 0.25 + i * 0.13 }), lg = new GainNode(ctx, { gain: level * 0.5 });
      lfo.connect(lg).connect(g.gain);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + len * 0.4); g.gain.setTargetAtTime(0, t + len, 0.6);
      o.connect(g).connect(pan); pan.connect(this.wet); pan.connect(this.echo);
      o.start(t); lfo.start(t); o.stop(t + len + 3); lfo.stop(t + len + 3);
    });
  }

  // a note of glass: soft, bell-like, ringing long into the room
  glass(n, t, vel) {
    const ctx = this.ctx, g = new GainNode(ctx, { gain: 0 }), pan = new StereoPannerNode(ctx, { pan: Math.random() * 1.2 - 0.6 });
    g.connect(pan); pan.connect(this.dry); pan.connect(this.echo); pan.connect(this.wet);
    this.env(g, t, 0.01, 0.022 * vel, 0.05, 1.1);
    for (const [ratio, k] of [[1, 1], [3, 0.06], [4.2, 0.03]]) {
      const o = new OscillatorNode(ctx, { frequency: hz(n) * ratio });
      o.connect(new GainNode(ctx, { gain: k })).connect(g); o.start(t); o.stop(t + 5);
    }
  }

  // a whistle (or an ocarina): a sine with a little of its next two, a breath of air with it, a slow vibrato coming
  whistle(n, t, len, vel) {
    const ctx = this.ctx, g = new GainNode(ctx, { gain: 0 }), peak = 0.065 * vel;
    g.connect(this.dry); g.connect(this.echo); g.connect(this.wet);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.035);
    g.gain.setValueAtTime(peak * 0.85, t + Math.max(0.05, len - 0.06)); g.gain.setTargetAtTime(0, t + Math.max(0.05, len - 0.06), 0.09);
    const vib = new OscillatorNode(ctx, { frequency: 5.6 }), vg = new GainNode(ctx, { gain: 0 });
    vg.gain.setValueAtTime(0, t + 0.2); vg.gain.linearRampToValueAtTime(12, t + Math.min(0.8, len + 0.2));
    vib.connect(vg);
    for (const [ratio, k] of [[1, 1], [2, 0.08], [3, 0.03]]) {
      const o = new OscillatorNode(ctx, { frequency: hz(n) * ratio });
      vg.connect(o.detune); o.connect(new GainNode(ctx, { gain: k })).connect(g); o.start(t); o.stop(t + len + 0.8);
    }
    const air = new AudioBufferSourceNode(ctx, { buffer: this.noise, loop: true });
    air.connect(new BiquadFilterNode(ctx, { type: 'bandpass', frequency: Math.min(9000, hz(n) * 2), Q: 2 })).connect(new GainNode(ctx, { gain: 0.05 })).connect(g);
    air.start(t, Math.random() * 0.5); air.stop(t + len + 0.8);
    vib.start(t); vib.stop(t + len + 0.8);
  }

  // the strings running: a short bow, two saws a little apart
  bow(n, t, vel) {
    const ctx = this.ctx, filt = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1900, Q: 0.7 }), g = new GainNode(ctx, { gain: 0 });
    filt.connect(g); g.connect(this.dry); g.connect(this.wet);
    this.env(g, t, 0.012, 0.024 * vel, 0.05, 0.06);
    for (const det of [-7, 7]) { const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: hz(n), detune: det }); o.connect(filt); o.start(t); o.stop(t + 0.5); }
  }

  // voices held: saws through the formants of an open 'ah', slow to come and go
  choir(notes, t, len, level) {
    const ctx = this.ctx, g = new GainNode(ctx, { gain: 0 });
    g.connect(this.dry); g.connect(this.wet);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + Math.min(0.9, len * 0.5));
    g.gain.setValueAtTime(level, t + len - 0.1); g.gain.setTargetAtTime(0, t + len - 0.1, 0.5);
    const f1 = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 750, Q: 4 }), f2 = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 1150, Q: 5 });
    f1.connect(g); f2.connect(new GainNode(ctx, { gain: 0.6 })).connect(g);
    notes.forEach((n, i) => {
      const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: hz(n), detune: (i - 1.5) * 5 });
      o.connect(f1); o.connect(f2); o.start(t); o.stop(t + len + 2.5);
    });
  }

  // a firefly: a soft high bell, somewhere about, blinking out slowly
  firefly(n, t) {
    const ctx = this.ctx, g = new GainNode(ctx, { gain: 0 }), pan = new StereoPannerNode(ctx, { pan: Math.random() * 1.8 - 0.9 });
    g.connect(pan); pan.connect(this.dry); pan.connect(this.echo); pan.connect(this.wet);
    this.env(g, t, 0.003, 0.012 + Math.random() * 0.014, 0.02, 0.5 + Math.random() * 0.5);
    for (const [ratio, k] of [[1, 1], [2.76, 0.2]]) {
      const o = new OscillatorNode(ctx, { frequency: hz(n) * ratio });
      o.connect(new GainNode(ctx, { gain: k })).connect(g); o.start(t); o.stop(t + 3);
    }
  }

  // 夏夜, an eighth at a time (six to the bar)
  waltz(step, t) {
    const bar = Math.floor(step / 6), e = step % 6, beat = e / 2, [notes, root] = S_CHORDS[S_BARS[bar]], B = S_EIGHTH * 2;
    if (e === 0) {
      this.pad(notes.map((n) => n - 12), t, B * 3, 700, 0.028);
      this.bass(root, t, 0.55);
    }
    const arp = [notes[0], notes[1], notes[2], notes[0] + 12, notes[2], notes[1]];
    this.harp(arp[e] + (bar % 2 && e === 3 ? 12 : 0), t, e === 0 ? 0.9 : 0.6);
    for (const [at, len, n] of S_TUNE[bar]) if (Math.abs(at - beat) < 1e-6) this.celesta(n, t, len * B);
    if (e === 0 && Math.random() < 0.3) this.crickets(t + Math.random() * B * 2);
  }

  celesta(n, t, len) {
    const ctx = this.ctx, g = new GainNode(ctx, { gain: 0 });
    g.connect(this.dry); g.connect(this.echo); g.connect(this.wet);
    this.env(g, t, 0.004, 0.06, 0.02, Math.max(0.5, len * 0.6));
    for (const [ratio, k] of [[1, 1], [4, 0.25], [2, 0.12]]) {
      const o = new OscillatorNode(ctx, { frequency: hz(n) * ratio });
      o.connect(new GainNode(ctx, { gain: k })).connect(g); o.start(t); o.stop(t + len + 3);
    }
  }

  harp(n, t, vel) {
    const ctx = this.ctx, o = new OscillatorNode(ctx, { type: 'triangle', frequency: hz(n) }), g = new GainNode(ctx, { gain: 0 });
    o.connect(g); g.connect(this.dry); g.connect(this.wet);
    this.env(g, t, 0.003, 0.045 * vel, 0.02, 0.35);
    o.start(t); o.stop(t + 2);
  }

  // crickets far off: a few quick chirps, high, soft
  crickets(t) {
    const ctx = this.ctx, pan = new StereoPannerNode(ctx, { pan: Math.random() * 2 - 1 });
    pan.connect(this.wet);
    for (let k = 0; k < 3; k++) {
      const o = new OscillatorNode(ctx, { frequency: 4300 + Math.random() * 300 }), g = new GainNode(ctx, { gain: 0 }), t0 = t + k * 0.11;
      o.connect(g).connect(pan);
      for (let p = 0; p < 4; p++) { g.gain.setValueAtTime(0.006, t0 + p * 0.018); g.gain.setValueAtTime(0, t0 + p * 0.018 + 0.009); }
      o.start(t0); o.stop(t0 + 0.1);
    }
  }

  brass(n, t, len) {
    const ctx = this.ctx, filt = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 600, Q: 1.2 }), g = new GainNode(ctx, { gain: 0 });
    filt.frequency.setValueAtTime(600, t); filt.frequency.linearRampToValueAtTime(3200, t + 0.06); filt.frequency.setTargetAtTime(1800, t + 0.06, 0.25);
    filt.connect(g); g.connect(this.dry); g.connect(this.echo); g.connect(this.wet);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.075, t + 0.03); g.gain.setValueAtTime(0.065, t + Math.max(0.05, len - 0.06)); g.gain.setTargetAtTime(0, t + Math.max(0.05, len - 0.06), 0.08);
    const vib = new OscillatorNode(ctx, { frequency: 5.5 }), vg = new GainNode(ctx, { gain: 0 });
    vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(6, t + Math.min(0.4, len));
    vib.connect(vg);
    for (const det of [-6, 6]) {
      const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: hz(n), detune: det });
      vg.connect(o.detune); o.connect(filt); o.start(t); o.stop(t + len + 0.6);
    }
    vib.start(t); vib.stop(t + len + 0.6);
  }

  stab(notes, t) {
    const ctx = this.ctx, filt = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 2200 }), g = new GainNode(ctx, { gain: 0 });
    filt.connect(g); g.connect(this.dry); g.connect(this.wet);
    this.env(g, t, 0.004, 0.035, 0.03, 0.05);
    for (const n of notes) { const o = new OscillatorNode(ctx, { type: 'square', frequency: hz(n) }); o.connect(filt); o.start(t); o.stop(t + 0.4); }
  }

  drive(root, t) {
    const ctx = this.ctx, filt = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 700 }), g = new GainNode(ctx, { gain: 0 });
    filt.connect(g); g.connect(this.dry);
    this.env(g, t, 0.005, 0.2, 0.06, 0.06);
    for (const [type, k] of [['sawtooth', 1], ['sine', 0.5]]) { const o = new OscillatorNode(ctx, { type, frequency: hz(root) }); o.connect(new GainNode(ctx, { gain: k })).connect(filt); o.start(t); o.stop(t + 0.5); }
  }

  sparkle(n, t) {
    const ctx = this.ctx, o = new OscillatorNode(ctx, { frequency: hz(n) }), g = new GainNode(ctx, { gain: 0 });
    o.connect(g); g.connect(this.echo); g.connect(this.wet);
    this.env(g, t, 0.003, 0.04, 0.01, 0.25);
    o.start(t); o.stop(t + 1.5);
  }

  hit(t, { type, freq, q = 1, gain, dur }) {
    const ctx = this.ctx, src = new AudioBufferSourceNode(ctx, { buffer: this.noise }), g = new GainNode(ctx, { gain: 0 });
    src.connect(new BiquadFilterNode(ctx, { type, frequency: freq, Q: q })).connect(g);
    g.connect(this.dry);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  }

  pad(notes, t, len, bright = 900, level = 0.05) {
    const ctx = this.ctx, filt = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: bright, Q: 0.4 }), g = new GainNode(ctx, { gain: 0 });
    filt.connect(g); g.connect(this.dry); g.connect(this.wet);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + Math.min(1.0, len * 0.3));
    g.gain.setValueAtTime(level, t + len - 0.2);
    g.gain.setTargetAtTime(0, t + len - 0.2, 0.6);
    notes.forEach((n, i) => {                           // (one voice a note, a little apart from its neighbours)
      const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: hz(n - 12), detune: i % 2 ? 6 : -6 });
      o.connect(filt); o.start(t); o.stop(t + len + 3);
    });
  }

  bass(root, t, vel) {
    const ctx = this.ctx, o = new OscillatorNode(ctx, { type: 'sine', frequency: hz(root) }), g = new GainNode(ctx, { gain: 0 });
    const o2 = new OscillatorNode(ctx, { type: 'triangle', frequency: hz(root) });
    o.connect(g); o2.connect(new GainNode(ctx, { gain: 0.25 })).connect(g); g.connect(this.dry);
    this.env(g, t, 0.02, 0.32 * vel, 0.25, 0.5);
    o.start(t); o2.start(t); o.stop(t + 3); o2.stop(t + 3);
  }

  keys(n, t, vel) {
    const ctx = this.ctx, f = hz(n);
    const car = new OscillatorNode(ctx, { frequency: f }), mod = new OscillatorNode(ctx, { frequency: f }), idx = new GainNode(ctx, { gain: 0 });
    mod.connect(idx).connect(car.frequency);
    idx.gain.setValueAtTime(f * 1.4 * vel, t); idx.gain.setTargetAtTime(f * 0.2, t, 0.15);
    const g = new GainNode(ctx, { gain: 0 }), pan = new StereoPannerNode(ctx, { pan: (Math.random() * 2 - 1) * 0.5 });
    car.connect(g).connect(pan);
    pan.connect(this.dry); pan.connect(this.echo); pan.connect(this.wet);
    this.env(g, t, 0.005, 0.07 * vel, 0.05, 0.45);
    car.start(t); mod.start(t); car.stop(t + 2.5); mod.stop(t + 2.5);
  }
}
