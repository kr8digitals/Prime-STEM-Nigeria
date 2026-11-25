"use client";

export interface AiProctorAlert {
  eventType:
    | "ai_no_face"
    | "ai_multiple_faces"
    | "ai_head_pose_gaze_away"
    | "ai_prohibited_object"
    | "ai_voice_activity";
  severity: "warning" | "critical";
  details: string;
  snapshotBlob?: Blob | null;
}

export interface AiProctorLiveMetrics {
  engineReady: boolean;
  backendName: string;
  facesDetected: number;
  gazeStatus: "centered" | "looking_away" | "no_face" | "initializing";
  detectedObjects: string[];
  speechBandLevelDb: number;
  voiceActive: boolean;
  lastCheckedAt: string | null;
}

export interface StartAiProctorOptions {
  getVideoElement: () => HTMLVideoElement | null;
  audioStream: MediaStream | null;
  onAlert: (alert: AiProctorAlert) => void;
  onMetrics: (metrics: AiProctorLiveMetrics) => void;
}

const PROHIBITED_LABELS = new Set([
  "cell phone",
  "mobile phone",
  "book",
  "laptop",
  "remote",
]);

async function captureEvidenceSnapshot(
  video: HTMLVideoElement
): Promise<Blob | null> {
  try {
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 480 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.65)
    );
  } catch {
    return null;
  }
}

export function startSelfHostedAiProctor(options: StartAiProctorOptions): {
  stop: () => void;
} {
  let stopped = false;
  let humanInstance: any = null;
  let visionTimer: ReturnType<typeof setTimeout> | null = null;
  let audioTimer: ReturnType<typeof setInterval> | null = null;
  let audioCtx: AudioContext | null = null;

  const cooldownMap = new Map<string, number>();
  let consecutiveNoFace = 0;
  let consecutiveGazeAway = 0;
  let consecutiveVoiceTicks = 0;

  const metricsState: AiProctorLiveMetrics = {
    engineReady: false,
    backendName: "loading",
    facesDetected: 0,
    gazeStatus: "initializing",
    detectedObjects: [],
    speechBandLevelDb: -90,
    voiceActive: false,
    lastCheckedAt: null,
  };

  function canEmit(key: string, cooldownMs = 25_000): boolean {
    const now = Date.now();
    const prev = cooldownMap.get(key) || 0;
    if (now - prev < cooldownMs) return false;
    cooldownMap.set(key, now);
    return true;
  }

  // 1. Setup Web Audio Spectral Speech-Band (300Hz - 3400Hz) Voice Activity Analyzer
  if (options.audioStream && options.audioStream.getAudioTracks().length > 0) {
    try {
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        audioCtx = new AudioContextCtor();
        const source = audioCtx.createMediaStreamSource(options.audioStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const sampleRate = audioCtx.sampleRate || 44100;
        const binHz = sampleRate / analyser.fftSize;
        const minSpeechBin = Math.max(1, Math.floor(300 / binHz));
        const maxSpeechBin = Math.min(
          analyser.frequencyBinCount - 1,
          Math.ceil(3400 / binHz)
        );

        audioTimer = setInterval(() => {
          if (stopped || !analyser) return;
          if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
          }
          analyser.getByteFrequencyData(freqData);
          let speechSum = 0;
          let count = 0;
          for (let i = minSpeechBin; i <= maxSpeechBin; i++) {
            speechSum += freqData[i];
            count++;
          }
          const avgMag = count > 0 ? speechSum / count : 0;
          const approxDb = Math.round((avgMag / 255) * 90 - 90);
          // Threshold tuned for sustained human speech in the 300-3400Hz vocal formant band
          const isSpeaking = avgMag > 68;

          metricsState.speechBandLevelDb = approxDb;
          metricsState.voiceActive = isSpeaking;
          options.onMetrics({ ...metricsState });

          if (isSpeaking) {
            consecutiveVoiceTicks += 1;
            if (consecutiveVoiceTicks >= 5 && canEmit("ai_voice_activity", 30_000)) {
              options.onAlert({
                eventType: "ai_voice_activity",
                severity: "warning",
                details: `Sustained vocal-band speech energy detected (${approxDb} dB relative speech band).`,
              });
              consecutiveVoiceTicks = 0;
            }
          } else {
            consecutiveVoiceTicks = Math.max(0, consecutiveVoiceTicks - 1);
          }
        }, 1000);
      }
    } catch (err) {
      console.warn("[ai-proctor] Web Audio analyzer unavailable:", err);
    }
  }

  // 2. Load Self-Hosted @vladmandic/human Vision Models from /api/ai-models/
  async function initAndRunVisionLoop() {
    try {
      // Dynamic ESM import from our own Next.js route — zero external CDN dependency
      const dynamicImport = new Function("url", "return import(url)");
      const mod = await dynamicImport("/api/ai-models/human.esm.js");
      const HumanCtor = mod.Human || mod.default;

      humanInstance = new HumanCtor({
        backend: "webgl",
        modelBasePath: "/api/ai-models/",
        warmup: "none",
        async: true,
        cacheSensitivity: 0.7,
        face: {
          enabled: true,
          detector: { enabled: true, rotation: false, maxDetected: 4, minConfidence: 0.45 },
          mesh: { enabled: true },
          iris: { enabled: true },
          description: { enabled: false },
          emotion: { enabled: false },
          antispoof: { enabled: false },
          liveness: { enabled: false },
        },
        body: { enabled: false },
        hand: { enabled: false },
        gesture: { enabled: false },
        segmentation: { enabled: false },
        object: {
          enabled: true,
          modelPath: "centernet.json",
          minConfidence: 0.45,
          maxDetected: 6,
        },
      });

      await humanInstance.load();
      if (stopped) return;

      metricsState.engineReady = true;
      metricsState.backendName = humanInstance.tf?.getBackend?.() || "webgl";
      options.onMetrics({ ...metricsState });
    } catch (err) {
      console.warn("[ai-proctor] WebGL init fallback to CPU:", err);
      try {
        if (humanInstance) {
          humanInstance.config.backend = "cpu";
          await humanInstance.init();
          metricsState.engineReady = true;
          metricsState.backendName = "cpu";
          options.onMetrics({ ...metricsState });
        }
      } catch (cpuErr) {
        console.warn("[ai-proctor] Vision model load error:", cpuErr);
      }
    }

    async function runFrameCheck() {
      if (stopped) return;
      const video = options.getVideoElement();

      if (
        humanInstance &&
        metricsState.engineReady &&
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0
      ) {
        try {
          const result = await humanInstance.detect(video);
          const faces = Array.isArray(result?.face) ? result.face : [];
          const objects = Array.isArray(result?.object) ? result.object : [];

          metricsState.facesDetected = faces.length;
          metricsState.detectedObjects = objects.map(
            (o: any) => `${o.label} (${Math.round((o.score || 0) * 100)}%)`
          );
          metricsState.lastCheckedAt = new Date().toISOString();

          // A. Face presence & multi-person detection
          if (faces.length === 0) {
            metricsState.gazeStatus = "no_face";
            consecutiveNoFace += 1;
            if (consecutiveNoFace >= 2 && canEmit("ai_no_face", 28_000)) {
              const snap = await captureEvidenceSnapshot(video);
              options.onAlert({
                eventType: "ai_no_face",
                severity: "warning",
                details:
                  "AI Vision Alert: Candidate face absent from webcam frame across consecutive checks.",
                snapshotBlob: snap,
              });
            }
          } else {
            consecutiveNoFace = 0;

            if (faces.length > 1 && canEmit("ai_multiple_faces", 25_000)) {
              const snap = await captureEvidenceSnapshot(video);
              options.onAlert({
                eventType: "ai_multiple_faces",
                severity: "critical",
                details: `AI Vision Alert: ${faces.length} faces simultaneously detected in webcam frame.`,
                snapshotBlob: snap,
              });
            }

            // B. Head pose (yaw/pitch) & iris gaze check on primary face
            const primary = faces[0];
            const yawRad = Math.abs(primary?.rotation?.angle?.yaw || 0);
            const pitchRad = Math.abs(primary?.rotation?.angle?.pitch || 0);
            const gazeBearing = primary?.rotation?.gaze?.bearing || 0;
            const gazeStrength = primary?.rotation?.gaze?.strength || 0;

            // ~0.52 rad is ~30 degrees head turn
            const headTurnedAway = yawRad > 0.52 || pitchRad > 0.48;
            const eyesLookingFarOff = gazeStrength > 0.58 && Math.abs(gazeBearing) > 0.6;

            if (headTurnedAway || eyesLookingFarOff) {
              metricsState.gazeStatus = "looking_away";
              consecutiveGazeAway += 1;
              if (
                consecutiveGazeAway >= 2 &&
                canEmit("ai_head_pose_gaze_away", 30_000)
              ) {
                const snap = await captureEvidenceSnapshot(video);
                options.onAlert({
                  eventType: "ai_head_pose_gaze_away",
                  severity: "warning",
                  details: `AI Gaze/Head-Pose Alert: Sustained off-screen head/eye orientation (yaw ${Math.round(
                    (yawRad * 180) / Math.PI
                  )}°, pitch ${Math.round((pitchRad * 180) / Math.PI)}°).`,
                  snapshotBlob: snap,
                });
              }
            } else {
              metricsState.gazeStatus = "centered";
              consecutiveGazeAway = 0;
            }
          }

          // C. Prohibited object detection (CenterNet COCO classes)
          const prohibited = objects.find((obj: any) =>
            PROHIBITED_LABELS.has(String(obj.label || "").toLowerCase())
          );
          // Also check if CenterNet detects >= 2 persons when face mesh missed a background person
          const personBoxes = objects.filter(
            (obj: any) => String(obj.label || "").toLowerCase() === "person"
          );

          if (prohibited && canEmit(`obj_${prohibited.label}`, 25_000)) {
            const snap = await captureEvidenceSnapshot(video);
            options.onAlert({
              eventType: "ai_prohibited_object",
              severity: "critical",
              details: `AI Object Detector: Prohibited object "${
                prohibited.label
              }" detected (${Math.round((prohibited.score || 0) * 100)}% confidence).`,
              snapshotBlob: snap,
            });
          } else if (
            personBoxes.length >= 2 &&
            faces.length <= 1 &&
            canEmit("obj_extra_person", 30_000)
          ) {
            const snap = await captureEvidenceSnapshot(video);
            options.onAlert({
              eventType: "ai_multiple_faces",
              severity: "warning",
              details: `AI Object Detector: ${personBoxes.length} persons detected in room frame.`,
              snapshotBlob: snap,
            });
          }

          options.onMetrics({ ...metricsState });
        } catch (detectErr) {
          console.warn("[ai-proctor] frame detect skipped:", detectErr);
        }
      }

      if (!stopped) {
        visionTimer = setTimeout(runFrameCheck, 3500);
      }
    }

    runFrameCheck();
  }

  initAndRunVisionLoop();

  return {
    stop: () => {
      stopped = true;
      if (visionTimer) clearTimeout(visionTimer);
      if (audioTimer) clearInterval(audioTimer);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    },
  };
}
