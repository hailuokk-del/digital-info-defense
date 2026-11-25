import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Shield, Eye, Zap, Pause, Play, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
import { AIConfig, CategoryStat, GameReport, InfoCardData, MistakeRecord } from '../types';
import { soundFX } from '../utils/sound';
import { GameSprites, loadGameSprites } from '../utils/sprites';
import { generateWaveCards } from '../utils/aiClient';

interface Props {
  aiConfig: AIConfig;
  onGameOver: (report: GameReport) => void;
  onExit: () => void;
}

interface ActiveUnit {
  uid: string;
  data: InfoCardData;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  wobblePhase: number;
  visualVariant: 'drone' | 'ship'; // 随机外观，与真假无关，防止颜色泄题
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Shockwave {
  x: number;
  y: number;
  r: number;
  maxR: number;
  color: string;
  life: number;
}

interface LaserBeam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const TUTORIAL_KEY = 'did_tutorial_seen_v2';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const chars = text.split('');
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

/**
 * 绘制科技感六边形蜂窝护盾纹理
 */
function drawHexShield(
  ctx: CanvasRenderingContext2D,
  W: number,
  defenseLineY: number,
  H: number,
  shieldFlash: number,
  pulsePhase: number
) {
  const isHurt = shieldFlash > 0;
  const baseColor = isHurt ? '244, 63, 94' : '16, 185, 129';

  // 护盾区域半透明底光
  const areaGrad = ctx.createLinearGradient(0, defenseLineY - 12, 0, H);
  areaGrad.addColorStop(0, `rgba(${baseColor}, ${0.22 + Math.sin(pulsePhase) * 0.05})`);
  areaGrad.addColorStop(1, `rgba(${baseColor}, 0.06)`);
  ctx.fillStyle = areaGrad;
  ctx.fillRect(0, defenseLineY, W, H - defenseLineY);

  // 六边形网格线
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, defenseLineY, W, H - defenseLineY);
  ctx.clip();

  ctx.strokeStyle = `rgba(${baseColor}, ${isHurt ? 0.55 : 0.25})`;
  ctx.lineWidth = 1.2;
  const r = 16;
  const dx = r * 1.732;
  const dy = r * 1.5;
  for (let row = 0; row < 4; row++) {
    for (let col = -1; col < W / dx + 2; col++) {
      const cx = col * dx + (row % 2 === 1 ? dx / 2 : 0);
      const cy = defenseLineY + 12 + row * dy;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i - Math.PI / 6;
        const hx = cx + r * Math.cos(ang);
        const hy = cy + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  // 顶部发光能量弧线
  const lineGrad = ctx.createLinearGradient(0, defenseLineY, W, defenseLineY);
  lineGrad.addColorStop(0, isHurt ? '#fb7185' : '#38bdf8');
  lineGrad.addColorStop(0.5, isHurt ? '#e11d48' : '#34d399');
  lineGrad.addColorStop(1, isHurt ? '#fb7185' : '#38bdf8');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, defenseLineY - 3, W, 6);
}

export const GameCanvas: React.FC<Props> = ({ aiConfig, onGameOver, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<GameSprites>({ enemyDrone: null, tank: null, allyShip: null });
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [energy, setEnergy] = useState(40);
  const [scanLeft, setScanLeft] = useState(0);
  const [scanCooldown, setScanCooldown] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem(TUTORIAL_KEY));
  const [banner, setBanner] = useState<string>('第 1 波防御开始！请看清信息内容辨别真伪');
  const [aiSourceTag, setAiSourceTag] = useState<string>('题库加载中...');

  const stateRef = useRef({
    hp: 100,
    score: 0,
    combo: 0,
    maxCombo: 0,
    wave: 1,
    energy: 40,
    scanTimer: 0,
    paused: !localStorage.getItem(TUTORIAL_KEY),
    ended: false,
    shake: 0,
    recoil: 0,
    shieldFlash: 0,
    pulsePhase: 0,
    turretAngle: -Math.PI / 2,
    activeUnits: [] as ActiveUnit[],
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    lasers: [] as LaserBeam[],
    texts: [] as FloatingText[],
    spawnQueue: [] as InfoCardData[],
    spawnTimer: 0.5,
    loadingWave: false,
    totalHandled: 0,
    correctCount: 0,
    categoryStats: {} as Record<string, CategoryStat>,
    mistakes: [] as MistakeRecord[],
    clouds: [
      { x: 60, y: 65, s: 1.0, spd: 12 },
      { x: 260, y: 140, s: 0.75, spd: 8 },
      { x: 420, y: 90, s: 1.15, spd: 10 },
    ],
  });

  useEffect(() => {
    loadGameSprites().then((sp) => {
      spritesRef.current = sp;
    });
    const bg = new Image();
    bg.onload = () => {
      bgImgRef.current = bg;
    };
    bg.src = '/assets/hero-bg.jpg';
  }, []);

  const recordStat = (card: InfoCardData, isCorrect: boolean, mistakeType?: MistakeRecord['type']) => {
    const st = stateRef.current;
    st.totalHandled += 1;
    if (isCorrect) st.correctCount += 1;

    const cat = card.category || '其他';
    if (!st.categoryStats[cat]) {
      st.categoryStats[cat] = { total: 0, correct: 0 };
    }
    st.categoryStats[cat].total += 1;
    if (isCorrect) st.categoryStats[cat].correct += 1;

    if (!isCorrect && mistakeType) {
      st.mistakes.push({ card, type: mistakeType });
    }
  };

  const getWeakCategories = (): string[] => {
    return Object.entries(stateRef.current.categoryStats)
      .filter(([, v]) => v.total >= 2 && v.correct / v.total < 0.7)
      .map(([k]) => k);
  };

  const fetchWaveCards = useCallback(
    async (targetWave: number) => {
      const st = stateRef.current;
      if (st.loadingWave || st.ended) return;
      st.loadingWave = true;
      const weak = getWeakCategories();

      try {
        const data = await generateWaveCards(aiConfig, targetWave, weak);
        const cards: InfoCardData[] = Array.isArray(data.cards) ? data.cards : [];
        st.spawnQueue.push(...cards);

        setAiSourceTag(
          data.source === 'deepseek'
            ? 'DeepSeek 实时出题'
            : data.source === 'zhipu'
            ? '智谱 GLM 实时出题'
            : '本地智能题库'
        );

        if (weak.length > 0 && targetWave > 1) {
          setBanner(`⚠️ AI 检测到【${weak[0]}】薄弱，第 ${targetWave} 波已定向强化！`);
        } else if (targetWave > 1) {
          setBanner(`第 ${targetWave} 波信息编队来袭！请仔细阅读辨别真伪！`);
        }
      } catch {
        setAiSourceTag('离线兜底题库');
      } finally {
        st.loadingWave = false;
      }
    },
    [aiConfig]
  );

  useEffect(() => {
    fetchWaveCards(1);
  }, [fetchWaveCards]);

  const finishGame = useCallback(() => {
    const st = stateRef.current;
    if (st.ended) return;
    st.ended = true;
    const accuracy = st.totalHandled > 0 ? Math.round((st.correctCount / st.totalHandled) * 100) : 100;
    onGameOver({
      score: st.score,
      maxCombo: st.maxCombo,
      waveReached: st.wave,
      accuracy,
      totalHandled: st.totalHandled,
      correctCount: st.correctCount,
      categoryStats: st.categoryStats,
      mistakes: st.mistakes,
    });
  }, [onGameOver]);

  const closeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setShowTutorial(false);
    stateRef.current.paused = false;
    setPaused(false);
  };

  const openTutorial = () => {
    stateRef.current.paused = true;
    setPaused(true);
    setShowTutorial(true);
  };

  const activateScan = () => {
    if (scanCooldown > 0 || stateRef.current.paused) return;
    soundFX.playScan();
    stateRef.current.scanTimer = 5;
    setScanLeft(5);
    setScanCooldown(14);
    setBanner('🔍 AI 透视镜已开启！全场慢动作，红标击碎 / 绿标放行');
  };

  const activateFirewall = () => {
    const st = stateRef.current;
    if (st.energy < 100 || st.paused) return;
    soundFX.playUlt();
    st.energy = 0;
    setEnergy(0);
    st.shake = 12;

    let cleared = 0;
    const remaining: ActiveUnit[] = [];
    for (const unit of st.activeUnits) {
      if (unit.data.isMalicious) {
        cleared += 1;
        st.score += 120;
        st.combo += 1;
        st.maxCombo = Math.max(st.maxCombo, st.combo);
        recordStat(unit.data, true);
        st.shockwaves.push({
          x: unit.x,
          y: unit.y,
          r: 12,
          maxR: 85,
          color: '#0ea5e9',
          life: 0.45,
        });
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 70 + Math.random() * 160;
          st.particles.push({
            x: unit.x,
            y: unit.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 3 + Math.random() * 4.5,
            color: i % 2 === 0 ? '#0ea5e9' : '#10b981',
            life: 0.6,
            maxLife: 0.6,
          });
        }
        st.texts.push({
          x: unit.x,
          y: unit.y - 16,
          text: '防空清屏 +120',
          color: '#0284c7',
          life: 0.9,
        });
      } else {
        remaining.push(unit);
      }
    }
    st.activeUnits = remaining;
    setScore(st.score);
    setCombo(st.combo);
    setBanner(`🛡️ 全屏防火墙释放！精准拦截 ${cleared} 条高危信息！`);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (stateRef.current.paused || stateRef.current.ended) return;
      setScanCooldown((c) => Math.max(0, c - 1));
      setScanLeft((s) => Math.max(0, Number((s - 0.5).toFixed(1))));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();
    let rafId = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const st = stateRef.current;
      const rect = container.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const defenseLineY = H - 72;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      st.pulsePhase += dt * 3;
      for (const c of st.clouds) {
        c.x += c.spd * dt;
        if (c.x - 80 > W) c.x = -80;
      }

      if (!st.paused && !st.ended) {
        if (st.scanTimer > 0) st.scanTimer = Math.max(0, st.scanTimer - dt);
        if (st.recoil > 0) st.recoil = Math.max(0, st.recoil - dt * 28);
        if (st.shieldFlash > 0) st.shieldFlash = Math.max(0, st.shieldFlash - dt * 3);
        const timeScale = st.scanTimer > 0 ? 0.3 : 1;

        if (st.spawnQueue.length > 0) {
          st.spawnTimer -= dt * timeScale;
          if (st.spawnTimer <= 0) {
            const nextCard = st.spawnQueue.shift()!;
            const cardW = Math.min(224, W * 0.45);
            const lanes = W >= 520 ? 3 : 2;
            const laneW = W / lanes;
            const laneIdx = Math.floor(Math.random() * lanes);
            const x = Math.max(cardW / 2 + 10, Math.min(W - cardW / 2 - 10, laneIdx * laneW + laneW / 2));
            const baseSpeed = 46 + st.wave * 7.5;

            st.activeUnits.push({
              uid: nextCard.id,
              data: nextCard,
              x,
              y: -70,
              w: cardW,
              h: 118,
              speed: nextCard.hp > 1 ? baseSpeed * 0.76 : baseSpeed + Math.random() * 10,
              hp: nextCard.hp,
              maxHp: nextCard.hp,
              hitFlash: 0,
              wobblePhase: Math.random() * Math.PI * 2,
              // 随机分配无人机/飞船外观，彻底取消颜色泄题！
              visualVariant: Math.random() > 0.5 ? 'drone' : 'ship',
            });
            st.spawnTimer = Math.max(1.35, 2.35 - st.wave * 0.14);
          }
        } else if (st.activeUnits.length === 0 && !st.loadingWave) {
          st.wave += 1;
          setWave(st.wave);
          fetchWaveCards(st.wave);
        }

        const nextActive: ActiveUnit[] = [];
        for (const unit of st.activeUnits) {
          unit.y += unit.speed * dt * timeScale;
          unit.wobblePhase += dt * 4;
          if (unit.hitFlash > 0) unit.hitFlash = Math.max(0, unit.hitFlash - dt * 5);

          // 统一的清爽蓝色尾流（不泄题）
          if (Math.random() < 0.32) {
            st.particles.push({
              x: unit.x + (Math.random() - 0.5) * 14,
              y: unit.y - 30,
              vx: (Math.random() - 0.5) * 14,
              vy: -25 - Math.random() * 20,
              radius: 2 + Math.random() * 2.5,
              color: 'rgba(14, 165, 233, 0.45)',
              life: 0.35,
              maxLife: 0.35,
            });
          }

          if (unit.y + 42 >= defenseLineY) {
            if (unit.data.isMalicious) {
              soundFX.playHurt();
              const dmg = unit.data.hp > 1 ? 25 : 15;
              st.hp = Math.max(0, st.hp - dmg);
              st.combo = 0;
              st.shake = 14;
              st.shieldFlash = 1;
              setHp(st.hp);
              setCombo(0);
              recordStat(unit.data, false, 'missed_malicious');
              st.shockwaves.push({
                x: unit.x,
                y: defenseLineY,
                r: 10,
                maxR: 60,
                color: '#e11d48',
                life: 0.4,
              });
              st.texts.push({
                x: unit.x,
                y: defenseLineY - 22,
                text: `护盾受创 -${dmg}%`,
                color: '#e11d48',
                life: 1.0,
              });
              if (st.hp <= 0) finishGame();
            } else {
              soundFX.playSafe();
              st.score += 60;
              st.combo += 1;
              st.maxCombo = Math.max(st.maxCombo, st.combo);
              st.energy = Math.min(100, st.energy + 10);
              setScore(st.score);
              setCombo(st.combo);
              setEnergy(st.energy);
              recordStat(unit.data, true);
              st.texts.push({
                x: unit.x,
                y: defenseLineY - 18,
                text: '安全入港 +60',
                color: '#059669',
                life: 0.85,
              });
            }
          } else {
            nextActive.push(unit);
          }
        }
        st.activeUnits = nextActive;

        st.particles = st.particles.filter((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          return p.life > 0;
        });
        st.shockwaves = st.shockwaves.filter((sw) => {
          sw.r += (sw.maxR - sw.r) * dt * 8;
          sw.life -= dt;
          return sw.life > 0;
        });
        st.lasers = st.lasers.filter((l) => {
          l.life -= dt * 6;
          return l.life > 0;
        });
        st.texts = st.texts.filter((t) => {
          t.y -= 38 * dt;
          t.life -= dt;
          return t.life > 0;
        });
        if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 35);
      }

      // ================= 绘制呼应首页的 3D 卡通海滨科技城战场 =================
      ctx.save();
      if (st.shake > 0) {
        ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
      }

      // 1. 阳光蓝天背景
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, st.scanTimer > 0 ? '#99f6e4' : '#38bdf8');
      skyGrad.addColorStop(0.55, st.scanTimer > 0 ? '#ecfeff' : '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. 融入首页同款 3D 卡通未来城市远景（柔光半透明，不抢卡片文字视线）
      if (bgImgRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        const img = bgImgRef.current;
        const scale = Math.max(W / img.width, H / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, H - dh, dw, dh);
        ctx.restore();
      }

      // 3. 蓬松 3D 白云
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      for (const c of st.clouds) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.s, c.s);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.arc(22, -6, 20, 0, Math.PI * 2);
        ctx.arc(-22, 4, 18, 0, Math.PI * 2);
        ctx.arc(40, 4, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. 六边形蜂窝能量护盾防线
      drawHexShield(ctx, W, defenseLineY, H, st.shieldFlash, st.pulsePhase);

      // 5. 激光光束
      for (const l of st.lasers) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, l.life);
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        ctx.restore();
      }

      // 6. 空中载具 + 信息横幅（不通过颜色泄题！）
      const sprites = spritesRef.current;
      for (const unit of st.activeUnits) {
        const isBoss = unit.maxHp > 1;
        const scanActive = st.scanTimer > 0;
        const hoverX = unit.x + Math.sin(unit.wobblePhase) * 3;
        const planeY = unit.y - 20;

        if (isBoss) {
          ctx.save();
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(hoverX, planeY, 44 + Math.sin(unit.wobblePhase * 2) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        const spriteSize = isBoss ? 80 : 64;
        const sprite = unit.visualVariant === 'drone' ? sprites.enemyDrone : sprites.allyShip;
        if (sprite) {
          ctx.save();
          if (unit.hitFlash > 0) ctx.filter = 'brightness(1.6)';
          ctx.drawImage(sprite, hoverX - spriteSize / 2, planeY - spriteSize / 2, spriteSize, spriteSize);
          ctx.restore();
        }

        const boxX = hoverX - unit.w / 2;
        const boxY = unit.y + 14;
        const boxH = 58;

        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = unit.hitFlash > 0 ? '#ffe4e6' : 'rgba(255, 255, 255, 0.97)';
        drawRoundedRect(ctx, boxX, boxY, unit.w, boxH, 12);
        ctx.fill();
        ctx.restore();

        // 平时统一蓝色边框（Boss 紫框），仅开启【AI 透视镜】后才亮红/绿提示！
        ctx.lineWidth = scanActive || isBoss ? 2.5 : 1.5;
        ctx.strokeStyle = scanActive
          ? unit.data.isMalicious
            ? '#f43f5e'
            : '#10b981'
          : isBoss
          ? '#8b5cf6'
          : '#7dd3fc';
        drawRoundedRect(ctx, boxX, boxY, unit.w, boxH, 12);
        ctx.stroke();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hoverX - 18, planeY + 18);
        ctx.lineTo(hoverX - 18, boxY);
        ctx.moveTo(hoverX + 18, planeY + 18);
        ctx.lineTo(hoverX + 18, boxY);
        ctx.stroke();

        ctx.fillStyle = isBoss ? '#ede9fe' : '#e0f2fe';
        drawRoundedRect(ctx, boxX + 8, boxY + 6, 52, 16, 6);
        ctx.fill();
        ctx.fillStyle = isBoss ? '#6d28d9' : '#0369a1';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillText(unit.data.tag, boxX + 13, boxY + 17);

        if (scanActive) {
          ctx.fillStyle = unit.data.isMalicious ? '#ffe4e6' : '#d1fae5';
          drawRoundedRect(ctx, boxX + unit.w - 62, boxY + 6, 54, 16, 6);
          ctx.fill();
          ctx.fillStyle = unit.data.isMalicious ? '#e11d48' : '#059669';
          ctx.font = 'bold 9.5px sans-serif';
          ctx.fillText(unit.data.isMalicious ? '击碎!' : '放行', boxX + unit.w - 49, boxY + 17);
        } else if (isBoss) {
          ctx.fillStyle = '#e2e8f0';
          drawRoundedRect(ctx, boxX + unit.w - 56, boxY + 10, 46, 7, 3.5);
          ctx.fill();
          ctx.fillStyle = '#8b5cf6';
          drawRoundedRect(ctx, boxX + unit.w - 56, boxY + 10, (46 * unit.hp) / unit.maxHp, 7, 3.5);
          ctx.fill();
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 11.5px sans-serif';
        const lines = wrapText(ctx, unit.data.title, unit.w - 16);
        lines.forEach((line, idx) => {
          ctx.fillText(line, boxX + 8, boxY + 34 + idx * 14);
        });
      }

      // 7. 底部 3D 卡通防空激光坦克 + 发光基座
      const tankX = W / 2;
      const tankY = H - 36 + st.recoil;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(tankX, H - 14, 48, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      if (sprites.tank) {
        ctx.save();
        ctx.translate(tankX, tankY);
        const baseOffset = -Math.PI * 0.28;
        ctx.rotate((st.turretAngle + Math.PI / 2) * 0.45 + baseOffset * 0.15);
        ctx.drawImage(sprites.tank, -48, -48, 96, 96);
        ctx.restore();
      }

      // 8. 冲击波、粒子与飘字
      for (const sw of st.shockwaves) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, sw.life * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const p of st.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const t of st.texts) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life * 1.4);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 3.5;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      ctx.restore();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [fetchWaveCards, finishGame]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    if (st.paused || st.ended) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    for (let i = st.activeUnits.length - 1; i >= 0; i--) {
      const unit = st.activeUnits[i];
      const hitLeft = unit.x - unit.w / 2 - 6;
      const hitRight = unit.x + unit.w / 2 + 6;
      const hitTop = unit.y - 58;
      const hitBottom = unit.y + 76;

      if (px >= hitLeft && px <= hitRight && py >= hitTop && py <= hitBottom) {
        const cx = unit.x;
        const cy = unit.y - 10;
        const tx = rect.width / 2;
        const ty = rect.height - 46;
        st.turretAngle = Math.atan2(cy - ty, cx - tx);
        st.recoil = 7;
        soundFX.playLaser();

        st.lasers.push({
          x1: tx,
          y1: ty,
          x2: cx,
          y2: cy,
          color: unit.data.isMalicious ? '#0ea5e9' : '#f59e0b',
          life: 1,
        });

        if (unit.data.isMalicious) {
          unit.hp -= 1;
          unit.hitFlash = 1;
          if (unit.hp <= 0) {
            soundFX.playBreak();
            st.activeUnits.splice(i, 1);
            const pts = (unit.maxHp > 1 ? 250 : 100) + Math.min(st.combo * 10, 100);
            st.score += pts;
            st.combo += 1;
            st.maxCombo = Math.max(st.maxCombo, st.combo);
            st.energy = Math.min(100, st.energy + (unit.maxHp > 1 ? 25 : 15));
            st.shake = unit.maxHp > 1 ? 10 : 4;
            setScore(st.score);
            setCombo(st.combo);
            setEnergy(st.energy);
            recordStat(unit.data, true);

            st.shockwaves.push({
              x: cx,
              y: cy,
              r: 10,
              maxR: unit.maxHp > 1 ? 75 : 50,
              color: '#0ea5e9',
              life: 0.35,
            });
            for (let k = 0; k < 16; k++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 65 + Math.random() * 140;
              st.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: 3 + Math.random() * 4,
                color: k % 2 === 0 ? '#38bdf8' : '#f43f5e',
                life: 0.55,
                maxLife: 0.55,
              });
            }
            st.texts.push({
              x: cx,
              y: unit.y - 36,
              text: st.combo >= 3 ? `+${pts} (${st.combo}连击!)` : `+${pts}`,
              color: '#0284c7',
              life: 0.9,
            });
          } else {
            st.texts.push({
              x: cx,
              y: unit.y - 36,
              text: `伪装破裂 (${unit.hp}/${unit.maxHp})`,
              color: '#7c3aed',
              life: 0.7,
            });
          }
        } else {
          soundFX.playHurt();
          st.activeUnits.splice(i, 1);
          st.combo = 0;
          st.score = Math.max(0, st.score - 50);
          st.hp = Math.max(0, st.hp - 10);
          st.shake = 8;
          st.shieldFlash = 0.8;
          setCombo(0);
          setScore(st.score);
          setHp(st.hp);
          recordStat(unit.data, false, 'killed_safe');
          st.texts.push({
            x: cx,
            y: unit.y - 36,
            text: '误伤真实科普！-50',
            color: '#d97706',
            life: 1.0,
          });
          if (st.hp <= 0) finishGame();
        }
        break;
      }
    }
  };

  const togglePause = () => {
    const next = !paused;
    stateRef.current.paused = next;
    setPaused(next);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white shadow-2xl border-x border-sky-200">
      {/* 顶部 HUD */}
      <div className="px-4 py-2.5 bg-white border-b border-sky-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[11px] text-slate-400 font-bold">护盾耐久</div>
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all ${
                    hp > 50 ? 'bg-emerald-500' : hp > 25 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${hp}%` }}
                />
              </div>
              <span className="text-xs font-black text-slate-700">{hp}%</span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-sky-100 border border-sky-200">
            <span className="text-xs text-sky-700 font-black">第 {wave} 波</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <div className="text-[11px] text-slate-400 font-bold">
              积分 {combo >= 2 && <span className="text-amber-500 font-black">· {combo}连击</span>}
            </div>
            <div className="text-base font-black text-sky-600 leading-none">{score}</div>
          </div>
          <button
            type="button"
            onClick={openTutorial}
            className="p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition"
            title="玩法提示"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={togglePause}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            title={paused ? '继续' : '暂停'}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition"
          >
            退出
          </button>
        </div>
      </div>

      {/* 提示横幅 */}
      <div className="px-4 py-1.5 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs">
        <span className="text-sky-800 font-semibold truncate flex items-center gap-1.5">
          {banner.includes('⚠️') ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          )}
          {banner}
        </span>
        <span className="shrink-0 ml-2 px-2 py-0.5 rounded-md bg-white text-[10px] font-bold text-sky-700 border border-sky-200">
          {aiSourceTag}
        </span>
      </div>

      {/* Canvas 主战场 */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className="w-full h-full block cursor-crosshair"
        />

        {/* 新手引导浮层（强调看内容辨真伪，不靠颜色泄题） */}
        {showTutorial && (
          <div className="absolute inset-0 z-20 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl border-2 border-sky-200 space-y-4">
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-black mb-1">
                  3秒快速上手指南
                </span>
                <h3 className="text-lg font-black text-slate-800">真假信息均会伪装空投！</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">请根据卡片上的<span className="font-bold text-slate-700">文字内容</span>来判断，不能只看飞机外观哦</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-3 text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xs font-black text-rose-600">点击击落！</div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                    发现<span className="font-bold text-rose-600">中奖补贴、客服退款、伪科学谣言</span>等假消息，立即点击发射激光击毁！
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-3 text-center">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-xs font-black text-emerald-600">安全放行！</div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                    遇到<span className="font-bold text-emerald-600">96110提醒、地震预警、安全常识</span>等真信息，不要点击，让它落入护盾加分！
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-sky-50 border border-sky-200 p-3 text-xs text-slate-700 flex items-start gap-2">
                <Eye className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold text-sky-700">遇事不决用透视：</span>点击底部【AI 透视镜】可进入 5 秒慢动作，AI 会帮你直接标出红/绿真伪！
                </span>
              </div>

              <button
                type="button"
                onClick={closeTutorial}
                className="w-full rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 border-b-4 border-blue-800 py-3.5 text-base font-black text-white shadow-lg active:translate-y-0.5 transition"
              >
                明白了，立即开火！
              </button>
            </div>
          </div>
        )}

        {paused && !showTutorial && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <div className="text-xl font-black text-slate-800">战斗暂停中</div>
            <button
              type="button"
              onClick={togglePause}
              className="px-6 py-3 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 border-b-4 border-blue-800 text-white font-black shadow-md active:translate-y-0.5 transition"
            >
              继续保卫防线
            </button>
          </div>
        )}
      </div>

      {/* 底部技能栏 */}
      <div className="px-4 py-3 bg-white border-t border-sky-100 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={activateScan}
          disabled={scanCooldown > 0 || paused}
          className={`flex items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-sm font-black transition border-b-4 active:translate-y-0.5 ${
            scanLeft > 0
              ? 'bg-cyan-500 text-white border-cyan-700 shadow-md animate-pulse'
              : scanCooldown > 0
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          {scanLeft > 0 ? `透视中 (${scanLeft}s)` : scanCooldown > 0 ? `冷却中 ${scanCooldown}s` : 'AI 透视镜 (慢动作)'}
        </button>

        <button
          type="button"
          onClick={activateFirewall}
          disabled={energy < 100 || paused}
          className={`relative overflow-hidden flex items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-sm font-black transition border-b-4 active:translate-y-0.5 ${
            energy >= 100
              ? 'bg-gradient-to-b from-emerald-400 to-teal-600 text-white border-teal-800 shadow-md'
              : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
          }`}
        >
          <div
            className="absolute left-0 top-0 bottom-0 bg-emerald-300/45 transition-all"
            style={{ width: `${energy}%` }}
          />
          <Shield className="w-4 h-4 relative z-10" />
          <span className="relative z-10 flex items-center gap-1">
            {energy >= 100 ? (
              <>
                <Zap className="w-4 h-4" /> 全屏防火墙 (就绪!)
              </>
            ) : (
              `防火墙充能 ${energy}%`
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
