import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Express } from "express";
import { GoogleGenAI, Type } from "@google/genai";

export type VisualStudioMode =
  | "flashcard"
  | "literature"
  | "mindmap_infographic"
  | "avatar"
  | "poster"
  | "free_image";

export interface OverlayMetadata {
  title: string;
  subtitle?: string;
  word?: string;
  phonetic?: string;
  partOfSpeech?: string;
  vietnameseMeaning?: string;
  exampleEn?: string;
  exampleVi?: string;
  eraOrWork?: string;
  quoteOrCaption?: string;
  branches?: Array<{ heading: string; detail: string }>;
  keyTip?: string;
  badgeLabel?: string;
}

export interface CachedVisualAsset {
  cacheKey: string;
  canonicalKeyword: string;
  originalPrompt: string;
  mode: VisualStudioMode;
  style: string;
  aspectRatio: string;
  fileName: string;
  imageUrl: string;
  enhancedEnglishPrompt: string;
  overlay: OverlayMetadata;
  provider: string;
  seed: number;
  width: number;
  height: number;
  createdAt: number;
  hitCount: number;
}

export interface ImageQueueJob {
  jobId: string;
  userId: string;
  prompt: string;
  mode: VisualStudioMode;
  style: string;
  aspectRatio: string;
  avatarArchetype?: string;
  status: "queued" | "enhancing_prompt" | "generating_image" | "caching_asset" | "completed" | "failed";
  progress: number;
  stageLabel: string;
  position: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
  result?: {
    cached: boolean;
    quotaConsumed: boolean;
    imageUrl: string;
    prompt: string;
    enhancedPrompt: string;
    mode: VisualStudioMode;
    style: string;
    aspectRatio: string;
    provider: string;
    seed: number;
    width: number;
    height: number;
    canonicalKeyword: string;
    overlay: OverlayMetadata;
    quota: DailyImageQuotaInfo;
  };
}

export interface DailyImageQuotaInfo {
  userId: string;
  plan: string;
  role: string;
  date: string;
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const IMAGE_CACHE_DIR = path.resolve(DATA_DIR, "image_cache");
const IMAGE_CACHE_INDEX_PATH = path.resolve(DATA_DIR, "image_cache_index.json");
const IMAGE_QUOTA_PATH = path.resolve(DATA_DIR, "image_daily_quota.json");
const FREE_TIER_GEMINI_MODEL = "gemini-2.5-flash";

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IMAGE_CACHE_DIR)) fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Canonical educational synonym map for cross-language Keyword Cache (e.g. "photosynthesis" == "quang hợp")
const CANONICAL_SYNONYMS: Record<string, string> = {
  "quang hop": "photosynthesis",
  "photosynthesis": "photosynthesis",
  "quang hợp": "photosynthesis",
  "te bao": "cell_biology",
  "tế bào": "cell_biology",
  "cell": "cell_biology",
  "biological cell": "cell_biology",
  "he mat troi": "solar_system",
  "hệ mặt trời": "solar_system",
  "solar system": "solar_system",
  "vong tuan hoan nuoc": "water_cycle",
  "vòng tuần hoàn nước": "water_cycle",
  "water cycle": "water_cycle",
  "adn": "dna_helix",
  "dna": "dna_helix",
  "cau truc adn": "dna_helix",
  "cấu trúc adn": "dna_helix",
  "truyen kieu": "truyen_kieu",
  "truyện kiều": "truyen_kieu",
  "nui lua": "volcano",
  "núi lửa": "volcano",
  "volcano": "volcano",
  "nguyen tu": "atom_structure",
  "nguyên tử": "atom_structure",
  "atom": "atom_structure",
  "dien bien phu": "dien_bien_phu",
  "điện biên phủ": "dien_bien_phu",
  "bach dang": "bach_dang_938",
  "bạch đằng": "bach_dang_938",
  "ngo quyen": "bach_dang_938",
  "ngô quyền": "bach_dang_938",
};

export function normalizeCacheKeyword(raw: string): string {
  const trimmed = (raw || "").trim().toLowerCase();
  if (CANONICAL_SYNONYMS[trimmed]) {
    return CANONICAL_SYNONYMS[trimmed];
  }
  const stripped = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (CANONICAL_SYNONYMS[stripped]) {
    return CANONICAL_SYNONYMS[stripped];
  }
  return stripped || "educational_visual";
}

function makeCacheKey(
  prompt: string,
  mode: VisualStudioMode,
  style: string,
  aspectRatio: string,
  avatarArchetype?: string
): { cacheKey: string; canonicalKeyword: string } {
  const canonicalKeyword = normalizeCacheKeyword(prompt);
  const rawKey = `${canonicalKeyword}|${mode}|${style}|${aspectRatio}|${avatarArchetype || ""}|svg_v2`;
  const cacheKey = crypto.createHash("sha256").update(rawKey).digest("hex").slice(0, 24);
  return { cacheKey, canonicalKeyword };
}

function loadCacheIndex(): Record<string, CachedVisualAsset> {
  ensureDirs();
  try {
    if (fs.existsSync(IMAGE_CACHE_INDEX_PATH)) {
      return JSON.parse(fs.readFileSync(IMAGE_CACHE_INDEX_PATH, "utf-8"));
    }
  } catch (e) {
    console.warn("Failed to load image cache index:", e);
  }
  return {};
}

function saveCacheIndex(index: Record<string, CachedVisualAsset>) {
  ensureDirs();
  try {
    fs.writeFileSync(IMAGE_CACHE_INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save image cache index:", e);
  }
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDailyLimitForUser(plan: string = "free", role: string = "student", isAdmin: boolean = false): number {
  if (isAdmin || role === "admin") return 200;
  if (role === "teacher") return 100;
  if (plan === "premium") return 100;
  if (plan === "plus") return 25;
  return 5;
}

function loadQuotaStore(): Record<string, Record<string, number>> {
  ensureDirs();
  try {
    if (fs.existsSync(IMAGE_QUOTA_PATH)) {
      return JSON.parse(fs.readFileSync(IMAGE_QUOTA_PATH, "utf-8"));
    }
  } catch (e) {
    console.warn("Failed to load image quota store:", e);
  }
  return {};
}

function saveQuotaStore(store: Record<string, Record<string, number>>) {
  ensureDirs();
  try {
    fs.writeFileSync(IMAGE_QUOTA_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save image quota store:", e);
  }
}

export function getUserDailyImageQuota(
  userId: string = "guest",
  plan: string = "free",
  role: string = "student",
  isAdmin: boolean = false
): DailyImageQuotaInfo {
  const date = getTodayKey();
  const limit = getDailyLimitForUser(plan, role, isAdmin);
  const store = loadQuotaStore();
  const dayMap = store[date] || {};
  const used = dayMap[userId] || 0;
  const remaining = Math.max(0, limit - used);
  return {
    userId,
    plan,
    role,
    date,
    used,
    limit,
    remaining,
    isUnlimited: limit >= 100,
  };
}

function incrementUserDailyImageQuota(
  userId: string = "guest",
  plan: string = "free",
  role: string = "student",
  isAdmin: boolean = false
): DailyImageQuotaInfo {
  const date = getTodayKey();
  const store = loadQuotaStore();
  if (!store[date]) {
    const keys = Object.keys(store).sort();
    while (keys.length > 3) {
      const oldest = keys.shift();
      if (oldest) delete store[oldest];
    }
    store[date] = {};
  }
  store[date][userId] = (store[date][userId] || 0) + 1;
  saveQuotaStore(store);
  return getUserDailyImageQuota(userId, plan, role, isAdmin);
}

// Student Safety Guardrail
const BLOCKED_SAFETY_TERMS = [
  "nsfw",
  "nude",
  "naked",
  "sex",
  "porn",
  "blood",
  "gore",
  "kill",
  "murder",
  "suicide",
  "weapon",
  "gun",
  "khỏa thân",
  "khiêu dâm",
  "bạo lực",
  "máu me",
  "tự tử",
  "ma túy",
];

function checkPromptSafety(prompt: string): { safe: boolean; reason?: string } {
  const lower = (prompt || "").toLowerCase();
  for (const term of BLOCKED_SAFETY_TERMS) {
    if (lower.includes(term)) {
      return {
        safe: false,
        reason: "Nội dung không phù hợp với môi trường học đường. Vui lòng nhập chủ đề học tập lành mạnh.",
      };
    }
  }
  return { safe: true };
}

function getDimensions(aspectRatio: string): { width: number; height: number } {
  if (aspectRatio === "16:9") return { width: 1280, height: 720 };
  if (aspectRatio === "9:16") return { width: 720, height: 1280 };
  if (aspectRatio === "4:3") return { width: 1024, height: 768 };
  return { width: 1024, height: 1024 };
}

function getStyleDescription(style: string, mode: VisualStudioMode, avatarArchetype?: string): string {
  if (mode === "avatar") {
    const archetypes: Record<string, string> = {
      cartoon_3d: "friendly 3D-shaded vector student portrait with glowing studio rim light and expressive eyes",
      superhero: "heroic young student superhero vector portrait with energy cape and glowing emblem",
      scientist: "young scientist vector portrait with lab goggles and glowing holographic orbital atoms",
      scholar: "noble academic scholar crest portrait with golden laurel wreath and starry royal blue background",
    };
    return archetypes[avatarArchetype || "cartoon_3d"] || archetypes.cartoon_3d;
  }

  const map: Record<string, string> = {
    chatgpt: "rich layered modern flat-3D vector educational illustration with soft gradients and depth",
    photorealistic: "atmospheric scenic vector illustration with realistic sunset/sky gradients and silhouettes",
    "3d_cartoon": "playful colorful Pixar-inspired shaded vector illustration with rounded forms",
    anime: "warm sunlit Studio Ghibli inspired scenic vector illustration with expressive clouds",
    literature_art: "evocative historical and literary vector painting with warm atmospheric moonlight/river/lantern lighting",
    diagram: "clean modern minimalist educational vector backdrop with subtle geometric patterns",
  };
  return map[style] || map.chatgpt;
}

async function generateTextFreePromptAndOverlay(
  rawPrompt: string,
  mode: VisualStudioMode,
  style: string,
  avatarArchetype?: string
): Promise<{ enhancedEnglishPrompt: string; overlay: OverlayMetadata; isSafe: boolean; safetyReason?: string }> {
  const styleDesc = getStyleDescription(style, mode, avatarArchetype);
  const ai = getGenAIClient();

  const instruction = `You are Max10 Visual Studio Prompt & Curriculum Architect.
Analyze the student's input: "${rawPrompt}" for mode="${mode}".
1. Safety check: Ensure it is 100% appropriate for middle/high school education. If harmful/inappropriate, set isSafe=false.
2. Text-Free Visual Prompt Rule:
   Your "enhancedEnglishPrompt" MUST describe ONLY the visual scene/illustration with STRICTLY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO LABELS inside the SVG art itself, so the app's HTML5 Canvas can render crisp Vietnamese text on top.
   Include style nuance: ${styleDesc}. Keep enhancedEnglishPrompt under 55 words.
3. Structured Vietnamese Overlay Metadata (for HTML5 Canvas rendering):
   - For mode="flashcard": Fill word (English or main concept), phonetic (IPA), partOfSpeech (e.g. "Danh từ (n.)"), vietnameseMeaning (accurate Vietnamese meaning), exampleEn, exampleVi, title, subtitle.
   - For mode="literature": Fill title (tên tác phẩm/sự kiện), eraOrWork (giai đoạn/tác giả), quoteOrCaption (câu thơ/trích dẫn/nhận định đắt giá 1-2 dòng tiếng Việt chuẩn dấu), subtitle.
   - For mode="mindmap_infographic": Fill title (chủ đề ngắn gọn), subtitle (tóm tắt 1 câu), branches (3 to 4 concise items with {heading, detail}), keyTip (1 mẹo ghi nhớ nhanh).
   - For mode="avatar": Fill title (danh hiệu cá nhân), badgeLabel (e.g., "SIÊU ANH HÙNG HỌC TẬP" / "NHÀ KHOA HỌC NHÍ"), subtitle.
   - For mode="poster" or "free_image": Fill title, subtitle, keyTip.`;

  try {
    const response = await ai.models.generateContent({
      model: FREE_TIER_GEMINI_MODEL,
      contents: instruction,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            safetyReason: { type: Type.STRING },
            enhancedEnglishPrompt: { type: Type.STRING },
            overlay: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                word: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                vietnameseMeaning: { type: Type.STRING },
                exampleEn: { type: Type.STRING },
                exampleVi: { type: Type.STRING },
                eraOrWork: { type: Type.STRING },
                quoteOrCaption: { type: Type.STRING },
                keyTip: { type: Type.STRING },
                badgeLabel: { type: Type.STRING },
                branches: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      heading: { type: Type.STRING },
                      detail: { type: Type.STRING },
                    },
                    required: ["heading", "detail"],
                  },
                },
              },
              required: ["title"],
            },
          },
          required: ["isSafe", "enhancedEnglishPrompt", "overlay"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const cleanPrompt =
      (parsed.enhancedEnglishPrompt || `${rawPrompt}, ${styleDesc}`).trim() +
      ", strictly no text, no letters, no words, no numbers";

    return {
      isSafe: parsed.isSafe !== false,
      safetyReason: parsed.safetyReason,
      enhancedEnglishPrompt: cleanPrompt,
      overlay: parsed.overlay || { title: rawPrompt },
    };
  } catch (err) {
    console.warn("gemini-2.5-flash prompt separation fallback:", err);
    return {
      isSafe: true,
      enhancedEnglishPrompt: `${rawPrompt}, ${styleDesc}, strictly no text, no letters, no words`,
      overlay: {
        title: rawPrompt,
        subtitle: "Minh họa học tập trực quan Max10",
        word: mode === "flashcard" ? rawPrompt : undefined,
        vietnameseMeaning: mode === "flashcard" ? "Khái niệm / Từ vựng trọng tâm" : undefined,
        branches:
          mode === "mindmap_infographic"
            ? [
                { heading: "Bản chất trọng tâm", detail: rawPrompt.slice(0, 80) },
                { heading: "Ứng dụng thực tế", detail: "Liên hệ giải bài tập và ví dụ minh họa." },
                { heading: "Lưu ý điểm 10", detail: "Tránh nhầm lẫn điều kiện và công thức." },
              ]
            : undefined,
      },
    };
  }
}

function buildFallbackArtSvg(width: number, height: number, mode: VisualStudioMode, seed: number): string {
  const palettes: Record<VisualStudioMode, [string, string, string, string]> = {
    flashcard: ["#064e3b", "#0f766e", "#34d399", "#fde68a"],
    literature: ["#1e1b4b", "#4c1d95", "#f59e0b", "#fda4af"],
    mindmap_infographic: ["#0f172a", "#1e3a8a", "#38bdf8", "#34d399"],
    avatar: ["#1e1b4b", "#312e81", "#fbbf24", "#38bdf8"],
    poster: ["#4c0519", "#9f1239", "#fb7185", "#fde68a"],
    free_image: ["#0f172a", "#0369a1", "#38bdf8", "#a7f3d0"],
  };
  const [bg1, bg2, acc1, acc2] = palettes[mode] || palettes.flashcard;
  const cx = Math.round(width / 2);
  const cy = Math.round(height * 0.44);
  const r = Math.round(Math.min(width, height) * 0.24);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glowGrad_${seed}" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${acc2}" stop-opacity="0.7"/>
      <stop offset="60%" stop-color="${acc1}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${bg2}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad_${seed})"/>
  <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 1.9)}" fill="url(#glowGrad_${seed})"/>
  <path d="M0,${Math.round(height * 0.72)} Q${Math.round(width * 0.3)},${Math.round(height * 0.6)} ${Math.round(width * 0.65)},${Math.round(height * 0.74)} T${width},${Math.round(height * 0.68)} L${width},${height} L0,${height} Z" fill="${bg1}" opacity="0.55"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${acc1}" opacity="0.25" stroke="${acc2}" stroke-width="5"/>
  <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.65)}" fill="${acc2}" opacity="0.35"/>
  <g stroke="${acc2}" stroke-width="3" fill="none" opacity="0.7">
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(r * 1.25)}" ry="${Math.round(r * 0.45)}" transform="rotate(-24 ${cx} ${cy})"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(r * 1.25)}" ry="${Math.round(r * 0.45)}" transform="rotate(24 ${cx} ${cy})"/>
  </g>
</svg>`;
}

/**
 * Free-Tier Vector Illustration Generator using Gemini 2.5 Flash (GEMINI_API_KEY)
 * Zero paid API keys or billing required. Generates crisp, text-free multi-layer SVG art
 * so HTML5 Canvas can overlay accurate Vietnamese typography cleanly on top.
 */
async function generateFreeSvgIllustration(
  enhancedEnglishPrompt: string,
  mode: VisualStudioMode,
  width: number,
  height: number,
  seed: number
): Promise<{ buffer: Buffer; ext: string; provider: string }> {
  const ai = getGenAIClient();

  const focusGuidance =
    mode === "avatar"
      ? "Center a charming illustrated student character portrait (head, shoulders, glasses/cape/laurel) in the upper 70% of the frame, leaving the bottom 25% uncluttered."
      : mode === "flashcard"
      ? "Illustrate the core science/English concept vividly in the upper 62% of the canvas using rich shapes, gradients, sunlight rays, molecules/leaves/planets/objects, leaving the bottom 35% darker and calm for the Flashcard text overlay."
      : mode === "literature"
      ? "Compose a cinematic atmospheric landscape/historical scene with layered silhouettes, moon/sunlight, river/architecture/figures in the upper 70%, keeping the bottom 28% dark for the caption overlay."
      : "Create an atmospheric abstract educational backdrop with subtle luminous waves, geometric constellations, and soft radial lighting.";

  const svgPrompt = `You are a master vector illustrator creating rich, vibrant, multi-layered SVG artwork.
Create a complete standalone SVG illustration for: "${enhancedEnglishPrompt}".
Canvas size: width="${width}" height="${height}" viewBox="0 0 ${width} ${height}".
Composition rule: ${focusGuidance}

STRICT SVG RULES:
1. Return ONLY valid raw <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">...</svg> XML. No markdown fences, no explanations.
2. STRICTLY NO TEXT: Do NOT use <text> or <tspan> elements, no letters, no numbers, no words anywhere in the SVG!
3. Use rich <defs> with <linearGradient> and <radialGradient>, layered paths, smooth Bézier curves, crisp highlights, shadows, and atmospheric details (15-40 rich vector shapes).
4. Never include <script> or external image links.`;

  try {
    const response = await ai.models.generateContent({
      model: FREE_TIER_GEMINI_MODEL,
      contents: svgPrompt,
    });
    let svgText = (response.text || "").trim();
    // Strip markdown code fences if present
    svgText = svgText.replace(/^```(?:svg|xml)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const startIdx = svgText.indexOf("<svg");
    const endIdx = svgText.lastIndexOf("</svg>");
    if (startIdx !== -1 && endIdx !== -1) {
      svgText = svgText.slice(startIdx, endIdx + 6);
      // Sanitize any scripts or accidental <text> elements
      svgText = svgText
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/<text[\s\S]*?>[\s\S]*?<\/text>/gi, "");

      // Ensure xmlns, width, height are set for crisp Canvas drawing
      if (!svgText.includes("xmlns=")) {
        svgText = svgText.replace("<svg", `<svg xmlns="http://www.w3.org/2000/svg"`);
      }
      if (!/\bwidth=/.test(svgText.slice(0, 220))) {
        svgText = svgText.replace("<svg", `<svg width="${width}" height="${height}"`);
      }

      return {
        buffer: Buffer.from(svgText, "utf-8"),
        ext: "svg",
        provider: "Gemini 2.5 Flash Free-Tier Vector SVG",
      };
    }
  } catch (err) {
    console.warn("Gemini 2.5 Flash SVG illustration fallback:", err);
  }

  const fallbackSvg = buildFallbackArtSvg(width, height, mode, seed);
  return {
    buffer: Buffer.from(fallbackSvg, "utf-8"),
    ext: "svg",
    provider: "Max10 Procedural Vector Engine (Free)",
  };
}

// Async Queue State
const jobMap = new Map<string, ImageQueueJob>();
const pendingJobIds: string[] = [];
let activeWorkers = 0;
const MAX_CONCURRENT_WORKERS = 2;

function updatePendingPositions() {
  pendingJobIds.forEach((id, idx) => {
    const job = jobMap.get(id);
    if (job && job.status === "queued") {
      job.position = idx + 1;
    }
  });
}

async function processQueueWorker(jobParamsMap: Map<string, { plan: string; role: string; isAdmin: boolean }>) {
  if (activeWorkers >= MAX_CONCURRENT_WORKERS || pendingJobIds.length === 0) return;

  const jobId = pendingJobIds.shift();
  if (!jobId) return;
  updatePendingPositions();

  const job = jobMap.get(jobId);
  const authMeta = jobParamsMap.get(jobId) || { plan: "free", role: "student", isAdmin: false };
  if (!job) {
    processQueueWorker(jobParamsMap);
    return;
  }

  activeWorkers++;
  try {
    // Stage 1: Safety + Text-Free Prompt Engineering
    job.status = "enhancing_prompt";
    job.progress = 30;
    job.stageLabel = "Đang tách chữ Tiếng Việt & kiểm duyệt an toàn học đường...";
    job.position = 0;
    job.updatedAt = Date.now();

    const { enhancedEnglishPrompt, overlay, isSafe, safetyReason } =
      await generateTextFreePromptAndOverlay(job.prompt, job.mode, job.style, job.avatarArchetype);

    if (!isSafe) {
      job.status = "failed";
      job.progress = 100;
      job.error = safetyReason || "Nội dung vi phạm quy chuẩn an toàn học sinh.";
      job.updatedAt = Date.now();
      return;
    }

    // Stage 2: Free-Tier Vector SVG Generation (Zero Paid Billing)
    job.status = "generating_image";
    job.progress = 68;
    job.stageLabel = "Đang vẽ minh họa vector SVG không chữ (Gemini 2.5 Flash Free Tier)...";
    job.updatedAt = Date.now();

    const { width, height } = getDimensions(job.aspectRatio);
    const seed = Math.floor(Math.random() * 900000) + 100000;
    const { buffer, ext, provider } = await generateFreeSvgIllustration(
      enhancedEnglishPrompt,
      job.mode,
      width,
      height,
      seed
    );

    // Stage 3: Save to Keyword Cache + Deduct Daily Quota
    job.status = "caching_asset";
    job.progress = 92;
    job.stageLabel = "Đang lưu bộ nhớ đệm từ khóa & chuẩn bị Canvas chữ Việt...";
    job.updatedAt = Date.now();

    const { cacheKey, canonicalKeyword } = makeCacheKey(
      job.prompt,
      job.mode,
      job.style,
      job.aspectRatio,
      job.avatarArchetype
    );

    ensureDirs();
    const fileName = `${cacheKey}.${ext}`;
    fs.writeFileSync(path.resolve(IMAGE_CACHE_DIR, fileName), buffer);
    const finalImageUrl = `/api/image-cache/${fileName}`;

    const index = loadCacheIndex();
    index[cacheKey] = {
      cacheKey,
      canonicalKeyword,
      originalPrompt: job.prompt,
      mode: job.mode,
      style: job.style,
      aspectRatio: job.aspectRatio,
      fileName,
      imageUrl: finalImageUrl,
      enhancedEnglishPrompt,
      overlay,
      provider,
      seed,
      width,
      height,
      createdAt: Date.now(),
      hitCount: 1,
    };
    saveCacheIndex(index);

    const updatedQuota = incrementUserDailyImageQuota(
      job.userId,
      authMeta.plan,
      authMeta.role,
      authMeta.isAdmin
    );

    job.status = "completed";
    job.progress = 100;
    job.stageLabel = "Hoàn tất! Sẵn sàng ghép chữ Tiếng Việt chuẩn nét trên Canvas.";
    job.updatedAt = Date.now();
    job.result = {
      cached: false,
      quotaConsumed: true,
      imageUrl: finalImageUrl,
      prompt: job.prompt,
      enhancedPrompt: enhancedEnglishPrompt,
      mode: job.mode,
      style: job.style,
      aspectRatio: job.aspectRatio,
      provider,
      seed,
      width,
      height,
      canonicalKeyword,
      overlay,
      quota: updatedQuota,
    };
  } catch (err: any) {
    console.error("Image queue worker failed:", err);
    job.status = "failed";
    job.progress = 100;
    job.error = err?.message || "Lỗi xử lý hàng đợi tạo minh họa.";
    job.updatedAt = Date.now();
  } finally {
    activeWorkers--;
    jobParamsMap.delete(jobId);
    const now = Date.now();
    for (const [k, v] of jobMap.entries()) {
      if (now - v.updatedAt > 15 * 60 * 1000) jobMap.delete(k);
    }
    processQueueWorker(jobParamsMap);
  }
}

const jobAuthParams = new Map<string, { plan: string; role: string; isAdmin: boolean }>();

export function registerVisualStudioRoutes(app: Express) {
  ensureDirs();

  // 1. Serve Cached Vector/Image Assets (Same-Origin => Zero CORS tainting on HTML5 Canvas!)
  app.get("/api/image-cache/:fileName", (req, res) => {
    const safeName = path.basename(req.params.fileName || "");
    const filePath = path.resolve(IMAGE_CACHE_DIR, safeName);
    if (!filePath.startsWith(IMAGE_CACHE_DIR + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).send("Cached visual not found");
    }
    const ext = path.extname(safeName).toLowerCase();
    const mime =
      ext === ".svg"
        ? "image/svg+xml; charset=utf-8"
        : ext === ".png"
        ? "image/png"
        : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "public, max-age=86400");
    fs.createReadStream(filePath).pipe(res);
  });

  // 2. List Popular Cached Keywords so students can browse instant 0-cost results
  app.get("/api/image-cache-list", (_req, res) => {
    const index = loadCacheIndex();
    const items = Object.values(index)
      .filter((item) => item.fileName && fs.existsSync(path.resolve(IMAGE_CACHE_DIR, item.fileName)))
      .sort((a, b) => b.hitCount - a.hitCount || b.createdAt - a.createdAt)
      .slice(0, 24);
    res.json({ success: true, items });
  });

  // 3. Get User Daily Image Quota
  app.get("/api/image-quota", (req, res) => {
    const userId = String(req.query.userId || "guest");
    const plan = String(req.query.plan || "free");
    const role = String(req.query.role || "student");
    const isAdmin = req.query.isAdmin === "true";
    const quota = getUserDailyImageQuota(userId, plan, role, isAdmin);
    res.json({ success: true, quota });
  });

  // 4. Enqueue Async Image Job (Checks Cache first -> Checks Quota -> Enqueues safely)
  app.post("/api/image-jobs/enqueue", (req, res) => {
    try {
      const {
        prompt,
        mode = "flashcard",
        style = "chatgpt",
        aspectRatio = "1:1",
        avatarArchetype,
        userId = "guest",
        plan = "free",
        role = "student",
        isAdmin = false,
        bypassCache = false,
      } = req.body || {};

      const cleanPrompt = String(prompt || "").trim();
      if (!cleanPrompt) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập mô tả hoặc từ khóa." });
      }

      const safety = checkPromptSafety(cleanPrompt);
      if (!safety.safe) {
        return res.status(400).json({ success: false, error: safety.reason });
      }

      const validMode: VisualStudioMode = [
        "flashcard",
        "literature",
        "mindmap_infographic",
        "avatar",
        "poster",
        "free_image",
      ].includes(mode)
        ? mode
        : "free_image";

      const { cacheKey, canonicalKeyword } = makeCacheKey(
        cleanPrompt,
        validMode,
        style,
        aspectRatio,
        avatarArchetype
      );

      // Step A: Keyword Cache Lookup (Instant return & ZERO daily quota cost!)
      if (!bypassCache) {
        const index = loadCacheIndex();
        const hit = index[cacheKey];
        if (hit && hit.fileName && fs.existsSync(path.resolve(IMAGE_CACHE_DIR, hit.fileName))) {
          hit.hitCount = (hit.hitCount || 1) + 1;
          saveCacheIndex(index);
          const quota = getUserDailyImageQuota(userId, plan, role, isAdmin);
          const instantJobId = `job-cache-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const completedJob: ImageQueueJob = {
            jobId: instantJobId,
            userId,
            prompt: cleanPrompt,
            mode: validMode,
            style,
            aspectRatio,
            avatarArchetype,
            status: "completed",
            progress: 100,
            stageLabel: "⚡ Trả về tức thì từ Bộ nhớ đệm (Cache) — Không tốn lượt tạo!",
            position: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            result: {
              cached: true,
              quotaConsumed: false,
              imageUrl: hit.imageUrl,
              prompt: cleanPrompt,
              enhancedPrompt: hit.enhancedEnglishPrompt,
              mode: validMode,
              style: hit.style,
              aspectRatio: hit.aspectRatio,
              provider: `${hit.provider} (Cached #${hit.hitCount})`,
              seed: hit.seed,
              width: hit.width,
              height: hit.height,
              canonicalKeyword,
              overlay: hit.overlay,
              quota,
            },
          };
          jobMap.set(instantJobId, completedJob);
          return res.json({ success: true, job: completedJob });
        }
      }

      // Step B: Daily Quota Check before queuing new AI call
      const quota = getUserDailyImageQuota(userId, plan, role, isAdmin);
      if (quota.remaining <= 0) {
        return res.status(429).json({
          success: false,
          quotaExceeded: true,
          quota,
          error: `Bạn đã dùng hết ${quota.limit}/${quota.limit} lượt tạo mới hôm nay. Hãy nâng cấp gói VIP hoặc dùng các từ khóa đã lưu trong Bộ nhớ đệm (0 lượt)!`,
        });
      }

      // Step C: Enqueue Async Job
      const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const position = pendingJobIds.length + 1;
      const newJob: ImageQueueJob = {
        jobId,
        userId,
        prompt: cleanPrompt,
        mode: validMode,
        style,
        aspectRatio,
        avatarArchetype,
        status: "queued",
        progress: 12,
        stageLabel: `Đang xếp hàng xử lý bất đồng bộ (Vị trí #${position})...`,
        position,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      jobMap.set(jobId, newJob);
      jobAuthParams.set(jobId, { plan, role, isAdmin });
      pendingJobIds.push(jobId);

      setImmediate(() => processQueueWorker(jobAuthParams));

      return res.json({ success: true, job: newJob });
    } catch (err: any) {
      console.error("Enqueue image job error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Lỗi xếp hàng tạo minh họa." });
    }
  });

  // 5. Poll Async Job Progress
  app.get("/api/image-jobs/:jobId", (req, res) => {
    const job = jobMap.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Không tìm thấy tiến trình tạo minh họa." });
    }
    res.json({ success: true, job });
  });

  // 6. Exact STEM Diagram Generator (SVG & Mermaid.js — gemini-2.5-flash Free Tier!)
  app.post("/api/generate-diagram", async (req, res) => {
    try {
      const {
        prompt,
        subject = "Toán Hình Học",
        preferredFormat = "auto",
        grade = "Lớp 9",
      } = req.body || {};

      const cleanPrompt = String(prompt || "").trim();
      if (!cleanPrompt) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập đề bài hoặc nội dung cần vẽ hình/sơ đồ." });
      }

      const ai = getGenAIClient();
      const diagramInstruction = `You are a precision STEM & Educational Diagram Code Generator for Vietnamese ${grade} students (${subject}).
CRITICAL RULE: Generate 100% EXACT mathematical/scientific vector SVG code AND/OR Mermaid.js syntax.
User Request: "${cleanPrompt}"
Subject: "${subject}"
Preferred Format: "${preferredFormat}"

Requirements:
1. For Geometry, Function Graphs, Physics, Chemistry:
   - Produce a crisp, mathematically accurate standalone "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500' width='800' height='500'>...</svg>".
   - Use a clean high-contrast dark blueprint background (#0f172a), crisp strokes (#38bdf8, #34d399, #f59e0b, #f43f5e, #e2e8f0), dashed auxiliary lines (stroke-dasharray="6,4"), clear point dots, right-angle square markers when perpendicular, and crisp Vietnamese/math Unicode labels (font-family="system-ui, sans-serif", font-size="16").
2. Also produce clean "mermaidCode" (e.g., "flowchart TD" or "mindmap" or "graph LR") wrapping node labels in double quotes: A["Bước 1: ..."].
3. Set primaryFormat to "mermaid" if preferredFormat === "mermaid", otherwise "svg".
4. Return concise Vietnamese explanation and keyFormulas array.`;

      const response = await ai.models.generateContent({
        model: FREE_TIER_GEMINI_MODEL,
        contents: diagramInstruction,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              primaryFormat: { type: Type.STRING },
              svgCode: { type: Type.STRING },
              mermaidCode: { type: Type.STRING },
              explanation: { type: Type.STRING },
              keyFormulas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["title", "primaryFormat", "svgCode", "explanation", "keyFormulas"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      let svgCode: string = String(parsed.svgCode || "").trim();
      svgCode = svgCode.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

      return res.json({
        success: true,
        diagram: {
          title: parsed.title || cleanPrompt,
          subject,
          primaryFormat: parsed.primaryFormat === "mermaid" ? "mermaid" : "svg",
          svgCode,
          mermaidCode: String(parsed.mermaidCode || "").trim(),
          explanation: parsed.explanation || "",
          keyFormulas: Array.isArray(parsed.keyFormulas) ? parsed.keyFormulas : [],
        },
      });
    } catch (err: any) {
      console.error("Generate diagram code error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Lỗi khi AI sinh mã SVG/Mermaid chuẩn xác.",
      });
    }
  });
}
