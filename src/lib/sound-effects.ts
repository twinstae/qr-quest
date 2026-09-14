import type { SoundKey } from "@/domain/step";

let sharedContext: AudioContext | undefined;

function getAudioContext(): AudioContext | undefined {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return undefined;
  sharedContext ??= new AudioContext();
  return sharedContext;
}

function playTone(
  ctx: AudioContext,
  { type, frequency, duration, gain }: { type: OscillatorType; frequency: number; duration: number; gain: number },
) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function playNoiseBurst(ctx: AudioContext, duration: number, gain: number) {
  const now = ctx.currentTime;
  const sampleCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  source.connect(gainNode).connect(ctx.destination);
  source.start(now);
}

/**
 * 내장 효과음 2~3개를 파일 없이 WebAudio로 합성한다(요구, ticket 15) — 라이선스
 * 걱정이 없고, 콘텐츠를 고쳐도 다시 만들 게 없다. 반드시 사용자 제스처(토글/제출
 * 버튼 클릭) 뒤에만 불러야 한다 — 브라우저 자동재생 정책 때문이다.
 */
export function playSound(key: SoundKey): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (key) {
    case "chime":
      playTone(ctx, { type: "sine", frequency: 880, duration: 0.8, gain: 0.2 });
      break;
    case "radio":
      playTone(ctx, { type: "square", frequency: 220, duration: 0.3, gain: 0.08 });
      break;
    case "paper":
      playNoiseBurst(ctx, 0.3, 0.15);
      break;
  }
}
