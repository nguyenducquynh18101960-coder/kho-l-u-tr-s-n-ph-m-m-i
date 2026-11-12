import confetti from 'canvas-confetti';

/**
 * Realistic Canvas Confetti & Fireworks Celebration Suite for Max10 AI
 * Powered by 'canvas-confetti'
 */

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Multi-stage realistic Fireworks bursts (shots from left and right upwards)
 */
export function launchCanvasFireworks(durationMs: number = 3500) {
  const animationEnd = Date.now() + durationMs;
  const defaults = {
    startVelocity: 35,
    spread: 360,
    ticks: 65,
    zIndex: 999999,
    shapes: ['circle', 'square'] as confetti.Shape[],
    colors: ['#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#eab308', '#06b6d4'],
  };

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 45 * (timeLeft / durationMs);

    // Left explosion
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.15, 0.35), y: Math.random() * 0.4 },
    });

    // Right explosion
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.65, 0.85), y: Math.random() * 0.4 },
    });
  }, 240);
}

/**
 * Dual cannon burst shooting from bottom corners towards the center
 */
export function launchConfettiCannons() {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

  // Left cannon
  confetti({
    particleCount: 85,
    angle: 60,
    spread: 60,
    origin: { x: 0, y: 0.85 },
    zIndex: 999999,
    colors,
  });

  // Right cannon
  confetti({
    particleCount: 85,
    angle: 120,
    spread: 60,
    origin: { x: 1, y: 0.85 },
    zIndex: 999999,
    colors,
  });
}

/**
 * Sparkling Gold & Star burst for badges and honor rewards
 */
export function launchGoldenStarBurst() {
  confetti({
    particleCount: 75,
    spread: 100,
    origin: { y: 0.55 },
    zIndex: 999999,
    colors: ['#ffd700', '#ffa500', '#ffec8b', '#ffffff'],
    shapes: ['star'] as any,
    scalar: 1.2,
  });
}

/**
 * Grand Celebration: Fireworks + Cannons for reaching 10 interactions or milestone badge
 */
export function celebrateMilestone() {
  launchConfettiCannons();
  setTimeout(() => {
    launchCanvasFireworks(3200);
  }, 180);
}

/**
 * Backwards-compatible class matching previous calls
 */
class CanvasFireworksEngine {
  public launchFireworks(burstsCount: number = 3) {
    launchCanvasFireworks(Math.max(2000, burstsCount * 900));
  }

  public launchConfetti(count: number = 100) {
    confetti({
      particleCount: count,
      spread: 90,
      origin: { y: 0.6 },
      zIndex: 999999,
    });
  }

  public celebrate(bursts: number = 4) {
    celebrateMilestone();
  }
}

export const celebrationEngine = new CanvasFireworksEngine();
