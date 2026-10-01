// Original Fibonacci particle sphere. No third-party code or assets.
export type ParticleVariant = 'sphere' | 'orbit' | 'helix';
export interface ParticleOptions {
  variant: ParticleVariant;
  speed: number;
}
export interface SpherePoint {
  x: number;
  y: number;
  depth: number;
  radius: number;
  opacity: number;
}
const count = 48;
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const particles = Array.from({ length: count }, (_, index) => {
  const y = 1 - (2 * (index + 0.5)) / count;
  const radius = Math.sqrt(1 - y * y);
  return { x: Math.cos(index * goldenAngle) * radius, y, z: Math.sin(index * goldenAngle) * radius };
});
const orbits = Array.from({ length: 36 }, (_, index) => {
  const angle = ((index % 18) / 18) * Math.PI * 2;
  return index < 18
    ? { x: Math.cos(angle), y: Math.sin(angle) * 0.28, z: Math.sin(angle) * 0.96 }
    : { x: Math.cos(angle) * 0.35, y: Math.sin(angle), z: Math.cos(angle) * 0.94 };
});
const helix = Array.from({ length: 32 }, (_, index) => {
  const y = ((index % 16) / 15) * 1.8 - 0.9;
  const angle = (y + 0.9) * Math.PI * 1.6 + (index < 16 ? 0 : Math.PI);
  return { x: Math.cos(angle) * 0.65, y, z: Math.sin(angle) * 0.65 };
});
export function projectSphere(seconds: number, variant: ParticleVariant = 'sphere', speed = 1): SpherePoint[] {
  const rate = Number.isFinite(speed) ? Math.min(4, Math.max(0.25, speed)) : 1;
  const turn = seconds * 1.2 * rate;
  const tilt = 0.25 + Math.sin(seconds * 0.35) * 0.12;
  const breathe = 0.94 + Math.sin(seconds * 1.1) * 0.045;
  const points = variant === 'orbit' ? orbits : variant === 'helix' ? helix : particles;
  return points
    .map((point) => {
      const x = point.x * Math.cos(turn) + point.z * Math.sin(turn);
      const rotatedZ = point.z * Math.cos(turn) - point.x * Math.sin(turn);
      const y = point.y * Math.cos(tilt) - rotatedZ * Math.sin(tilt);
      const z = point.y * Math.sin(tilt) + rotatedZ * Math.cos(tilt);
      const depth = (z + 1) / 2;
      const perspective = 1 / (1 - z * 0.08);
      return {
        x: 20 + x * 16.2 * breathe * perspective,
        y: 20 + y * 16.2 * breathe * perspective,
        depth,
        radius: 0.4 + depth * 0.85,
        opacity: 0.13 + depth * 0.77
      };
    })
    .sort((a, b) => a.depth - b.depth);
}
export interface ParticleRenderer {
  draw: (seconds: number, color: string, variant?: ParticleVariant, speed?: number) => void;
  dispose: () => void;
}
export function createParticleRenderer(canvas: HTMLCanvasElement, pixels: number): ParticleRenderer | undefined {
  let context: CanvasRenderingContext2D | null;
  try {
    context = canvas.getContext('2d');
  } catch {
    return;
  }
  if (!context) return;
  const drawing = context;
  canvas.width = canvas.height = Math.max(1, Math.round(pixels));
  const scale = canvas.width / 40;
  return {
    draw(seconds, color, variant, speed) {
      drawing.clearRect(0, 0, canvas.width, canvas.height);
      drawing.fillStyle = color;
      for (const point of projectSphere(seconds, variant, speed)) {
        drawing.globalAlpha = point.opacity;
        drawing.beginPath();
        drawing.arc(point.x * scale, point.y * scale, point.radius * scale, 0, Math.PI * 2);
        drawing.fill();
      }
      drawing.globalAlpha = 1;
    },
    dispose() {
      drawing.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}
