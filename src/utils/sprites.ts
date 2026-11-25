export interface GameSprites {
  enemyDrone: HTMLCanvasElement | null;
  tank: HTMLCanvasElement | null;
  allyShip: HTMLImageElement | null;
}

/**
 * 使用边缘泛洪（Flood Fill）精准抠除纯白背景，保留机身上的白色装甲高光
 */
function removeWhiteBgEdgeFlood(img: HTMLImageElement, threshold = 236): HTMLCanvasElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  // 限制最大尺寸到 512px 保证游戏渲染高性能
  const scale = Math.min(1, 512 / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, cw, ch);

  const imgData = ctx.getImageData(0, 0, cw, ch);
  const data = imgData.data;
  const visited = new Uint8Array(cw * ch);

  const isBg = (idx: number) => {
    const p = idx * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    return r >= threshold && g >= threshold && b >= threshold;
  };

  const queue = new Int32Array(cw * ch);
  let head = 0;
  let tail = 0;

  const pushIfBg = (x: number, y: number) => {
    const idx = y * cw + x;
    if (!visited[idx] && isBg(idx)) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  // 从四条边缘开始泛洪
  for (let x = 0; x < cw; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, ch - 1);
  }
  for (let y = 0; y < ch; y++) {
    pushIfBg(0, y);
    pushIfBg(cw - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    data[idx * 4 + 3] = 0; // 设为透明

    const x = idx % cw;
    const y = (idx - x) / cw;
    if (x > 0) pushIfBg(x - 1, y);
    if (x < cw - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < ch - 1) pushIfBg(x, y + 1);
  }

  // 轻微羽化边缘 1px 消除白边锯齿
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const idx = y * cw + x;
      if (data[idx * 4 + 3] === 0) continue;
      const hasTransparentNeighbor =
        data[(idx - 1) * 4 + 3] === 0 ||
        data[(idx + 1) * 4 + 3] === 0 ||
        data[(idx - cw) * 4 + 3] === 0 ||
        data[(idx + cw) * 4 + 3] === 0;
      if (hasTransparentNeighbor && isBg(idx)) {
        data[idx * 4 + 3] = 70;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * 构建 3D 卡通质感友方“安全科普飞船”矢量贴图
 */
function createAllyShipImage(): Promise<HTMLImageElement> {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
    <defs>
      <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="#e0f2fe"/>
        <stop offset="100%" stop-color="#bae6fd"/>
      </linearGradient>
      <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#34d399"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <filter id="drop" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0369a1" flood-opacity="0.25"/>
      </filter>
    </defs>
    <g filter="url(#drop)">
      <!-- 尾部喷射器 -->
      <rect x="74" y="18" width="12" height="18" rx="5" fill="#0369a1"/>
      <rect x="94" y="18" width="12" height="18" rx="5" fill="#0369a1"/>
      <ellipse cx="80" cy="18" rx="5" ry="7" fill="#6ee7b7"/>
      <ellipse cx="100" cy="18" rx="5" ry="7" fill="#6ee7b7"/>
      <!-- 机翼 -->
      <path d="M90 52 L162 84 C168 87 168 102 156 105 L90 96 L24 105 C12 102 12 87 18 84 Z" fill="url(#wingGrad)" stroke="#0369a1" stroke-width="3" stroke-linejoin="round"/>
      <path d="M36 86 L62 80 M144 86 L118 80" stroke="#bae6fd" stroke-width="4" stroke-linecap="round"/>
      <!-- 主机身 -->
      <path d="M90 156 C62 142 54 102 60 54 C64 34 76 28 90 28 C104 28 116 34 120 54 C126 102 118 142 90 156 Z" fill="url(#bodyGrad)" stroke="#0284c7" stroke-width="3.5"/>
      <!-- 驾驶舱玻璃 -->
      <ellipse cx="90" cy="112" rx="16" ry="20" fill="#0ea5e9" stroke="#0369a1" stroke-width="2.5"/>
      <ellipse cx="85" cy="106" rx="6" ry="9" fill="#bae6fd" opacity="0.75"/>
      <!-- 顶部安全盾牌徽章 -->
      <path d="M90 54 L106 61 L104 78 C103 86 90 93 90 93 C90 93 77 86 76 78 L74 61 Z" fill="url(#shieldGrad)" stroke="#ffffff" stroke-width="2.5"/>
      <path d="M84 73 L88 78 L97 68" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

let cachedSprites: GameSprites | null = null;

export async function loadGameSprites(): Promise<GameSprites> {
  if (cachedSprites) return cachedSprites;

  const [enemyImg, tankImg, allyShip] = await Promise.all([
    loadImage('/assets/enemy-drone.jpg').catch(() => null),
    loadImage('/assets/tank.jpg').catch(() => null),
    createAllyShipImage().catch(() => null),
  ]);

  cachedSprites = {
    enemyDrone: enemyImg ? removeWhiteBgEdgeFlood(enemyImg, 238) : null,
    tank: tankImg ? removeWhiteBgEdgeFlood(tankImg, 238) : null,
    allyShip,
  };
  return cachedSprites;
}
