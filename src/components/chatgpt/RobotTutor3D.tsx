import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CountryCode, getCountryCulture } from '../../data/countryCultures';
import { Sparkles, Volume2, Mic, Eye, EyeOff, RotateCcw } from 'lucide-react';

export type RobotReactionType = 'none' | 'celebrate' | 'encourage';

interface RobotTutor3DProps {
  countryCode: CountryCode;
  isListening: boolean;
  isSpeaking: boolean;
  reaction?: RobotReactionType;
  reactionTrigger?: number;
  isDark?: boolean;
  compact?: boolean;
  onTriggerTestReaction?: (type: RobotReactionType) => void;
}

// Pre-allocated math objects to ensure zero per-frame GC allocation inside render loop
const _tmpVec = new THREE.Vector3();
const _tmpColor = new THREE.Color();

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, 'rgba(2, 6, 23, 0.52)');
  grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.22)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildCountryAccessory(code: CountryCode): THREE.Group {
  const group = new THREE.Group();
  group.name = `accessory-${code}`;

  if (code === 'VN') {
    // Traditional Vietnamese Nón Lá (woven conical bamboo hat + red silk strap)
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xe7c88a,
      roughness: 0.72,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.56, 32, 1, true), coneMat);
    cone.position.set(0, 0.76, -0.02);
    cone.rotation.x = -0.08;
    cone.castShadow = true;
    group.add(cone);

    const rimMat = new THREE.MeshStandardMaterial({ color: 0xb48446, roughness: 0.65 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.025, 10, 48), rimMat);
    rim.rotation.x = Math.PI / 2 - 0.08;
    rim.position.set(0, 0.49, 0);
    group.add(rim);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), rimMat);
    cap.position.set(0, 1.03, -0.04);
    group.add(cap);

    // Red silk ribbon loop
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.022, 8, 32), ribbonMat);
    band.rotation.x = Math.PI / 2 - 0.08;
    band.position.set(0, 0.62, -0.01);
    group.add(band);
  } else if (code === 'US') {
    // Classic Cowboy Hat
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x7c4a25, roughness: 0.68, metalness: 0.06 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.02, 0.05, 32), hatMat);
    brim.position.set(0, 0.52, 0);
    brim.scale.set(1.05, 1, 0.92);
    brim.castShadow = true;
    group.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.46, 24), hatMat);
    crown.position.set(0, 0.76, 0);
    crown.castShadow = true;
    group.add(crown);

    const strap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.51, 0.52, 0.09, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    strap.position.set(0, 0.59, 0);
    group.add(strap);

    const starBuckle = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.08, 0),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
    );
    starBuckle.position.set(0, 0.59, 0.52);
    group.add(starBuckle);
  } else if (code === 'GB') {
    // Royal Crown with velvet cushion and jewels
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.18 });
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.39, 0.24, 24), goldMat);
    base.position.set(0, 0.66, 0);
    base.castShadow = true;
    group.add(base);

    const cushion = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), velvetMat);
    cushion.scale.set(1, 0.55, 1);
    cushion.position.set(0, 0.75, 0);
    group.add(cushion);

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), goldMat);
      spike.position.set(Math.cos(ang) * 0.4, 0.86, Math.sin(ang) * 0.4);
      group.add(spike);

      const jewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 10, 10),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x38bdf8 : 0xef4444,
          emissive: i % 2 === 0 ? 0x0284c7 : 0x991b1b,
          emissiveIntensity: 0.55,
          roughness: 0.15,
        })
      );
      jewel.position.set(Math.cos(ang) * 0.44, 0.68, Math.sin(ang) * 0.44);
      group.add(jewel);
    }
  } else if (code === 'JP') {
    // Cute Neko Cat-Ear Headband + Sakura Blossom
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4, metalness: 0.2 });
    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 12, 36, Math.PI), bandMat);
    headband.position.set(0, 0.22, 0);
    group.add(headband);

    const earInnerMat = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      emissive: 0xf472b6,
      emissiveIntensity: 0.2,
    });
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.36, 4), bandMat);
      ear.position.set(side * 0.42, 0.78, 0.04);
      ear.rotation.z = -side * 0.34;
      ear.rotation.y = Math.PI / 4;
      ear.castShadow = true;
      group.add(ear);

      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), earInnerMat);
      inner.position.set(side * 0.41, 0.76, 0.09);
      inner.rotation.z = -side * 0.34;
      inner.rotation.y = Math.PI / 4;
      group.add(inner);
    });

    const flower = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.1, 0),
      new THREE.MeshStandardMaterial({ color: 0xfda4af, emissive: 0xf43f5e, emissiveIntensity: 0.25 })
    );
    flower.position.set(0.5, 0.62, 0.14);
    group.add(flower);
  } else if (code === 'KR') {
    // Stylish Idol Star Beret
    const beretMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.55 });
    const beret = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), beretMat);
    beret.scale.set(1.12, 0.45, 1.08);
    beret.position.set(0.08, 0.65, 0);
    beret.rotation.z = -0.18;
    beret.castShadow = true;
    group.add(beret);

    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 0.6,
        metalness: 0.6,
      })
    );
    star.position.set(-0.22, 0.72, 0.45);
    group.add(star);
  } else if (code === 'CN') {
    // Traditional Emerald Scholar Cap with Golden Knot
    const jadeMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5, metalness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), jadeMat);
    cap.position.set(0, 0.52, 0);
    cap.castShadow = true;
    group.add(cap);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 10, 32), goldMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.53, 0);
    group.add(rim);

    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    knot.position.set(0, 1.05, 0);
    group.add(knot);
  } else if (code === 'DE') {
    // Alpine Felt Hat with Feather
    const feltMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.05, 28), feltMat);
    brim.position.set(0, 0.56, 0);
    group.add(brim);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.4, 24), feltMat);
    dome.position.set(0, 0.76, 0);
    dome.castShadow = true;
    group.add(dome);
    const feather = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    feather.position.set(0.42, 0.86, -0.05);
    feather.rotation.z = -0.35;
    group.add(feather);
  } else {
    // FR: Classic French Crimson Beret
    const beretMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.65 });
    const beret = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 16), beretMat);
    beret.scale.set(1.15, 0.42, 1.1);
    beret.position.set(-0.08, 0.65, 0);
    beret.rotation.z = 0.2;
    beret.castShadow = true;
    group.add(beret);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8), beretMat);
    stem.position.set(-0.1, 0.9, 0);
    group.add(stem);
  }

  return group;
}

export const RobotTutor3D: React.FC<RobotTutor3DProps> = ({
  countryCode,
  isListening,
  isSpeaking,
  reaction = 'none',
  reactionTrigger = 0,
  isDark = true,
  compact = false,
  onTriggerTestReaction,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const countryCulture = getCountryCulture(countryCode);
  const [showStage, setShowStage] = useState(true);

  // Live prop refs read inside animation loop without recreating WebGL context
  const stateRef = useRef({
    isListening,
    isSpeaking,
    reaction,
    reactionTrigger,
    micLevel: 0,
    lookX: 0,
    lookY: 0,
    celebrateTimer: 0,
    encourageTimer: 0,
    spinRemaining: 0,
  });

  stateRef.current.isListening = isListening;
  stateRef.current.isSpeaking = isSpeaking;

  const accessorySwapRef = useRef<((code: CountryCode) => void) | null>(null);
  const fireworkTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current.reaction = reaction;
    if (reaction === 'celebrate' && reactionTrigger > 0) {
      stateRef.current.celebrateTimer = 2.4;
      stateRef.current.spinRemaining = Math.PI * 2;
      fireworkTriggerRef.current?.();
    } else if (reaction === 'encourage' && reactionTrigger > 0) {
      stateRef.current.encourageTimer = 1.6;
    }
  }, [reaction, reactionTrigger]);

  useEffect(() => {
    accessorySwapRef.current?.(countryCode);
  }, [countryCode]);

  // Real microphone AnalyserNode during Listening mode
  useEffect(() => {
    if (!isListening) {
      stateRef.current.micLevel = 0;
      return;
    }
    let stopped = false;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let raf = 0;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtx = new AudioCtx();
        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const poll = () => {
          if (stopped) return;
          analyser.getByteFrequencyData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i];
          stateRef.current.micLevel = Math.min(1, sum / buf.length / 80);
          raf = requestAnimationFrame(poll);
        };
        raf = requestAnimationFrame(poll);
      } catch {
        // Fallback if SpeechRecognition holds exclusive mic access
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isListening]);

  // Build Three.js Procedural Robot Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !showStage) return;

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 220);

    // Detect software WebGL renderer per skill guidelines
    let isSoftwareGl = false;
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const rendererStr = dbg
          ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
          : '';
        isSoftwareGl = /SwiftShader|llvmpipe|Software|ANGLE \(Google/i.test(rendererStr);
      }
    } catch {}

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDark ? 0x0b1220 : 0xecfdf5, 0.045);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0, 1.35, 4.35);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 3.0;
    controls.maxDistance = 6.2;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 0.95, 0);

    // 3-Point Studio Lighting (Warm Key + Cool Hemisphere + Rim)
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.85);
    keyLight.position.set(3.2, 5.0, 3.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(512, 512);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 14;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.15);
    rimLight.position.set(-3.5, 2.5, -3.0);
    scene.add(rimLight);

    // Soft Contact Shadow + Studio Pedestal Ring
    const shadowTex = createContactShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.3),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.72, depthWrite: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.18;
    scene.add(contactShadow);

    const stageRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.04, 48),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      })
    );
    stageRing.rotation.x = -Math.PI / 2;
    stageRing.position.y = -0.17;
    scene.add(stageRing);

    // =========================================================================
    // PROCEDURAL MAX10 ROBOT TUTOR RIG (Multi-part articulated group)
    // =========================================================================
    const robotRoot = new THREE.Group();
    robotRoot.position.y = 0.9;
    scene.add(robotRoot);

    const pearlWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.24,
      metalness: 0.12,
    });
    const slateTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.38,
      metalness: 0.55,
    });
    const emeraldGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.4,
    });

    // 1. Torso + Chest Core
    const bodyGroup = new THREE.Group();
    robotRoot.add(bodyGroup);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.34, 12, 24), pearlWhiteMat);
    torso.position.y = -0.22;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const chestBelt = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 12, 32), slateTrimMat);
    chestBelt.rotation.x = Math.PI / 2;
    chestBelt.position.y = -0.18;
    bodyGroup.add(chestBelt);

    const chestCore = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), emeraldGlowMat);
    chestCore.position.set(0, -0.12, 0.32);
    chestCore.scale.set(1, 1, 0.55);
    bodyGroup.add(chestCore);

    const thruster = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.2, 20), emeraldGlowMat);
    thruster.rotation.x = Math.PI;
    thruster.position.y = -0.6;
    bodyGroup.add(thruster);

    // 2. Floating Articulated Hands/Arms
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.56, -0.18, 0.05);
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 16), pearlWhiteMat);
    leftHand.scale.set(0.95, 1.15, 0.95);
    leftHand.castShadow = true;
    const leftCuff = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 10, 24), emeraldGlowMat);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.position.y = 0.08;
    leftArmGroup.add(leftHand, leftCuff);
    bodyGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.56, -0.18, 0.05);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 16), pearlWhiteMat);
    rightHand.scale.set(0.95, 1.15, 0.95);
    rightHand.castShadow = true;
    const rightCuff = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 10, 24), emeraldGlowMat);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.position.y = 0.08;
    rightArmGroup.add(rightHand, rightCuff);
    bodyGroup.add(rightArmGroup);

    // 3. Head + Dynamic Glowing LED Face Screen + Headphones + Country Accessory
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.45;
    robotRoot.add(headGroup);

    const headShell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), pearlWhiteMat);
    headShell.scale.set(1.12, 0.94, 0.98);
    headShell.castShadow = true;
    headGroup.add(headShell);

    // Dark glossy visor bezel
    const visorBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.56, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.15, metalness: 0.7 })
    );
    visorBezel.position.set(0, 0.0, 0.4);
    headGroup.add(visorBezel);

    // LED Facial Display Canvas Texture
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 512;
    faceCanvas.height = 320;
    const faceCtx = faceCanvas.getContext('2d')!;
    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    faceTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    const faceScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.48),
      new THREE.MeshBasicMaterial({ map: faceTexture })
    );
    faceScreen.position.set(0, 0.0, 0.525);
    headGroup.add(faceScreen);

    // Stereo Headphones
    const headphoneBandMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.6,
    });
    const headphoneGlowMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });

    const bandArc = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.048, 12, 36, Math.PI), headphoneBandMat);
    bandArc.position.y = 0.05;
    headGroup.add(bandArc);

    [-1, 1].forEach((side) => {
      const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24), headphoneBandMat);
      earCup.rotation.z = Math.PI / 2;
      earCup.position.set(side * 0.62, 0.02, 0);
      headGroup.add(earCup);

      const earLed = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.024, 10, 24), headphoneGlowMat);
      earLed.rotation.y = Math.PI / 2;
      earLed.position.set(side * 0.685, 0.02, 0);
      headGroup.add(earLed);
    });

    // Country Accessory Container
    const accessoryMount = new THREE.Group();
    headGroup.add(accessoryMount);

    const mountAccessory = (code: CountryCode) => {
      while (accessoryMount.children.length > 0) {
        const child = accessoryMount.children[0];
        accessoryMount.remove(child);
        child.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
            else mesh.material.dispose();
          }
        });
      }
      accessoryMount.add(buildCountryAccessory(code));
    };
    mountAccessory(countryCode);
    accessorySwapRef.current = mountAccessory;

    // 3D Fireworks Particle Burst System (pre-allocated buffer)
    const FW_COUNT = 90;
    const fwPositions = new Float32Array(FW_COUNT * 3);
    const fwVelocities = new Float32Array(FW_COUNT * 3);
    const fwColors = new Float32Array(FW_COUNT * 3);
    const fwGeo = new THREE.BufferGeometry();
    fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPositions, 3));
    fwGeo.setAttribute('color', new THREE.BufferAttribute(fwColors, 3));
    const fwMat = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const fireworks = new THREE.Points(fwGeo, fwMat);
    scene.add(fireworks);

    let fwActive = false;
    let fwAge = 0;

    const launchFireworks = () => {
      fwActive = true;
      fwAge = 0;
      fwMat.opacity = 1;
      const palette = [0x34d399, 0xfbbf24, 0x38bdf8, 0xf472b6, 0xa78bfa];
      for (let i = 0; i < FW_COUNT; i++) {
        const i3 = i * 3;
        const burstCenter = i < FW_COUNT / 2 ? -0.9 : 0.9;
        fwPositions[i3] = burstCenter;
        fwPositions[i3 + 1] = 1.65;
        fwPositions[i3 + 2] = 0.2;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.1 + Math.random() * 1.9;
        fwVelocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
        fwVelocities[i3 + 1] = Math.cos(phi) * speed + 0.8;
        fwVelocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

        _tmpColor.setHex(palette[i % palette.length]);
        fwColors[i3] = _tmpColor.r;
        fwColors[i3 + 1] = _tmpColor.g;
        fwColors[i3 + 2] = _tmpColor.b;
      }
      fwGeo.attributes.position.needsUpdate = true;
      fwGeo.attributes.color.needsUpdate = true;
    };
    fireworkTriggerRef.current = launchFireworks;

    // LED Facial Screen Redraw Helper
    let blinkCountdown = 2.5;
    let blinkAmount = 0;

    const drawLedFace = (
      t: number,
      speaking: boolean,
      listening: boolean,
      celebrating: boolean,
      encouraging: boolean,
      lookX: number,
      lookY: number,
      blink: number
    ) => {
      faceCtx.fillStyle = '#070b14';
      faceCtx.fillRect(0, 0, 512, 320);

      // Subtle LED scanlines
      faceCtx.fillStyle = 'rgba(16, 185, 129, 0.04)';
      for (let y = 0; y < 320; y += 8) {
        faceCtx.fillRect(0, y, 512, 3);
      }

      const eyeColor = celebrating
        ? '#fde047'
        : listening
        ? '#38bdf8'
        : encouraging
        ? '#fbbf24'
        : '#34d399';
      const exOffset = lookX * 16;
      const eyOffset = -lookY * 12;

      faceCtx.shadowColor = eyeColor;
      faceCtx.shadowBlur = 18;
      faceCtx.fillStyle = eyeColor;
      faceCtx.strokeStyle = eyeColor;

      const drawEye = (cx: number, cy: number) => {
        if (celebrating) {
          // Happy curved ^ ^ eyes
          faceCtx.lineWidth = 14;
          faceCtx.lineCap = 'round';
          faceCtx.beginPath();
          faceCtx.arc(cx + exOffset, cy + 16 + eyOffset, 34, Math.PI * 1.15, Math.PI * 1.85);
          faceCtx.stroke();
        } else {
          const h = Math.max(6, 72 * (1 - blink));
          const r = Math.min(28, h / 2);
          const x = cx - 34 + exOffset;
          const y = cy - h / 2 + eyOffset;
          faceCtx.beginPath();
          faceCtx.roundRect(x, y, 68, h, r);
          faceCtx.fill();

          if (h > 22) {
            faceCtx.shadowBlur = 0;
            faceCtx.fillStyle = '#ffffff';
            faceCtx.beginPath();
            faceCtx.arc(cx - 12 + exOffset, cy - 12 + eyOffset, 9, 0, Math.PI * 2);
            faceCtx.fill();
            faceCtx.fillStyle = eyeColor;
            faceCtx.shadowBlur = 18;
          }
        }
      };

      drawEye(162, 125);
      drawEye(350, 125);

      // Cheeks
      faceCtx.shadowBlur = 0;
      faceCtx.fillStyle = celebrating ? 'rgba(244, 114, 182, 0.45)' : 'rgba(244, 114, 182, 0.2)';
      faceCtx.beginPath();
      faceCtx.ellipse(98 + exOffset, 178, 22, 11, 0, 0, Math.PI * 2);
      faceCtx.ellipse(414 + exOffset, 178, 22, 11, 0, 0, Math.PI * 2);
      faceCtx.fill();

      // LED Mouth (Audio Wave when Speaking, Smile otherwise)
      faceCtx.shadowColor = eyeColor;
      faceCtx.shadowBlur = 14;
      faceCtx.fillStyle = eyeColor;
      faceCtx.strokeStyle = eyeColor;

      if (speaking) {
        const bars = 9;
        const barW = 14;
        const gap = 8;
        const startX = 256 - ((bars * barW + (bars - 1) * gap) / 2);
        for (let b = 0; b < bars; b++) {
          const wave = Math.abs(Math.sin(t * 14 + b * 0.75)) * 0.75 + 0.25;
          const bh = 10 + wave * 42;
          faceCtx.beginPath();
          faceCtx.roundRect(startX + b * (barW + gap), 232 - bh / 2, barW, bh, 6);
          faceCtx.fill();
        }
      } else if (listening) {
        // Attentive small O / ripple mouth
        const r = 13 + Math.sin(t * 8) * 3;
        faceCtx.lineWidth = 8;
        faceCtx.beginPath();
        faceCtx.arc(256, 230, r, 0, Math.PI * 2);
        faceCtx.stroke();
      } else {
        // Warm friendly smile arc
        faceCtx.lineWidth = 10;
        faceCtx.lineCap = 'round';
        faceCtx.beginPath();
        faceCtx.arc(256, 212, 34, 0.2 * Math.PI, 0.8 * Math.PI);
        faceCtx.stroke();
      }
      faceCtx.shadowBlur = 0;
      faceTexture.needsUpdate = true;
    };

    // Mouse / Pointer tracking over the canvas
    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.lookX = THREE.MathUtils.clamp(nx, -1, 1);
      stateRef.current.lookY = THREE.MathUtils.clamp(ny, -1, 1);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // ResizeObserver for crisp responsive viewport
    const ro = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 200);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // WebGL Context Lost safety
    const onContextLost = (ev: Event) => {
      ev.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    // Animation Loop
    let rafId = 0;
    let prevTime = performance.now();
    let elapsed = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      if (isSoftwareGl) {
        setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(cb);
        }, 32);
      } else {
        rafId = requestAnimationFrame(cb);
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - prevTime) / 1000);
      prevTime = now;
      elapsed += dt;

      const st = stateRef.current;

      // Natural blinking
      blinkCountdown -= dt;
      if (blinkCountdown <= 0) {
        blinkAmount = Math.sin(((-blinkCountdown) / 0.18) * Math.PI);
        if (blinkCountdown < -0.18) {
          blinkCountdown = 2.2 + Math.random() * 2.5;
          blinkAmount = 0;
        }
      } else {
        blinkAmount = 0;
      }

      // Reaction timers
      let jumpOffset = 0;
      if (st.celebrateTimer > 0) {
        st.celebrateTimer = Math.max(0, st.celebrateTimer - dt);
        jumpOffset = Math.abs(Math.sin(st.celebrateTimer * 5.2)) * 0.48;
      }
      if (st.spinRemaining > 0) {
        const spinStep = Math.min(st.spinRemaining, dt * 8.5);
        st.spinRemaining -= spinStep;
        robotRoot.rotation.y += spinStep;
      } else {
        robotRoot.rotation.y = THREE.MathUtils.damp(robotRoot.rotation.y, 0, 5, dt);
      }

      let encourageNod = 0;
      if (st.encourageTimer > 0) {
        st.encourageTimer = Math.max(0, st.encourageTimer - dt);
        encourageNod = Math.sin(st.encourageTimer * 9) * 0.16;
      }

      // Levitation Idle Bob
      const idleBob = Math.sin(elapsed * 2.2) * 0.085;
      robotRoot.position.y = THREE.MathUtils.damp(robotRoot.position.y, 0.92 + idleBob + jumpOffset, 10, dt);

      // Contact shadow scale responds smoothly to height
      const shadowScale = THREE.MathUtils.clamp(1.05 - (idleBob + jumpOffset) * 0.45, 0.55, 1.15);
      contactShadow.scale.set(shadowScale, shadowScale, 1);

      // Head tracking + Listening tilt
      const targetHeadYaw = st.lookX * 0.36;
      const targetHeadPitch = -st.lookY * 0.22 + encourageNod;
      const targetHeadTilt = st.isListening ? 0.2 : st.isSpeaking ? Math.sin(elapsed * 3.5) * 0.06 : 0;

      headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, targetHeadYaw, 7, dt);
      headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, targetHeadPitch, 7, dt);
      headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, targetHeadTilt, 6, dt);

      // Headphone LED glow pulsing to Mic Level when Listening
      const pulse = st.isListening
        ? 1.1 + Math.max(st.micLevel * 2.4, Math.abs(Math.sin(elapsed * 6)) * 0.55)
        : st.isSpeaking
        ? 1.15 + Math.abs(Math.sin(elapsed * 8)) * 0.6
        : 0.65;
      headphoneGlowMat.emissiveIntensity = pulse;
      _tmpVec.set(
        st.isListening ? 0.22 : 0.06,
        st.isListening ? 0.83 : 0.72,
        st.isListening ? 0.97 : 0.5
      );
      headphoneGlowMat.emissive.setRGB(_tmpVec.x, _tmpVec.y, _tmpVec.z);

      // Articulated Floating Hands Animation
      if (st.celebrateTimer > 0) {
        leftArmGroup.position.y = THREE.MathUtils.damp(leftArmGroup.position.y, 0.35 + Math.sin(elapsed * 12) * 0.12, 10, dt);
        rightArmGroup.position.y = THREE.MathUtils.damp(rightArmGroup.position.y, 0.35 + Math.cos(elapsed * 12) * 0.12, 10, dt);
      } else if (st.isSpeaking) {
        leftArmGroup.position.y = THREE.MathUtils.damp(leftArmGroup.position.y, -0.04 + Math.sin(elapsed * 6.5) * 0.16, 8, dt);
        rightArmGroup.position.y = THREE.MathUtils.damp(rightArmGroup.position.y, -0.02 + Math.cos(elapsed * 6.5) * 0.18, 8, dt);
        leftArmGroup.position.z = THREE.MathUtils.damp(leftArmGroup.position.z, 0.22 + Math.sin(elapsed * 5) * 0.08, 8, dt);
        rightArmGroup.position.z = THREE.MathUtils.damp(rightArmGroup.position.z, 0.22 + Math.cos(elapsed * 5) * 0.08, 8, dt);
      } else {
        leftArmGroup.position.y = THREE.MathUtils.damp(leftArmGroup.position.y, -0.18 + Math.sin(elapsed * 2.2 + 0.5) * 0.06, 6, dt);
        rightArmGroup.position.y = THREE.MathUtils.damp(rightArmGroup.position.y, -0.18 + Math.sin(elapsed * 2.2 + 1.0) * 0.06, 6, dt);
        leftArmGroup.position.z = THREE.MathUtils.damp(leftArmGroup.position.z, 0.05, 6, dt);
        rightArmGroup.position.z = THREE.MathUtils.damp(rightArmGroup.position.z, 0.05, 6, dt);
      }

      // Fireworks step
      if (fwActive) {
        fwAge += dt;
        for (let i = 0; i < FW_COUNT; i++) {
          const i3 = i * 3;
          fwVelocities[i3 + 1] -= 2.4 * dt; // gravity
          fwPositions[i3] += fwVelocities[i3] * dt;
          fwPositions[i3 + 1] += fwVelocities[i3 + 1] * dt;
          fwPositions[i3 + 2] += fwVelocities[i3 + 2] * dt;
        }
        fwGeo.attributes.position.needsUpdate = true;
        fwMat.opacity = Math.max(0, 1 - fwAge / 1.9);
        if (fwAge >= 1.9) {
          fwActive = false;
          fwMat.opacity = 0;
        }
      }

      // Redraw LED face every frame (cheap 512x320 2D canvas)
      drawLedFace(
        elapsed,
        st.isSpeaking,
        st.isListening,
        st.celebrateTimer > 0,
        st.encourageTimer > 0,
        st.lookX,
        st.lookY,
        blinkAmount
      );

      controls.update();
      renderer.render(scene, camera);
      afterDraw(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      envTex.dispose();
      pmrem.dispose();
      shadowTex.dispose();
      faceTexture.dispose();
      fwGeo.dispose();
      fwMat.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [showStage, isDark]);

  const statusText =
    reaction === 'celebrate'
      ? '🎉 Xuất sắc! Pháo hoa chúc mừng!'
      : isListening
      ? '🎧 Đang nghiêng đầu lắng nghe giọng bạn...'
      : isSpeaking
      ? `🔊 Đang giảng bằng giọng ${countryCulture.nativeName}...`
      : `✨ Sẵn sàng (${countryCulture.flag} ${countryCulture.nativeName})`;

  return (
    <div
      className={`mx-auto w-full max-w-4xl rounded-3xl border overflow-hidden transition-all mb-3 ${
        isDark
          ? 'bg-gradient-to-b from-[#0b1220] via-[#0e1729] to-[#0b101b] border-emerald-500/25 shadow-xl shadow-black/30'
          : 'bg-gradient-to-b from-emerald-50 via-teal-50/70 to-white border-emerald-200/90 shadow-md'
      }`}
    >
      {/* Top Stage Header Bar (NO backdrop-blur over WebGL) */}
      <div
        className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          isDark ? 'border-white/10 bg-[#0d1526]' : 'border-emerald-200/70 bg-white/95'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gia sư 3D Max10</span>
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
            {countryCulture.flag} {countryCulture.nativeName}
          </span>
          <span className="hidden sm:inline text-[11px] font-semibold text-slate-600 dark:text-zinc-300 truncate">
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isListening && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-400 text-[10px] font-black">
              <Mic className="w-3 h-3" /> Mic
            </span>
          )}
          {isSpeaking && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
              <Volume2 className="w-3 h-3" /> Đang nói
            </span>
          )}
          {onTriggerTestReaction && (
            <>
              <button
                type="button"
                onClick={() => onTriggerTestReaction('celebrate')}
                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 text-[10px] font-bold cursor-pointer whitespace-nowrap"
                title="Xem biểu cảm chúc mừng & pháo hoa 3D"
              >
                🎆 Ăn mừng
              </button>
              <button
                type="button"
                onClick={() => onTriggerTestReaction('encourage')}
                className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-300 text-[10px] font-bold cursor-pointer whitespace-nowrap"
                title="Xem biểu cảm khích lệ"
              >
                👍 Khích lệ
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowStage((prev) => !prev)}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-white/15 text-[10px] font-bold text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            {showStage ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showStage ? 'Thu gọn 3D' : 'Hiện 3D'}</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Stage */}
      {showStage && (
        <div className="relative w-full">
          <div
            ref={mountRef}
            className={`w-full ${compact ? 'h-[210px] sm:h-[240px]' : 'h-[240px] sm:h-[280px]'} cursor-grab active:cursor-grabbing`}
            aria-label="Sân khấu nhân vật gia sư Robot 3D tương tác"
          />
          <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-400">
            <RotateCcw className="w-3 h-3" />
            <span>Kéo chuột để xoay góc nhìn · Di chuột để Robot nhìn theo</span>
          </div>
        </div>
      )}
    </div>
  );
};
