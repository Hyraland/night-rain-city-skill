// The board inside each rain shelter: the city's time and date, where one is, the weather (how hard it is raining
// now, the next hours), and (if the district has a metro line) the next train. One canvas for every board, drawn
// again when what it says changes.
//   place: { cn, en }                       where one is (under the clock)
//   line:  { number, name, toward, last }   the metro line (optional; without it the weather has the room)

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const W = 1024, H = 392;
const NIGHT = 21 * 60 + 36;          // the city's clock starts at 21:36 and goes on as time passes
const EVERY = 4;                     // a train every 4 minutes
const INK = '#08141f', CYAN = '#5fe3f2', PALE = '#d9f6fa', DIM = '#5f8fa0';
const FONT = '"PingFang SC", "Noto Sans SC", sans-serif';
// the hours ahead, as each rain would have them: what the sky does, and how warm
const AHEAD = {
  小雨: [['rain', 17], ['rain', 17], ['drizzle', 16], ['cloud', 16], ['cloud', 15], ['moon', 15]],
  中雨: [['rain', 16], ['rain', 16], ['rain', 16], ['drizzle', 15], ['cloud', 15], ['cloud', 14]],
  暴雨: [['storm', 15], ['storm', 15], ['rain', 15], ['rain', 14], ['drizzle', 14], ['cloud', 14]],
};
const NOW = { 小雨: ['小雨', 17, 92, '东北风 2级'], 中雨: ['中雨', 16, 96, '东北风 3级'], 暴雨: ['暴雨', 15, 99, '东风 5级 · 请勿涉水'] };

// planes: where the boards are (already placed, in the world); returns { mesh, update(seconds, rain name) }
export function makeInfoBoard(planes, { place = { cn: '', en: '' }, line = null } = {}) {
  if (!planes.length) return { mesh: null, update() {} };
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(mergeGeometries(planes), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  let said = '';
  return {
    mesh,
    update(t, rain = '小雨') {
      const min = Math.floor(NIGHT + t / 60), hh = Math.floor(min / 60) % 24, mm = min % 60;
      const wait = EVERY - (min % EVERY);
      const say = `${hh}:${mm}|${rain}|${wait}`;
      if (say === said) return;
      said = say;
      draw(g, hh, mm, rain in NOW ? rain : '小雨', wait, place, line);
      tex.needsUpdate = true;
    },
  };
}

function draw(g, hh, mm, rain, wait, place, line) {
  const pad = (n) => String(n).padStart(2, '0');
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  g.strokeStyle = CYAN; g.lineWidth = 3; g.strokeRect(6, 6, W - 12, H - 12);
  g.strokeStyle = 'rgba(95,227,242,0.35)'; g.lineWidth = 2;
  for (const x of line ? [330, 712] : [330]) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, H - 40); g.stroke(); }
  g.textBaseline = 'alphabetic';

  // the time, the date, where one is
  const d = new Date(), week = '日一二三四五六'[d.getDay()];
  g.fillStyle = PALE; g.font = `200 112px ${FONT}`; g.textAlign = 'left';
  g.fillText(`${pad(hh)}:${pad(mm)}`, 36, 166, 330 - 36 - 26);          // (kept short of the line beside it)
  g.fillStyle = CYAN; g.font = `500 30px ${FONT}`;
  g.fillText(`${d.getMonth() + 1}月${d.getDate()}日 · 星期${week}`, 40, 228);
  g.fillStyle = DIM; g.font = `400 24px ${FONT}`;
  g.fillText(place.cn || '', 40, 274, 330 - 40 - 20);
  g.fillText(place.en || '', 40, 306, 330 - 40 - 20);

  // the weather now, and the hours ahead
  const [name, temp, wet, wind] = NOW[rain];
  icon(g, rain === '暴雨' ? 'storm' : 'rain', 396, 88, 1.4);
  g.fillStyle = PALE; g.font = `300 64px ${FONT}`;
  g.fillText(`${temp}°`, 470, 118);
  g.fillStyle = CYAN; g.font = `500 32px ${FONT}`;
  g.fillText(name, 590, 112);
  g.fillStyle = DIM; g.font = `400 22px ${FONT}`;
  g.fillText(`湿度 ${wet}% · ${wind}`, 362, 178, 330);
  AHEAD[rain].forEach(([kind, t], i) => {
    const x = 380 + i * 54;
    g.fillStyle = DIM; g.font = `400 20px ${FONT}`; g.textAlign = 'center';
    g.fillText(pad((hh + i + 1) % 24), x, 230);
    icon(g, kind, x, 268, 0.62);
    g.fillStyle = PALE; g.font = `400 22px ${FONT}`;
    g.fillText(`${t}°`, x, 318);
  });
  g.textAlign = 'left';

  // the next train
  if (!line) return;
  g.strokeStyle = CYAN; g.lineWidth = 6;
  g.beginPath(); g.arc(790, 108, 40, 0, Math.PI * 2); g.stroke();
  g.fillStyle = CYAN; g.font = `700 50px ${FONT}`; g.textAlign = 'center';
  g.fillText(String(line.number ?? ''), 790, 126, 64);
  g.textAlign = 'left';
  g.fillStyle = PALE; g.font = `500 27px ${FONT}`;
  g.fillText(line.name || '', 846, 104, W - 846 - 24);
  g.fillStyle = DIM; g.font = `400 20px ${FONT}`;
  g.fillText(line.toward ? `开往 ${line.toward}` : '', 850, 136, W - 850 - 24);
  g.fillStyle = DIM; g.font = `400 24px ${FONT}`;
  g.fillText('下一班', 752, 214);
  g.fillStyle = wait <= 1 ? CYAN : PALE; g.font = `300 66px ${FONT}`;
  g.fillText(wait <= 1 ? '即将进站' : `${wait} 分钟`, 750, 286);
  g.fillStyle = DIM; g.font = `400 20px ${FONT}`;
  g.fillText(line.last || '', 752, 330, W - 752 - 24);
}

// a little drawing of the sky at (x, y), k its size: rain, drizzle, a storm (cloud, drops), cloud, the moon
function icon(g, kind, x, y, k) {
  g.save(); g.translate(x, y); g.scale(k, k);
  if (kind === 'moon') {
    g.fillStyle = PALE; g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(9, -6, 18, 0, Math.PI * 2); g.fill();
  } else {
    g.fillStyle = kind === 'storm' ? '#9fb6c4' : PALE;
    g.beginPath();
    g.arc(-14, 2, 14, 0, Math.PI * 2); g.arc(4, -6, 18, 0, Math.PI * 2); g.arc(20, 4, 12, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-14, 4, 34, 12);
    if (kind !== 'cloud') {
      const n = kind === 'drizzle' ? 2 : kind === 'storm' ? 5 : 3;
      g.strokeStyle = CYAN; g.lineWidth = 4; g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const dx = -14 + i * (34 / Math.max(1, n - 1));
        g.beginPath(); g.moveTo(dx, 24); g.lineTo(dx - 5, kind === 'drizzle' ? 32 : 38); g.stroke();
      }
    }
  }
  g.restore();
}
