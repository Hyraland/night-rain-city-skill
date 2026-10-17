// First-person walk through the city. By default one strolls on one's own along a route (a line of points
// through the streets, there and back), glancing up at the big screens as they come; drag to look around,
// WASD / arrow keys to walk freely (W to walk, W twice quickly to run), Space to hand control back to the stroll.

import * as THREE from 'three';
import { CURB } from './constants.js';

const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const EYE = 1.65;
const GAIT = {
  walk: { speed: 1.6, stride: 0.8, bob: 0.022, sway: 0.014 },
  run: { speed: 4.2, stride: 1.3, bob: 0.045, sway: 0.008 },
  stroll: 1.35,
};
const FOV = 64;
const LOOK_UP = 0.1; // the stroll's resting gaze, a little upward: the towers are the thing here

const STEP_UP = 0.6; // the highest one steps up in one go (a stair is many small steps)

export class Walker {
  // route: the stroll's way, [[x, z], ...]; baseAt(x, z): the street's own level there (the road, or up on a
  // pavement); bounds: [x0, x1, z0, z1], where one may walk freely
  constructor(camera, dom, { colliders, floors = [], sights, route, baseAt = () => CURB, bounds = [-1e4, 1e4, -1e4, 1e4], onStep, onModeChange }) {
    this.camera = camera;
    this.colliders = colliders;
    this.floors = floors;     // terraces, stairs, decks: { x0, x1, z0, z1, at(x, z) }
    this.baseAt = baseAt;
    this.bounds = bounds;
    this.feet = CURB;
    this.sights = sights;     // big screens: { x, y, z, r }, plus moving ones given each frame
    this.onStep = onStep;
    this.onModeChange = onModeChange;
    this.mode = 'auto';
    // the route, its points, the length of each leg and where along it each starts
    this.route = route.map(([x, z]) => new THREE.Vector2(x, z));
    this.legs = [];
    let at = 0;
    for (let i = 0; i + 1 < this.route.length; i++) {
      const len = this.route[i].distanceTo(this.route[i + 1]);
      this.legs.push({ from: this.route[i], to: this.route[i + 1], len, at });
      at += len;
    }
    this.routeLen = Math.max(at, 1e-3);
    this.along = 0;           // how far along the route
    this.dir = 1;             // the stroll's way along it
    const start = this.routeAt(0);
    this.pos = new THREE.Vector3(start.x, 0, start.z);
    this.yaw = start.yaw;
    this.pitch = LOOK_UP;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.lastDrag = -10;
    this.eyeY = EYE;
    this.vel = new THREE.Vector2();
    this.speedNow = 0;
    this.runAmt = 0;
    this.pace = 0.5;          // the pace slider (0..1): walking from a walk's speed to half again a run's
    this.gaitSpeed = GAIT.walk.speed;   // (how fast the gait is, eased: walking, running, striding out)
    this.running = false;     // forward pressed twice in quick succession
    this.forwardUp = -10;     // when forward was last let go
    this.phase = 0;
    this.keys = new Set();
    this.time = 0;
    this.focus = null;

    let dragging = false, lx = 0, ly = 0;
    dom.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; dom.setPointerCapture(e.pointerId); });
    dom.addEventListener('pointerup', (e) => { dragging = false; dom.releasePointerCapture(e.pointerId); });
    dom.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      const k = 0.0032;
      if (this.mode === 'auto') {
        this.lookYaw -= dx * k;
        this.lookPitch = THREE.MathUtils.clamp(this.lookPitch - dy * k, -1.1, 1.3);
        this.lastDrag = this.time;
      } else {
        this.yaw -= dx * k;
        this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -1.2, 1.4);
      }
    });
    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') { e.preventDefault(); this.setMode(this.mode === 'auto' ? 'free' : 'auto'); return; }
      const move = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (move.includes(e.code)) { e.preventDefault(); this.keys.add(e.code); if (this.mode === 'auto') this.setMode('free'); }
      // forward pressed again soon after letting it go: run, until it is let go
      if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !e.repeat) {
        this.running = this.time - this.forwardUp < 0.3;
      }
    });
    addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !this.keys.has('KeyW') && !this.keys.has('ArrowUp')) {
        this.forwardUp = this.time;
        this.running = false;
      }
    });
    addEventListener('blur', () => { this.keys.clear(); this.running = false; });
  }

  // the route at distance d along it: the point, the way it runs (as a yaw: 0 looking toward -z), and the way
  // across it (to its right)
  routeAt(d) {
    d = THREE.MathUtils.clamp(d, 0, this.routeLen);
    const leg = this.legs.find((l) => d <= l.at + l.len) || this.legs[this.legs.length - 1];
    const t = leg.len > 0 ? (d - leg.at) / leg.len : 0;
    const dx = (leg.to.x - leg.from.x) / (leg.len || 1), dz = (leg.to.y - leg.from.y) / (leg.len || 1);
    return { x: leg.from.x + (leg.to.x - leg.from.x) * t, z: leg.from.y + (leg.to.y - leg.from.y) * t, yaw: Math.atan2(-dx, -dz), rx: -dz, rz: dx };
  }

  setMode(mode) {
    if (mode === this.mode) return;
    if (mode === 'free') {
      this.yaw += this.lookYaw;
      this.pitch += this.lookPitch;
      this.lookYaw = this.lookPitch = 0;
    } else {
      // back onto the route where it passes nearest, carrying on the way one is facing
      let best = 0, bestD = Infinity;
      for (let d = 0; d <= this.routeLen; d += 2) {
        const r = this.routeAt(d), dd = Math.hypot(r.x - this.pos.x, r.z - this.pos.z);
        if (dd < bestD) { bestD = dd; best = d; }
      }
      this.along = best;
      const here = this.routeAt(best);
      this.dir = Math.cos(angleDiff(this.yaw, here.yaw)) > 0 ? 1 : -1;
      this.lookYaw = angleDiff(this.yaw, this.dir > 0 ? here.yaw : here.yaw + Math.PI);
      this.lookPitch = this.pitch - LOOK_UP;
      this.yaw -= this.lookYaw;
      this.pitch = LOOK_UP;
      this.lastDrag = this.time;
    }
    this.mode = mode;
    this.onModeChange?.(mode);
  }

  // Something worth a look as the stroll goes by: a big screen, close and ahead or to the
  // side. Held for a while once chosen, so the gaze doesn't flit.
  pickFocus(heading, extra) {
    const f = this.focus;
    if (f && this.time < f.until) return f;
    let best = null;
    for (const g of [...this.sights, ...extra]) {
      const dx = g.x - this.pos.x, dz = g.z - this.pos.z, d = Math.hypot(dx, dz);
      const yaw = Math.atan2(-dx, -dz), rel = angleDiff(yaw, heading);
      if (d > g.r * 1.6 || d < 6 || Math.abs(rel) > 1.6) continue;
      const w = (1 - d / (g.r * 1.6)) * smooth(1.6, 0.6, Math.abs(rel)) * (g.weight ?? 1);
      if (!best || w > best.w) best = { g, w };
    }
    this.focus = best ? { g: best.g, w: Math.min(0.7, best.w * 1.4), until: this.time + 9 } : { g: null, until: this.time + 4 };
    return this.focus;
  }

  // out of anything one has walked into: round things (trees, columns, planters) and buildings, benches,
  // pools (boxes), pushed out the shortest way
  // The ground underfoot: the street or pavement, or the highest terrace, stair or deck here that is no more
  // than a step above where one stands (so under a deck one stays below it).
  // Below the street (the metro station) the street's own level doesn't count where a floor replaces it.
  groundAt(x, z) {
    let best = -Infinity, below = false;
    for (const f of this.floors) {
      if (x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) continue;
      const fh = f.at(x, z);
      if (fh === -Infinity) continue;
      if (f.replace) below = true;
      if (fh > best && fh <= this.feet + STEP_UP) best = fh;
    }
    if (below && best > -Infinity) return best;
    return Math.max(this.baseAt(x, z), best);
  }

  collide() {
    const p = this.pos, body = 0.3;
    for (const c of this.colliders) {
      // some only stop one at certain heights: a terrace's edge from below, a railing up on a deck
      if ((c.y0 !== undefined && this.feet < c.y0) || (c.y1 !== undefined && this.feet > c.y1)) continue;
      if (c.r !== undefined) {
        const dx = p.x - c.x, dz = p.z - c.z, rr = c.r + body, d2 = dx * dx + dz * dz;
        if (d2 < rr * rr && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          p.x = c.x + (dx / d) * rr;
          p.z = c.z + (dz / d) * rr;
        }
      } else if (c.ux !== undefined) {
        // a box turned with its street: in its own axes (u along its x, v along its z)
        if (p.x < c.x0 - body || p.x > c.x1 + body || p.z < c.z0 - body || p.z > c.z1 + body) continue;
        const dx = p.x - c.cx, dz = p.z - c.cz, u = dx * c.ux + dz * c.uz, v = -dx * c.uz + dz * c.ux;
        const hu = c.hx + body, hv = c.hz + body;
        if (Math.abs(u) >= hu || Math.abs(v) >= hv) continue;
        const pu = hu - Math.abs(u), pv = hv - Math.abs(v);
        const nu = pu < pv ? Math.sign(u) * hu : u, nv = pu < pv ? v : Math.sign(v) * hv;
        p.x = c.cx + nu * c.ux - nv * c.uz;
        p.z = c.cz + nu * c.uz + nv * c.ux;
      } else if (p.x > c.x0 - body && p.x < c.x1 + body && p.z > c.z0 - body && p.z < c.z1 + body) {
        const out = [[c.x0 - body - p.x, 0], [c.x1 + body - p.x, 0], [0, c.z0 - body - p.z], [0, c.z1 + body - p.z]];
        out.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
        p.x += out[0][0];
        p.z += out[0][1];
      }
    }
  }

  update(dt, extraSights = []) {
    this.time += dt;
    const prev = this.pos.clone();
    const ease = (rate) => 1 - Math.exp(-dt * rate);
    const running = this.running;
    this.runAmt += ((running ? 1 : 0) - this.runAmt) * ease(4);

    if (this.mode === 'auto') {
      this.speedNow += (GAIT.stroll - this.speedNow) * ease(1.2);
      this.along += this.dir * this.speedNow * dt;
      // at either end of the route, turn back
      if (this.along > this.routeLen - 2) this.dir = -1;
      if (this.along < 2) this.dir = 1;
      // along it, drifting gently from side to side
      const r = this.routeAt(this.along), drift = Math.sin(this.along * 0.006) * 2.2;
      const tx = r.x + r.rx * drift, tz = r.z + r.rz * drift;
      this.pos.x += (tx - this.pos.x) * ease(2);
      this.pos.z += (tz - this.pos.z) * ease(2);
      const heading = this.dir > 0 ? r.yaw : r.yaw + Math.PI;
      let targetYaw = heading, targetPitch = LOOK_UP;
      const f = this.pickFocus(heading, extraSights);
      if (f.g) {
        const g = f.g, dx = g.x - this.pos.x, dz = g.z - this.pos.z, d = Math.max(Math.hypot(dx, dz), 4);
        targetYaw += angleDiff(Math.atan2(-dx, -dz), heading) * f.w;
        targetPitch += (Math.min(0.5, Math.atan2(g.y - this.eyeY, d)) - targetPitch) * f.w;
      }
      this.yaw += angleDiff(targetYaw, this.yaw) * Math.min(1, dt * 0.5);
      this.pitch += (targetPitch - this.pitch) * Math.min(1, dt * 0.4);
      if (this.time - this.lastDrag > 4) {
        const k = Math.min(1, dt * 0.5);
        this.lookYaw -= angleDiff(this.lookYaw, 0) * k;
        this.lookPitch -= this.lookPitch * k;
      }
    } else {
      const f = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
      const r = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
      const turn = (this.keys.has('ArrowLeft') ? 1 : 0) - (this.keys.has('ArrowRight') ? 1 : 0);
      this.yaw += turn * dt * 1.4;
      const want = new THREE.Vector2();
      if (f || r) {
        const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
        want.set(fx * f - fz * r, fz * f + fx * r).normalize();
        // (the pace: a walk's speed to half again a run's; running, half again that, never slower than a run)
        const walk = THREE.MathUtils.lerp(GAIT.walk.speed, GAIT.run.speed * 1.5, this.pace), run = Math.max(GAIT.run.speed, walk * 1.5);
        const top = THREE.MathUtils.lerp(walk, run, this.runAmt) * (f < 0 || (r && !f) ? 0.7 : 1);
        this.gaitTo = top;
        want.multiplyScalar(top);
      }
      this.vel.lerp(want, ease(want.lengthSq() > this.vel.lengthSq() ? 4 : 6));
      if (this.vel.lengthSq() < 1e-5) this.vel.set(0, 0);
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.y * dt;
      this.collide();
      this.pos.x = THREE.MathUtils.clamp(this.pos.x, this.bounds[0], this.bounds[1]);
      this.pos.z = THREE.MathUtils.clamp(this.pos.z, this.bounds[2], this.bounds[3]);
    }

    this.feet = this.groundAt(this.pos.x, this.pos.z);
    this.eyeY += (this.feet + EYE - this.eyeY) * Math.min(1, dt * 8);

    // the gait: a footfall every stride, the head lowest as each foot lands
    const travelled = Math.hypot(this.pos.x - prev.x, this.pos.z - prev.z);
    if (this.mode !== 'auto') this.speedNow = travelled / Math.max(dt, 1e-4);
    // (the gait by how fast one means to go: a walk at a walk's speed, a run at a run's, longer strides past it)
    this.gaitSpeed += ((this.mode === 'auto' ? GAIT.walk.speed : this.gaitTo ?? GAIT.walk.speed) - this.gaitSpeed) * ease(4);
    const gait = THREE.MathUtils.clamp((this.gaitSpeed - GAIT.walk.speed) / (GAIT.run.speed - GAIT.walk.speed), 0, 1);
    const stride = THREE.MathUtils.lerp(GAIT.walk.stride, GAIT.run.stride, gait) * Math.max(1, this.gaitSpeed / GAIT.run.speed);
    const before = this.phase;
    this.phase += travelled / stride;
    if (Math.floor(this.phase) !== Math.floor(before)) this.onStep?.(gait);
    const moving = smooth(0.1, 0.8, this.speedNow);
    const ph = this.phase * Math.PI;
    const walkBob = -Math.cos(2 * ph);
    const runBob = 2 * Math.pow(Math.abs(Math.sin(ph)), 0.7) - 1;
    const bob = THREE.MathUtils.lerp(GAIT.walk.bob * walkBob, GAIT.run.bob * runBob, gait) * moving;
    const sway = Math.sin(ph) * THREE.MathUtils.lerp(GAIT.walk.sway, GAIT.run.sway, gait) * moving;

    const cam = this.camera;
    const ry = this.yaw + this.lookYaw;
    cam.position.set(this.pos.x + Math.cos(ry) * sway, this.eyeY + bob, this.pos.z - Math.sin(ry) * sway);
    cam.rotation.set(this.pitch + this.lookPitch - 0.035 * gait * moving, ry, sway * 0.35, 'YXZ');
    const fov = FOV + 4 * gait * moving;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  }
}
