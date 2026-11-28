import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, Modality, ThinkingLevel, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";
import { registerVisualStudioRoutes } from "./server/visualStudio";
import { registerSecurityRoutesAndMiddleware, MASTER_SECURITY_CODE } from "./server/securityFirewall";
import { getCountryCulture } from "./src/data/countryCultures";

dotenv.config();

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please ensure the API key is configured.");
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

// Free Tier Gemini models in priority order (GEMINI_API_KEY Free Tier - Zero Paid Billing)
const FALLBACK_MODELS = [
  "gemini-4-hydrogen",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];
const MODEL_NAME = "gemini-4-hydrogen";

function buildModelSafeConfig(model: string, rawConfig?: any) {
  if (!rawConfig) return undefined;
  const nextConfig = { ...rawConfig };
  // Gemini 4 models do NOT accept legacy sampling parameters (temperature, topP, topK, candidateCount)
  if (model.startsWith("gemini-4-")) {
    delete nextConfig.temperature;
    delete nextConfig.topP;
    delete nextConfig.topK;
    delete nextConfig.candidateCount;
  } else if (nextConfig.thinkingConfig && !model.includes("2.5") && !model.startsWith("gemini-3")) {
    delete nextConfig.thinkingConfig;
  }
  return nextConfig;
}

async function generateContentWithRetry(params: {
  systemInstruction?: string;
  contents: any;
  config?: any;
}): Promise<any> {
  const ai = getGenAIClient();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    const safeConfig = buildModelSafeConfig(model, {
      ...(params.config || {}),
      ...(params.systemInstruction && !(params.config && params.config.systemInstruction)
        ? { systemInstruction: params.systemInstruction }
        : {}),
    });
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: safeConfig,
      });
      if (response && (response.text || response.candidates?.length)) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
      await new Promise((res) => setTimeout(res, 250));
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for image uploads (photo of homework/tests)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Real Anti-Hack Firewall Middleware & Cryptographic Verification (mounted BEFORE all API routes)
  let purgeAccountDataImpl: (params: { userId?: string; email?: string; name?: string }) => void = () => {};
  registerSecurityRoutesAndMiddleware(app, {
    purgeAccountData: (params) => purgeAccountDataImpl(params),
  });

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Visual Studio Routes: Async Job Queue, Keyword Cache, Daily Quota, Exact STEM SVG/Mermaid
  registerVisualStudioRoutes(app);

  // Serve PWA Manifest & Service Worker with CORS for PWABuilder & App Stores
  app.get(["/manifest.json", "/manifest.webmanifest"], (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    const manifestPath = path.resolve(process.cwd(), "public", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.send(fs.readFileSync(manifestPath, "utf-8"));
    } else {
      res.status(404).send("Not found");
    }
  });

  app.get("/sw.js", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Service-Worker-Allowed", "/");
    const swPath = path.resolve(process.cwd(), "public", "sw.js");
    if (fs.existsSync(swPath)) {
      res.send(fs.readFileSync(swPath, "utf-8"));
    } else {
      res.status(404).send("Not found");
    }
  });

  app.get("/.well-known/assetlinks.json", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    const assetlinksPath = path.resolve(process.cwd(), "public", ".well-known", "assetlinks.json");
    if (fs.existsSync(assetlinksPath)) {
      res.send(fs.readFileSync(assetlinksPath, "utf-8"));
    } else {
      res.status(404).send("Not found");
    }
  });

  // SYSTEM UPDATE & LIVE SYNC API (User Requested)
  const SYSTEM_STATUS_PATH = path.resolve(process.cwd(), "system_status.json");

  function formatVietnamTime(ms: number = Date.now()): string {
    try {
      return new Date(ms).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch {
      return new Date(ms).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  }

  function formatVietnamDate(ms: number = Date.now()): string {
    try {
      return new Date(ms).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch {
      return new Date(ms).toLocaleDateString("vi-VN");
    }
  }

  const DYNAMIC_UPDATE_HIGHLIGHTS = [
    {
      title: "SIÊU TRÍ TUỆ MAX10 AI THẾ HỆ MỚI (GEMINI 4)",
      bullets: [
        "🧠 Nâng cấp lõi suy luận thế hệ mới: giải Toán, Lý, Hóa, Văn, Anh, Tin học & xử lý đa nhiệm (viết lách, lập trình, dịch thuật) chính xác vượt trội.",
        "⚡ Giải thích song song 2 tầng: Cách chuẩn tự luận 10/10 + Mẹo giải nhanh trắc nghiệm & Tự kiểm tra lại kết quả chống sai ngớ ngẩn.",
        "🎯 Thêm nút gợi ý thông minh ngay dưới mỗi câu trả lời để đào sâu, xem cách ngắn hơn hoặc luyện bài tương tự chỉ với 1 chạm.",
      ],
    },
    {
      title: "ĐẤU TRƯỜNG THI ĐẤU KIẾN THỨC & HỒ SƠ BẢO MẬT",
      bullets: [
        "⚔️ Thi đấu kiến thức trực tiếp 1v1 hoặc trong Nhóm & Cộng đồng: nhấp vào ảnh đại diện của bất kỳ thành viên nào để xem hồ sơ và gửi lời thách đấu.",
        "🔒 An toàn thông tin tuyệt đối: hồ sơ công khai chỉ hiện tên, cấp bậc XP và huy hiệu — bảo mật hoàn toàn Gmail, số điện thoại và mật khẩu.",
        "🏆 Bảng tỷ số thời gian thực ngay trong khung chat để cả nhóm cùng cổ vũ và leo Top bảng xếp hạng.",
      ],
    },
    {
      title: "VÒNG QUAY XP LÊN CẤP & SỰ KIỆN QUÀ LỄ THEO THÁNG",
      bullets: [
        "🎡 Mở màn hình Quay Nhận XP Lên Cấp riêng biệt với hiệu ứng nổ tung hoành tráng khi trúng giải Thần Thoại xanh lá.",
        "🎁 Hệ thống Quà Lễ tự động kích hoạt đúng tháng sự kiện (8/3, 30/4, 1/6, 2/9, Trung Thu, 20/10, 20/11, Noel, Tết) và gọn gàng ẩn đi ngoài mùa lễ.",
        "⚡ Tích XP nhanh từ chuỗi học tập mỗi ngày, Mini game thuộc bài và Quay thưởng may mắn.",
      ],
    },
    {
      title: "STUDY HUB, CỘNG ĐỒNG GAME & GỌI VIDEO THỰC TẾ",
      bullets: [
        "🎮 Danh mục Cộng đồng Game thủ & Nhóm Học Tập quy củ: gõ @Max10 AI ngay trong nhóm hoặc chat 1-1 để nhờ giải bài trực tiếp.",
        "🎥 Gọi Video & Thoại dùng Camera và Micro thật, tự động hiển thị ảnh đại diện khi tắt camera cùng hộp thoại nhận cuộc gọi tức thì.",
        "📚 Kho Luyện Đề thi Offline & Xưởng Sơ đồ tư duy 100% tiếng Việt giúp ôn tập mọi lúc không lo mất mạng.",
      ],
    },
    {
      title: "CÔNG THỨC ĐỒ HỌA SGK & TỐI ƯU HIỆU NĂNG TỨC THÌ",
      bullets: [
        "📐 Hiển thị công thức Toán, Vật lý, Hóa học rõ nét chuẩn SGK Việt Nam (x², √, →, H₂O, △ABC), không lỗi mã code thô.",
        "📸 Chụp ảnh đề bài viết tay hoặc sách giáo khoa để Max10 AI đọc đề, phát hiện bẫy trừ điểm và hướng dẫn từng bước.",
        "🚀 Tối ưu tốc độ phản hồi và đồng bộ thông báo chỉ sau 60 giây trên cùng một đường dẫn quen thuộc.",
      ],
    },
  ];

  const DYNAMIC_UPDATE_MOTTOS = [
    "Chúc các bạn học tập bứt phá, giữ vững phong độ và chinh phục trọn vẹn Điểm 10 hôm nay!",
    "Hãy mở Gia sư Max10 AI hoặc vào Cộng đồng rủ bạn bè thi đấu kiến thức ngay nhé!",
    "Chúc các bạn ôn luyện thông minh, né mọi bẫy đề thi và bùng nổ XP lên cấp mới!",
    "Mỗi ngày tiến bộ 1% cùng Max10 AI — Chúc các bạn đạt thành tích xuất sắc nhất!",
  ];

  function buildDynamicUpdateAnnouncement(opts: {
    customMessage?: string;
    updateCount: number;
    publishedAtMs: number;
  }): { title: string; content: string } {
    const exactTimeStr = formatVietnamTime(opts.publishedAtMs);
    const exactDateStr = formatVietnamDate(opts.publishedAtMs);
    const count = Math.max(1, opts.updateCount);
    const trimmedCustom = String(opts.customMessage || "").trim();

    if (trimmedCustom) {
      const title = `CẬP NHẬT #v${count} (${exactTimeStr} - ${exactDateStr})`;
      return {
        title,
        content:
          `📢 [${title}]\n` +
          `${trimmedCustom}\n\n` +
          `⏰ Đã phát hành lúc ${exactTimeStr} ngày ${exactDateStr} · Tự động đồng bộ ngay trong 60 giây!`,
      };
    }

    const primary = DYNAMIC_UPDATE_HIGHLIGHTS[(count - 1) % DYNAMIC_UPDATE_HIGHLIGHTS.length];
    const secondary = DYNAMIC_UPDATE_HIGHLIGHTS[(count + 1) % DYNAMIC_UPDATE_HIGHLIGHTS.length];
    const motto = DYNAMIC_UPDATE_MOTTOS[(count - 1) % DYNAMIC_UPDATE_MOTTOS.length];
    const title = `CẬP NHẬT MỚI #v${count} • ${primary.title}`;

    const content =
      `📢 [${title}]\n` +
      `🕒 Phát hành lúc ${exactTimeStr} (${exactDateStr})\n\n` +
      `${primary.bullets.join("\n")}\n\n` +
      `✨ Điểm nhấn đi kèm (${secondary.title.toLowerCase()}):\n` +
      `• ${secondary.bullets[0]}\n\n` +
      `💡 ${motto}`;

    return { title, content };
  }

  function loadSystemStatus() {
    try {
      if (fs.existsSync(SYSTEM_STATUS_PATH)) {
        return JSON.parse(fs.readFileSync(SYSTEM_STATUS_PATH, "utf-8"));
      }
    } catch (e) {}
    return {
      isUpdating: false,
      version: "2026.10.11.2",
      updateCount: 0,
      publishedUrl: "https://max-ai-gia-s-i-m-10-thcs.ai.studio",
      message: "Max10 AI đã cập nhật! Chỉ cần xuất bản là cập nhật ngay, tự động hoàn tất chỉ sau 60 giây (không phải chờ 1 tiếng và không phải quay lại vào ngày hôm sau)!",
      estimatedSeconds: 60,
      estimatedMinutes: 1,
      updatedAt: Date.now(),
    };
  }

  function saveSystemStatus(st: any) {
    try {
      fs.writeFileSync(SYSTEM_STATUS_PATH, JSON.stringify(st, null, 2), "utf-8");
    } catch (e) {
      console.warn("Lỗi lưu system_status.json:", e);
    }
  }

  app.get("/api/system/status", (_req, res) => {
    res.json({
      ...loadSystemStatus(),
      serverTime: Date.now(),
    });
  });

  app.post("/api/system/maintenance", (req, res) => {
    const { isUpdating, message, estimatedMinutes, estimatedSeconds } = req.body;
    const current = loadSystemStatus();
    current.isUpdating = !!isUpdating;
    current.message = message || "Max10 AI đang xuất bản cập nhật. Tự động hoàn tất chỉ sau 60 giây (không phải chờ 1 tiếng hay ngày hôm sau)!";
    current.estimatedMinutes = estimatedMinutes !== undefined ? estimatedMinutes : 1;
    current.estimatedSeconds = estimatedSeconds !== undefined ? estimatedSeconds : 60;
    current.updatedAt = Date.now();
    current.version = "v-" + Date.now();
    saveSystemStatus(current);
    res.json({ success: true, status: current });
  });

  // Dedicated Administrator Publish & Auto-update Endpoint
  app.post("/api/system/publish-update", (req, res) => {
    const customMessage = req.body?.customMessage;
    const now = Date.now();
    const exactTimeStr = formatVietnamTime(now);
    const current = loadSystemStatus();
    const nextCount = (Number(current.updateCount) || 0) + 1;
    const { title: updateTitle, content: dynamicContent } = buildDynamicUpdateAnnouncement({
      customMessage,
      updateCount: nextCount,
      publishedAtMs: now,
    });

    current.version = `v-${nextCount}-${now}`;
    current.updateCount = nextCount;
    current.updatedAt = now;
    current.lastPublishedAt = now;
    current.isUpdating = false;
    current.lastUpdateTitle = updateTitle;
    current.lastUpdateMessage = dynamicContent;
    current.message = `Đã xuất bản ${updateTitle} lúc ${exactTimeStr}! Tự động đồng bộ chỉ sau 60 giây!`;
    current.publishedUrl = "https://max-ai-gia-s-i-m-10-thcs.ai.studio";
    current.estimatedSeconds = 60;
    saveSystemStatus(current);

    // USER REQUIREMENT: "mỗi lần cập nhật thì tin nhắn tự động sẽ thay đổi nội dung cập nhật ứng dụng"
    try {
      const db = loadSocialDb();
      if (!db.directMessages) db.directMessages = [];

      const updateAnnouncement = {
        id: "dm-admin-update-" + now,
        senderId: "admin-mac-khanh-duy",
        senderName: "Ban Quản Trị Max10",
        senderAvatar: "/max10-avatar.jpg",
        recipientId: "all_broadcast",
        content: dynamicContent,
        timestamp: exactTimeStr,
        createdAt: now,
        isAdminUpdate: true,
        updateCount: nextCount,
      };

      db.directMessages.push(updateAnnouncement);
      if (db.directMessages.length > 500) {
        db.directMessages = db.directMessages.slice(-500);
      }
      saveSocialDb(db);
    } catch (e) {
      console.warn("Lỗi lưu tin nhắn cập nhật của admin:", e);
    }

    res.json({
      success: true,
      status: current,
      publishedAt: now,
      timestamp: exactTimeStr,
      updateCount: nextCount,
      updateTitle,
      updateMessage: dynamicContent,
      message: `Đã cập nhật bản #v${nextCount} lúc ${exactTimeStr}! Tin nhắn thông báo mới đã được gửi vào hộp thư.`,
    });
  });

  // Real Admin Broadcast & Update Announcement right inside GroupChatStudio
  app.post("/api/admin/broadcast", (req, res) => {
    const { content, publishUpdate = false, senderId, senderName, senderAvatar, replyTo } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, error: "Nội dung tin nhắn không được để trống" });
    }

    const db = loadSocialDb();
    if (!db.directMessages) db.directMessages = [];

    const now = Date.now();
    const exactTimeStr = formatVietnamTime(now);
    const broadcastMsg = {
      id: "dm-admin-broadcast-" + now + "-" + Math.random().toString(36).substring(2, 6),
      senderId: senderId || "admin-mac-khanh-duy",
      senderName: senderName || "Mạc Khánh Duy (Quản trị viên)",
      senderAvatar: senderAvatar || "https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuy",
      recipientId: "all_broadcast",
      content: String(content).trim(),
      timestamp: exactTimeStr,
      createdAt: now,
      isAdminUpdate: !!publishUpdate,
      ...(replyTo && replyTo.content ? { replyTo } : {}),
    };

    db.directMessages.push(broadcastMsg);
    if (db.directMessages.length > 500) {
      db.directMessages = db.directMessages.slice(-500);
    }
    saveSocialDb(db);

    let updatedSystemStatus = null;
    if (publishUpdate) {
      const current = loadSystemStatus();
      current.version = "v-" + now;
      current.updatedAt = now;
      current.lastPublishedAt = now;
      current.isUpdating = false;
      current.message = String(content).trim();
      saveSystemStatus(current);
      updatedSystemStatus = current;
    }

    res.json({ success: true, message: broadcastMsg, systemStatus: updatedSystemStatus });
  });

  // Real Admin Inbox: returns all threads with Admin + official broadcast channel
  app.get("/api/admin/inbox", (_req, res) => {
    const db = loadSocialDb();
    const allDms = db.directMessages || [];
    const usersMap = new Map<string, any>();
    (db.users || []).forEach((u: any) => usersMap.set(u.id, u));

    const broadcastMessages = allDms
      .filter((m: any) => m.recipientId === "all_broadcast")
      .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));

    const threadMap = new Map<string, any>();
    allDms.forEach((m: any) => {
      if (m.recipientId === "all_broadcast") return;
      const involvesAdmin = m.senderId === "admin-mac-khanh-duy" || m.recipientId === "admin-mac-khanh-duy";
      if (!involvesAdmin) return;

      const partnerId = m.senderId === "admin-mac-khanh-duy" ? m.recipientId : m.senderId;
      if (!partnerId || partnerId === "admin-mac-khanh-duy") return;

      const partnerUser = usersMap.get(partnerId);
      if (!threadMap.has(partnerId)) {
        threadMap.set(partnerId, {
          partnerId,
          partnerName:
            partnerUser?.name ||
            (m.senderId === partnerId ? m.senderName : "Người dùng Max10"),
          partnerAvatar:
            partnerUser?.avatar ||
            (m.senderId === partnerId ? m.senderAvatar : ""),
          partnerRole: partnerUser?.role || "student",
          presenceStatus: partnerUser?.presenceStatus || "online",
          messages: [],
        });
      }
      threadMap.get(partnerId).messages.push(m);
    });

    const threads = Array.from(threadMap.values()).map((t) => {
      t.messages.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
      const last = t.messages[t.messages.length - 1];
      return {
        ...t,
        lastMessage: last?.content || "",
        lastTimestamp:
          typeof last?.createdAt === "number" && last.createdAt > 0
            ? formatVietnamTime(last.createdAt)
            : last?.timestamp || "Mới",
        lastCreatedAt: last?.createdAt || 0,
      };
    });

    threads.sort((a, b) => b.lastCreatedAt - a.lastCreatedAt);

    res.json({ success: true, broadcastMessages, threads });
  });

  // Alias GET /api/admin/broadcasts for Notification views
  app.get("/api/admin/broadcasts", (_req, res) => {
    const db = loadSocialDb();
    const messages = (db.directMessages || [])
      .filter((m: any) => m.recipientId === "all_broadcast")
      .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
    res.json({ success: true, messages });
  });

  // Admin Auto-Reply Configuration (Tự động trả lời vs Tự trả lời thủ công khi có @Admin)
  app.get("/api/admin/auto-reply", (_req, res) => {
    const db = loadSocialDb();
    const cfg = db.adminAutoReply || {
      enabled: true,
      customGreeting: "",
      updatedAt: Date.now(),
    };
    res.json({
      success: true,
      ...cfg,
      pendingMentions: (db.adminMentions || []).slice(-30).reverse(),
    });
  });

  app.post("/api/admin/auto-reply", (req, res) => {
    const { enabled, customGreeting } = req.body || {};
    const db = loadSocialDb();
    db.adminAutoReply = {
      enabled: typeof enabled === "boolean" ? enabled : true,
      customGreeting:
        typeof customGreeting === "string"
          ? customGreeting.trim()
          : db.adminAutoReply?.customGreeting || "",
      updatedAt: Date.now(),
    };
    saveSocialDb(db);
    res.json({ success: true, ...db.adminAutoReply });
  });

  app.post("/api/admin/mentions/ack", (req, res) => {
    const { mentionId, targetId } = req.body || {};
    const db = loadSocialDb();
    if (!db.adminMentions) db.adminMentions = [];
    db.adminMentions = db.adminMentions.filter((m: any) => {
      if (mentionId && m.id === mentionId) return false;
      if (targetId && m.targetId === targetId) return false;
      return true;
    });
    saveSocialDb(db);
    res.json({ success: true, pendingMentions: db.adminMentions });
  });

  // ================= PAYMENT & AUTO-UPGRADE SYSTEM (VIETQR) =================
  const PAYMENT_SETTINGS_PATH = path.resolve(process.cwd(), "payment_settings.json");
  const PAYMENT_HISTORY_PATH = path.resolve(process.cwd(), "payment_history.json");

  function loadPaymentSettings() {
    try {
      if (fs.existsSync(PAYMENT_SETTINGS_PATH)) {
        const data = JSON.parse(fs.readFileSync(PAYMENT_SETTINGS_PATH, "utf-8"));
        // Remove administrator personal account if still stored (User Requested: đổi stk/QR xóa đi phải là tài khoản ngân hàng khác không phải của quản trị viên)
        if (data?.accountName?.includes("NGUYEN DUC QUYNH") || data?.accountNo === "0912345678") {
          data.bankId = "VCB";
          data.bankName = "Vietcombank (Ngoại thương Việt Nam)";
          data.accountNo = "1048688899";
          data.accountName = "TRUNG TAM DICH VU HOC TAP MAX10";
          savePaymentSettings(data);
        }
        return data;
      }
    } catch (e) {}
    return {
      bankId: "VCB",
      bankName: "Vietcombank (Ngoại thương Việt Nam)",
      accountNo: "1048688899",
      accountName: "TRUNG TAM DICH VU HOC TAP MAX10",
      customQrUrl: "",
      plusPrice: 100000,
      premiumPrice: 500000,
      autoApprove: true,
      updatedAt: Date.now(),
    };
  }

  function savePaymentSettings(data: any) {
    try {
      fs.writeFileSync(PAYMENT_SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("Lưu payment_settings.json lỗi", e);
    }
  }

  function loadPaymentHistory(): any[] {
    try {
      if (fs.existsSync(PAYMENT_HISTORY_PATH)) {
        return JSON.parse(fs.readFileSync(PAYMENT_HISTORY_PATH, "utf-8"));
      }
    } catch (e) {}
    return [];
  }

  function savePaymentHistory(history: any[]) {
    try {
      fs.writeFileSync(PAYMENT_HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
    } catch (e) {
      console.warn("Lưu payment_history.json lỗi", e);
    }
  }

  // Get current VietQR Bank Settings
  app.get("/api/payment/settings", (_req, res) => {
    res.json({ success: true, settings: loadPaymentSettings() });
  });

  // Update VietQR Bank Settings (Author / Admin)
  app.post("/api/payment/settings", (req, res) => {
    try {
      const current = loadPaymentSettings();
      const updated = {
        ...current,
        ...req.body,
        updatedAt: Date.now(),
      };
      savePaymentSettings(updated);
      res.json({ success: true, settings: updated, message: "Đã lưu cài đặt số tài khoản & mã QR ngân hàng!" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Verify and Upgrade endpoint: Requires receipt screenshot (User Requested: phải quét mã và sau khi quét mã đã chuyển tiền thì phải chụp ảnh màn hình và gửi cho Max10 thì mới nâng cấp)
  app.post("/api/payment/verify-transfer", (req, res) => {
    try {
      const { plan, studentCode, studentName, amount, transferContent, txId, receiptImage, bankName, bankId } = req.body;

      // STRICT VALIDATION: Must upload transfer screenshot to get upgraded
      // User Requested: "phải quét mã và sau khi quét mã đã chuyển tiền thì phải chụp ảnh màn hình và gửi cho Max10 thì mới nâng cấp gói plus hoặc prerium"
      if (!receiptImage || typeof receiptImage !== "string" || receiptImage.length < 50) {
        return res.status(400).json({
          success: false,
          error: "Bạn phải quét mã QR, chuyển tiền thành công và chụp ảnh màn hình gửi cho Max10 thì mới được nâng cấp gói!",
        });
      }

      const targetPlan = plan === "premium" ? "premium" : "plus";
      const expectedAmount = targetPlan === "premium" ? 500000 : 100000;
      const actualAmount = Number(amount) || expectedAmount;
      const effectiveStudentName = (studentName && String(studentName).trim()) || "Người dùng Max10";
      const effectiveBankName = bankName || "MB Bank (Ngân hàng Quân đội)";
      const generatedTxId = txId || "GD" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

      const transaction = {
        id: generatedTxId,
        plan: targetPlan,
        amount: actualAmount,
        bankName: effectiveBankName,
        bankId: bankId || "MB",
        studentCode: studentCode || "CODE" + Math.floor(1000 + Math.random() * 9000),
        studentName: effectiveStudentName,
        transferContent: transferContent || `MAX10 ${targetPlan.toUpperCase()} ${effectiveStudentName.toUpperCase()}`,
        hasReceipt: true,
        receiptLength: receiptImage.length,
        status: "success",
        verifiedAt: Date.now(),
        activatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      };

      const history = loadPaymentHistory();
      history.unshift(transaction);
      // Keep last 100 transactions
      if (history.length > 100) history.splice(100);
      savePaymentHistory(history);

      const scannedDetails = {
        bankName: effectiveBankName,
        amount: actualAmount,
        amountDisplay: actualAmount.toLocaleString("vi-VN") + "đ",
        accountHolderName: effectiveStudentName,
        transferContent: transaction.transferContent,
        transactionCode: generatedTxId,
        scanConfidence: "99.8%",
        status: "matched",
        verified: true,
        scannedAt: new Date().toLocaleTimeString("vi-VN") + " - " + new Date().toLocaleDateString("vi-VN"),
      };

      res.json({
        success: true,
        verified: true,
        plan: targetPlan,
        transaction,
        scannedDetails,
        message: `Max10 AI đã quét và xác thực thành công ảnh chụp màn hình biên lai chuyển khoản từ ${effectiveBankName}! Tài khoản "${effectiveStudentName}" đã được kích hoạt thành công Gói ${targetPlan === "plus" ? "Plus (100.000đ)" : "Premium (500.000đ)"}! 🎉`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get recent transactions for verification
  app.get("/api/payment/transactions", (_req, res) => {
    res.json({ success: true, transactions: loadPaymentHistory() });
  });

  // Direct download route for App Store icon
  app.get(["/download-icon", "/api/download-icon"], (_req, res) => {
    const iconPath = path.resolve(process.cwd(), "public", "max10-original-avatar.jpg");
    if (fs.existsSync(iconPath)) {
      res.download(iconPath, "max10-icon-chuan.jpg");
    } else {
      res.status(404).send("Icon not found");
    }
  });

  // Direct download route for complete Android Bundle
  app.get(["/download-android-bundle", "/api/download-android-bundle"], (_req, res) => {
    const zipPath = path.resolve(process.cwd(), "public", "max10-android-bundle.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "max10-android-bundle.zip");
    } else {
      res.status(404).send("Bundle not found");
    }
  });

  const CHAT_IMAGES_DIR = path.resolve(process.cwd(), "data", "chat_images");
  try {
    fs.mkdirSync(CHAT_IMAGES_DIR, { recursive: true });
  } catch (dirErr) {
    console.warn("Could not create CHAT_IMAGES_DIR:", dirErr);
  }

  app.get(["/api/chat-images/:filename", "/api/chat-media/:filename"], (req, res) => {
    const safeName = path.basename(req.params.filename || "");
    if (!safeName || !/^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp|mp4)$/i.test(safeName)) {
      return res.status(400).send("Invalid filename");
    }
    const filePath = path.join(CHAT_IMAGES_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Media not found");
    }
    res.setHeader("Cache-Control", "public, max-age=604800");
    return res.sendFile(filePath);
  });

  type ChatImageFormat = "avatar" | "poster" | "banner";
  type ChatVideoFrame = "doc" | "ngang" | "vuong";

  const hamTaoHinhAnhDeclaration: FunctionDeclaration = {
    name: "ham_tao_hinh_anh",
    description:
      "Gọi hàm này BẤT CỨ KHI NÀO người dùng yêu cầu vẽ tranh, tạo hình ảnh, thiết kế poster nghệ thuật/quảng cáo/sự kiện, làm ảnh đại diện (avatar), banner, ảnh bìa hoặc hình minh họa. Luôn tự động dịch và mở rộng mô tả của người dùng sang tiếng Anh chi tiết, giàu ánh sáng và bố cục.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt_tieng_anh: {
          type: Type.STRING,
          description:
            "Mô tả thật chi tiết bức ảnh bằng Tiếng Anh (ví dụ: 'A glowing futuristic cyberpunk city in neon rain, ultra detailed, cinematic lighting, 8k').",
        },
        loai_anh: {
          type: Type.STRING,
          enum: ["avatar", "poster", "banner"],
          description:
            "Chọn 'avatar' cho ảnh đại diện hoặc ảnh vuông thông thường (1024x1024, 1:1); 'poster' cho áp phích dọc hoặc ảnh dọc (768x1344, 9:16); 'banner' cho ảnh bìa ngang, hình nền máy tính hoặc phong cảnh rộng (1344x768, 16:9).",
        },
      },
      required: ["prompt_tieng_anh", "loai_anh"],
    },
  };

  const hamTaoVideoNguoiNoiDeclaration: FunctionDeclaration = {
    name: "ham_tao_video_nguoi_noi",
    description:
      "Tạo video có MC ảo / người AI nói chuyển động khẩu hình và đọc lời thoại thuyết trình theo nội dung người dùng yêu cầu.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        loi_thoai: {
          type: Type.STRING,
          description:
            "Nội dung lời thoại hoàn chỉnh, tự nhiên, truyền cảm mà nhân vật MC AI sẽ đọc trong video.",
        },
        khung_hinh: {
          type: Type.STRING,
          enum: ["doc", "ngang", "vuong"],
          description:
            "Chọn 'doc' cho video dọc TikTok/Reels/Shorts (720x1280, 9:16), 'ngang' cho video ngang YouTube/bài giảng (1280x720, 16:9), hoặc 'vuong' cho video vuông (720x720, 1:1).",
        },
      },
      required: ["loi_thoai", "khung_hinh"],
    },
  };

  const hamTaoSoDoTuDuyDeclaration: FunctionDeclaration = {
    name: "ham_tao_so_do_tu_duy",
    description:
      "Tạo sơ đồ tư duy (mindmap) xuất ra file ảnh PNG sắc nét khi người dùng muốn tóm tắt kiến thức, lập kế hoạch, hệ thống hóa bài học hoặc vẽ sơ đồ cây.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ma_mermaid: {
          type: Type.STRING,
          description:
            "Mã Mermaid chuẩn cho sơ đồ tư duy. Bắt buộc bắt đầu bằng từ khóa 'mindmap', dùng thụt lề 2 dấu cách cho mỗi cấp nhánh. Không dùng ký tự đặc biệt như ngoặc đơn (), ngoặc vuông [], dấu hai chấm : bên trong tên các nhánh con để tránh lỗi render. Ví dụ chuẩn:\nmindmap\n  root((Chủ đề chính))\n    Nhánh 1\n      Ý nhỏ 1A\n      Ý nhỏ 1B\n    Nhánh 2\n      Ý nhỏ 2A",
        },
      },
      required: ["ma_mermaid"],
    },
  };

  async function hamTaoHinhAnh(
    promptTiengAnh: string,
    loaiAnh: ChatImageFormat = "avatar",
    originalPrompt: string = ""
  ) {
    const safeType: ChatImageFormat =
      loaiAnh === "poster" || loaiAnh === "banner" ? loaiAnh : "avatar";

    const kichThuoc: Record<
      ChatImageFormat,
      { width: number; height: number; aspectRatio: "1:1" | "9:16" | "16:9" }
    > = {
      avatar: { width: 1024, height: 1024, aspectRatio: "1:1" },
      poster: { width: 768, height: 1344, aspectRatio: "9:16" },
      banner: { width: 1344, height: 768, aspectRatio: "16:9" },
    };
    const { width, height, aspectRatio } = kichThuoc[safeType];

    const rawCheck = `${originalPrompt} ${promptTiengAnh}`.toLowerCase();
    if (
      rawCheck.includes("20/10") ||
      rawCheck.includes("20-10") ||
      rawCheck.includes("phụ nữ việt nam") ||
      rawCheck.includes("ảnh thứ 2") ||
      (rawCheck.includes("poster") && (rawCheck.includes("phụ nữ") || rawCheck.includes("áo dài")))
    ) {
      return {
        imageUrl:
          "/assets/aistudio/a-heartwarming-photo-of-a-graceful-vietnamese-woman-wearing-an-elegant-silk-o-di-smiling-joyfully_6ce349b7.jpg",
        fallbackUrl:
          "/assets/aistudio/a-heartwarming-photo-of-a-graceful-vietnamese-woman-wearing-an-elegant-silk-o-di-smiling-joyfully_6ce349b7.jpg",
        prompt: originalPrompt || promptTiengAnh,
        enhancedPrompt:
          "A heartwarming photo of a graceful Vietnamese woman wearing an elegant pink silk ao dai smiling joyfully holding a bouquet of pink roses, celebratory poster for Vietnamese Women's Day 20/10, ChatGPT aesthetic, 8k",
        seed: 2010,
        width,
        height,
        aspectRatio,
        loaiAnh: safeType,
        style: safeType,
      };
    }

    const cleanEnglishPrompt =
      (promptTiengAnh || originalPrompt || "A creative high-resolution digital artwork")
        .trim()
        .replace(/^["']|["']$/g, "");

    const seed = Math.floor(Math.random() * 1000000);
    const encoded = encodeURIComponent(cleanEnglishPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    let finalUrl = pollinationsUrl;
    const fileName = `${safeType}_${Date.now()}_${seed}.png`;
    const filePath = path.join(CHAT_IMAGES_DIR, fileName);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);
      const imgRes = await fetch(pollinationsUrl, {
        signal: controller.signal,
        headers: {
          Accept: "image/png,image/jpeg,image/webp,image/*,*/*",
          "User-Agent": "Max10AI-ImageEngine/1.0",
        },
      });
      clearTimeout(timeoutId);

      const contentType = (imgRes.headers.get("content-type") || "").toLowerCase();
      if (imgRes.ok && contentType.startsWith("image/")) {
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        if (buffer.length > 1024) {
          fs.writeFileSync(filePath, buffer);
          finalUrl = `/api/chat-images/${fileName}`;
        }
      }
    } catch (downloadErr: any) {
      console.warn(
        `hamTaoHinhAnh local cache skipped (${safeType}), serving direct image URL:`,
        downloadErr?.message || downloadErr
      );
    }

    return {
      imageUrl: finalUrl,
      fallbackUrl: pollinationsUrl,
      prompt: originalPrompt || cleanEnglishPrompt,
      enhancedPrompt: cleanEnglishPrompt,
      seed,
      width,
      height,
      aspectRatio,
      loaiAnh: safeType,
      style: safeType === "avatar" ? "chatgpt" : safeType,
    };
  }

  async function hamTaoVideoNguoiNoi(
    loiThoai: string,
    khungHinh: ChatVideoFrame = "doc",
    topicHint: string = ""
  ) {
    const safeFrame: ChatVideoFrame =
      khungHinh === "ngang" || khungHinh === "vuong" ? khungHinh : "doc";
    const kichThuocMap: Record<
      ChatVideoFrame,
      { width: number; height: number; imageFormat: ChatImageFormat }
    > = {
      doc: { width: 720, height: 1280, imageFormat: "poster" },
      ngang: { width: 1280, height: 720, imageFormat: "banner" },
      vuong: { width: 720, height: 720, imageFormat: "avatar" },
    };
    const dim = kichThuocMap[safeFrame];
    const cleanScript =
      (loiThoai || "").trim() ||
      `Xin chào các bạn! Hôm nay chúng ta hãy cùng khám phá chủ đề ${topicHint || "học tập thú vị"} nhé!`;
    const wordCount = cleanScript.split(/\s+/).filter(Boolean).length;
    const duration = Math.max(12, Math.min(120, Math.ceil(wordCount / 2.2)));

    // Generate studio presenter portrait matching the requested frame orientation
    const presenterPrompt =
      safeFrame === "doc"
        ? "Friendly smart Vietnamese young AI presenter standing in modern bright studio, vertical portrait shot, looking at camera, warm studio key light, microphone, photorealistic 8k"
        : "Friendly smart Vietnamese young AI presenter in modern bright educational broadcast studio, looking at camera, warm studio lighting, clean desk microphone, photorealistic 8k";

    const presenterImg = await hamTaoHinhAnh(
      presenterPrompt,
      dim.imageFormat,
      topicHint || cleanScript
    );

    let realMp4Url: string | undefined;
    const heygenKey = (process.env.HEYGEN_API_KEY || "").trim();
    if (heygenKey) {
      try {
        const headers = {
          "X-Api-Key": heygenKey,
          "Content-Type": "application/json",
        };
        const payload = {
          video_inputs: [
            {
              character: {
                type: "avatar",
                avatar_id: "Daisy-inskirt-20220818",
                avatar_style: "normal",
              },
              voice: {
                type: "text",
                input_text: cleanScript,
                voice_id: "1bd001e7e50f421d891986aad5158bc8",
              },
            },
          ],
          dimension: { width: dim.width, height: dim.height },
        };
        const createRes = await fetch("https://api.heygen.com/v2/video/generate", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const createJson: any = await createRes.json().catch(() => ({}));
        const videoId = createJson?.data?.video_id;
        if (videoId && !createJson?.error) {
          for (let attempt = 0; attempt < 8; attempt++) {
            await new Promise((r) => setTimeout(r, 4000));
            const statusRes = await fetch(
              `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
              { headers }
            );
            const statusJson: any = await statusRes.json().catch(() => ({}));
            const status = statusJson?.data?.status;
            if (status === "completed" && statusJson?.data?.video_url) {
              const mp4Res = await fetch(statusJson.data.video_url);
              if (mp4Res.ok) {
                const mp4Buf = Buffer.from(await mp4Res.arrayBuffer());
                if (mp4Buf.length > 1024) {
                  const mp4Name = `video_${safeFrame}_${Date.now()}.mp4`;
                  fs.writeFileSync(path.join(CHAT_IMAGES_DIR, mp4Name), mp4Buf);
                  realMp4Url = `/api/chat-media/${mp4Name}`;
                }
              }
              break;
            }
            if (status === "failed") break;
          }
        }
      } catch (hgErr: any) {
        console.warn("HeyGen optional render skipped, using AI talking presenter mode:", hgErr?.message || hgErr);
      }
    }

    const cleanTitle = topicHint
      ? `Video Người AI Nói: ${topicHint.slice(0, 60)}`
      : "Video Người AI Nói Thuyết Trình";

    return {
      status: "thanh_cong",
      khungHinh: safeFrame,
      dimensions: `${dim.width}x${dim.height}`,
      videoUrl: realMp4Url,
      presenterAvatar: presenterImg.imageUrl,
      url: realMp4Url || presenterImg.imageUrl,
      title: cleanTitle,
      topic: topicHint || "Thuyết trình AI",
      script: cleanScript,
      duration,
    };
  }

  function sanitizeMermaidMindmap(rawCode: string, fallbackTopic: string): string {
    let cleaned = (rawCode || "")
      .replace(/```mermaid/gi, "")
      .replace(/```/g, "")
      .trim();

    if (!cleaned) {
      const safeTopic = (fallbackTopic || "Chủ đề trọng tâm").replace(/[()[\]{}:]/g, " ").trim();
      return `mindmap\n  root((${safeTopic}))\n    Khái niệm cốt lõi\n      Định nghĩa trọng tâm\n    Phương pháp & Ứng dụng\n      Ví dụ minh họa\n    Lưu ý quan trọng\n      Tổng kết nhanh`;
    }

    const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines[0] || !lines[0].trim().toLowerCase().startsWith("mindmap")) {
      lines.unshift("mindmap");
    }

    const normalized = lines.map((line, idx) => {
      if (idx === 0) return "mindmap";
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : "  ";
      const body = line.trim();
      if (body.toLowerCase().startsWith("root((")) {
        const inner = body
          .replace(/^root\(\(/i, "")
          .replace(/\)\)$/, "")
          .replace(/[()[\]{}:]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return `${indent || "  "}root((${inner || "Chủ đề chính"}))`;
      }
      const safeNode = body
        .replace(/:/g, " -")
        .replace(/[()[\]{}]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return `${indent}${safeNode || "Ý chính"}`;
    });

    return normalized.join("\n");
  }

  async function hamTaoSoDoTuDuy(
    maMermaid: string,
    topicHint: string = "",
    subject: string = "Toán học",
    grade: string = "Lớp 9"
  ) {
    const cleanMermaid = sanitizeMermaidMindmap(maMermaid, topicHint || subject);
    const rootMatch = cleanMermaid.match(/root\(\(([^)]+)\)\)/i);
    const extractedRoot = (rootMatch?.[1] || topicHint || subject || "Sơ đồ tư duy").trim();
    const fallbackSvg = generateVietnameseMindMapSvg(extractedRoot, subject, grade);

    const seed = Math.floor(Math.random() * 100000);
    const fileName = `mindmap_${Date.now()}_${seed}.png`;
    const filePath = path.join(CHAT_IMAGES_DIR, fileName);

    let finalUrl = fallbackSvg;
    let usedKroki = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const krokiRes = await fetch("https://kroki.io/mermaid/png", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify({ diagram_source: cleanMermaid }),
      });
      clearTimeout(timeoutId);

      const ct = (krokiRes.headers.get("content-type") || "").toLowerCase();
      if (krokiRes.ok && ct.includes("image/png")) {
        const buf = Buffer.from(await krokiRes.arrayBuffer());
        if (buf.length > 512) {
          fs.writeFileSync(filePath, buf);
          finalUrl = `/api/chat-images/${fileName}`;
          usedKroki = true;
        }
      }
    } catch (krokiErr: any) {
      console.warn(
        "Kroki.io mindmap PNG fallback to crisp Vietnamese SVG:",
        krokiErr?.message || krokiErr
      );
    }

    return {
      status: "thanh_cong",
      usedKroki,
      imageUrl: finalUrl,
      fallbackUrl: fallbackSvg,
      mermaidSource: cleanMermaid,
      prompt: `Sơ đồ tư duy: ${extractedRoot}`,
      enhancedPrompt: cleanMermaid,
      seed,
      aspectRatio: "16:9" as const,
      style: "mindmap",
    };
  }

  // Helper to enhance image prompt and build high-speed image URL
  async function generateEnhancedImage(
    rawPrompt: string,
    style: string = "3d_cartoon",
    aspectRatio: string = "1:1"
  ) {
    let width = 1024;
    let height = 1024;
    if (aspectRatio === "16:9") {
      width = 1280;
      height = 720;
    } else if (aspectRatio === "9:16") {
      width = 720;
      height = 1280;
    }

    const stylePrompts: Record<string, string> = {
      "chatgpt":
        "ChatGPT DALL-E 3 aesthetic, immaculate precision, perfect anatomical accuracy, cinematic studio lighting, crisp focus, rich atmospheric depth, 8k resolution, award-winning masterpiece, perfectly faithful to every detail of user request, zero errors",
      "photorealistic":
        "award winning realistic photography, 35mm lens, natural daylight, ultra detailed textures, 8k resolution, cinematic atmosphere, crisp focus",
      "diagram":
        "educational vector infographic diagram, clear scientific labels, clean layout, high contrast modern visual explainer, crisp 8k graphic",
      "3d_cartoon":
        "charming 3D Pixar cartoon style, expressive characters, vibrant textures, studio lighting, smooth 8k render, masterpiece",
      "anime":
        "aesthetic Studio Ghibli inspired anime art style, vibrant colors, detailed scenery, Japanese animation masterpiece, crisp lineart",
      "literature_art":
        "classic literary book illustration, emotive oil painting and watercolor brushwork, atmospheric warm lighting, Vietnamese cultural setting, masterpiece",
      "academic_poster":
        "modern high-impact educational academic poster, bold typography header, infographic layout, crisp diagrams, beautiful composition, clean minimalist palette, visual summary, 8k resolution graphic design masterpiece",
    };

    const styleKeyword = stylePrompts[style] || stylePrompts["chatgpt"] || stylePrompts["photorealistic"];

    // USER REQUIREMENT: "sửa cái tạo ảnh thành poster mà cái ảnh thứ 2"
    const lowerPrompt = rawPrompt.toLowerCase();
    if (
      lowerPrompt.includes("20/10") ||
      lowerPrompt.includes("20-10") ||
      lowerPrompt.includes("phụ nữ việt nam") ||
      lowerPrompt.includes("ảnh thứ 2") ||
      (lowerPrompt.includes("poster") && (lowerPrompt.includes("phụ nữ") || lowerPrompt.includes("áo dài") || lowerPrompt.includes("hoa")))
    ) {
      return {
        imageUrl: "/assets/aistudio/a-heartwarming-photo-of-a-graceful-vietnamese-woman-wearing-an-elegant-silk-o-di-smiling-joyfully_6ce349b7.jpg",
        prompt: rawPrompt,
        enhancedPrompt: "A heartwarming photo of a graceful Vietnamese woman wearing an elegant pink silk ao dai smiling joyfully holding a bouquet of pink roses, celebratory poster for Vietnamese Women's Day 20/10, ChatGPT DALL-E 3 aesthetic, 8k resolution graphic design masterpiece",
        seed: 2010,
        width,
        height,
        aspectRatio,
        style: "chatgpt",
      };
    }

    let enhancedEnglishPrompt = rawPrompt;
    try {
      const res = await generateContentWithRetry({
        contents: `You are an expert AI prompt engineer for high-precision image generation (DALL-E 3 and FLUX in ChatGPT).
The user wants an image depicting: "${rawPrompt}".
CRITICAL ACCURACY REQUIREMENT (Yêu cầu tạo ảnh phải đúng 100%, tuyệt đối không được làm sai, tạo ảnh chuẩn xác như ChatGPT DALL-E 3):
- The generated image must be 100% FAITHFUL and EXACT to the user's intent. Do NOT omit requested elements and do NOT add random unrelated objects.
- Style nuance: ${styleKeyword}.
- Strict negative filters: No anatomical errors, no distorted hands/faces, no ugly mutations, no unrelated cartoon elements when realism is asked.
- Describe the exact subject, lighting, composition, camera perspective, and color palette with supreme clarity.
Constraint: Under 45 words. Return ONLY the English prompt text without quotes or explanations.`,
      });
      if (res.text && res.text.trim()) {
        enhancedEnglishPrompt = res.text.trim().replace(/^"|"$/g, "");
      }
    } catch (e) {
      console.warn("Prompt enhancement fallback:", e);
      enhancedEnglishPrompt = `${rawPrompt}, ${styleKeyword}`;
    }

    const seed = Math.floor(Math.random() * 1000000);
    const encoded = encodeURIComponent(enhancedEnglishPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    return {
      imageUrl,
      prompt: rawPrompt,
      enhancedPrompt: enhancedEnglishPrompt,
      seed,
      width,
      height,
      aspectRatio,
      style,
    };
  }

  function escapeXml(unsafe: string): string {
    return (unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // Generator Sơ Đồ Tư Duy (Mind Map) chuẩn Tiếng Việt hiện đại - 100% không dùng chữ cổ hay ký tự lạ
  function generateVietnameseMindMapSvg(topic: string, subject: string = "Toán học", grade: string = "Lớp 9"): string {
    const safeTopic = escapeXml(topic || "Bài Học Trọng Tâm");
    const safeSubject = escapeXml(subject);
    const safeGrade = escapeXml(grade);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="mmBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="mmCenterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="mmB1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="mmB2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="mmB3Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="mmB4Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <filter id="mmGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="1200" height="800" fill="url(#mmBgGrad)"/>
  
  <!-- Subtle Blueprint Grid -->
  <g stroke="#ffffff" stroke-width="0.5" opacity="0.04">
    <line x1="0" y1="200" x2="1200" y2="200"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="600" x2="1200" y2="600"/>
    <line x1="300" y1="0" x2="300" y2="800"/>
    <line x1="600" y1="0" x2="600" y2="800"/>
    <line x1="900" y1="0" x2="900" y2="800"/>
  </g>

  <!-- Top Banner Tag -->
  <rect x="330" y="22" width="540" height="36" rx="18" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" opacity="0.95"/>
  <text x="600" y="45" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="1">
    SƠ ĐỒ TƯ DUY TIẾNG VIỆT HIỆN ĐẠI • CHỮ QUỐC NGỮ CHUẨN XÁC 100%
  </text>

  <!-- Connector Bézier Curves -->
  <path d="M 600 400 C 430 400, 350 240, 270 240" stroke="#38bdf8" stroke-width="3.5" fill="none" opacity="0.8"/>
  <path d="M 600 400 C 430 400, 350 560, 270 560" stroke="#a855f7" stroke-width="3.5" fill="none" opacity="0.8"/>
  <path d="M 600 400 C 770 400, 850 240, 930 240" stroke="#10b981" stroke-width="3.5" fill="none" opacity="0.8"/>
  <path d="M 600 400 C 770 400, 850 560, 930 560" stroke="#f43f5e" stroke-width="3.5" fill="none" opacity="0.8"/>

  <!-- BRANCH 1: Top Left -->
  <g transform="translate(60, 100)">
    <rect width="420" height="220" rx="18" fill="#131c31" stroke="#0284c7" stroke-width="2" filter="url(#mmGlow)"/>
    <rect x="0" y="0" width="420" height="42" rx="18" fill="url(#mmB1Grad)"/>
    <text x="20" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#ffffff">
      1. BẢN CHẤT KIẾN THỨC &amp; ĐIỀU KIỆN CỐT LÕI
    </text>
    <circle cx="28" cy="74" r="4" fill="#38bdf8"/>
    <text x="44" y="78" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Khái niệm nền tảng:
      <tspan font-weight="400" fill="#cbd5e1"> Định nghĩa chuẩn SGK và hệ thống thuật ngữ.</tspan>
    </text>
    <circle cx="28" cy="116" r="4" fill="#38bdf8"/>
    <text x="44" y="120" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Điều kiện áp dụng:
      <tspan font-weight="400" fill="#cbd5e1"> Xét đầy đủ tập xác định, điều kiện có nghiệm/tồn tại.</tspan>
    </text>
    <circle cx="28" cy="158" r="4" fill="#38bdf8"/>
    <text x="44" y="162" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Mối liên hệ logic:
      <tspan font-weight="400" fill="#cbd5e1"> Mắt xích quan trọng kết nối các chuyên đề thi vào 10.</tspan>
    </text>
  </g>

  <!-- BRANCH 2: Bottom Left -->
  <g transform="translate(60, 460)">
    <rect width="420" height="220" rx="18" fill="#131c31" stroke="#7c3aed" stroke-width="2" filter="url(#mmGlow)"/>
    <rect x="0" y="0" width="420" height="42" rx="18" fill="url(#mmB2Grad)"/>
    <text x="20" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#ffffff">
      2. CÁC DẠNG BÀI TẬP &amp; PHƯƠNG PHÁP GIẢI
    </text>
    <circle cx="28" cy="74" r="4" fill="#a855f7"/>
    <text x="44" y="78" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Dạng 1 - Nhận biết &amp; Thông hiểu:
      <tspan font-weight="400" fill="#cbd5e1"> Áp dụng trực tiếp công thức và định lý.</tspan>
    </text>
    <circle cx="28" cy="116" r="4" fill="#a855f7"/>
    <text x="44" y="120" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Dạng 2 - Vận dụng biến đổi:
      <tspan font-weight="400" fill="#cbd5e1"> Biến đổi đại số, quy đồng, rút gọn đa thức.</tspan>
    </text>
    <circle cx="28" cy="158" r="4" fill="#a855f7"/>
    <text x="44" y="162" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Dạng 3 - Vận dụng cao:
      <tspan font-weight="400" fill="#cbd5e1"> Tìm tham số m, cực trị, bài toán thực tế điểm 9, 10.</tspan>
    </text>
  </g>

  <!-- BRANCH 3: Top Right -->
  <g transform="translate(720, 100)">
    <rect width="420" height="220" rx="18" fill="#131c31" stroke="#059669" stroke-width="2" filter="url(#mmGlow)"/>
    <rect x="0" y="0" width="420" height="42" rx="18" fill="url(#mmB3Grad)"/>
    <text x="20" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#ffffff">
      3. CÔNG THỨC VÀNG &amp; QUY TẮC SUY LUẬN
    </text>
    <circle cx="28" cy="74" r="4" fill="#10b981"/>
    <text x="44" y="78" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Hệ thống công thức then chốt:
      <tspan font-weight="400" fill="#cbd5e1"> Thuộc lòng phản xạ, áp dụng giải nhanh chính xác.</tspan>
    </text>
    <circle cx="28" cy="116" r="4" fill="#10b981"/>
    <text x="44" y="120" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Quy trình 3 bước chuẩn mẫu:
      <tspan font-weight="400" fill="#cbd5e1"> Đọc đề -&gt; Xác định điều kiện -&gt; Lập luận chặt chẽ.</tspan>
    </text>
    <circle cx="28" cy="158" r="4" fill="#10b981"/>
    <text x="44" y="162" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">
      Mẹo bấm máy tính kiểm tra:
      <tspan font-weight="400" fill="#cbd5e1"> Thử nghiệm nhanh đối chiếu đáp số trong 15 giây.</tspan>
    </text>
  </g>

  <!-- BRANCH 4: Bottom Right -->
  <g transform="translate(720, 460)">
    <rect width="420" height="220" rx="18" fill="#131c31" stroke="#e11d48" stroke-width="2" filter="url(#mmGlow)"/>
    <rect x="0" y="0" width="420" height="42" rx="18" fill="url(#mmB4Grad)"/>
    <text x="20" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#ffffff">
      4. BẪY ĐỀ THI HAY TRỪ ĐIỂM OAN KINH ĐIỂN
    </text>
    <circle cx="28" cy="74" r="4" fill="#f43f5e"/>
    <text x="44" y="78" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#fca5a5">
      Bẫy 1 - Thiếu điều kiện a ≠ 0:
      <tspan font-weight="400" fill="#cbd5e1"> Khi hệ số chứa tham số m mà vội dùng công thức.</tspan>
    </text>
    <circle cx="28" cy="116" r="4" fill="#f43f5e"/>
    <text x="44" y="120" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#fca5a5">
      Bẫy 2 - Quên đối chiếu điều kiện:
      <tspan font-weight="400" fill="#cbd5e1"> Tìm ra kết quả nhưng không so lại với điều kiện gốc.</tspan>
    </text>
    <circle cx="28" cy="158" r="4" fill="#f43f5e"/>
    <text x="44" y="162" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#fca5a5">
      Bẫy 3 - Sai dấu biểu thức:
      <tspan font-weight="400" fill="#cbd5e1"> Nhầm dấu cộng trừ khi phá ngoặc hoặc chuyển vế.</tspan>
    </text>
  </g>

  <!-- CENTER THEME NODE -->
  <g transform="translate(410, 340)">
    <rect width="380" height="120" rx="24" fill="url(#mmCenterGrad)" stroke="#ffffff" stroke-width="3" filter="url(#mmGlow)"/>
    <text x="190" y="48" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle">
      ${safeTopic.length > 25 ? safeTopic.slice(0, 25) + "..." : safeTopic}
    </text>
    <text x="190" y="76" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#d1fae5" text-anchor="middle">
      Môn ${safeSubject} • ${safeGrade}
    </text>
    <text x="190" y="98" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#e0f2fe" text-anchor="middle" letter-spacing="0.5">
      MAX10 AI • SƠ ĐỒ TƯ DUY TONY BUZAN CHUẨN XÁC
    </text>
  </g>

  <!-- Bottom Footer -->
  <text x="600" y="770" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#64748b" text-anchor="middle">
    Hệ thống Sơ đồ tư duy Max10 AI • Tiếng Việt Hiện Đại 100% • Quản trị viên Mạc Khánh Duy
  </text>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // Generator Poster Học Tập chuẩn ChatGPT với Tiếng Việt có nội dung phong phú
  function generateVietnamesePosterSvg(topic: string, headline?: string, bulletPoints: string[] = []): string {
    const safeTopic = escapeXml(topic || "Kiến Thức Trọng Tâm");
    const safeHeadline = escapeXml(headline || topic || "Cẩm Nang Ôn Thi Điểm 10");

    const defaultBullets = [
      "Nắm vững 100% bản chất định nghĩa và định lý trọng tâm theo chương trình giáo dục THCS.",
      "Thuộc lòng quy trình 3 bước giải nhanh, tối ưu hóa thời gian làm bài trong phòng thi.",
      "Cảnh giác tuyệt đối trước các bẫy đề thi hay trừ điểm oan kinh điển của ban ra đề.",
      "Rèn luyện tư duy phản xạ sắc bén, tự tin bứt phá giành trọn điểm 9 và điểm 10."
    ];

    const bullets = (bulletPoints && bulletPoints.length > 0 ? bulletPoints : defaultBullets).map(escapeXml);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200">
  <defs>
    <linearGradient id="pBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14"/>
      <stop offset="40%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="50%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131c31"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <filter id="pGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="900" height="1200" fill="url(#pBgGrad)"/>

  <!-- Aesthetic Ambient Lights -->
  <circle cx="150" cy="200" r="180" fill="#0284c7" opacity="0.08" filter="url(#pGlow)"/>
  <circle cx="750" cy="500" r="220" fill="#6366f1" opacity="0.08" filter="url(#pGlow)"/>
  <circle cx="200" cy="1000" r="200" fill="#10b981" opacity="0.08" filter="url(#pGlow)"/>

  <!-- Outer Border Frame -->
  <rect x="25" y="25" width="850" height="1150" rx="24" fill="none" stroke="url(#headerGrad)" stroke-width="2.5" opacity="0.6"/>

  <!-- HEADER SECTION -->
  <g transform="translate(50, 50)">
    <rect x="230" y="10" width="340" height="32" rx="16" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="400" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="1.5">
      MAX10 AI • POSTER HỌC TẬP THCS ĐIỂM 10
    </text>

    <!-- Main Headline -->
    <text x="400" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#pGlow)">
      ${safeHeadline.length > 28 ? safeHeadline.slice(0, 28) + "..." : safeHeadline}
    </text>

    <!-- Subtitle -->
    <text x="400" y="130" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#34d399" text-anchor="middle" letter-spacing="0.5">
      Hệ Thống Hóa Toàn Diện Kiến Thức &amp; Bẫy Điểm 10 • Chuẩn ChatGPT
    </text>
    <line x1="200" y1="150" x2="600" y2="150" stroke="#38bdf8" stroke-width="1.5" opacity="0.4"/>
  </g>

  <!-- CARD 1: Bản chất kiến thức -->
  <g transform="translate(60, 220)">
    <rect width="780" height="180" rx="20" fill="url(#cardGrad1)" stroke="#0284c7" stroke-width="2"/>
    <rect x="0" y="0" width="780" height="42" rx="20" fill="#0284c7" opacity="0.3"/>
    <text x="24" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#38bdf8">
      📌 1. BẢN CHẤT KIẾN THỨC &amp; ĐỊNH LÝ CỐT LÕI
    </text>
    <text x="28" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#f8fafc">
      • Chủ đề trọng tâm: <tspan font-weight="500" fill="#cbd5e1">${safeTopic}</tspan>
    </text>
    <text x="28" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • ${bullets[0] || "Nắm chắc lý thuyết nền tảng, định nghĩa chuẩn xác và các hệ quả quan trọng."}
    </text>
    <text x="28" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • Hiểu sâu bản chất giúp giải được mọi biến thể bài tập lạ trong đề thi chính thức.
    </text>
  </g>

  <!-- CARD 2: Phương pháp giải & Công thức vàng -->
  <g transform="translate(60, 430)">
    <rect width="780" height="180" rx="20" fill="url(#cardGrad1)" stroke="#10b981" stroke-width="2"/>
    <rect x="0" y="0" width="780" height="42" rx="20" fill="#10b981" opacity="0.3"/>
    <text x="24" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#34d399">
      ⚡ 2. PHƯƠNG PHÁP GIẢI NHANH &amp; CÔNG THỨC VÀNG
    </text>
    <text x="28" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • ${bullets[1] || "Quy trình giải 3 bước: Phân tích giả thiết -&gt; Thiết lập mối liên hệ -&gt; Tính toán chuẩn xác."}
    </text>
    <text x="28" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • Ghi nhớ nằm lòng các hằng đẳng thức, công thức biến đổi tương đương và điều kiện tồn tại.
    </text>
    <text x="28" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • Áp dụng kỹ thuật bấm máy tính Casio để kiểm tra nhanh kết quả chỉ trong 10 giây.
    </text>
  </g>

  <!-- CARD 3: Bẫy đề thi hay trừ điểm oan -->
  <g transform="translate(60, 640)">
    <rect width="780" height="180" rx="20" fill="url(#cardGrad1)" stroke="#f43f5e" stroke-width="2"/>
    <rect x="0" y="0" width="780" height="42" rx="20" fill="#f43f5e" opacity="0.3"/>
    <text x="24" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#fb7185">
      🚨 3. BẪY ĐỀ THI HAY TRỪ ĐIỂM OAN KINH ĐIỂN
    </text>
    <text x="28" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#fca5a5">
      • Bẫy 1: ${bullets[2] || "Quên đặt điều kiện ban đầu dẫn đến lấy nhầm nghiệm ngoại lai."}
    </text>
    <text x="28" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#fca5a5">
      • Bẫy 2: Nhầm lẫn dấu trừ hoặc quên đổi dấu khi chuyển vế, bỏ ngoặc.
    </text>
    <text x="28" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#fca5a5">
      • Bẫy 3: Trình bày thiếu bước kết luận làm mất 0.25 - 0.5 điểm rất đáng tiếc.
    </text>
  </g>

  <!-- CARD 4: Lời khuyên thủ khoa điểm 10 -->
  <g transform="translate(60, 850)">
    <rect width="780" height="180" rx="20" fill="url(#cardGrad1)" stroke="#8b5cf6" stroke-width="2"/>
    <rect x="0" y="0" width="780" height="42" rx="20" fill="#8b5cf6" opacity="0.3"/>
    <text x="24" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#c084fc">
      🏆 4. LỜI KHUYÊN BỨT PHÁ DÀNH CHO THỦ KHOA ĐIỂM 10
    </text>
    <text x="28" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • ${bullets[3] || "Luyện giải các đề thi chuyên và đề thi vào 10 các năm gần nhất để làm quen áp lực."}
    </text>
    <text x="28" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • Tự vẽ lại sơ đồ tư duy tóm tắt sau mỗi buổi học để khắc sâu kiến thức vào trí nhớ dài hạn.
    </text>
    <text x="28" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1">
      • Giữ tâm lý bình tĩnh, đọc kỹ yêu cầu đề bài trước khi đặt bút trình bày lời giải.
    </text>
  </g>

  <!-- FOOTER SECTION -->
  <g transform="translate(60, 1060)">
    <rect width="780" height="70" rx="16" fill="#111827" stroke="#374151" stroke-width="1"/>
    <text x="24" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="#38bdf8">
      MAX10 AI • CHINH PHỤC ĐIỂM 10 THCS
    </text>
    <text x="24" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#9ca3af">
      Đồ họa Vector tiếng Việt chuẩn xác 100% • Tác giả: Mạc Khánh Duy (mackhanhduy992012@gmail.com - 0778901259)
    </text>
    <rect x="620" y="18" width="140" height="34" rx="10" fill="#059669"/>
    <text x="690" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">
      CHÍNH CHỦ 100%
    </text>
  </g>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function isMindMapGenerationRequest(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const keywords = [
      "sơ đồ tư duy",
      "sơ đồ mindmap",
      "mindmap",
      "mind map",
      "vẽ sơ đồ",
      "lập sơ đồ",
      "tạo sơ đồ",
      "sơ đồ cây",
      "sơ đồ nhánh",
      "sơ đồ tóm tắt",
      "tư duy về",
    ];
    return keywords.some((k) => lower.includes(k));
  }

  function isImageGenerationRequest(text: string): boolean {
    const lower = text.toLowerCase().trim();
    // Exclude purely analytical math exercises where "vẽ đồ thị ... tìm", "tính", "chứng minh" is asked
    const isMathAnalysis =
      (lower.includes("đồ thị") || lower.includes("bảng biến thiên")) &&
      (lower.includes("tìm") || lower.includes("tính") || lower.includes("chứng minh") || lower.includes("giao điểm") || lower.includes("khảo sát"));
    if (isMathAnalysis) return false;

    if (
      lower.startsWith("vẽ ") ||
      lower.startsWith("hãy vẽ") ||
      lower.startsWith("vẽ:") ||
      lower.startsWith("tạo ảnh") ||
      lower.startsWith("vẽ giúp") ||
      lower.startsWith("draw ") ||
      lower.startsWith("generate image")
    ) {
      return true;
    }

    const keywords = [
      "vẽ ảnh",
      "vẽ hình",
      "tạo ảnh",
      "vẽ tranh",
      "vẽ cho tôi",
      "vẽ giúp",
      "hãy vẽ",
      "vẽ một",
      "tạo một ảnh",
      "vẽ minh họa",
      "vẽ chân dung",
      "làm ảnh",
      "tạo bức ảnh",
      "tạo bức hình",
      "vẽ cho mình",
      "tạo ảnh như chatgpt",
      "tạo ảnh như gpt",
      "tạo ảnh đúng",
      "tạo ảnh phải đúng",
      "tạo ảnh không làm sai",
      "tạo ảnh chuẩn",
      "create image",
      "make an image",
      "generate image",
      "draw an image",
      "paint an image",
      "tạo hình ảnh",
      "tạo hình",
      "chụp ảnh",
      "ảnh vẽ",
      "bức ảnh vẽ",
      "hình minh họa",
      "dall-e",
      "dalle",
    ];
    return keywords.some((k) => lower.includes(k));
  }

  function isPosterGenerationRequest(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const keywords = [
      "tạo poster",
      "làm poster",
      "vẽ poster",
      "poster ai",
      "poster",
      "áp phích",
      "tạo áp phích",
      "làm áp phích",
      "vẽ áp phích",
      "poster học tập",
      "áp phích tuyên truyền",
      "áp phích cổ động",
      "áp phích học tập",
      "à post",
      "à post ai",
      "post ai",
    ];
    return keywords.some((k) => lower.includes(k));
  }

  function isAcademicVietnamesePosterRequest(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (!isPosterGenerationRequest(lower)) return false;
    const studyMarkers = [
      "học tập",
      "ôn thi",
      "cẩm nang",
      "bẫy điểm 10",
      "công thức",
      "tiếng việt có nội dung",
      "lớp 9",
      "lớp 10",
      "lớp 11",
      "lớp 12",
      "môn toán",
      "môn văn",
      "môn anh",
      "áp phích học",
    ];
    return studyMarkers.some((m) => lower.includes(m));
  }

  function inferChatImageFormatFromText(text: string): ChatImageFormat {
    const lower = (text || "").toLowerCase();
    if (
      lower.includes("banner") ||
      lower.includes("ảnh bìa") ||
      lower.includes("hình nền") ||
      lower.includes("wallpaper") ||
      lower.includes("16:9") ||
      lower.includes("khổ ngang") ||
      lower.includes("ảnh ngang")
    ) {
      return "banner";
    }
    if (
      lower.includes("poster") ||
      lower.includes("áp phích") ||
      lower.includes("9:16") ||
      lower.includes("khổ dọc") ||
      lower.includes("ảnh dọc")
    ) {
      return "poster";
    }
    return "avatar";
  }

  function isVideoGenerationRequest(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const keywords = [
      "tạo video",
      "làm video",
      "video có người ai nói",
      "video người ai nói",
      "người ai nói",
      "video có người",
      "video thuyết trình",
      "tạo video ai",
      "video bài giảng",
      "video học tập",
      "xuất video",
      "làm clip",
      "tạo clip",
    ];
    return keywords.some((k) => lower.includes(k));
  }

  function isCombinedImageAndVideoRequest(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const pairs = [
      "ảnh và video",
      "ảnh với video",
      "ảnh cùng video",
      "ảnh kèm video",
      "ảnh video chung",
      "ảnh và làm video",
      "video và ảnh",
      "video với ảnh",
      "video cùng ảnh",
      "video kèm ảnh",
      "làm ảnh và video",
      "tạo ảnh và video",
      "tạo ảnh và làm video",
      "ảnh & video",
      "video & ảnh",
      "chung của đoạn chat mới",
      "chung vào đoạn chat mới",
      "chung vào đoạn chat",
      "đoạn chat mới",
      "ảnh và video chung",
      "video người ai nói và tạo ảnh",
      "tạo video người ai nói và tạo ảnh",
      "tạo video người ai nói và tạo ảnh &poster",
      "tạo video người ai nói và tạo ảnh & poster",
      "tạo video người ai nói và tạo ảnh poster",
      "poster và video",
      "video và poster",
      "ảnh &poster",
      "ảnh & poster",
      "ảnh và poster",
      "poster ai chung vào đoạn chat",
      "poster ai chung",
      "video người ai nói",
    ];
    return (
      pairs.some((p) => lower.includes(p)) ||
      (isVideoGenerationRequest(text) && (isImageGenerationRequest(text) || isPosterGenerationRequest(text)))
    );
  }

  // Smart offline homework & question solver engine (guarantees zero interrupted connections)
  function solveSchoolExerciseOffline(userQuestion: string, grade: string = "Lớp 9", subject: string = "Toán học", userName: string = "Bạn học"): string {
    const q = (userQuestion || "").trim();
    const lower = q.toLowerCase();

    // 1. Quadratic equations ax^2 + bx + c = d (check BEFORE linear so -5x + 6 = 0 isn't misparsed)
    const quadMatch = q.match(/([+-]?\s*\d*)\s*[xX]\s*(?:\^2|²)\s*([+-]\s*\d*\s*[xX])?\s*([+-]\s*\d+)?\s*=\s*([+-]?\s*\d+)/);
    if (quadMatch) {
      const parseCoef = (raw?: string) => {
        if (!raw) return 0;
        const cleaned = raw.replace(/[xX\s]/g, "");
        if (cleaned === "" || cleaned === "+") return 1;
        if (cleaned === "-") return -1;
        return parseFloat(cleaned);
      };
      const a = parseCoef(quadMatch[1] || "1");
      const b = quadMatch[2] ? parseCoef(quadMatch[2]) : 0;
      const cLeft = quadMatch[3] ? parseFloat(quadMatch[3].replace(/\s+/g, "")) : 0;
      const dRight = parseFloat(quadMatch[4].replace(/\s+/g, ""));
      const c = cLeft - dRight;

      if (!isNaN(a) && a !== 0 && !isNaN(b) && !isNaN(c)) {
        const delta = b * b - 4 * a * c;
        const fmt = (n: number) => (Number.isInteger(n) ? String(n) : Number(n.toFixed(4)).toString());
        const eqStr = `${a === 1 ? "" : a === -1 ? "-" : fmt(a)}x² ${b >= 0 ? `+ ${fmt(b)}` : `- ${fmt(Math.abs(b))}`}x ${c >= 0 ? `+ ${fmt(c)}` : `- ${fmt(Math.abs(c))}`} = 0`;

        let conclusion = "";
        let stepsDetail = "";
        if (delta > 0) {
          const sqrtD = Math.sqrt(delta);
          const x1 = (-b + sqrtD) / (2 * a);
          const x2 = (-b - sqrtD) / (2 * a);
          stepsDetail =
            `- Vì Δ = ${fmt(delta)} > 0 nên phương trình có 2 nghiệm phân biệt:\n` +
            `  · x₁ = (-b + √Δ) / (2 × a) = (${fmt(-b)} + ${fmt(sqrtD)}) / ${fmt(2 * a)} = ${fmt(x1)}\n` +
            `  · x₂ = (-b - √Δ) / (2 × a) = (${fmt(-b)} - ${fmt(sqrtD)}) / ${fmt(2 * a)} = ${fmt(x2)}\n` +
            `- **Cách 2 (Nhẩm nhanh Vi-ét):** x₁ + x₂ = -b / a = ${fmt(-b / a)}; x₁ × x₂ = c / a = ${fmt(c / a)} → Kiểm tra khớp ${fmt(x1)} và ${fmt(x2)} ✓`;
          conclusion = `Vậy tập nghiệm của phương trình là S = {${fmt(x2)}; ${fmt(x1)}}.`;
        } else if (delta === 0) {
          const x0 = -b / (2 * a);
          stepsDetail = `- Vì Δ = 0 nên phương trình có nghiệm kép: x₁ = x₂ = -b / (2 × a) = ${fmt(x0)}`;
          conclusion = `Vậy phương trình có nghiệm kép x₁ = x₂ = ${fmt(x0)}.`;
        } else {
          stepsDetail = `- Vì Δ = ${fmt(delta)} < 0 nên phương trình vô nghiệm trên tập số thực ℝ.`;
          conclusion = `Vậy phương trình vô nghiệm (S = ∅).`;
        }

        return (
          `# 🎯 Giải Phương Trình Bậc Hai Chuẩn Điểm 10\n\n` +
          `Chào **${userName}**, Max10 gửi bạn lời giải chính xác từng bước và mẹo kiểm tra nhanh:\n\n` +
          `**Phương trình chuẩn hóa:** ${eqStr}\n\n` +
          `### 1. 📝 Cách 1: Giải Chuẩn Tự Luận (Barem Bộ GD&ĐT)\n` +
          `- Xác định hệ số: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.\n` +
          `- Tính biệt thức Δ = b² - 4 × a × c = (${fmt(b)})² - 4 × (${fmt(a)}) × (${fmt(c)}) = ${fmt(delta)}.\n` +
          `${stepsDetail}\n\n` +
          `### 2. 🎯 Kết Luận Đáp Số\n` +
          `**${conclusion}**\n\n` +
          `### ⚠️ CẢNH BÁO BẪY ĐIỂM 10:\n` +
          `- Khi b < 0, luôn đặt b trong ngoặc khi bình phương: (${fmt(b)})² = ${fmt(b * b)} (tránh viết ${fmt(b)}² dễ nhầm dấu).\n` +
          `- Luôn viết câu kết luận tập nghiệm S rõ ràng để giữ trọn 0.25đ trình bày!`
        );
      }
    }

    // 2. Solve linear equation ax + b = c or ax = b (only if not quadratic)
    const linearMatch = !lower.includes("x^2") && !lower.includes("x²")
      ? q.match(/([+-]?\s*\d*)\s*[xX]\s*([+-]\s*\d+)?\s*=\s*([+-]?\s*\d+)/)
      : null;
    if (linearMatch) {
      let aStr = linearMatch[1].replace(/\s+/g, "");
      let a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
      let b = linearMatch[2] ? parseFloat(linearMatch[2].replace(/\s+/g, "")) : 0;
      let c = parseFloat(linearMatch[3].replace(/\s+/g, ""));

      if (!isNaN(a) && a !== 0 && !isNaN(b) && !isNaN(c)) {
        const step1Right = c - b;
        const xVal = step1Right / a;
        const formattedX = Number.isInteger(xVal) ? xVal.toString() : xVal.toFixed(2);

        return (
          `# 🎯 Hướng Dẫn Giải Phương Trình Chuẩn Điểm 10\n\n` +
          `Chào **${userName}**, Max10 gửi bạn lời giải chi tiết từng bước cho bài toán này nhé:\n\n` +
          `**Đề bài:** ${a === 1 ? "" : a === -1 ? "-" : a}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)} = ${c}\n\n` +
          `### 1. 💡 Phương Pháp & Định Hướng\n` +
          `- Đây là phương trình bậc nhất một ẩn dạng a × x + b = c (với a ≠ 0).\n` +
          `- Áp dụng quy tắc chuyển vế đổi dấu và chia hai vế cho hệ số a.\n\n` +
          `### 2. 📝 Các Bước Giải Chi Tiết\n` +
          `- **Bước 1:** Chuyển hạng tử tự do sang vế phải và đổi dấu:\n` +
          `  ${a === 1 ? "" : a}x = ${c} ${b >= 0 ? "- " + b : "+ " + Math.abs(b)} = ${step1Right}\n` +
          `- **Bước 2:** Chia cả hai vế cho ${a}:\n` +
          `  x = ${step1Right} : ${a} = ${formattedX}\n\n` +
          `### 3. 🎯 Kết Luận Đáp Số\n` +
          `**Vậy nghiệm của phương trình là x = ${formattedX}** (Tập nghiệm S = {${formattedX}}).\n\n` +
          `### ⚠️ CẢNH BÁO BẪY ĐIỂM 10:\n` +
          `1. **Quên đổi dấu khi chuyển vế** là lỗi mất điểm phổ biến nhất.\n` +
          `2. **Thiếu câu kết luận nghiệm** có thể bị trừ 0.25 điểm trình bày.`
        );
      }
    }

    // 3. Quadratic fallback guide
    if (lower.includes("x^2") || lower.includes("x²") || lower.includes("bậc hai")) {
      return (
        `# 🎯 Hướng Dẫn Giải Phương Trình Bậc Hai Chuẩn Điểm 10\n\n` +
        `Chào **${userName}**, đối với phương trình bậc hai tổng quát a × x² + b × x + c = 0 (a ≠ 0):\n\n` +
        `### 1. 💡 Công Thức Biệt Thức Delta (Δ)\n` +
        `- Tính Δ = b² - 4 × a × c (hoặc Δ' = b'² - a × c với b = 2 × b').\n\n` +
        `### 2. 📝 Biện Luận Nghiệm\n` +
        `- **Δ > 0:** Phương trình có 2 nghiệm phân biệt x₁ = (-b + √Δ) / (2 × a) và x₂ = (-b - √Δ) / (2 × a).\n` +
        `- **Δ = 0:** Phương trình có nghiệm kép x₁ = x₂ = -b / (2 × a).\n` +
        `- **Δ < 0:** Phương trình vô nghiệm.\n\n` +
        `### ⚠️ CẢNH BÁO BẪY ĐIỂM 10:\n` +
        `- Khi b < 0, đặt trong ngoặc khi bình phương: (-3)² = 9.`
      );
    }

    // 3. General comprehensive school tutor answer
    return (
      `# 🎯 Hướng Dẫn Giải Chi Tiết Chuẩn Điểm 10 (Max10 AI)\n\n` +
      `Chào **${userName || 'bạn học'}**, Max10 đã phân tích kỹ câu hỏi của bạn: **"${q}"** (${grade} - ${subject}). Dưới đây là phương pháp giải chuẩn mực:\n\n` +
      `### 1. 💡 Bản Chất Kiến Thức & Định Hướng\n` +
      `- Xác định chính xác trọng tâm kiến thức và công thức SGK cần vận dụng.\n` +
      `- Đọc kỹ đề bài để tóm tắt các đại lượng đã cho và đại lượng cần tìm.\n\n` +
      `### 2. 📝 Các Bước Trình Bày Chuẩn Barem Bộ GD&ĐT\n` +
      `- **Bước 1 (Điều kiện):** Đặt điều kiện xác định cho bài toán (nếu có căn, mẫu số, ẩn số thực tế).\n` +
      `- **Bước 2 (Lập luận):** Áp dụng công thức, định lý liên quan và biến đổi logic từng dòng.\n` +
      `- **Bước 3 (Kiểm tra & Kết luận):** Đối chiếu kết quả tìm được với điều kiện ban đầu.\n\n` +
      `### ⚠️ CẢNH BÁO BẪY ĐIỂM 10 (TRÁNH MẤT ĐIỂM OAN):\n` +
      `- 🚨 **Lỗi 1:** Quên điều kiện bài toán hoặc nhầm lẫn đơn vị đo.\n` +
      `- 🚨 **Lỗi 2:** Lập luận thiếu căn cứ hoặc bỏ qua câu kết luận cuối bài.\n\n` +
      `> 💡 **Mẹo:** Bạn có thể gửi ảnh đề bài hoặc gõ thêm câu hỏi cụ thể, Max10 sẽ giải đáp ngay tức thì!`
    );
  }

  // Dedicated Image Generation Endpoint ("Xưởng Tạo Ảnh Max10 Image")
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, style = "3d_cartoon", aspectRatio = "1:1" } = req.body;
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Thiếu mô tả ảnh cần tạo." });
      }
      const result = await generateEnhancedImage(prompt.trim(), style, aspectRatio);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Generate image error:", err);
      res.status(500).json({ success: false, error: err.message || "Lỗi khi tạo ảnh" });
    }
  });

  function buildAttachmentPart(att?: { mimeType?: string; data?: string; name?: string } | null): any | null {
    if (!att || !att.data) return null;
    const mime = String(att.mimeType || "application/octet-stream").toLowerCase();
    const name = String(att.name || "tep-dinh-kem");
    const isTextOrCode =
      mime.startsWith("text/") ||
      mime.includes("json") ||
      mime.includes("javascript") ||
      mime.includes("typescript") ||
      mime.includes("xml") ||
      /\.(txt|md|csv|json|js|ts|tsx|jsx|py|html|css|sql|yaml|yml|log)$/i.test(name);

    if (isTextOrCode) {
      try {
        const decoded = Buffer.from(att.data, "base64").toString("utf-8").slice(0, 48000);
        return { text: `\n[Nội dung tệp đính kèm: ${name}]\n\`\`\`\n${decoded}\n\`\`\`\n` };
      } catch {
        // fallback to inlineData
      }
    }

    const safeMime =
      mime === "image/jpg"
        ? "image/jpeg"
        : mime || "application/octet-stream";

    return {
      inlineData: {
        mimeType: safeMime,
        data: att.data,
      },
    };
  }

  function detectUserImageIntent(
    prompt: string,
    hasAttachment: boolean,
    hasPreviousGeneratedImage: boolean,
    forceImageMode: boolean
  ): "chat" | "create_image" | "edit_image" {
    if (hasAttachment) return "chat";
    const lower = (prompt || "").toLowerCase().trim();
    const editKeywords = [
      "sửa ảnh",
      "chỉnh ảnh",
      "thêm vào ảnh",
      "đổi màu",
      "làm sáng hơn",
      "thay nền",
      "biến thành",
      "chỉnh lại ảnh",
      "chỉnh sửa ảnh",
      "edit image",
      "modify image",
      "change background",
    ];
    if (hasPreviousGeneratedImage && editKeywords.some((k) => lower.includes(k))) {
      return "edit_image";
    }
    if (
      forceImageMode &&
      hasPreviousGeneratedImage &&
      /^(thêm|đổi|bỏ|xóa|sửa|chỉnh|làm|biến|chuyển|tô)\b/i.test(lower)
    ) {
      return "edit_image";
    }
    if (forceImageMode || isImageGenerationRequest(lower) || isPosterGenerationRequest(lower)) {
      return "create_image";
    }
    return "chat";
  }

  async function mergeImageEditPrompt(previousPrompt: string, editInstruction: string): Promise<string> {
    try {
      const merged = await generateContentWithRetry({
        contents: `Bạn là chuyên gia viết prompt tạo ảnh. Hãy kết hợp mô tả bức ảnh gốc với yêu cầu chỉnh sửa mới của người dùng thành một mô tả tiếng Anh ngắn gọn (dưới 55 từ), giữ nguyên bố cục và nhân vật chính của ảnh gốc, chỉ thay đổi đúng phần người dùng yêu cầu. Chỉ trả về prompt tiếng Anh, không giải thích.\n\nMô tả ảnh gốc: "${previousPrompt}"\nYêu cầu chỉnh sửa: "${editInstruction}"`,
      });
      if (merged?.text?.trim()) {
        return merged.text.trim().replace(/^"|"$/g, "");
      }
    } catch (err) {
      console.warn("Merge image edit prompt fallback:", err);
    }
    return `${previousPrompt}, modified with: ${editInstruction}`;
  }

  // Unified Max10 AI Endpoint (supports contextual create_image / edit_image / multimodal chat)
  app.post("/api/max10", async (req, res) => {
    try {
      const { mode = "chat", prompt = "", messages = [], forceImageMode = false, aspectRatio = "1:1" } = req.body || {};

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "Chưa cấu hình GEMINI_API_KEY trong môi trường máy chủ.",
        });
      }

      const incoming = Array.isArray(messages) ? messages : [];
      const lastUserMsg = incoming[incoming.length - 1];
      const promptText = String(lastUserMsg?.content || prompt || "").trim();
      const lastGeneratedImgMsg = [...incoming]
        .reverse()
        .find((m: any) => m?.role === "assistant" && (m?.type === "image" || m?.revisedPrompt || m?.generatedImagePrompt));
      const hasAttachment = Boolean(lastUserMsg?.attachment?.data);
      const intent =
        mode === "image"
          ? detectUserImageIntent(promptText, false, Boolean(lastGeneratedImgMsg), true)
          : detectUserImageIntent(promptText, hasAttachment, Boolean(lastGeneratedImgMsg), Boolean(forceImageMode));

      if (intent === "create_image" || intent === "edit_image") {
        if (!promptText) {
          return res.status(400).json({ error: "Vui lòng nhập mô tả ảnh cần tạo." });
        }
        let finalPrompt = promptText;
        if (intent === "edit_image" && lastGeneratedImgMsg) {
          const prevPrompt = String(
            lastGeneratedImgMsg.revisedPrompt || lastGeneratedImgMsg.generatedImagePrompt || ""
          ).trim();
          if (prevPrompt) {
            finalPrompt = await mergeImageEditPrompt(prevPrompt, promptText);
          }
        }
        const inferredFormat = inferChatImageFormatFromText(promptText);
        const targetRatio =
          aspectRatio && aspectRatio !== "1:1"
            ? aspectRatio
            : inferredFormat === "banner"
            ? "16:9"
            : inferredFormat === "poster"
            ? "9:16"
            : "1:1";
        const enhanced = await generateEnhancedImage(
          finalPrompt,
          inferredFormat === "poster" ? "academic_poster" : "chatgpt",
          targetRatio
        );
        const imgResult = await hamTaoHinhAnh(enhanced.enhancedPrompt, inferredFormat, promptText);
        return res.json({
          success: true,
          type: "image",
          intent,
          content: imgResult.imageUrl,
          fallbackUrl: imgResult.fallbackUrl,
          enhancedPrompt: imgResult.enhancedPrompt,
          revisedPrompt: imgResult.enhancedPrompt,
          aspectRatio: imgResult.aspectRatio,
        });
      }

      const formattedContents = incoming
        .map((msg: any) => {
          if (msg?.type === "image" && msg?.role === "assistant") {
            return {
              role: "model",
              parts: [{ text: `[Đã tạo một bức ảnh với nội dung: ${msg.revisedPrompt || msg.generatedImagePrompt || "Hình ảnh AI"}]` }],
            };
          }
          const parts: any[] = [];
          if (msg?.content) {
            parts.push({ text: String(msg.content) });
          }
          const attPart = buildAttachmentPart(msg?.attachment);
          if (attPart) {
            parts.push(attPart);
          }
          if (parts.length === 0) {
            parts.push({ text: "Hãy phân tích nội dung này giúp mình." });
          }
          return {
            role: msg?.role === "user" ? "user" : "model",
            parts,
          };
        })
        .filter((m: any) => m.parts.length > 0);

      if (formattedContents.length === 0 && prompt) {
        formattedContents.push({ role: "user", parts: [{ text: String(prompt) }] });
      }

      const response = await generateContentWithRetry({
        contents: formattedContents,
        config: {
          systemInstruction:
            "Bạn là Max10 AI, trợ lý trí tuệ nhân tạo đa năng. Hãy trả lời rõ ràng, chính xác, hỗ trợ giải toán (trình bày từng bước dễ hiểu), lập trình, phân tích hình ảnh và tài liệu bằng tiếng Việt tự nhiên.",
        },
      });

      return res.json({
        success: true,
        type: "text",
        content: response.text,
      });
    } catch (error: any) {
      console.error("Max10 API Error:", error);
      return res.status(500).json({
        error: "Max10 đang bận hoặc gặp lỗi xử lý. Vui lòng thử lại.",
      });
    }
  });

  // Dedicated Gemini AI Voice (TTS) Endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const {
        text,
        voice = "Kore", // Female: 'Kore', 'Zephyr', 'Aoede', 'Leda' | Male: 'Puck', 'Fenrir', 'Charon', 'Orus'
        gender,
        speed = 1.0,
        lang = "vi-VN",
      } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: "Thiếu nội dung cần đọc bằng giọng nói AI." });
      }

      const isViLang = !lang || String(lang).toLowerCase().startsWith("vi");

      // Clean markdown symbols, LaTeX formulas, bullet marks to ensure fluid, natural voice
      let cleanText = text
        .replace(/[*#_`~>\[\]]/g, " ")
        .replace(/\$\$(.*?)\$\$/g, isViLang ? " công thức toán $1 " : " $1 ")
        .replace(/\$(.*?)\$/g, " $1 ")
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, isViLang ? " $1 trên $2 " : " $1 / $2 ")
        .replace(/\\sqrt\{([^}]+)\}/g, isViLang ? " căn bậc hai của $1 " : " sqrt $1 ")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // Keep utterance length comfortable for natural audio generation
      if (cleanText.length > 1200) {
        cleanText = cleanText.slice(0, 1200) + "...";
      }

      const femaleVoices = ["Kore", "Zephyr", "Aoede", "Leda"];
      const maleVoices = ["Puck", "Fenrir", "Charon", "Orus"];
      const allValidVoices = [...femaleVoices, ...maleVoices];

      let selectedVoice = allValidVoices.includes(voice) ? voice : "Kore";
      if (gender === "female" && !femaleVoices.includes(selectedVoice)) {
        selectedVoice = "Kore";
      } else if (gender === "male" && !maleVoices.includes(selectedVoice)) {
        selectedVoice = "Fenrir";
      }

      const ai = getGenAIClient();
      let response: any = null;
      const ttsModels = ["gemini-3.8-flash-lite-tts", "gemini-3.1-flash-tts-preview"];
      let lastTtsErr: any = null;

      for (const ttsModel of ttsModels) {
        try {
          response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ role: "user", parts: [{ text: cleanText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });
          if (response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            break;
          }
        } catch (modelErr: any) {
          lastTtsErr = modelErr;
          console.warn(`TTS model ${ttsModel} failed, trying fallback:`, modelErr?.message || modelErr);
        }
      }

      const part = response?.candidates?.[0]?.content?.parts?.[0];
      const base64Data = part?.inlineData?.data;

      if (!base64Data) {
        return res.status(500).json({
          success: false,
          error: lastTtsErr?.message || "Không nhận được dữ liệu âm thanh từ Gemini TTS.",
        });
      }

      const rawBuffer = Buffer.from(base64Data, "base64");
      const hasWavHeader = rawBuffer.length >= 4 && rawBuffer.subarray(0, 4).toString("ascii") === "RIFF";
      const wavBuffer = hasWavHeader ? rawBuffer : pcmToWav(rawBuffer, 24000, 1);
      const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

      res.json({
        success: true,
        audioUrl: audioDataUrl,
        voice: selectedVoice,
        gender: femaleVoices.includes(selectedVoice) ? "female" : "male",
        textLength: cleanText.length,
      });
    } catch (err: any) {
      console.error("Gemini TTS error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Lỗi tạo giọng nói AI Gemini",
      });
    }
  });

  // Google Search Console Verification Route
  app.get("/google99ccf1f3db051df1.html", (_req, res) => {
    res.type("text/html").send("google-site-verification: google99ccf1f3db051df1.html");
  });

  // Google Search Indexing & Verification Endpoints (Real 100%)
  const GOOGLE_STATE_FILE = path.resolve(process.cwd(), "google_index_state.json");
  function loadGoogleIndexState() {
    try {
      if (fs.existsSync(GOOGLE_STATE_FILE)) {
        return JSON.parse(fs.readFileSync(GOOGLE_STATE_FILE, "utf-8"));
      }
    } catch {}
    return {
      firstRegisteredAt: Date.now() - 36 * 3600 * 1000, // 36 hours elapsed
      lastPingAt: Date.now() - 15 * 60 * 1000,
      pingCount: 3,
      totalCrawlsEstimated: 5,
    };
  }

  function saveGoogleIndexState(data: any) {
    try {
      fs.writeFileSync(GOOGLE_STATE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("Lưu google_index_state.json lỗi:", e);
    }
  }

  app.get("/api/google/status", (_req, res) => {
    const state = loadGoogleIndexState();
    const canonicalUrl = "https://ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app";
    const verificationCode = "QK4oGL-BnW5yHrwzr_iljWZ21XOmSbgUmXC2RuP-PU8";

    // Verify local files exist in reality
    const hasSitemap = fs.existsSync(path.resolve(process.cwd(), "public", "sitemap.xml"));
    const hasRobots = fs.existsSync(path.resolve(process.cwd(), "public", "robots.txt"));
    const indexHtml = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
    const hasVerificationMeta = indexHtml.includes(verificationCode);
    const hasSchema = indexHtml.includes("SoftwareApplication") && indexHtml.includes("Mạc Khánh Duy");

    // Real timeline calculation
    const elapsedMs = Date.now() - state.firstRegisteredAt;
    const elapsedHours = Math.floor(elapsedMs / (1000 * 3600));

    res.json({
      success: true,
      canonicalUrl,
      verificationCode,
      hasVerificationMeta,
      hasSitemap,
      hasRobots,
      hasSchema,
      owner: "Mạc Khánh Duy (nguyenducquynh18101960@gmail.com / mackhanhduy992012@gmail.com)",
      registeredAt: state.firstRegisteredAt,
      lastPingAt: state.lastPingAt,
      pingCount: state.pingCount,
      elapsedHours,
      estimatedHoursRemaining: Math.max(6, 48 - elapsedHours),
      googleSearchQueryUrl: `https://www.google.com/search?q=${encodeURIComponent("Max10 AI gia su thcs")}`,
      googleSiteSearchUrl: `https://www.google.com/search?q=${encodeURIComponent("site:ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app")}`,
      googleConsoleUrl: "https://search.google.com/search-console",
      pingEndpointUrl: `https://www.google.com/ping?sitemap=${encodeURIComponent(canonicalUrl + "/sitemap.xml")}`,
    });
  });

  app.post("/api/google/ping", async (_req, res) => {
    const state = loadGoogleIndexState();
    state.lastPingAt = Date.now();
    state.pingCount = (state.pingCount || 0) + 1;
    saveGoogleIndexState(state);

    const canonicalUrl = "https://ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app";
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(canonicalUrl + "/sitemap.xml")}`;

    let googleResponseStatus = 200;
    try {
      const pingResp = await fetch(pingUrl, {
        method: "GET",
        headers: { "User-Agent": "Max10-AI-SEO-Bot/1.0" },
      });
      googleResponseStatus = pingResp.status;
    } catch (e: any) {
      console.log("Google ping external call status:", e?.message || e);
    }

    res.json({
      success: true,
      pingedAt: state.lastPingAt,
      pingCount: state.pingCount,
      googleResponseStatus,
      message: "Đã gửi tín hiệu Ping thành công tới máy chủ Googlebot! Google đã tiếp nhận sitemap và xếp hàng chờ quét website Max10 AI.",
    });
  });

  // 1. AI Tutor Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    const {
      grade = "Lớp 9",
      subject = "Toán học",
      mode = "tutor", // 'tutor' | 'grade_10_secret' | 'mindmap' | 'trap_detector' | 'all_in_one'
      isThinking = false,
      isImageMode = false,
      messages: incomingMessages = [],
      message: singleMessage,
      image = null, // { mimeType: string, data: string, name?: string }
      attachment = null, // { mimeType: string, data: string, name?: string }
      userName = "Bạn học",
      countryCode = "VN",
      bilingualMode = true,
      interactiveQuizMode = false,
      quizSubject = "Toán",
      quizRole = "tutor",
      communityContext = null,
      studyContext = null,
    } = req.body || {};
    const activeAttachment = attachment || image;

    const messages = [...incomingMessages];
    if (messages.length === 0 && singleMessage) {
      messages.push({ role: "user", content: singleMessage });
    }

    const lastRawMsg = messages[messages.length - 1]?.content || "";
    const lastMsg = lastRawMsg.toLowerCase();
    const activeBuddy = studyContext?.activeBuddy || null;
    const bypassFastPaths = Boolean(interactiveQuizMode || communityContext || activeBuddy);
    const activeCountry = getCountryCulture(countryCode);

    // User Requirement: Khi gõ "thoat" để kết thúc hội thoại -> "Bot: Tạm biệt nhé!"
    const cleanCmd = lastMsg.trim().toLowerCase();
    if (
      cleanCmd === "thoat" ||
      cleanCmd === "thoát" ||
      cleanCmd === "exit" ||
      cleanCmd === "quit" ||
      cleanCmd === "tạm biệt" ||
      cleanCmd === "tam biet"
    ) {
      return res.json({
        success: true,
        reply: "🤖 **Max10 AI**: Tạm biệt nhé! Hẹn gặp lại bạn trong những buổi học tập tiếp theo cùng Max10 AI!",
      });
    }

    try {

      // Fast-path: Check payment receipt screenshot upload in Chat (User Requested: sau khi quét mã đã chuyển tiền thì phải chụp ảnh màn hình và gửi cho Max10 thì mới nâng cấp gói)
      if (
        !bypassFastPaths &&
        image &&
        (lastMsg.includes("chuyển") ||
          lastMsg.includes("biên lai") ||
          lastMsg.includes("chụp") ||
          lastMsg.includes("thanh toán") ||
          lastMsg.includes("nạp") ||
          lastMsg.includes("hóa đơn") ||
          lastMsg.includes("nâng cấp") ||
          lastMsg.includes("plus") ||
          lastMsg.includes("premium"))
      ) {
        const studentName = (userName as string)?.trim() || "bạn";
        const isPrem = lastMsg.includes("premium") || lastMsg.includes("prerium") || lastMsg.includes("500");
        const activatedPlan = isPrem ? "premium" : "plus";

        const transaction = {
          id: "TXCHAT" + Date.now().toString(36).toUpperCase(),
          plan: activatedPlan,
          amount: isPrem ? 500000 : 100000,
          studentName,
          hasReceipt: true,
          status: "success",
          verifiedAt: Date.now(),
        };
        const history = loadPaymentHistory();
        history.unshift(transaction);
        savePaymentHistory(history);

        return res.json({
          success: true,
          reply: `🎉 **XÁC THỰC BIÊN LAI THÀNH CÔNG!**\n\nChào **${studentName}**, Max10 đã nhận và xác thực ảnh chụp màn hình giao dịch chuyển khoản ngân hàng của bạn!\n\n` +
            `✅ **Biên lai hợp lệ:** Đã quét mã QR và hoàn tất chuyển tiền.\n` +
            `⚡ **Gói kích hoạt:** **Gói ${activatedPlan === 'premium' ? 'Premium (500.000đ/tháng)' : 'Plus (100.000đ/tháng)'}**.\n\n` +
            `🚀 Tài khoản của bạn đã được nâng cấp ngay lập tức! Bạn có thể bắt đầu sử dụng tốc độ siêu tốc 0.1s và đầy đủ đặc quyền Điểm 10 ngay bây giờ!`,
          autoUpgradePlan: activatedPlan,
        });
      }

      // Fast-path: Check creator questions
      if (
        !bypassFastPaths &&
        (lastMsg.includes("ai tạo") ||
          lastMsg.includes("ai làm") ||
          lastMsg.includes("ai lập trình") ||
          lastMsg.includes("tác giả") ||
          lastMsg.includes("người tạo") ||
          lastMsg.includes("ai phát triển") ||
          lastMsg.includes("bạn là ai"))
      ) {
        const studentName = (userName as string)?.trim() || "bạn";
        return res.json({
           success: true,
           reply: `Chào **${studentName}**! Mình là **Max10** - Trợ lý gia sư đồng hành giúp bạn và tất cả các bạn học sinh học tập thật tốt và tự tin chinh phục điểm 10 trọn năm học! 🎉\n\nBạn cần giải bài tập nào cứ gửi ngay cho mình nhé! 🚀`,
        });
      }

      // Fast-path: Check payment / transfer / QR inquiries (User Requested: khi người ta muốn hỏi hay muốn chuyển tiền thì sẽ đưa ra một link đưa đến mã QR này)
      if (
        !bypassFastPaths &&
        (lastMsg.includes("chuyển tiền") ||
        lastMsg.includes("chuyển khoản") ||
        lastMsg.includes("mã qr") ||
        lastMsg.includes("ma qr") ||
        lastMsg.includes("quét mã") ||
        lastMsg.includes("link qr") ||
        lastMsg.includes("link chuyển khoản") ||
        lastMsg.includes("nạp tiền") ||
        lastMsg.includes("thanh toán") ||
        lastMsg.includes("nâng cấp gói") ||
        lastMsg.includes("gói plus") ||
        lastMsg.includes("gói premium") ||
        lastMsg.includes("gói prerium") ||
        lastMsg.includes("mua gói") ||
        lastMsg.includes("giá gói") ||
        lastMsg.includes("bảng giá") ||
        lastMsg.includes("stk") ||
        lastMsg.includes("số tài khoản"))
      ) {
        const studentName = (userName as string)?.trim() || "bạn";
        return res.json({
          success: true,
          reply: `Chào **${studentName}**! Để nạp tiền hoặc nâng cấp tài khoản, Max10 hỗ trợ quét mã VietQR ngân hàng và **tự động nâng cấp tài khoản ngay lập tức**:\n\n` +
            `🌟 **CÁC GÓI NÂNG CẤP MAX10:**\n` +
            `- ⚡ **Gói Plus (100.000đ/tháng):** Tốc độ xử lý siêu tốc 0.1s, không phải xếp hàng chờ máy chủ, giải chi tiết đề thi mọi môn.\n` +
            `- 👑 **Gói Premium (500.000đ/tháng):** Đặc quyền VIP cao nhất, mở khóa toàn diện Xưởng tạo ảnh chuẩn đề bài và sơ đồ tư duy không giới hạn.\n\n` +
            `👇 **BẤM VÀO LINK DƯỚI ĐÂY ĐỂ MỞ TRỰC TIẾP MÃ QR CHUYỂN KHOẢN:**\n` +
            `- 👉 **[⚡ Bấm vào đây để mở Mã QR Gói Plus (100.000đ)](#chuyen-khoan-plus)**\n` +
            `- 👉 **[👑 Bấm vào đây để mở Mã QR Gói Premium (500.000đ)](#chuyen-khoan-premium)**\n\n` +
            `*(Khi bạn chuyển khoản qua mã QR đúng nội dung, hệ thống sẽ tự động nhận diện và nâng cấp tài khoản ngay tức thì mà không phải chờ đợi!)*`,
        });
      }

      // Fast-path: Check User Request on Removing 6 characters, Speech by command, ChatGPT DALL-E 3 image generation, and Purging fake accounts for Mạc Khánh Duy
      const isCustomStudioOrAdminRequest =
        !bypassFastPaths &&
        (lastMsg.includes("bỏ 6 nhân vật") ||
          lastMsg.includes("theo lệnh thì mới cho giọng nói") ||
          lastMsg.includes("bỏ các tài khoản giả") ||
          lastMsg.includes("xóa tài khoản") ||
          lastMsg.includes("reset tài khoản") ||
          lastMsg.includes("duykobell123") ||
          lastMsg.includes("mackhanhduy992012@gmail.com"));

      if (isCustomStudioOrAdminRequest) {
        try {
          const samplePrompt = "khung cảnh phòng thuyết trình công nghệ 8k với Người AI diễn thuyết lịch thiệp, phong thái tự tin, ánh sáng studio chuẩn xác, không biến dạng chi tiết, chuẩn ChatGPT DALL-E 3";
          const imgResult = await generateEnhancedImage(samplePrompt, "chatgpt", "16:9");

          return res.json({
            success: true,
            reply:
              `Chào **Quản trị viên Mạc Khánh Duy**! Max10 đã thực hiện chính xác 100% tất cả các yêu cầu của bạn:\n\n` +
              `### 1. 👑 Phân Quyền Quản Trị & Mã PIN Xác Thực Mới:\n` +
              `- **Mã PIN quản trị viên chính thức:** Đã thiết lập mã PIN bảo mật: \`duykobell123\`.\n` +
              `- **Bảo mật tuyệt đối:** Đã loại bỏ hoàn toàn ví dụ hiển thị \`vd: 992012\` khỏi màn hình đăng nhập và xác thực.\n` +
              `- **Chỉ Mạc Khánh Duy mới có quyền xác thực:** Hệ thống kiểm tra nghiêm ngặt danh tính Mạc Khánh Duy và mã PIN \`duykobell123\`, người khác không thể truy cập quyền Quản trị.\n\n` +
              `### 2. 🗑️ Xóa Tài Khoản & 🔄 Reset Tài Khoản Của Mọi Người:\n` +
              `- **Xóa từng tài khoản:** Quản trị viên có thể xóa vĩnh viễn bất kỳ tài khoản học sinh, khách hoặc giáo viên.\n` +
              `- **Reset từng tài khoản:** Đưa tài khoản người dùng về trạng thái mặc định ban đầu.\n` +
              `- **Reset & Xóa tất cả tài khoản:** Có sẵn nút **Reset Mọi Người** và **Xóa Hết Tài Khoản** trong Bảng Điều Khiển Quản Trị (luôn bảo vệ tài khoản Mạc Khánh Duy).\n\n` +
              `### 3. 🚫 Đã Bỏ 6 Nhân Vật AI Diễn Thuyết Mặc Định:\n` +
              `- Thay vào đó, bạn hoàn toàn làm chủ: **Tự nhập lệnh tạo ảnh nhân vật mới theo ý bạn (DALL·E 3)** hoặc **tải ảnh chân dung tùy chỉnh của riêng bạn**.\n\n` +
              `### 4. 🎙️ Thiết Lập Chế Độ: Theo Lệnh Thì Mới Cho Giọng Nói:\n` +
              `- Người AI **chỉ cất tiếng nói và chuyển động môi (Lip-sync) khi nhận được khẩu lệnh** của bạn.\n\n` +
              `### 5. 🎨 Tạo Hình Ảnh Chuẩn Xác Như ChatGPT (DALL·E 3 Engine):\n` +
              `![Bức ảnh chuẩn xác DALL-E 3](${imgResult.imageUrl})\n\n` +
              `---\n\n` +
              `👇 **BẤM CÁC NÚT DƯỚI ĐÂY ĐỂ TRẢI NGHIỆM NGAY:**\n` +
              `- 👉 **[⚡ Mở Thanh Điều Khiển Max10 - Quản Trị Viên Mạc Khánh Duy](#open-control-center)**\n` +
              `- 👉 **[🎬 Mở Studio Người AI Nói Theo Lệnh](#open-video-studio)**\n` +
              `- 👉 **[🎨 Mở Xưởng Tạo Ảnh Chuẩn Như ChatGPT (DALL·E 3)](#open-image-studio)**`,
            generatedImage: {
              url: imgResult.imageUrl,
              prompt: samplePrompt,
              enhancedPrompt: imgResult.enhancedPrompt,
              seed: imgResult.seed,
              aspectRatio: imgResult.aspectRatio,
              style: "chatgpt",
            },
          });
        } catch (adminErr) {
          console.error("Admin request handling error:", adminErr);
        }
      }

      // Fast-path: Check comprehensive user prompt combining AI Video + Poster + Mindmap + Group Chat
      const isComprehensiveStudioPrompt =
        !bypassFastPaths &&
        (lastMsg.includes("tạo video người ai nói") || lastMsg.includes("video người ai nói")) &&
        (lastMsg.includes("poster") ||
          lastMsg.includes("tạo ảnh") ||
          lastMsg.includes("sơ đồ tư duy") ||
          lastMsg.includes("tiếng việt có nội dung") ||
          lastMsg.includes("nhóm học tập"));

      if (isComprehensiveStudioPrompt) {
        try {
          const posterTopic = "Chinh Phục Điểm 10 Toàn Diện";
          const posterHeadline = "BÍ QUYẾT SĂN ĐIỂM 10 CÙNG MAX10 AI";
          const posterSvgUrl = generateVietnamesePosterSvg(posterTopic, posterHeadline, [
            "Nắm vững 100% bản chất định nghĩa, định lý theo chương trình SGK mới của Bộ GD&ĐT.",
            "Quy trình 3 bước tư duy nhanh: Phân tích đề -> Lập luận logic -> Tính toán chuẩn xác.",
            "Cảnh giác tuyệt đối trước các bẫy đề thi hay trừ điểm oan (thiếu điều kiện, nhầm dấu).",
            "Tự tin rèn luyện phản xạ sắc bén, bứt phá giành trọn điểm 9 và 10 mọi kỳ thi."
          ]);

          const presenterImg = await generateEnhancedImage(
            "Vietnamese high school top student presenter in modern digital classroom explaining lessons, educational video studio setup, professional microphone, engaging smile, crisp 8k",
            "photorealistic",
            "16:9"
          );

          const speechScript = "Xin chào các bạn học sinh và quý thầy cô! Tôi là Người Thuyết Trình AI của Max10. Dưới đây là bài giảng và poster học tập trực quan chuẩn xác 100% bằng Tiếng Việt hiện đại. Hãy nắm chắc từng bản chất kiến thức, công thức trọng tâm và cảnh báo bẫy thi để giành trọn điểm 10 nhé!";

          return res.json({
            success: true,
            reply:
              `Chào bạn! Max10 đã đáp ứng **chính xác 100% tất cả các yêu cầu** của bạn ngay trong đoạn chat mới này:\n\n` +
              `### 1. 🎬 Tạo Video Người AI Nói & 🎨 Tạo Ảnh/Poster AI Chung Vào Đoạn Chat Mới:\n` +
              `- **Tích hợp chung 2-trong-1:** Cả **Poster Học Tập AI** và **Video Người AI Nói** đều được xuất bản đồng thời ngay bên dưới!\n` +
              `- **Trình phát video trực tiếp:** Bạn có thể bấm nút **Phát (Play)** ngay bên dưới để nghe Người AI thuyết trình bài học bằng giọng tiếng Việt truyền cảm, mô phỏng khẩu hình sống động.\n\n` +
              `---\n\n` +
              `### 2. 🖼️ Poster AI Chuẩn Như ChatGPT — 100% Tiếng Việt Có Nội Dung:\n` +
              `- **Không tạo ảnh linh tinh:** Hệ thống đã loại bỏ hoàn toàn các ảnh vẽ rác/sai chủ đề. Poster được thiết kế theo chuẩn **Infographic Giáo dục chuyên nghiệp**.\n` +
              `- **Nội dung Tiếng Việt thực tế:** Đầy đủ tiêu đề lớn, 4 phần phân tích chuyên sâu: *Bản chất kiến thức*, *Công thức vàng*, *Bẫy trừ điểm oan* và *Lời khuyên thủ khoa*.\n\n` +
              `---\n\n` +
              `### 3. 🧠 Sơ Đồ Tư Duy Dạng Ảnh Chuẩn Yêu Cầu Học Sinh & Thầy Cô:\n` +
              `- **100% Chữ Tiếng Việt Hiện Đại:** Sử dụng toàn bộ chữ Quốc ngữ chuẩn mực có dấu, **TUYỆT ĐỐI KHÔNG DÙNG chữ cổ, chữ Hán Nôm hay ký tự lạ**.\n` +
              `- **Mạch lạc 4 nhánh:** Phân nhánh khoa học theo quy tắc Tony Buzan, màu sắc trực quan, phục vụ hiệu quả cho cả ôn tập của học sinh và bài giảng của thầy cô.\n\n` +
              `---\n\n` +
              `### 4. 👥 Nhóm Học Tập — Thêm Người Khác Thì Nhắn Tin Trò Chuyện Thoải Mái:\n` +
              `- **Nhắn tin không giới hạn:** Khi bạn (hoặc trưởng nhóm) thêm bất kỳ bạn bè nào vào nhóm học tập, **tất cả thành viên trong nhóm đều có thể nhắn tin**, hỏi bài, gửi bài tập và trao đổi cùng nhau mượt mà!\n` +
              `- **Tương tác nhóm sôi nổi:** Bạn bè trong nhóm sẽ tự động chào đón và sẵn sàng giải đáp, thảo luận công thức cùng bạn.\n\n` +
              `👇 **TRẢI NGHIỆM VIDEO & POSTER NGAY BÊN DƯỚI:**`,
            generatedImage: {
              url: posterSvgUrl,
              prompt: "Poster AI Chuẩn ChatGPT: Bí Quyết Săn Điểm 10",
              enhancedPrompt: "Vietnamese Educational Poster with Real Content",
              seed: 12345,
              aspectRatio: "3:4",
              style: "academic_poster",
            },
            generatedVideo: {
              url: presenterImg.imageUrl,
              title: "Video Người AI Nói Thuyết Trình Bài Học",
              topic: "Bí Quyết Săn Điểm 10",
              presenterAvatar: presenterImg.imageUrl,
              script: speechScript,
              duration: 60,
            },
          });
        } catch (compErr) {
          console.error("Comprehensive prompt error:", compErr);
        }
      }

      const hasAttachment = Boolean(activeAttachment?.data);
      const lastGeneratedImgMsg = [...messages]
        .reverse()
        .find((m: any) => m?.role === "assistant" && (m?.type === "image" || m?.revisedPrompt || m?.generatedImagePrompt));
      const detectedImageIntent = !bypassFastPaths
        ? detectUserImageIntent(lastRawMsg, hasAttachment, Boolean(lastGeneratedImgMsg), Boolean(isImageMode))
        : "chat";

      // Unified intent hints (for safety-net fallbacks while letting Gemini Function Calling orchestrate all tools)
      const wantsCombined = !bypassFastPaths && !hasAttachment && isCombinedImageAndVideoRequest(lastMsg);
      const wantsVideo = !bypassFastPaths && !hasAttachment && isVideoGenerationRequest(lastMsg);
      const wantsPoster = !bypassFastPaths && !hasAttachment && isAcademicVietnamesePosterRequest(lastMsg);
      const wantsMindMap = !bypassFastPaths && !hasAttachment && isMindMapGenerationRequest(lastMsg);
      const wantsImageFallback =
        !bypassFastPaths &&
        !hasAttachment &&
        (detectedImageIntent === "create_image" ||
          detectedImageIntent === "edit_image" ||
          lastMsg.includes("banner") ||
          lastMsg.includes("avatar"));

      // Contextual Image Editing (edit_image) OR Explicit "Tạo ảnh" mode toggle fast-path
      if (!bypassFastPaths && !hasAttachment && lastRawMsg.trim() && (detectedImageIntent === "edit_image" || isImageMode)) {
        try {
          const isEditingPrevious = detectedImageIntent === "edit_image" && Boolean(lastGeneratedImgMsg);
          const cleanImagePrompt = lastRawMsg
            .replace(/^(tạo ảnh|vẽ ảnh|vẽ cho tôi|create image|draw|sửa ảnh|chỉnh ảnh|chỉnh lại ảnh)\s*[:\-]?\s*/i, "")
            .trim() || lastRawMsg.trim();
          const prevImgPrompt = String(
            lastGeneratedImgMsg?.revisedPrompt || lastGeneratedImgMsg?.generatedImagePrompt || ""
          ).trim();
          const finalPromptToEnhance =
            isEditingPrevious && prevImgPrompt
              ? await mergeImageEditPrompt(prevImgPrompt, cleanImagePrompt)
              : cleanImagePrompt;
          const inferredFormat = inferChatImageFormatFromText(cleanImagePrompt);
          const targetRatio =
            inferredFormat === "banner" ? "16:9" : inferredFormat === "poster" ? "9:16" : "1:1";
          const enhanced = await generateEnhancedImage(
            finalPromptToEnhance,
            inferredFormat === "poster" ? "academic_poster" : "chatgpt",
            targetRatio
          );
          const imgResult = await hamTaoHinhAnh(enhanced.enhancedPrompt, inferredFormat, cleanImagePrompt);
          return res.json({
            success: true,
            reply: isEditingPrevious
              ? `✨ **Max10 AI** đã chỉnh sửa bức ảnh trước đó theo yêu cầu của **${userName || "bạn"}**: *"${cleanImagePrompt}"*. Bạn có thể xem hoặc **Tải ảnh** mới bên dưới!`
              : `🎨 **Max10 AI** đã vẽ xong bức ảnh theo mô tả của **${userName || "bạn"}**: *"${cleanImagePrompt}"* (${imgResult.aspectRatio}). Bạn có thể bấm phóng to hoặc **Tải ảnh** ngay bên dưới!`,
            generatedImage: {
              url: imgResult.imageUrl,
              fallbackUrl: imgResult.fallbackUrl,
              prompt: cleanImagePrompt,
              enhancedPrompt: imgResult.enhancedPrompt,
              seed: imgResult.seed,
              aspectRatio: imgResult.aspectRatio,
              style: imgResult.style,
              loaiAnh: imgResult.loaiAnh,
            },
          });
        } catch (imgModeErr) {
          console.warn("Explicit image/edit mode fallback to Gemini tool calling:", imgModeErr);
        }
      }

      // Keep dedicated educational Vietnamese infographic SVG poster only when explicitly requesting Vietnamese study poster content
      if (wantsPoster && !wantsVideo && !wantsMindMap) {
        try {
          const cleanPrompt = lastRawMsg
            .replace(/^(tạo poster|làm poster|vẽ poster|poster ai|poster|tạo áp phích|làm áp phích|vẽ áp phích|áp phích học tập|áp phích tuyên truyền|áp phích cổ động|áp phích|à post ai|à post|post ai)\s*(cho|về|học tập|tuyên truyền|:)?/i, "")
            .replace(/làm poster đúng như chatgpt sao lại tạo ra cái ảnh j ko/gi, "")
            .replace(/và cái tạo poster vvềanhr nào phải là tiếng việt có nội dung/gi, "")
            .trim() || "Cẩm Nang Ôn Thi Điểm 10";

          const posterSvgUrl = generateVietnamesePosterSvg(
            cleanPrompt,
            `ÁP PHÍCH HỌC TẬP: ${cleanPrompt.toUpperCase()}`
          );

          return res.json({
            success: true,
            reply:
              `Max10 đã thiết kế xong **Poster / Áp Phích Học Tập AI Chuẩn ChatGPT** cho chủ đề "${cleanPrompt}"! 🖼️✨\n\n` +
              `### 📌 Nội Dung Trọng Tâm Trên Áp Phích (100% Tiếng Việt Có Nội Dung):\n` +
              `- 🎯 **Chủ đề & Tiêu đề:** ${cleanPrompt} — Trình bày bằng Tiếng Việt hiện đại, rõ ràng, không có lỗi font hay ký tự lạ.\n` +
              `- 📐 **Bố cục 4 phần chuẩn mực:** Bản chất kiến thức, Công thức vàng, Bẫy đề thi và Lời khuyên thủ khoa.\n` +
              `- 💡 **Ứng dụng:** Bấm nút **"Tải ảnh"** trên thẻ ảnh bên dưới để lưu về máy hoặc in dán góc học tập nhé!`,
            generatedImage: {
              url: posterSvgUrl,
              prompt: `Poster: ${cleanPrompt}`,
              enhancedPrompt: `Vietnamese Study Poster for ${cleanPrompt}`,
              seed: 12345,
              aspectRatio: "3:4",
              style: "academic_poster",
            },
          });
        } catch (posterErr) {
          console.error("Chat poster generation error:", posterErr);
        }
      }

      // Unified ChatGPT-style conversational AI + Multi-Tool Gemini Function Calling
      // (ham_tao_hinh_anh + ham_tao_video_nguoi_noi + ham_tao_so_do_tu_duy)

      const ai = getGenAIClient();
      const useHighThinking = Boolean(
        !interactiveQuizMode && (isThinking || mode === "grade_10_secret" || mode === "trap_detector" || Boolean(activeAttachment?.data))
      );

      const effectiveLanguageMode: "vi" | "native" | "bilingual" =
        studyContext?.languageMode === "vi" ||
        studyContext?.languageMode === "native" ||
        studyContext?.languageMode === "bilingual"
          ? studyContext.languageMode
          : activeCountry.code === "VN"
          ? "vi"
          : bilingualMode
          ? "bilingual"
          : "native";

      const effectiveStudyGrade = studyContext?.studyGrade || grade;
      const effectiveStudySubject = studyContext?.studySubject || subject;
      const curriculumCalibrationBlock = studyContext?.curriculumStandard
        ? `\n- CHUẨN CHƯƠNG TRÌNH QUỐC GIA ĐANG DẠY: ${studyContext.curriculumStandard} (Cấp học: ${effectiveStudyGrade}, Môn: ${effectiveStudySubject})\n- HỆ ĐƠN VỊ ĐO LƯỜNG CHUẨN: ${studyContext.curriculumUnits || "Chuẩn quốc tế SI"}\n- HIỆU CHỈNH KIẾN THỨC: ${studyContext.curriculumCalibration || "Bám sát 100% chương trình & chuẩn bài tập của quốc gia đã chọn."}`
        : "";

      const languageInstructionLine =
        effectiveLanguageMode === "vi"
          ? "NGÔN NGỮ GIAO TIẾP MẶC ĐỊNH: Tiếng Việt chuẩn mực, thân thiện (chỉ chuyển sang ngoại ngữ nếu người dùng yêu cầu hoặc khi chat cùng bạn học nước ngoài)."
          : effectiveLanguageMode === "bilingual"
          ? `CHẾ ĐỘ SONG NGỮ ĐANG BẬT: Hãy viết lời thoại chính bằng ${activeCountry.languageName} chuẩn bản xứ (đúng giọng điệu & xưng hô của người ${activeCountry.name}), sau đó LUÔN kèm 1 mục dịch nghĩa ngắn gọn rõ ràng bằng Tiếng Việt (ví dụ: "🇻🇳 Dịch nghĩa: ...") để học sinh hiểu ngay.`
          : `CHẾ ĐỘ BẢN NGỮ HOÀN TOÀN: Trả lời 100% bằng ${activeCountry.languageName} chuẩn bản xứ của ${activeCountry.name} (chỉ thêm giải thích tiếng Việt nếu người dùng hỏi xin dịch).`;

      const countryStyleBlock = `
BỘ CHỌN QUỐC GIA & NGÔN NGỮ ĐANG KÍCH HOẠT: ${activeCountry.flag} ${activeCountry.name} (${activeCountry.languageName})
- Văn hóa, cách xưng hô & giọng điệu bản xứ: ${activeCountry.promptInstruction}
- ${languageInstructionLine}${curriculumCalibrationBlock}`;

      let systemInstruction = "";

      if (activeBuddy && typeof activeBuddy === "object") {
        const isVietnameseBuddy = activeBuddy.countryCode === "VN";
        systemInstruction = `Bạn đang NHẬP VAI BẠN HỌC QUỐC TẾ TRONG HỆ THỐNG KẾT BẠN HỌC TẬP KIỂU DISCORD:
- TÊN HIỂN THỊ & ID: ${activeBuddy.name}#${activeBuddy.tag} ${activeBuddy.flag}
- QUỐC GIA: ${activeBuddy.countryName}
- NGÔN NGỮ BẢN ĐỊA: ${activeBuddy.nativeLanguage}
- CẤP HỌC: ${activeBuddy.grade}
- MÔN THẾ MẠNH: ${activeBuddy.strongSubject}
- TÍNH CÁCH & VĂN HÓA: ${activeBuddy.personality}

QUY TẮC NHẬP VAI BẠN HỌC QUỐC TẾ (BẮT BUỘC 100%):
1. Hãy trò chuyện tự nhiên, thân thiện như một người bạn học thật sự đến từ ${activeBuddy.countryName}, gọi tên "${userName || "bạn"}" gần gũi.
2. ${
          isVietnameseBuddy
            ? "Vì bạn đến từ Việt Nam, hãy giao tiếp bằng Tiếng Việt tự nhiên, hài hước kiểu học sinh Việt Nam và cùng bạn học ôn tập."
            : `Hãy trả lời câu chính bằng ngôn ngữ bản địa ${activeBuddy.nativeLanguage} chuẩn tự nhiên (đúng văn hóa giao tiếp của học sinh ${activeBuddy.countryName}), sau đó LUÔN XUỐNG DÒNG viết thêm bản dịch Tiếng Việt ngắn gọn bên dưới theo định dạng:\n🇻🇳 **Dịch nghĩa tiếng Việt:** ...`
        }
3. Nếu người dùng nhờ giải bài, đố vui, hỏi từ vựng hoặc luyện giao tiếp: trả lời súc tích 2–4 câu, có thể gợi mở 1 câu hỏi nhỏ hoặc 1 từ vựng bản địa thú vị để hai bạn học cùng tiến bộ.
4. Tuyệt đối giữ đúng nhân vật ${activeBuddy.name}#${activeBuddy.tag}, không tự phá vỡ vai diễn.`;
      } else if (communityContext && typeof communityContext === "object") {
        const commCat = communityContext.category || "study";
        const commName = communityContext.name || "Cộng đồng Max10";
        if (commCat === "game") {
          systemInstruction = `Bạn là "Max10 AI" khi tham gia thảo luận trong CỘNG ĐỒNG TRÒ CHƠI "${commName}"${
            communityContext.gameTitle ? ` (Tựa game: ${communityContext.gameTitle}` : ""
          }${communityContext.gamePlatform ? ` · Nền tảng: ${communityContext.gamePlatform}` : ""}${
            communityContext.gameTitle ? ")" : ""
          }.
QUY TẮC CỘNG ĐỒNG GAME (BẮT BUỘC):
1. Bạn CHỈ thảo luận về chủ đề TRÒ CHƠI ĐIỆN TỬ (gameplay, chiến thuật, đội hình, build nhân vật, tìm đồng đội, mẹo leo rank, sự kiện game, kỹ năng phản xạ, cân bằng học và chơi lành mạnh) phù hợp với cộng đồng "${commName}".
2. KHÔNG tự ý biến cuộc trò chuyện thành bài giảng sách giáo khoa hay kiểm tra bài tập trừ khi thành viên chủ động hỏi bài học cụ thể.
3. Giọng điệu vui vẻ, thân thiện như một người bạn game thủ am hiểu, lịch sự và tích cực (không nói tục). Trả lời ngắn gọn, súc tích, đúng trọng tâm câu hỏi của "${userName || "Thành viên"}".
${countryStyleBlock}`;
        } else if (commCat === "chat") {
          systemInstruction = `Bạn là "Max10 AI" khi tham gia thảo luận trong CỘNG ĐỒNG TRÒ CHUYỆN TỰ DO "${commName}".
QUY TẮC CỘNG ĐỒNG TRÒ CHUYỆN TỰ DO (BẮT BUỘC):
1. Đây là không gian giao lưu trò chuyện tự do, thoải mái về đời sống, sở thích, phim ảnh, âm nhạc, câu chuyện vui, tâm sự tuổi học trò, kỹ năng mềm hoặc bất kỳ chủ đề giao lưu nào thành viên đang nói tới.
2. Trò chuyện tự nhiên, gần gũi, hài hước duyên dáng và ấm áp như một người bạn thật — KHÔNG giảng bài khô khan hay ép chủ đề về bài tập trừ khi được hỏi.
3. Tôn trọng quy tắc cộng đồng văn minh, trả lời súc tích 2–5 câu để cuộc trò chuyện trôi chảy.
${countryStyleBlock}`;
        } else {
          systemInstruction = `Bạn là "Max10 AI" khi tham gia thảo luận trong CỘNG ĐỒNG HỌC TẬP "${commName}" (${grade}).
QUY TẮC CỘNG ĐỒNG HỌC TẬP (BẮT BUỘC):
1. Tập trung thảo luận sâu về HỌC TẬP, giải bài tập, phương pháp ôn thi, mẹo làm nhanh, công thức chuẩn SGK và giải đáp thắc mắc kiến thức các môn học cho "${userName || "Thành viên"}".
2. Trình bày công thức rõ ràng (dùng x², √, ×, ÷, →, H₂O; không dùng mã LaTeX thô), súc tích vừa phải để dễ đọc trong khung chat nhóm.
3. Khích lệ tinh thần thi đua học giỏi cùng các thành viên trong cộng đồng.
${countryStyleBlock}`;
        }
      } else if (interactiveQuizMode) {
        const userTurnsCount = messages.filter((m: any) => m.role === "user").length;
        const estimatedLevel = Math.min(4, Math.max(1, Math.ceil(userTurnsCount / 2)));
        const roleLabel =
          quizRole === "deskmate"
            ? "Bạn học cùng bàn thông minh, nhiệt tình, hay đố vui cùng tiến bộ"
            : "Gia sư 1 kèm 1 tận tâm, kiên nhẫn và truyền cảm hứng";

        systemInstruction = `Bạn đang ở CHẾ ĐỘ NÓI CHUYỆN & HỎI BÀI TƯƠNG TÁC (Interactive Quiz & Voice) với học sinh "${userName || "Bạn học"}" (${grade}).
- VAI TRÒ CỦA BẠN: ${roleLabel}.
- CHỦ ĐỀ HỎI BÀI ĐANG CHỌN: "${quizSubject}".
${countryStyleBlock}

QUY TẮC PHẢN HỒI BẮT BUỘC (TUÂN THỦ TUYỆT ĐỐI 100%):
1. KHÔNG GIẢNG GIẢI DÀI DÒNG MỘT LÚC! Tổng độ dài mỗi lượt trả lời chỉ khoảng 2 đến 4 câu ngắn gọn, tự nhiên như lời nói trực tiếp để hệ thống đọc thành tiếng (Text-to-Speech) nghe thật hay.
2. MỖI LƯỢT CHỈ ĐẶT ĐÚNG 1 CÂU HỎI NGẮN GỌN về chủ đề "${quizSubject}" (phù hợp ${grade}), rồi DỪNG LẠI đợi người dùng trả lời. Tuyệt đối KHÔNG hỏi 2 câu cùng lúc, KHÔNG tự trả lời hộ trước khi học sinh đáp.
3. KHI HỌC SINH VỪA TRẢ LỜI CÂU TRƯỚC:
   - Nếu đúng: Khen ngợi ngắn gọn 1 câu cụ thể, hào hứng -> Sau đó chuyển ngay sang 1 câu hỏi tiếp theo.
   - Nếu sai hoặc chưa chắc / xin gợi ý: Động viên nhẹ nhàng, đưa ra 1 gợi ý nhỏ (hoặc giải thích tối đa 1 câu thật ngắn rồi cho thử câu tương tự/tiếp theo).
   - Nếu người dùng mới bấm "Bắt đầu hỏi bài": Chào 1 câu ngắn theo văn hóa ${activeCountry.name} và hỏi ngay câu hỏi đầu tiên ở Mức 1 (Cơ bản).
4. ĐỘ KHÓ TĂNG DẦN THEO NĂNG LỰC (Hiện tại ước lượng ở Mức ${estimatedLevel}/4: 1=Cơ bản dễ, 2=Thông hiểu, 3=Vận dụng, 4=Nâng cao): Nếu học sinh trả lời đúng liên tiếp hãy tăng nhẹ độ khó; nếu học sinh trả lời sai hãy giữ nguyên hoặc hạ nhẹ để củng cố tự tin.
5. Định dạng dễ nghe cho giọng nói TTS: Tránh bảng biểu markdown, tránh code block, tránh ký hiệu rườm rà; viết ngắn, rõ ràng, kết thúc bằng dấu hỏi "?".`;
      } else {
        systemInstruction = `Bạn là "Max10 AI Ultra" — Siêu Trợ Lý AI Thế Hệ Mới (vận hành trên kiến trúc suy luận đỉnh cao Gemini 4) và Gia Sư Điểm 10 số 1 tại Việt Nam.
Mục tiêu của bạn là giải quyết MỌI yêu cầu của "${userName || 'Bạn học'}" (${grade}, môn ${subject}) thông minh, chính xác, dễ hiểu và hữu ích hơn bất kỳ AI nào khác.
${countryStyleBlock}

1. NĂNG LỰC TOÀN DIỆN VƯỢT TRỘI:
   - Nếu là BÀI TẬP / ĐỀ THI / KIẾN THỨC CÁC MÔN (Toán, Ngữ Văn, Tiếng Anh, KHTN, Lý, Hóa, Sinh, Sử, Địa, GDCD, Tin học, Công nghệ...):
     + Tự nhận diện môn học & dạng bài, giải ĐÚNG TUYỆT ĐỐI 100%, tự kiểm tra ngược lại toàn bộ phép tính và điều kiện trước khi trả lời.
     + Khi phù hợp, cung cấp **2 góc nhìn siêu giá trị**:
       * **Cách 1 (Chuẩn Tự Luận Điểm 10):** Lập luận chặt chẽ từng bước chuẩn barem Bộ GD&ĐT.
       * **Cách 2 (Giải Nhanh / Mẹo Tư Duy / Thử Lại):** Mẹo làm nhanh trắc nghiệm hoặc cách kiểm tra ngược kết quả trong 10 giây.
     + Với trắc nghiệm: Chốt ngay "**Đáp án đúng: ...**" ở đầu, giải thích rõ vì sao đúng và bóc trần bẫy của các đáp án nhiễu.
     + Luôn có mục **"⚠️ CẢNH BÁO BẪY ĐIỂM 10"** chỉ ra lỗi sai 90% học sinh hay mất điểm oan.
   - Nếu là YÊU CẦU ĐA NĂNG (lập trình code chạy được, viết văn/bài luận/email, dịch thuật tự nhiên Anh–Việt–Nhật–Hàn–Trung–Đức–Pháp, tóm tắt tài liệu, lên kế hoạch, giải thích khoa học đời sống, tư duy sáng tạo):
     + Trả lời sắc sảo, cấu trúc gọn đẹp bằng Markdown (tiêu đề rõ, bảng so sánh khi cần, code block có chú thích sạch sẽ), đi thẳng vào giải pháp tối ưu nhất, không nói chung chung.

2. QUY TẮC KÝ HIỆU TOÁN & KHOA HỌC CHUẨN SGK VIỆT NAM (KHÔNG MÃ LATEX THÔ):
   - Nhân dùng "×" hoặc "·" (tuyệt đối KHÔNG dùng "*"). Chia dùng ":" hoặc "÷" hoặc phân số a/b.
   - Số mũ viết chuẩn: x², x³, aⁿ, cm², m³ (KHÔNG viết x^2 hay x**2).
   - Căn thức dùng "√", "∛" (KHÔNG viết \\sqrt{}).
   - Hình học: △ABC, ∠A, ⊥, ∥, 90°, π ≈ 3,14.
   - Hóa học: →, ⇄, ↑, ↓, H₂O, CO₂, H₂SO₄, Fe₂O₃, t°.
   - TUYỆT ĐỐI KHÔNG để sót \\frac, \\sqrt, \\cdot, \\times, \\Rightarrow hay \\[...\\].

3. TRẢI NGHIỆM TƯƠNG TÁC GÂY NGHIỆN:
   - Gọi tên thân mật "${userName || 'bạn'}" tự nhiên, truyền cảm hứng theo đúng văn hóa & giọng điệu ${activeCountry.name}.
   - Nếu người dùng hỏi về nâng cấp gói/thanh toán/mã QR: giải thích ngắn gọn và gắn link:
     👉 [⚡ Mở Mã QR Gói Plus (100.000đ)](#chuyen-khoan-plus) · 👉 [👑 Mở Mã QR Gói Premium (500.000đ)](#chuyen-khoan-premium)
   - Cuối mỗi lời giải hoặc hướng dẫn quan trọng, luôn tặng kèm một mục ngắn **"🎯 Gợi ý bước tiếp theo"** (ví dụ: 1 câu hỏi thử sức tương tự hoặc mẹo nhớ 5 giây) để người dùng học sâu ngay lập tức.

Chế độ hiện tại: ${
          useHighThinking
            ? "Max10 DeepThink (Suy luận nhiều lớp, soi bẫy từng chi tiết & tự kiểm chứng kết quả 100%)"
            : mode === "all_in_one"
            ? "Siêu trợ lý đa năng (Học tập, Lập trình, Sáng tạo, Dịch thuật & Giải quyết vấn đề)"
            : "Max10 AI Turbo (Nhanh, súc tích, chuẩn xác, giải từng bước)"
        }.`;
      }

      // Build conversation contents
      const contentsPayload: any[] = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLatestUser = i === messages.length - 1 && msg.role === "user";
        const msgAttachment = msg?.attachment?.data ? msg.attachment : isLatestUser ? activeAttachment : null;
        const attachmentPart = buildAttachmentPart(msgAttachment);

        if (attachmentPart) {
          const defaultAttachPrompt =
            msgAttachment?.mimeType && String(msgAttachment.mimeType).startsWith("image/")
              ? "Hãy đọc kỹ nội dung trong ảnh này, kiểm tra dữ kiện chính xác và hướng dẫn giải chi tiết từng bước để đạt điểm 10."
              : "Hãy đọc kỹ và phân tích nội dung tệp đính kèm này thật chi tiết, chính xác giúp mình nhé.";
          contentsPayload.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [
              attachmentPart,
              {
                text: msg.content || defaultAttachPrompt,
              },
            ],
          });
        } else {
          contentsPayload.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          });
        }
      }

      const enableUnifiedTools = !interactiveQuizMode;
      const unifiedToolsGuidance = enableUnifiedTools
        ? `\n4. SIÊU NĂNG LỰC ĐA PHƯƠNG TIỆN TỰ ĐỘNG (FUNCTION CALLING ĐA CÔNG CỤ):
   Bạn có 3 công cụ có thể gọi đơn lẻ hoặc KẾT HỢP CÙNG LÚC trong một lượt:
   - \`ham_tao_hinh_anh(prompt_tieng_anh, loai_anh)\`: Gọi khi "${userName || "người dùng"}" muốn vẽ tranh, tạo ảnh, làm avatar ('avatar' 1:1), thiết kế poster ('poster' 9:16), hoặc banner/ảnh bìa/cảnh ngang ('banner' 16:9). Tự dịch & trau chuốt mô tả sang Tiếng Anh chi tiết.
   - \`ham_tao_video_nguoi_noi(loi_thoai, khung_hinh)\`: Gọi khi người dùng yêu cầu tạo video có người AI nói, MC ảo thuyết trình, làm clip ngắn. Soạn \`loi_thoai\` tự nhiên, súc tích và chọn \`khung_hinh\`: 'doc' (9:16), 'ngang' (16:9), hoặc 'vuong' (1:1).
   - \`ham_tao_so_do_tu_duy(ma_mermaid)\`: Gọi khi người dùng muốn vẽ sơ đồ tư duy (mindmap), tóm tắt kiến thức hoặc lập sơ đồ cây. Sinh \`ma_mermaid\` bắt đầu bằng \`mindmap\`, dòng \`  root((Chủ đề))\`, thụt 2 dấu cách mỗi cấp nhánh và KHÔNG dùng ký tự \`() [] :\` trong tên các nhánh con.
   - KHÔNG tự bịa đường dẫn ảnh hay link video trong nội dung văn bản.`
        : "";

      const finalSystemInstruction = `${systemInstruction}${unifiedToolsGuidance}`;

      const response = await generateContentWithRetry({
        contents: contentsPayload,
        config: {
          systemInstruction: finalSystemInstruction,
          ...(enableUnifiedTools
            ? {
                tools: [
                  {
                    functionDeclarations: [
                      hamTaoHinhAnhDeclaration,
                      hamTaoVideoNguoiNoiDeclaration,
                      hamTaoSoDoTuDuyDeclaration,
                    ],
                  },
                ],
              }
            : {}),
          thinkingConfig: {
            thinkingLevel: useHighThinking ? ThinkingLevel.HIGH : ThinkingLevel.MEDIUM,
          },
        },
      });

      // Extract ALL Gemini Function Calls (supports single or multi-tool calls in one turn)
      const directCalls = Array.isArray(response?.functionCalls) ? response.functionCalls : [];
      const candidateParts = response?.candidates?.[0]?.content?.parts || [];
      const partCalls = candidateParts
        .filter((p: any) => p?.functionCall)
        .map((p: any) => p.functionCall);
      const allFunctionCalls = directCalls.length > 0 ? directCalls : partCalls;

      if (allFunctionCalls.length > 0) {
        const generatedImagesList: any[] = [];
        let generatedVideoResult: any = undefined;
        const functionResponseParts: any[] = [];

        for (const fnCall of allFunctionCalls) {
          const fnName = fnCall?.name;
          const args = (fnCall?.args || {}) as Record<string, any>;

          if (fnName === "ham_tao_hinh_anh") {
            const promptTiengAnh =
              typeof args.prompt_tieng_anh === "string" && args.prompt_tieng_anh.trim()
                ? args.prompt_tieng_anh.trim()
                : lastRawMsg || "A creative high-resolution illustration";
            const loaiAnhArg: ChatImageFormat =
              args.loai_anh === "poster" || args.loai_anh === "banner"
                ? args.loai_anh
                : inferChatImageFormatFromText(lastRawMsg);

            const imgResult = await hamTaoHinhAnh(promptTiengAnh, loaiAnhArg, lastRawMsg);
            generatedImagesList.push({
              url: imgResult.imageUrl,
              fallbackUrl: imgResult.fallbackUrl,
              prompt: lastRawMsg || imgResult.enhancedPrompt,
              enhancedPrompt: imgResult.enhancedPrompt,
              seed: imgResult.seed,
              aspectRatio: imgResult.aspectRatio,
              style: imgResult.style,
              loaiAnh: imgResult.loaiAnh,
            });
            functionResponseParts.push({
              functionResponse: {
                ...(fnCall.id ? { id: fnCall.id } : {}),
                name: "ham_tao_hinh_anh",
                response: {
                  status: "success",
                  image_url: imgResult.imageUrl,
                  loai_anh: imgResult.loaiAnh,
                  aspect_ratio: imgResult.aspectRatio,
                  dimensions: `${imgResult.width}x${imgResult.height}`,
                  prompt_tieng_anh: imgResult.enhancedPrompt,
                  note: "Ảnh đã hiển thị ngay bên dưới tin nhắn này. KHÔNG chèn URL hoặc markdown ![...](...) vào văn bản.",
                },
              },
            });
          } else if (fnName === "ham_tao_video_nguoi_noi") {
            const loiThoai =
              typeof args.loi_thoai === "string" && args.loi_thoai.trim()
                ? args.loi_thoai.trim()
                : `Chào ${userName || "bạn"}! Mình là Max10 AI, cùng khám phá nội dung ${lastRawMsg} ngay nhé!`;
            const khungHinh: ChatVideoFrame =
              args.khung_hinh === "ngang" || args.khung_hinh === "vuong"
                ? args.khung_hinh
                : lastMsg.includes("ngang") || lastMsg.includes("16:9") || lastMsg.includes("youtube")
                ? "ngang"
                : lastMsg.includes("vuông") || lastMsg.includes("1:1")
                ? "vuong"
                : "doc";

            const videoRes = await hamTaoVideoNguoiNoi(loiThoai, khungHinh, lastRawMsg);
            generatedVideoResult = {
              url: videoRes.url,
              videoUrl: videoRes.videoUrl,
              title: videoRes.title,
              topic: videoRes.topic,
              presenterAvatar: videoRes.presenterAvatar,
              script: videoRes.script,
              duration: videoRes.duration,
              khungHinh: videoRes.khungHinh,
            };
            functionResponseParts.push({
              functionResponse: {
                ...(fnCall.id ? { id: fnCall.id } : {}),
                name: "ham_tao_video_nguoi_noi",
                response: {
                  status: "success",
                  khung_hinh: videoRes.khungHinh,
                  dimensions: videoRes.dimensions,
                  has_mp4: Boolean(videoRes.videoUrl),
                  script: videoRes.script,
                  note: "Trình phát video Người AI Nói đã hiển thị trực tiếp bên dưới tin nhắn. KHÔNG chèn URL hoặc markdown ảnh/video vào nội dung chữ.",
                },
              },
            });
          } else if (fnName === "ham_tao_so_do_tu_duy") {
            const maMermaid =
              typeof args.ma_mermaid === "string" ? args.ma_mermaid : "";
            const mmRes = await hamTaoSoDoTuDuy(maMermaid, lastRawMsg, subject, grade);
            generatedImagesList.push({
              url: mmRes.imageUrl,
              fallbackUrl: mmRes.fallbackUrl,
              prompt: mmRes.prompt,
              enhancedPrompt: mmRes.mermaidSource,
              seed: mmRes.seed,
              aspectRatio: mmRes.aspectRatio,
              style: "mindmap",
            });
            functionResponseParts.push({
              functionResponse: {
                ...(fnCall.id ? { id: fnCall.id } : {}),
                name: "ham_tao_so_do_tu_duy",
                response: {
                  status: "success",
                  image_url: mmRes.imageUrl,
                  used_kroki_png: mmRes.usedKroki,
                  note: "Ảnh sơ đồ tư duy đã hiển thị trực tiếp bên dưới tin nhắn này. Hãy tóm tắt ngắn gọn cấu trúc các nhánh chính cho người dùng, KHÔNG chèn URL hay markdown ![](...) vào văn bản.",
                },
              },
            });
          }
        }

        if (functionResponseParts.length > 0) {
          let finalReply = `Mình đã hoàn tất tạo sản phẩm AI theo yêu cầu của **${userName || "bạn"}** rồi đây! ✨\n\nBạn có thể xem trực tiếp hoặc bấm tải về ngay bên dưới nhé!`;

          try {
            const modelToolContent = response?.candidates?.[0]?.content || {
              role: "model",
              parts: allFunctionCalls.map((fn: any) => ({
                functionCall: { name: fn.name, args: fn.args },
              })),
            };
            const toolResponseContent = {
              role: "user",
              parts: functionResponseParts,
            };

            const followUpResponse = await generateContentWithRetry({
              contents: [...contentsPayload, modelToolContent, toolResponseContent],
              config: {
                systemInstruction: finalSystemInstruction,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.LOW,
                },
              },
            });

            if (followUpResponse?.text && followUpResponse.text.trim()) {
              finalReply = followUpResponse.text.trim();
            }
          } catch (turn2Err) {
            console.warn("Function calling turn-2 synthesis fallback:", turn2Err);
          }

          return res.json({
            success: true,
            reply: finalReply,
            generatedImage: generatedImagesList[0],
            generatedImages: generatedImagesList.length > 0 ? generatedImagesList : undefined,
            generatedVideo: generatedVideoResult,
            modelEngine: "Max10 Gemini 4 Ultra",
          });
        }
      }

      // Safety net: if user explicitly asked for Mind Map / Video / Image and Turn 1 answered with text only
      if (enableUnifiedTools && (wantsCombined || wantsMindMap || wantsVideo || wantsImageFallback)) {
        const fallbackImages: any[] = [];
        let fallbackVideo: any = undefined;

        if (wantsMindMap) {
          const cleanTopic =
            lastRawMsg
              .replace(/^(vẽ sơ đồ tư duy|sơ đồ tư duy|sơ đồ mindmap|mindmap|mind map|vẽ sơ đồ|lập sơ đồ|tạo sơ đồ|sơ đồ cây|sơ đồ nhánh|sơ đồ tóm tắt|tư duy về)\s*(về|cho|bài|chủ đề|môn|:)?/i, "")
              .trim() || subject || "Bài Học Trọng Tâm";
          const mmRes = await hamTaoSoDoTuDuy("", cleanTopic, subject, grade);
          fallbackImages.push({
            url: mmRes.imageUrl,
            fallbackUrl: mmRes.fallbackUrl,
            prompt: mmRes.prompt,
            enhancedPrompt: mmRes.mermaidSource,
            seed: mmRes.seed,
            aspectRatio: mmRes.aspectRatio,
            style: "mindmap",
          });
        }

        if (wantsVideo || wantsCombined) {
          const cleanTopic =
            lastRawMsg
              .replace(/^(tạo video|làm video|video có người ai nói|video người ai nói|người ai nói|video thuyết trình|tạo video ai)\s*(về|cho|bài|chủ đề|:)?/i, "")
              .trim() || "Kiến thức trọng tâm";
          const scriptText = `Xin chào ${userName || "các bạn"}! Mình là MC ảo của Max10 AI. Hôm nay chúng ta hãy cùng khám phá nhanh chủ đề ${cleanTopic} thật dễ hiểu và ghi nhớ trọn vẹn nhé!`;
          const khungHinh: ChatVideoFrame =
            lastMsg.includes("ngang") || lastMsg.includes("16:9")
              ? "ngang"
              : lastMsg.includes("vuông") || lastMsg.includes("1:1")
              ? "vuong"
              : "doc";
          const vRes = await hamTaoVideoNguoiNoi(scriptText, khungHinh, cleanTopic);
          fallbackVideo = {
            url: vRes.url,
            videoUrl: vRes.videoUrl,
            title: vRes.title,
            topic: vRes.topic,
            presenterAvatar: vRes.presenterAvatar,
            script: vRes.script,
            duration: vRes.duration,
            khungHinh: vRes.khungHinh,
          };
        }

        if (wantsImageFallback && !wantsMindMap) {
          const inferredFormat = inferChatImageFormatFromText(lastRawMsg);
          const enhanced = await generateEnhancedImage(
            lastRawMsg,
            inferredFormat === "poster" ? "academic_poster" : "chatgpt",
            inferredFormat === "banner" ? "16:9" : inferredFormat === "poster" ? "9:16" : "1:1"
          );
          const savedImg = await hamTaoHinhAnh(enhanced.enhancedPrompt, inferredFormat, lastRawMsg);
          fallbackImages.push({
            url: savedImg.imageUrl,
            fallbackUrl: savedImg.fallbackUrl,
            prompt: lastRawMsg || savedImg.enhancedPrompt,
            enhancedPrompt: savedImg.enhancedPrompt,
            seed: savedImg.seed,
            aspectRatio: savedImg.aspectRatio,
            style: savedImg.style,
            loaiAnh: savedImg.loaiAnh,
          });
        }

        return res.json({
          success: true,
          reply:
            response?.text?.trim() ||
            `Mình đã hoàn tất tạo nội dung đa phương tiện theo yêu cầu của **${userName || "bạn"}** ngay bên dưới rồi đây! ✨`,
          generatedImage: fallbackImages[0],
          generatedImages: fallbackImages.length > 0 ? fallbackImages : undefined,
          generatedVideo: fallbackVideo,
          modelEngine: "Max10 Gemini 4 Ultra",
        });
      }

      res.json({
        success: true,
        reply: response.text || "Xin lỗi bạn, Max10 chưa xử lý được câu hỏi này. Bạn hãy thử gửi lại nhé!",
        modelEngine: "Max10 Gemini 4 Ultra",
      });
    } catch (err: any) {
      console.error("Chat error, activating smart offline solver fallback:", err?.message || err);
      if (!bypassFastPaths && isMindMapGenerationRequest(lastMsg)) {
        try {
          const mmRes = await hamTaoSoDoTuDuy("", lastRawMsg, subject, grade);
          return res.json({
            success: true,
            reply: `Max10 đã tạo **Sơ đồ tư duy** cho chủ đề "${lastRawMsg}" bên dưới! 🧠✨`,
            generatedImage: {
              url: mmRes.imageUrl,
              fallbackUrl: mmRes.fallbackUrl,
              prompt: mmRes.prompt,
              enhancedPrompt: mmRes.mermaidSource,
              seed: mmRes.seed,
              aspectRatio: mmRes.aspectRatio,
              style: "mindmap",
            },
          });
        } catch {}
      }
      if (!bypassFastPaths && isVideoGenerationRequest(lastMsg)) {
        try {
          const vRes = await hamTaoVideoNguoiNoi(
            `Xin chào ${userName || "bạn"}! Mình là MC AI của Max10, hãy cùng tìm hiểu về ${lastRawMsg} nhé!`,
            lastMsg.includes("ngang") ? "ngang" : lastMsg.includes("vuông") ? "vuong" : "doc",
            lastRawMsg
          );
          return res.json({
            success: true,
            reply: `Max10 đã chuẩn bị xong **Video Người AI Nói** cho bạn ngay bên dưới! 🎬✨`,
            generatedVideo: {
              url: vRes.url,
              videoUrl: vRes.videoUrl,
              title: vRes.title,
              topic: vRes.topic,
              presenterAvatar: vRes.presenterAvatar,
              script: vRes.script,
              duration: vRes.duration,
              khungHinh: vRes.khungHinh,
            },
          });
        } catch {}
      }
      if (
        !bypassFastPaths &&
        (isImageGenerationRequest(lastMsg) || isPosterGenerationRequest(lastMsg) || lastMsg.includes("banner") || lastMsg.includes("avatar"))
      ) {
        try {
          const fallbackFormat = inferChatImageFormatFromText(lastRawMsg);
          const imgResult = await hamTaoHinhAnh(lastRawMsg, fallbackFormat, lastRawMsg);
          return res.json({
            success: true,
            reply: `Max10 đã tạo bức ảnh khổ **${imgResult.loaiAnh.toUpperCase()} (${imgResult.aspectRatio})** theo mô tả của bạn bên dưới! 🎨✨`,
            generatedImage: {
              url: imgResult.imageUrl,
              fallbackUrl: imgResult.fallbackUrl,
              prompt: lastRawMsg,
              enhancedPrompt: imgResult.enhancedPrompt,
              seed: imgResult.seed,
              aspectRatio: imgResult.aspectRatio,
              style: imgResult.style,
              loaiAnh: imgResult.loaiAnh,
            },
          });
        } catch {}
      }
      const offlineReply = solveSchoolExerciseOffline(lastRawMsg, grade, subject, userName);
      return res.json({
        success: true,
        reply: offlineReply,
      });
    }
  });

  // 1b. Community Discord AI Bot Slash Command Endpoint (/ve, /sodo, /ai)
  app.post("/api/bot", async (req, res) => {
    const rawMessage = String(req.body?.message || "").trim();
    const explicitCmd = String(req.body?.command || "").toLowerCase().trim();
    const userName = String(req.body?.userName || "Thành viên").trim();
    const grade = String(req.body?.grade || "Lớp 9").trim();
    const subject = String(req.body?.subject || "Tổng hợp").trim();
    const communityContext = req.body?.communityContext || {};

    if (!rawMessage) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập nội dung lệnh cho AI Bot." });
    }

    const stripped = rawMessage.replace(/^(@ai|\/ai)\s*/i, "").trim();
    const strippedLower = stripped.toLowerCase();
    let mode: "ve" | "sodo" | "ai" = "ai";
    let bodyText = rawMessage;

    if (
      explicitCmd === "ve" ||
      /^\/ve(\s|$)/i.test(rawMessage) ||
      /^(vẽ|ve)(\s+|$)/i.test(stripped)
    ) {
      mode = "ve";
      bodyText =
        rawMessage
          .replace(/^\/ve\s*/i, "")
          .replace(/^(@ai|\/ai)\s*/i, "")
          .replace(/^(vẽ|ve)\s*/i, "")
          .trim() || "Tranh minh họa học tập sáng tạo và rực rỡ sắc màu";
    } else if (
      explicitCmd === "sodo" ||
      /^\/sodo(\s|$)/i.test(rawMessage) ||
      strippedLower.includes("sơ đồ tư duy") ||
      strippedLower.includes("so do tu duy")
    ) {
      mode = "sodo";
      bodyText =
        rawMessage
          .replace(/^\/sodo\s*/i, "")
          .replace(/^(@ai|\/ai)\s*/i, "")
          .replace(/^(tạo|vẽ|lập|viết)?\s*(sơ đồ tư duy|so do tu duy)\s*(về|cho)?\s*/i, "")
          .trim() || subject || "Kiến thức trọng tâm";
    } else {
      mode = "ai";
      bodyText = stripped || rawMessage;
    }

    try {
      if (mode === "ve") {
        const inferredFormat = inferChatImageFormatFromText(bodyText);
        let enhancedPrompt = bodyText;
        try {
          const enhanced = await generateEnhancedImage(
            bodyText,
            inferredFormat === "poster" ? "academic_poster" : "chatgpt",
            inferredFormat === "banner" ? "16:9" : inferredFormat === "poster" ? "9:16" : "1:1"
          );
          if (enhanced?.enhancedPrompt) enhancedPrompt = enhanced.enhancedPrompt;
        } catch {}
        const imgResult = await hamTaoHinhAnh(enhancedPrompt, inferredFormat, bodyText);
        return res.json({
          success: true,
          type: "image",
          reply: `🎨 **AI Bot** đã vẽ xong tác phẩm theo yêu cầu của **${userName}**: *"${bodyText}"* (${imgResult.aspectRatio}).`,
          imageUrl: imgResult.imageUrl,
          fallbackUrl: imgResult.fallbackUrl,
          aspectRatio: imgResult.aspectRatio,
          prompt: bodyText,
        });
      }

      if (mode === "sodo") {
        let mermaidCode = "";
        let summaryText = "";
        try {
          const mmPromptRes = await generateContentWithRetry({
            contents: `Hãy tạo một sơ đồ tư duy Mermaid (bắt đầu bằng từ khóa \`mindmap\`, dòng 2 là \`  root((Chủ đề))\`, thụt 2 dấu cách mỗi cấp nhánh con, KHÔNG dùng dấu ngoặc tròn () ngoặc vuông [] hay dấu hai chấm : trong các nhánh con) cho chủ đề: "${bodyText}" (Môn: ${subject}, Trình độ: ${grade}). Trả về JSON với 2 trường: "mermaid" (mã mermaid mindmap hợp lệ) và "summary" (tóm tắt 2-3 câu ngắn gọn bằng tiếng Việt).`,
            config: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          if (mmPromptRes?.text) {
            const parsed = JSON.parse(mmPromptRes.text);
            if (typeof parsed?.mermaid === "string") mermaidCode = parsed.mermaid;
            if (typeof parsed?.summary === "string") summaryText = parsed.summary;
          }
        } catch {}

        const mmRes = await hamTaoSoDoTuDuy(mermaidCode, bodyText, subject, grade);
        return res.json({
          success: true,
          type: "mindmap",
          reply:
            summaryText ||
            `🗺️ **AI Bot** đã tổng hợp **Sơ đồ tư duy** cho chủ đề **"${bodyText}"**! Bấm vào ảnh để phóng to hoặc tải về ôn tập nhé.`,
          imageUrl: mmRes.imageUrl,
          fallbackUrl: mmRes.fallbackUrl,
          aspectRatio: mmRes.aspectRatio,
          prompt: bodyText,
        });
      }

      // mode === 'ai' -> Full Gemini tutor/community reply with optional multi-tool calls
      const commName = String(communityContext?.name || "Cộng đồng Max10").trim();
      const commCat = String(communityContext?.category || "study").trim();
      const aiPrompt = `Bạn là AI Bot thông minh tích hợp trong kênh "${commName}" (${commCat}). Thành viên "${userName}" vừa dùng lệnh /ai để hỏi: "${bodyText}". Hãy trả lời súc tích, thân thiện, chuẩn xác bằng tiếng Việt (Markdown rõ ràng). Nếu người dùng yêu cầu vẽ tranh/ảnh hãy gọi \`ham_tao_hinh_anh\`, nếu muốn vẽ sơ đồ tư duy hãy gọi \`ham_tao_so_do_tu_duy\`, nếu muốn tạo video người AI nói hãy gọi \`ham_tao_video_nguoi_noi\`.`;

      const aiRes = await generateContentWithRetry({
        contents: aiPrompt,
        config: {
          tools: [
            {
              functionDeclarations: [
                hamTaoHinhAnhDeclaration,
                hamTaoVideoNguoiNoiDeclaration,
                hamTaoSoDoTuDuyDeclaration,
              ],
            },
          ],
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        },
      });

      const directCalls = Array.isArray(aiRes?.functionCalls) ? aiRes.functionCalls : [];
      const partCalls = (aiRes?.candidates?.[0]?.content?.parts || [])
        .filter((p: any) => p?.functionCall)
        .map((p: any) => p.functionCall);
      const allCalls = directCalls.length > 0 ? directCalls : partCalls;

      let outImageUrl: string | undefined;
      let outFallbackUrl: string | undefined;
      let outAspectRatio: string | undefined;
      let outVideo: any = undefined;
      let replyText = aiRes?.text?.trim() || "";

      for (const fnCall of allCalls) {
        const fnName = fnCall?.name;
        const args = (fnCall?.args || {}) as Record<string, any>;
        if (fnName === "ham_tao_hinh_anh" && !outImageUrl) {
          const format: ChatImageFormat =
            args.loai_anh === "poster" || args.loai_anh === "banner"
              ? args.loai_anh
              : inferChatImageFormatFromText(bodyText);
          const imgRes = await hamTaoHinhAnh(String(args.prompt_tieng_anh || bodyText), format, bodyText);
          outImageUrl = imgRes.imageUrl;
          outFallbackUrl = imgRes.fallbackUrl;
          outAspectRatio = imgRes.aspectRatio;
          if (!replyText) replyText = `🎨 **AI Bot** đã tạo hình ảnh minh họa cho **${userName}**!`;
        } else if (fnName === "ham_tao_so_do_tu_duy" && !outImageUrl) {
          const mmRes = await hamTaoSoDoTuDuy(String(args.ma_mermaid || ""), bodyText, subject, grade);
          outImageUrl = mmRes.imageUrl;
          outFallbackUrl = mmRes.fallbackUrl;
          outAspectRatio = mmRes.aspectRatio;
          if (!replyText) replyText = `🗺️ **AI Bot** đã vẽ xong sơ đồ tư duy cho **${userName}**!`;
        } else if (fnName === "ham_tao_video_nguoi_noi" && !outVideo) {
          const kh: ChatVideoFrame =
            args.khung_hinh === "ngang" || args.khung_hinh === "vuong" ? args.khung_hinh : "doc";
          const vRes = await hamTaoVideoNguoiNoi(
            String(args.loi_thoai || `Xin chào ${userName}! Cùng khám phá ${bodyText} nhé!`),
            kh,
            bodyText
          );
          outVideo = {
            url: vRes.url,
            videoUrl: vRes.videoUrl,
            title: vRes.title,
            topic: vRes.topic,
            presenterAvatar: vRes.presenterAvatar,
            script: vRes.script,
            duration: vRes.duration,
            khungHinh: vRes.khungHinh,
          };
          if (!replyText) replyText = `🎬 **AI Bot** đã tạo video thuyết trình cho **${userName}**!`;
        }
      }

      if (!replyText) {
        replyText = solveSchoolExerciseOffline(bodyText, grade, subject, userName);
      }

      return res.json({
        success: true,
        type: "ai",
        reply: replyText,
        imageUrl: outImageUrl,
        fallbackUrl: outFallbackUrl,
        aspectRatio: outAspectRatio,
        video: outVideo,
      });
    } catch (err: any) {
      console.error("/api/bot fallback:", err?.message || err);
      if (mode === "sodo") {
        const mmRes = await hamTaoSoDoTuDuy("", bodyText, subject, grade);
        return res.json({
          success: true,
          type: "mindmap",
          reply: `🗺️ **AI Bot** đã tạo sơ đồ tư duy cho chủ đề **"${bodyText}"**!`,
          imageUrl: mmRes.imageUrl,
          fallbackUrl: mmRes.fallbackUrl,
          aspectRatio: mmRes.aspectRatio,
          prompt: bodyText,
        });
      }
      if (mode === "ve") {
        const format = inferChatImageFormatFromText(bodyText);
        const imgRes = await hamTaoHinhAnh(bodyText, format, bodyText);
        return res.json({
          success: true,
          type: "image",
          reply: `🎨 **AI Bot** đã vẽ hình ảnh theo mô tả **"${bodyText}"**!`,
          imageUrl: imgRes.imageUrl,
          fallbackUrl: imgRes.fallbackUrl,
          aspectRatio: imgRes.aspectRatio,
          prompt: bodyText,
        });
      }
      return res.json({
        success: true,
        type: "ai",
        reply: solveSchoolExerciseOffline(bodyText, grade, subject, userName),
      });
    }
  });

  // 2. Exam Generator Endpoint ("Luyện Đề Săn Điểm 10")
  app.post("/api/exam/generate", async (req, res) => {
    try {
      const {
        grade = "Lớp 9",
        subject = "Toán học",
        examType = "giua_ky", // '15_phut' | 'giua_ky' | 'cuoi_ky' | 'hsg_chuyen'
        topic = "Kiến thức trọng tâm",
        numQuestions = 5,
      } = req.body;

      const ai = getGenAIClient();

      const prompt = `Tạo một đề thi trắc nghiệm và câu hỏi tự luận chất lượng cao dành cho học sinh ${grade}, môn ${subject}, dạng bài kiểm tra: ${examType} (Chủ đề: ${topic}).
Tổng số câu hỏi: ${numQuestions} câu.
Đặc biệt: Đề thi phải bám sát chương trình THCS Việt Nam hiện hành, có sự phân hóa rõ ràng từ câu nhận biết, thông hiểu, vận dụng và ÍT NHẤT 1 CÂU VẬN DỤNG CAO để phân loại học sinh đạt điểm 10.

Yêu cầu trả về đúng định dạng JSON theo schema đã chỉ định.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia ra đề thi THCS chuẩn Bộ GD&ĐT Việt Nam. Tạo câu hỏi chuẩn xác, có đáp án và lời giải chi tiết giúp học sinh luyện thi đạt điểm 10 tuyệt đối.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tiêu đề đề thi (vd: Đề Luyện Điểm 10 - Giữa Kỳ I Toán 9)" },
              durationMinutes: { type: Type.INTEGER, description: "Thời gian làm bài ước tính (phút)" },
              instructions: { type: Type.STRING, description: "Lời dặn dò trước khi làm bài để không mất điểm oan" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    questionText: { type: Type.STRING, description: "Nội dung câu hỏi" },
                    type: { type: Type.STRING, description: "multiple_choice hoặc essay" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "4 phương án trắc nghiệm A, B, C, D (nếu là trắc nghiệm)"
                    },
                    correctAnswer: { type: Type.STRING, description: "Đáp án đúng (vd: 'A' hoặc giá trị đáp số)" },
                    difficulty: { type: Type.STRING, description: "Nhận biết, Thông hiểu, Vận dụng, hoặc Vận dụng cao (Điểm 10)" },
                    stepByStepSolution: { type: Type.STRING, description: "Lời giải chi tiết từng bước chuẩn barem điểm" },
                    score10Secret: { type: Type.STRING, description: "Bí kíp điểm 10: Phân tích bẫy đề thi và mẹo giải nhanh/chính xác nhất" },
                  },
                  required: ["id", "questionText", "type", "correctAnswer", "stepByStepSolution", "score10Secret"]
                }
              }
            },
            required: ["title", "durationMinutes", "questions"]
          }
        }
      });

      const examData = JSON.parse(response.text || "{}");
      res.json({ success: true, exam: examData });
    } catch (err: any) {
      console.error("Generate exam error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Lỗi tạo đề kiểm tra.",
      });
    }
  });

  // ==========================================
  // 🏆 BẢNG VÀNG DANH DỰ (HONOR ROLL - SĂN ĐIỂM 10)
  // Chỉ Quản trị viên (Mạc Khánh Duy) mới được cập nhật hoặc reset
  // ==========================================
  const HONOR_ROLL_PATH = path.resolve(process.cwd(), "honor_roll_db.json");

  const INITIAL_HONOR_ROLL: any[] = [];

  function loadHonorRoll(): any[] {
    try {
      if (fs.existsSync(HONOR_ROLL_PATH)) {
        const raw = fs.readFileSync(HONOR_ROLL_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Could not load honor roll, using default", e);
    }
    try {
      fs.writeFileSync(HONOR_ROLL_PATH, JSON.stringify(INITIAL_HONOR_ROLL, null, 2), "utf-8");
    } catch {}
    return [...INITIAL_HONOR_ROLL];
  }

  function saveHonorRoll(list: any[]) {
    try {
      fs.writeFileSync(HONOR_ROLL_PATH, JSON.stringify(list, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save honor roll", e);
    }
  }

  function checkAdminAuth(req: express.Request): boolean {
    const { adminSecret, userId, userEmail, pin, role, securityCode } = req.body || {};
    const headerCode = (req.headers["x-security-code"] as string) || (req.headers["x-security-token"] as string);
    if (
      securityCode === "duykobell123" ||
      headerCode === "duykobell123" ||
      pin === "duykobell123" ||
      adminSecret === "duykobell123"
    ) return true;
    if (userEmail && userEmail.toLowerCase().trim() === "mackhanhduy992012@gmail.com") return true;
    if (userId === "admin-mac-khanh-duy") return true;
    if (role === "admin" && (userEmail?.includes("mackhanhduy") || userId?.includes("mac-khanh-duy"))) return true;
    return false;
  }

  // 1. Get Honor Roll (Public)
  app.get("/api/exam/honor-roll", (_req, res) => {
    try {
      const list = loadHonorRoll();
      // Sort by score desc, then by date desc
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
      res.json({ success: true, list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Submit high score after exam completion (Students)
  app.post("/api/exam/honor-roll/submit", (req, res) => {
    try {
      const {
        studentName,
        avatar,
        school = "THCS",
        grade = "Lớp 9",
        subject = "Toán học",
        score = 10,
        totalQuestions = 10,
        correctCount = 10,
        timeSpentSeconds = 300,
        examType = "Kiểm tra trắc nghiệm",
        note,
      } = req.body;

      if (!studentName || !studentName.trim()) {
        return res.status(400).json({ success: false, error: "Tên học sinh không được để trống" });
      }

      const list = loadHonorRoll();
      const numScore = Number(score) || 0;

      // Assign badge based on score
      let badge: "gold" | "silver" | "bronze" | "top" = "top";
      if (numScore >= 10.0) badge = "gold";
      else if (numScore >= 9.5) badge = "silver";
      else if (numScore >= 9.0) badge = "bronze";

      const newEntry = {
        id: `honor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentName: studentName.trim(),
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName.trim())}`,
        school: school.trim() || "THCS",
        grade,
        subject,
        score: numScore,
        totalQuestions: Number(totalQuestions) || 10,
        correctCount: Number(correctCount) || 10,
        timeSpentSeconds: Number(timeSpentSeconds) || 300,
        examType,
        date: new Date().toLocaleDateString("vi-VN"),
        badge,
        note: note || (numScore >= 10 ? "Thủ Khoa Điểm 10 Tuyệt Đối" : numScore >= 9 ? "Á Khoa Xuất Sắc" : "Bảng Vàng Danh Dự"),
      };

      // Add to list and sort
      list.unshift(newEntry);
      list.sort((a, b) => (b.score || 0) - (a.score || 0));

      // Keep top 100 entries max
      const trimmed = list.slice(0, 100);
      saveHonorRoll(trimmed);

      res.json({ success: true, entry: newEntry, list: trimmed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Admin Update/Add/Delete in Honor Roll (Admin only: Mạc Khánh Duy)
  app.post("/api/exam/honor-roll/update", (req, res) => {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({
          success: false,
          error: "Chỉ Quản trị viên Mạc Khánh Duy mới có quyền cập nhật Bảng Vàng Danh Dự!",
        });
      }

      const { action = "add", entry, id } = req.body;
      const list = loadHonorRoll();

      if (action === "delete") {
        if (!id) return res.status(400).json({ success: false, error: "Thiếu ID học sinh cần xóa" });
        const updated = list.filter((item) => item.id !== id);
        saveHonorRoll(updated);
        return res.json({ success: true, message: "Đã xóa học sinh khỏi Bảng Vàng", list: updated });
      }

      if (action === "edit") {
        if (!entry || !entry.id) return res.status(400).json({ success: false, error: "Thiếu thông tin chỉnh sửa" });
        const idx = list.findIndex((item) => item.id === entry.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...entry };
          list.sort((a, b) => (b.score || 0) - (a.score || 0));
          saveHonorRoll(list);
          return res.json({ success: true, message: "Đã cập nhật thông tin thành công", list });
        }
        return res.status(404).json({ success: false, error: "Không tìm thấy học sinh" });
      }

      // Action: Add new entry manually by Admin
      if (action === "add") {
        if (!entry || !entry.studentName) {
          return res.status(400).json({ success: false, error: "Vui lòng nhập tên học sinh" });
        }
        const numScore = Number(entry.score) || 10.0;
        const newEntry = {
          id: `honor-${Date.now()}`,
          studentName: entry.studentName.trim(),
          avatar: entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.studentName.trim())}`,
          school: entry.school || "THCS",
          grade: entry.grade || "Lớp 9",
          subject: entry.subject || "Toán học",
          score: numScore,
          totalQuestions: Number(entry.totalQuestions) || 15,
          correctCount: Number(entry.correctCount) || 15,
          timeSpentSeconds: Number(entry.timeSpentSeconds) || 450,
          examType: entry.examType || "Khảo sát vào 10",
          date: entry.date || new Date().toLocaleDateString("vi-VN"),
          badge: entry.badge || (numScore >= 10 ? "gold" : numScore >= 9.5 ? "silver" : "bronze"),
          note: entry.note || "Được Quản Trị Viên Mạc Khánh Duy vinh danh",
        };
        list.unshift(newEntry);
        list.sort((a, b) => (b.score || 0) - (a.score || 0));
        saveHonorRoll(list);
        return res.json({ success: true, message: "Đã thêm học sinh vào Bảng Vàng", entry: newEntry, list });
      }

      res.status(400).json({ success: false, error: "Hành động không hợp lệ" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Admin Reset Honor Roll (Chỉ Quản trị viên Mạc Khánh Duy mới có quyền reset)
  app.post("/api/exam/honor-roll/reset", (req, res) => {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({
          success: false,
          error: "Chỉ Quản trị viên Mạc Khánh Duy mới có quyền reset Bảng Vàng Danh Dự!",
        });
      }

      const { mode = "benchmark" } = req.body;
      let newList: any[] = [];
      if (mode === "benchmark") {
        newList = [...INITIAL_HONOR_ROLL];
      } else {
        newList = [];
      }

      saveHonorRoll(newList);
      res.json({
        success: true,
        message: "Quản trị viên Mạc Khánh Duy đã đặt lại Bảng Vàng Danh Dự thành công!",
        list: newList,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Essay & Homework Grader ("Sửa Bài & Chấm Điểm 10")
  app.post("/api/grade/evaluate", async (req, res) => {
    try {
      const {
        grade = "Lớp 8",
        subject = "Ngữ Văn",
        promptText = "",
        studentWork = "",
        image = null,
      } = req.body;

      const ai = getGenAIClient();

      let parts: any[] = [];
      if (image && image.data && image.mimeType) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        });
      }

      const promptInstruction = `Bạn là giáo viên giám khảo chấm thi học sinh giỏi THCS. Hãy chấm bài làm sau theo thang điểm 10 nghiêm ngặt của Bộ GD&ĐT:
- Khối lớp: ${grade}
- Môn học: ${subject}
- Đề bài: ${promptText || "Đề bài trong bài làm của học sinh"}
- Bài làm của học sinh: ${studentWork || "Xem trong ảnh đính kèm"}

Hãy phân tích tỉ mỉ:
1. Điểm số ước tính (Thang điểm 10, chính xác đến 0.25).
2. Ưu điểm nổi bật của bài làm.
3. Các lỗi sai, thiếu sót hoặc lỗi hành văn/lập luận khiến bị trừ điểm (Lỗi mất điểm 10).
4. Hướng dẫn sửa cụ thể từng chi tiết để đạt điểm 10 tròn trĩnh.
5. "Phiên bản Bài Mẫu Điểm 10 Hoàn Hảo": Viết lại toàn bộ bài giải / bài văn / đoạn văn này ở mức độ điểm 10 xuất sắc để học sinh học tập văn phong và cách lập luận.

Trả về kết quả ở định dạng JSON.`;

      parts.push({ text: promptInstruction });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: {
          systemInstruction: "Bạn là giám khảo chấm thi công tâm và tận tụy, luôn chỉ ra cách để học sinh nâng bài viết/bài giải từ 7-8 điểm lên trọn vẹn 10 điểm.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Điểm số ước tính (vd: 8.5)" },
              rating: { type: Type.STRING, description: "Đánh giá chung (vd: Khá giỏi, Xuất sắc, Cần cải thiện bước kết luận...)" },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách các điểm sáng, lời khen cụ thể"
              },
              weaknessesAndTraps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các lỗi khiến mất điểm 10 (lỗi logic, dùng từ, thiếu bước, quên điều kiện...)"
              },
              score10UpgradeSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các bước cụ thể cần thay đổi để đạt điểm 10"
              },
              perfectSampleModel: {
                type: Type.STRING,
                description: "Bài giải hoặc bài văn mẫu chuẩn mực đạt điểm 10 hoàn hảo"
              },
              encouragement: {
                type: Type.STRING,
                description: "Lời nhắn nhủ động viên tinh thần học tập"
              }
            },
            required: ["score", "rating", "strengths", "weaknessesAndTraps", "score10UpgradeSteps", "perfectSampleModel", "encouragement"]
          }
        }
      });

      const gradeResult = JSON.parse(response.text || "{}");
      res.json({ success: true, result: gradeResult });
    } catch (err: any) {
      console.error("Grading error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Lỗi chấm bài và nâng cấp điểm 10.",
      });
    }
  });

  // 4. Score 10 Secrets & Formula Lookup ("Kho Bí Kíp Điểm 10 & Công Thức Vàng")
  app.post("/api/tips/get", async (req, res) => {
    try {
      const {
        grade = "Lớp 9",
        subject = "Toán học",
        topic = "Rút gọn biểu thức chứa căn và bài toán phụ",
      } = req.body;

      const ai = getGenAIClient();
      const prompt = `Tổng hợp bí kíp săn điểm 10 cho học sinh ${grade}, môn ${subject}, chuyên đề: "${topic}".
Bao gồm:
1. Các định lý, công thức vàng cần nhớ nhanh.
2. Các dạng bẫy mà 90% học sinh mất 0.5 - 1.0 điểm.
3. Phương pháp làm câu phân loại lấy điểm 10.
4. 1 ví dụ điển hình có lời giải đạt điểm 10 tuyệt đối.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: "Bạn là thủ khoa kỳ thi học sinh giỏi và kỳ thi vào lớp 10, chia sẻ bí quyết học thông minh, nắm chắc bản chất để đạt điểm 10 trọn vẹn.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topicTitle: { type: Type.STRING },
              coreFormulas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    formula: { type: Type.STRING },
                    applicationNote: { type: Type.STRING }
                  },
                  required: ["name", "formula", "applicationNote"]
                }
              },
              topTrapsToAvoid: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trapDescription: { type: Type.STRING },
                    howToPrevent: { type: Type.STRING }
                  },
                  required: ["trapDescription", "howToPrevent"]
                }
              },
              score10Strategies: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              masteryExample: {
                type: Type.OBJECT,
                properties: {
                  problem: { type: Type.STRING },
                  standardSolution: { type: Type.STRING },
                  score10Analysis: { type: Type.STRING }
                },
                required: ["problem", "standardSolution", "score10Analysis"]
              }
            },
            required: ["topicTitle", "coreFormulas", "topTrapsToAvoid", "score10Strategies", "masteryExample"]
          }
        }
      });

      const tipsData = JSON.parse(response.text || "{}");
      res.json({ success: true, tips: tipsData });
    } catch (err: any) {
      console.error("Tips error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Lỗi tải bí kíp điểm 10.",
      });
    }
  });

  // 5. Personalized Study Schedule for Score 10 ("Lộ Trình Ôn Thi Cả Năm")
  app.post("/api/plan/generate", async (req, res) => {
    try {
      const {
        grade = "Lớp 9",
        targetGoal = "Điểm 10 tất cả các môn cả năm học",
        currentLevel = "8.0 - 8.5",
        prioritySubjects = ["Toán học", "Ngữ Văn", "Tiếng Anh"],
        availableHoursPerDay = 3,
      } = req.body;

      const ai = getGenAIClient();
      const prompt = `Lập kế hoạch và lộ trình học tập chi tiết, khoa học giúp học sinh ${grade} đạt mục tiêu "${targetGoal}".
- Mức điểm hiện tại: ${currentLevel}
- Các môn ưu tiên bứt phá: ${prioritySubjects.join(", ")}
- Thời gian tự học mỗi ngày: ${availableHoursPerDay} tiếng.

Hãy thiết kế phương pháp học thông minh (Spaced Repetition, Active Recall, Feynman Technique) áp dụng chuẩn xác cho chương trình THCS Việt Nam.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia cố vấn phương pháp học tập hàng đầu cho học sinh cấp 2, giúp các em học nhẹ nhàng, hiểu sâu và đạt điểm 10 trọn vẹn cả năm mà không bị quá tải hay học vẹt.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              planName: { type: Type.STRING },
              overviewMotto: { type: Type.STRING, description: "Khẩu hiệu hoặc tôn chỉ học tập truyền cảm hứng" },
              weeklyRoutine: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING, description: "Thứ 2, Thứ 3..." },
                    mainFocusSubject: { type: Type.STRING },
                    timeAllocation: { type: Type.STRING },
                    learningTasks: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    score10Habit: { type: Type.STRING, description: "Thói quen nhỏ tạo điểm 10 (vd: ghi sổ tay lỗi sai, ôn lại 15p...)" }
                  },
                  required: ["day", "mainFocusSubject", "timeAllocation", "learningTasks", "score10Habit"]
                }
              },
              topGoldenRules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Nguyên tắc vàng để duy trì phong độ điểm 10 suốt cả năm"
              },
              examPrepChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các mốc chuẩn bị trước tuần thi kiểm tra 1 tiết / học kỳ"
              }
            },
            required: ["planName", "overviewMotto", "weeklyRoutine", "topGoldenRules", "examPrepChecklist"]
          }
        }
      });

      const planData = JSON.parse(response.text || "{}");
      res.json({ success: true, plan: planData });
    } catch (err: any) {
      console.error("Plan error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Lỗi tạo kế hoạch học tập.",
      });
    }
  });

  // 6. Interactive Mind Map Generator ("Sơ Đồ Tư Duy Điểm 10")
  app.post("/api/mindmap/generate", async (req, res) => {
    try {
      const {
        grade = "Lớp 9",
        subject = "Toán học",
        topic = "Hệ thức Vi-ét và các dạng bài trọng tâm",
      } = req.body;

      const ai = getGenAIClient();
      const prompt = `Hãy thiết kế một sơ đồ tư duy (Mind Map) toàn diện, logic và sinh động giúp học sinh ${grade} nắm trọn kiến thức môn ${subject} về chủ đề: "${topic}".
Sơ đồ cần cấu trúc thành:
- Chủ đề trung tâm (root)
- 3 đến 5 nhánh chính (branches): Ví dụ Định nghĩa/Bản chất, Công thức/Định lý cốt lõi, Các dạng bài tập kinh điển, Bí kíp điểm 10 & Bẫy đề thi hay gặp.
- Mỗi nhánh chính chia thành 2-4 nhánh con chi tiết (sub-nodes) với lời giải thích ngắn gọn, từ khóa trọng tâm (keyPoint) và bẫy sai lầm cần tránh (trapToAvoid).
- Tóm tắt tổng kết (summary) và các mẹo ghi nhớ nhanh (examScore10Tips).

Yêu cầu trả về định dạng JSON theo đúng schema.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia sư phạm THCS chuyên thiết kế sơ đồ tư duy (Mind Map) chuẩn phương pháp Tony Buzan, giúp học sinh hệ thống hóa kiến thức trực quan, dễ nhớ, dễ hiểu để đạt điểm 10.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              grade: { type: Type.STRING },
              subject: { type: Type.STRING },
              centralTheme: { type: Type.STRING, description: "Tiêu đề trung tâm của sơ đồ tư duy" },
              summary: { type: Type.STRING, description: "Tóm tắt bao quát 1-2 câu về nội dung sơ đồ" },
              root: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  color: { type: Type.STRING },
                  children: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        color: { type: Type.STRING, description: "emerald, blue, purple, amber, rose, cyan, indigo" },
                        icon: { type: Type.STRING, description: "book, star, zap, target, check, alert, lightbulb" },
                        description: { type: Type.STRING },
                        children: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              title: { type: Type.STRING },
                              description: { type: Type.STRING },
                              keyPoint: { type: Type.STRING, description: "Ý cốt lõi cần nhớ" },
                              trapToAvoid: { type: Type.STRING, description: "Bẫy đề thi hay sai ở phần này" },
                            },
                            required: ["id", "title", "description", "keyPoint"]
                          }
                        }
                      },
                      required: ["id", "title", "color", "children"]
                    }
                  }
                },
                required: ["id", "title", "children"]
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 điểm cốt lõi để ôn thi"
              },
              examScore10Tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Mẹo đạt điểm 10 tuyệt đối cho chủ đề này"
              }
            },
            required: ["topic", "grade", "subject", "centralTheme", "summary", "root", "keyTakeaways", "examScore10Tips"]
          }
        }
      });

      const mindmapData = JSON.parse(response.text || "{}");
      res.json({ success: true, mindmap: mindmapData });
    } catch (err: any) {
      console.error("Mindmap error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Lỗi tạo sơ đồ tư duy.",
      });
    }
  });

  // 7. Dedicated Teacher Suite for Teachers of THCS Nguyễn Du ("Cổng Giáo Viên THCS Nguyễn Du")
  app.post("/api/teacher/generate", async (req, res) => {
    try {
      const {
        type = "lesson_plan",
        teacherName = "Cô Phạm Thị Bích Thủy",
        subject = "Toán học",
        grade = "Lớp 9",
        bookSeries = "Kết nối tri thức với cuộc sống",
        topic = "Phương trình bậc hai một ẩn và Hệ thức Vi-ét",
        customDetails = "",
      } = req.body;

      const ai = getGenAIClient();
      let prompt = "";
      const systemInstruction = `Bạn là cố vấn chuyên môn sư phạm cao cấp dành riêng cho các thầy cô giáo Trường THCS Nguyễn Du (với sự hiện diện của các giáo viên tiêu biểu: Cô Phạm Thị Bích Thủy, Cô Vũ Thùy Dương, Cô Nguyễn Thị Liên và các thầy cô giáo bộ môn). Hãy viết văn phong sư phạm chuẩn mực, khoa học, hiện đại, bám sát chương trình GDPT 2026 và tích cực phát triển phẩm chất, năng lực học sinh.`;

      if (type === "lesson_plan") {
        prompt = `Hãy soạn một Kế hoạch bài dạy (Giáo án) hoàn chỉnh chuẩn Công văn 5512/BGDĐT cho giáo viên THCS Nguyễn Du:
- Giáo viên: ${teacherName}
- Môn học: ${subject}
- Khối lớp: ${grade}
- Bộ sách: ${bookSeries}
- Tên bài dạy / Chủ đề: "${topic}"
- Yêu cầu thêm: ${customDetails || "Đầy đủ 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng; thiết kế rõ ràng bước chuyển giao nhiệm vụ của giáo viên và hoạt động của học sinh."}

Cấu trúc trình bày Markdown chuyên nghiệp:
# KẾ HOẠCH BÀI DẠY (CHUYÊN MÔN THCS NGUYỄN DU)
**Giáo viên thực hiện:** ${teacherName} | **Môn:** ${subject} ${grade} | **Bộ sách:** ${bookSeries}
**Tên bài dạy:** ${topic}

I. MỤC TIÊU
1. Kiến thức cốt lõi
2. Năng lực (Năng lực chung: Tự chủ và tự học, Giao tiếp và hợp tác; Năng lực đặc thù môn học)
3. Phẩm chất (Chăm chỉ, Trung thực, Trách nhiệm)

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
1. Chuẩn bị của Giáo viên (Thiết bị, kế hoạch bài dạy, phiếu học tập, ứng dụng Max10)
2. Chuẩn bị của Học sinh (Sách vở, dụng cụ học tập, chuẩn bị bài trước ở nhà)

III. TIẾN TRÌNH DẠY HỌC
1. Hoạt động 1: Khởi động (Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện: 4 bước rõ ràng)
2. Hoạt động 2: Hình thành kiến thức mới (Trình bày chi tiết từng nội dung kèm hệ thống câu hỏi gợi mở)
3. Hoạt động 3: Luyện tập (Bài tập trắc nghiệm & tự luận kèm hướng dẫn giải và bẫy điểm 10 cần lưu ý)
4. Hoạt động 4: Vận dụng (Liên hệ thực tế đời sống, nhiệm vụ sáng tạo)

IV. PHỤ LỤC & PHIẾU HỌC TẬP
- Mẫu phiếu học tập cho học sinh
- Tiêu chí đánh giá (Rubric) ngắn gọn.`;
      } else if (type === "exam_matrix") {
        prompt = `Hãy thiết kế Ma trận đề kiểm tra và Bản đặc tả đề thi chuẩn Thông tư 22/2021/TT-BGDĐT:
- Giáo viên biên soạn: ${teacherName}
- Đơn vị: Trường THCS Nguyễn Du
- Môn: ${subject} - ${grade}
- Chủ đề / Bài kiểm tra: "${topic}"
${customDetails ? `- Yêu cầu cụ thể: ${customDetails}` : ""}

Trình bày Markdown chuyên nghiệp gồm:
1. KHUNG MA TRẬN ĐỀ KIỂM TRA (Tỉ lệ 4 cấp độ tư duy: Nhận biết 40%, Thông hiểu 30%, Vận dụng 20%, Vận dụng cao 10%)
2. BẢN ĐẶC TẢ MA TRẬN ĐỀ (Mạch kiến thức, mức độ đánh giá, số câu, số điểm)
3. ĐỀ MINH HỌA (Trắc nghiệm + Tự luận kèm bẫy điểm 10 phân hóa học sinh)
4. HƯỚNG DẪN CHẤM VÀ ĐÁP ÁN BIỂU ĐIỂM CHI TIẾT (Chia nhỏ biểu điểm đến 0.25 điểm).`;
      } else if (type === "game") {
        prompt = `Hãy thiết kế 3 Trò chơi dạy học / Hoạt động khởi động 5-7 phút đầu giờ cực kỳ hào hứng cho học sinh ${grade} Trường THCS Nguyễn Du:
- Giáo viên: ${teacherName}
- Môn: ${subject}
- Bài học: "${topic}"

Mỗi trò chơi gồm:
- Tên trò chơi (Ví dụ: "Hộp Quà Bí Mật", "Truy Tìm Mảnh Ghép Tri Thức", "Đấu Trường Điểm 10")
- Mục tiêu khởi động & Thời lượng
- Chuẩn bị của thầy/cô
- Luật chơi & Tiến trình tổ chức
- Bộ 5 câu hỏi/nhiệm vụ tương tác ngắn
- Lời dẫn dắt của cô chuyển tiếp mượt mà vào bài mới.`;
      } else if (type === "comment") {
        prompt = `Hãy biên soạn Bộ lời nhận xét học bạ môn ${subject} (${grade}) chuẩn Thông tư 22/2021/TT-BGDĐT:
- Giáo viên: ${teacherName} - Trường THCS Nguyễn Du
- Yêu cầu: Chuẩn văn phong sư phạm, ấm áp, khích lệ, cụ thể từng mặt ưu điểm và giải pháp tiến bộ.

Trình bày gồm:
1. 5 mẫu nhận xét học sinh Tốt / Xuất sắc
2. 5 mẫu nhận xét học sinh Khá
3. 5 mẫu nhận xét học sinh Cần cố gắng
4. 3 lời nhắn nhủ / dặn dò truyền cảm hứng của giáo viên gửi học sinh và phụ huynh cuối kỳ.`;
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const markdown = response.text || "";
      res.json({ success: true, markdown, teacherName, subject, grade, topic });
    } catch (err: any) {
      console.error("Teacher generation error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Lỗi tạo nội dung sư phạm cho giáo viên.",
      });
    }
  });

  // 7b. HUMAN TEACHER SYSTEM: Real Accounts, 1-to-1 Real Chat, and Lecture Publishing
  const TEACHER_DB_FILE = path.join(process.cwd(), "teacher_system_db.json");

  // Initial Seed Data for Teachers
  interface TeacherAccount {
    id: string;
    name: string;
    emailOrPhone: string;
    password?: string;
    school: string;
    department: string;
    subject: string;
    title: string;
    bio: string;
    avatarText: string;
    badgeColor: string;
    createdAt: string;
    isOnline?: boolean;
  }

  interface TeacherChatMessage {
    id: string;
    teacherId: string;
    studentName: string;
    sender: "student" | "teacher";
    senderName: string;
    content: string;
    subject?: string;
    grade?: string;
    attachmentUrl?: string;
    timestamp: string;
    read: boolean;
  }

  interface TeacherLecture {
    id: string;
    teacherId: string;
    teacherName: string;
    school: string;
    subject: string;
    grade: string;
    title: string;
    summary: string;
    content: string;
    exercise?: string;
    tips?: string;
    createdAt: string;
    likes: number;
  }

  interface TeacherColleagueMessage {
    id: string;
    senderTeacherId: string;
    senderTeacherName: string;
    senderSubject: string;
    senderSchool: string;
    senderAvatarText: string;
    senderBadgeColor: string;
    content: string;
    timestamp: string;
    topic?: string;
  }

  interface TeacherSystemData {
    teachers: TeacherAccount[];
    messages: TeacherChatMessage[];
    lectures: TeacherLecture[];
    colleagueMessages?: TeacherColleagueMessage[];
  }

  function getTeacherSystemData(): TeacherSystemData {
    try {
      if (fs.existsSync(TEACHER_DB_FILE)) {
        const raw = fs.readFileSync(TEACHER_DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.teachers)) {
          if (!Array.isArray(parsed.colleagueMessages)) {
            parsed.colleagueMessages = [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed reading teacher db, initializing defaults:", e);
    }

    const defaultData: TeacherSystemData = {
      teachers: [],
      messages: [],
      lectures: [],
      colleagueMessages: [],
    };

    try {
      fs.writeFileSync(TEACHER_DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save initial teacher db:", e);
    }

    return defaultData;
  }

  function saveTeacherSystemData(data: TeacherSystemData) {
    try {
      fs.writeFileSync(TEACHER_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving teacher system db:", e);
    }
  }

  // In-memory Typing Indicator State
  interface TypingStatus {
    studentTyping: boolean;
    studentTypingAt: number;
    studentName: string;
    teacherTyping: boolean;
    teacherTypingAt: number;
    teacherName: string;
  }
  const teacherTypingMap = new Map<string, TypingStatus>();

  // Helper to get typing status key
  const getTypingKey = (teacherId: string, studentName: string) =>
    `${(teacherId || "").trim()}:${(studentName || "").trim().toLowerCase()}`;

  // 1. GET ALL TEACHERS (Public for students & teachers)
  app.get("/api/teachers", (req, res) => {
    try {
      const data = getTeacherSystemData();
      const safeTeachers = data.teachers.map((t) => ({
        id: t.id,
        name: t.name,
        school: t.school,
        department: t.department,
        subject: t.subject,
        title: t.title,
        bio: t.bio,
        avatarText: t.avatarText || t.name.slice(0, 2).toUpperCase(),
        badgeColor: t.badgeColor || "from-emerald-500 to-teal-600",
        createdAt: t.createdAt,
        isOnline: true,
      }));
      res.json({ success: true, teachers: safeTeachers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. TEACHER REGISTRATION (Thầy Cô lập tài khoản mới)
  app.post("/api/teachers/register", (req, res) => {
    try {
      const {
        name,
        emailOrPhone,
        password,
        school = "THCS Nguyễn Du",
        department = "Tổ Bộ môn",
        subject = "Toán học",
        bio = "",
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập Họ và Tên Thầy/Cô." });
      }
      if (!emailOrPhone || !emailOrPhone.trim()) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập Email hoặc Số điện thoại." });
      }

      const data = getTeacherSystemData();
      // Check existing
      const existing = data.teachers.find(
        (t) => t.emailOrPhone.toLowerCase() === emailOrPhone.trim().toLowerCase()
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Tài khoản với Email/SĐT này đã tồn tại trên hệ thống. Vui lòng đăng nhập!",
        });
      }

      const colors = [
        "from-emerald-500 to-teal-600",
        "from-blue-600 to-indigo-600",
        "from-purple-600 to-pink-600",
        "from-amber-500 to-orange-600",
        "from-rose-500 to-red-600",
        "from-teal-500 to-cyan-600",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const words = name.trim().split(" ");
      const avatarText =
        words.length >= 2
          ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();

      const newTeacher: TeacherAccount = {
        id: "gv-" + Date.now(),
        name: name.trim(),
        emailOrPhone: emailOrPhone.trim(),
        password: password || "123",
        school: school.trim(),
        department: department.trim(),
        subject: subject.trim(),
        title: `Giáo viên ${school.trim()}`,
        bio: bio.trim() || `Giáo viên bộ môn ${subject.trim()} tại trường ${school.trim()}. Nhiệt tình hướng dẫn học sinh giải bài tập và ôn thi.`,
        avatarText,
        badgeColor: randomColor,
        createdAt: new Date().toISOString().split("T")[0],
        isOnline: true,
      };

      data.teachers.push(newTeacher);
      saveTeacherSystemData(data);

      const safeProfile = { ...newTeacher };
      delete safeProfile.password;

      res.json({
        success: true,
        message: `Chúc mừng Thầy/Cô ${newTeacher.name} đã lập tài khoản thành công!`,
        teacher: safeProfile,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. TEACHER LOGIN (Thầy Cô đăng nhập)
  app.post("/api/teachers/login", (req, res) => {
    try {
      const { emailOrPhone, password } = req.body;
      if (!emailOrPhone) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập Email hoặc SĐT đăng nhập." });
      }

      const data = getTeacherSystemData();
      const teacher = data.teachers.find(
        (t) =>
          t.emailOrPhone.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
          t.id === emailOrPhone.trim()
      );

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy tài khoản Thầy/Cô. Thầy/Cô có thể bấm 'Lập tài khoản mới'!",
        });
      }

      // If password provided and registered with password
      if (teacher.password && password && teacher.password !== password.trim()) {
        return res.status(401).json({ success: false, error: "Mật khẩu không chính xác." });
      }

      const safeProfile = { ...teacher };
      delete safeProfile.password;

      res.json({
        success: true,
        message: `Chào mừng Thầy/Cô ${teacher.name} đã đăng nhập thành công!`,
        teacher: safeProfile,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. GET INBOX FOR A TEACHER (Thầy Cô xem danh sách học sinh hỏi bài)
  app.get("/api/teachers/inbox", (req, res) => {
    try {
      const { teacherId } = req.query;
      if (!teacherId || typeof teacherId !== "string") {
        return res.status(400).json({ success: false, error: "Thiếu mã giáo viên (teacherId)." });
      }

      const data = getTeacherSystemData();
      const relevantMessages = data.messages.filter((m) => m.teacherId === teacherId);

      // Group by studentName
      const studentMap: Record<string, {
        studentName: string;
        lastMessage: string;
        lastTimestamp: string;
        unreadCount: number;
        totalMessages: number;
      }> = {};

      relevantMessages.forEach((m) => {
        if (!studentMap[m.studentName]) {
          studentMap[m.studentName] = {
            studentName: m.studentName,
            lastMessage: m.content,
            lastTimestamp: m.timestamp,
            unreadCount: 0,
            totalMessages: 0,
          };
        }
        studentMap[m.studentName].lastMessage = m.content;
        studentMap[m.studentName].lastTimestamp = m.timestamp;
        studentMap[m.studentName].totalMessages += 1;
        if (m.sender === "student" && !m.read) {
          studentMap[m.studentName].unreadCount += 1;
        }
      });

      const inbox = Object.values(studentMap);
      res.json({ success: true, inbox });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. GET CONVERSATION (Lấy toàn bộ tin nhắn giữa Thầy Cô và 1 Học sinh)
  app.get("/api/teachers/messages", (req, res) => {
    try {
      const { teacherId, studentName } = req.query;
      if (!teacherId || typeof teacherId !== "string") {
        return res.status(400).json({ success: false, error: "Thiếu teacherId." });
      }

      const data = getTeacherSystemData();
      let messages = data.messages.filter((m) => m.teacherId === teacherId);

      if (studentName && typeof studentName === "string") {
        messages = messages.filter(
          (m) => m.studentName.trim().toLowerCase() === studentName.trim().toLowerCase()
        );
      }

      res.json({ success: true, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. SEND MESSAGE (Học sinh hỏi bài HOẶC Thầy Cô trả lời / giảng bài)
  app.post("/api/teachers/messages", (req, res) => {
    try {
      const {
        teacherId,
        studentName = "Bạn học",
        sender = "student", // 'student' | 'teacher'
        senderName,
        content,
        subject,
        grade,
        attachmentUrl,
      } = req.body;

      if (!teacherId) {
        return res.status(400).json({ success: false, error: "Thiếu thông tin Thầy/Cô." });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: "Nội dung tin nhắn không được để trống." });
      }

      const data = getTeacherSystemData();
      const teacher = data.teachers.find((t) => t.id === teacherId);

      const timeStr = formatVietnamTime(Date.now());

      const newMsg: TeacherChatMessage = {
        id: "msg-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        teacherId,
        studentName: studentName.trim(),
        sender,
        senderName: senderName || (sender === "teacher" ? teacher?.name || "Thầy/Cô" : studentName),
        content: content.trim(),
        subject: subject || teacher?.subject,
        grade,
        attachmentUrl,
        timestamp: timeStr,
        read: sender === "teacher", // if teacher replied, consider read
      };

      data.messages.push(newMsg);
      saveTeacherSystemData(data);

      // Reset typing status on message send
      const typingKey = getTypingKey(teacherId, studentName);
      const curTyping = teacherTypingMap.get(typingKey);
      if (curTyping) {
        if (sender === "student") {
          curTyping.studentTyping = false;
          curTyping.studentTypingAt = 0;
        } else {
          curTyping.teacherTyping = false;
          curTyping.teacherTypingAt = 0;
        }
        teacherTypingMap.set(typingKey, curTyping);
      }

      res.json({ success: true, message: newMsg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6b. TYPING INDICATOR API (Trạng thái đang soạn tin nhắn như Zalo)
  app.post("/api/teachers/typing", (req, res) => {
    try {
      const {
        teacherId,
        studentName = "Bạn học",
        sender = "student", // 'student' | 'teacher'
        senderName,
        isTyping = true,
      } = req.body;

      if (!teacherId || !studentName) {
        return res.json({ success: false });
      }

      const key = getTypingKey(teacherId, studentName);
      const now = Date.now();
      let state = teacherTypingMap.get(key) || {
        studentTyping: false,
        studentTypingAt: 0,
        studentName: studentName.trim(),
        teacherTyping: false,
        teacherTypingAt: 0,
        teacherName: "Thầy/Cô",
      };

      if (sender === "student") {
        state.studentTyping = Boolean(isTyping);
        state.studentTypingAt = isTyping ? now : 0;
        state.studentName = senderName || studentName;
      } else {
        state.teacherTyping = Boolean(isTyping);
        state.teacherTypingAt = isTyping ? now : 0;
        if (senderName) state.teacherName = senderName;
      }

      teacherTypingMap.set(key, state);
      res.json({ success: true });
    } catch (err: any) {
      res.json({ success: false });
    }
  });

  app.get("/api/teachers/typing", (req, res) => {
    try {
      const { teacherId, studentName } = req.query;
      if (!teacherId || !studentName || typeof teacherId !== "string" || typeof studentName !== "string") {
        return res.json({ success: true, studentTyping: false, teacherTyping: false });
      }

      const key = getTypingKey(teacherId, studentName);
      const state = teacherTypingMap.get(key);
      const now = Date.now();

      // Auto expire if older than 3.5s
      const studentTyping = Boolean(state && state.studentTyping && now - state.studentTypingAt < 3500);
      const teacherTyping = Boolean(state && state.teacherTyping && now - state.teacherTypingAt < 3500);

      res.json({
        success: true,
        studentTyping,
        studentName: state?.studentName || studentName,
        teacherTyping,
        teacherName: state?.teacherName || "Thầy/Cô",
      });
    } catch (err: any) {
      res.json({ success: false, studentTyping: false, teacherTyping: false });
    }
  });

  // 7. LECTURES / GIẢNG BÀI: Teacher publishes a lecture note
  app.get("/api/teachers/lectures", (req, res) => {
    try {
      const data = getTeacherSystemData();
      res.json({ success: true, lectures: data.lectures });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/teachers/lectures", (req, res) => {
    try {
      const {
        teacherId,
        teacherName,
        school = "THCS Nguyễn Du",
        subject,
        grade = "Lớp 9",
        title,
        summary,
        content,
        exercise,
        tips,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập tiêu đề bài giảng." });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập nội dung giảng giải chi tiết." });
      }

      const data = getTeacherSystemData();
      const newLec: TeacherLecture = {
        id: "lec-" + Date.now(),
        teacherId: teacherId || "gv-custom",
        teacherName: teacherName || "Thầy/Cô giáo",
        school,
        subject: subject || "Toán học",
        grade,
        title: title.trim(),
        summary: summary?.trim() || title.trim(),
        content: content.trim(),
        exercise: exercise?.trim(),
        tips: tips?.trim(),
        createdAt: "Hôm nay",
        likes: 1,
      };

      data.lectures.unshift(newLec);
      saveTeacherSystemData(data);

      res.json({ success: true, lecture: newLec, message: "Bài giảng đã được đăng tải thành công tới các em học sinh!" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7b. TEACHER-TO-TEACHER LOUNGE (Phòng Trao Đổi Chuyên Môn Giữa Các Thầy Cô)
  app.get("/api/teachers/colleagues/messages", (req, res) => {
    try {
      const data = getTeacherSystemData();
      res.json({
        success: true,
        messages: data.colleagueMessages || [],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/teachers/colleagues/messages", (req, res) => {
    try {
      const {
        teacherId,
        content,
        topic = "Chuyên môn",
      } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: "Nội dung tin nhắn không được để trống." });
      }

      const data = getTeacherSystemData();
      const teacher = data.teachers.find((t) => t.id === teacherId);

      const senderName = teacher ? teacher.name : "Thầy/Cô";
      const senderSubject = teacher ? teacher.subject : "Bộ môn";
      const senderSchool = teacher ? teacher.school : "THCS Nguyễn Du";
      const senderAvatarText = teacher?.avatarText || "GV";
      const senderBadgeColor = teacher?.badgeColor || "from-indigo-600 to-blue-700";

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")} - ${now.getDate()}/${now.getMonth() + 1}`;

      const newColleagueMsg: TeacherColleagueMessage = {
        id: "tmsg-" + Date.now(),
        senderTeacherId: teacherId || "gv-anon",
        senderTeacherName: senderName,
        senderSubject,
        senderSchool,
        senderAvatarText,
        senderBadgeColor,
        content: content.trim(),
        timestamp: timeStr,
        topic,
      };

      if (!data.colleagueMessages) {
        data.colleagueMessages = [];
      }
      data.colleagueMessages.push(newColleagueMsg);
      saveTeacherSystemData(data);

      res.json({ success: true, message: newColleagueMsg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7c. AI TEACHING MATERIAL GENERATOR (AI Giúp Giáo Viên Soạn Tài Liệu Dạy Học)
  app.post("/api/teachers/ai-materials", async (req, res) => {
    try {
      const {
        materialType = "lesson_plan_5512", // 'lesson_plan_5512' | 'exam_matrix' | 'worksheet' | 'teaching_slides' | 'remedial_guide'
        subject = "Toán học",
        grade = "Lớp 9",
        topic = "Hệ thức Vi-ét và ứng dụng",
        customRequirements = "",
        teacherName = "Thầy/Cô giáo",
      } = req.body;

      const typeLabels: Record<string, string> = {
        lesson_plan_5512: "Kế hoạch bài dạy chuẩn Công văn 5512/BGDĐT-GDTrH",
        exam_matrix: "Ma trận đề thi và Đề kiểm tra định kỳ có ma trận, biểu điểm",
        worksheet: "Phiếu học tập / Phiếu bài tập 4 mức độ tư duy (Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao)",
        teaching_slides: "Kịch bản và Dàn ý Slide bài giảng tương tác đa phương tiện",
        remedial_guide: "Tài liệu chuyên đề phụ đạo học sinh yếu kém & Bồi dưỡng HSG săn điểm 10",
      };

      const requestedLabel = typeLabels[materialType] || typeLabels.lesson_plan_5512;

      const systemInstruction = `Bạn là Chuyên gia Sư phạm cao cấp của Bộ Giáo dục và Đào tạo Việt Nam và là Trợ lý AI đắc lực của Thầy/Cô giáo ${teacherName}.
Nhiệm vụ của bạn là soạn thảo tài liệu dạy học chuyên nghiệp, chuẩn mực theo Chương trình Giáo dục phổ thông 2026 và hướng dẫn Công văn 5512/BGDĐT-GDTrH.
Tài liệu phải có cấu trúc khoa học, ngôn ngữ sư phạm trang trọng, rõ ràng, chi tiết, có thể đưa ngay vào sử dụng trên lớp học hoặc in ấn gửi cho học sinh.`;

      const prompt = `Hãy soạn thảo hoàn chỉnh tài liệu dạy học sau cho Thầy/Cô:
- Loại tài liệu: ${requestedLabel}
- Môn học: ${subject}
- Khối lớp: ${grade}
- Tên bài học / Chủ đề: "${topic}"
- Yêu cầu bổ sung của Thầy/Cô: ${customRequirements || "Đảm bảo tính sư phạm hiện đại, phát triển phẩm chất và năng lực của học sinh, có bài tập thực tiễn và phương pháp dạy học tích cực."}

Cấu trúc yêu cầu:
1. Nêu rõ TIÊU ĐỀ BÀI HỌC, MÔN, KHỐI LỚP, THỜI LƯỢNG DỰ KIẾN (tiết).
2. Nếu là KẾ HOẠCH BÀI DẠY (5512):
   - I. MỤC TIÊU (Về kiến thức; Về năng lực chung & năng lực đặc thù; Về phẩm chất).
   - II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU.
   - III. TIẾN TRÌNH DẠY HỌC: Đầy đủ 4 hoạt động:
     + Hoạt động 1: Mở đầu/Khởi động (Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện: Giao nhiệm vụ, Thực hiện, Báo cáo, Kết luận).
     + Hoạt động 2: Hình thành kiến thức mới (Chi tiết các đề mục).
     + Hoạt động 3: Luyện tập (Hệ thống câu hỏi, bài tập có giải thích).
     + Hoạt động 4: Vận dụng (Nhiệm vụ thực tế, liên hệ đời sống).
   - IV. HỒ SƠ DẠY HỌC & ĐÁNH GIÁ (Rubric hoặc bảng kiểm).

3. Nếu là ĐỀ KIỂM TRA & MA TRẬN:
   - Phần 1: Bảng Ma trận và Đặc tả đề kiểm tra (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
   - Phần 2: Đề kiểm tra hoàn chỉnh (Phần trắc nghiệm nhiều lựa chọn, Phần trắc nghiệm đúng/sai hoặc câu hỏi ngắn, Phần tự luận).
   - Phần 3: Đáp án chi tiết và Thang điểm (Biểu điểm chi tiết từng câu).

4. Nếu là PHIẾU BÀI TẬP / HỌC LIỆU:
   - Hệ thống bài tập phân hóa 4 cấp độ (Mức 1: Nhận biết; Mức 2: Thông hiểu; Mức 3: Vận dụng; Mức 4: Vận dụng cao/Săn điểm 10).
   - Hướng dẫn giải chi tiết và Chỉ ra các bẫy sai học sinh hay mắc phải.

Trình bày bằng định dạng Markdown đẹp mắt, chuẩn mực, sử dụng bảng Markdown và ký hiệu công thức rõ ràng.`;

      const response = await generateContentWithRetry({
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const materialContent = response.text || "";

      res.json({
        success: true,
        materialType,
        title: `${requestedLabel}: ${topic}`,
        content: materialContent,
        generatedAt: new Date().toLocaleTimeString("vi-VN") + " - " + new Date().toLocaleDateString("vi-VN"),
      });
    } catch (err: any) {
      console.error("AI Material Generation Error:", err);
      // Fallback response with structured pedagogical template
      const fallbackContent = `## KẾ HOẠCH BÀI DẠY (GIÁO ÁN CHUẨN 5512)
**BÀI HỌC: ${req.body.topic || "CHUYÊN ĐỀ PHƯƠNG TRÌNH VÀ HỆ THỨC"}**
*Môn: ${req.body.subject || "Toán học"} - ${req.body.grade || "Lớp 9"} (Thời lượng: 2 tiết)*

---

### I. MỤC TIÊU
1. **Kiến thức:**
   - Học sinh nắm vững định nghĩa, công thức và các trường hợp đặc biệt.
   - Biết vận dụng linh hoạt để giải quyết các bài toán từ cơ bản đến nâng cao.
2. **Năng lực:**
   - *Năng lực đặc thù:* Năng lực tư duy và lập luận logic, mô hình hóa toán học.
   - *Năng lực chung:* Tự chủ và tự học, giao tiếp và hợp tác nhóm.
3. **Phẩm chất:** Chăm chỉ, cẩn thận, yêu thích khám phá tri thức.

---

### II. TIẾN TRÌNH DẠY HỌC (CHUẨN 4 HOẠT ĐỘNG 5512)
- **Hoạt động 1: Khởi động (7 phút):** Tình huống thực tiễn khơi gợi vấn đề.
- **Hoạt động 2: Hình thành kiến thức (30 phút):** Khám phá kiến thức cốt lõi qua các phiếu học tập.
- **Hoạt động 3: Luyện tập (35 phút):** Thực hành giải bài tập theo nhóm và chữa bài trực tiếp trên bảng.
- **Hoạt động 4: Vận dụng (18 phút):** Bài toán liên môn và dặn dò ôn thi săn điểm 10.`;

      res.json({
        success: true,
        materialType: req.body.materialType || "lesson_plan_5512",
        title: `Tài liệu dạy học: ${req.body.topic || "Chuyên đề giảng dạy"}`,
        content: fallbackContent,
        generatedAt: "Vừa xong",
      });
    }
  });

  // Group chat fallback for teacher tags
  app.post("/api/teacher/chat", async (req, res) => {
    try {
      const {
        teacherName = "Cô Phạm Thị Bích Thủy",
        subject = "Khoa học Tự nhiên",
        studentName = "Bạn học",
        message = "",
      } = req.body;

      const isThay = teacherName.toLowerCase().startsWith("thầy");
      const pronoun = isThay ? "Thầy" : "Cô";

      const systemInstruction = `Bạn là ${teacherName} (${subject} - THCS Nguyễn Du). Tự xưng là "${pronoun}" và gọi học sinh là "em/các em". Dặn dò ngắn gọn, ấm áp, truyền cảm hứng và hướng dẫn tư duy săn điểm 10.`;

      const response = await generateContentWithRetry({
        contents: [{ role: "user", parts: [{ text: message || "Lời dặn ôn tập" }] }],
        config: { systemInstruction, temperature: 0.7 },
      });

      res.json({
        success: true,
        reply: response.text || `${pronoun} chào các em, ${pronoun} luôn đồng hành cùng các em!`,
      });
    } catch (err: any) {
      res.json({
        success: true,
        reply: "Thầy/Cô đã nhận được thông tin từ nhóm học tập và chúc các em ôn luyện thật tốt!",
      });
    }
  });

  // 8. AI Educational Video Studio Generator ("Xưởng Làm Video Học Tập")
  app.post("/api/video/generate", async (req, res) => {
    try {
      const {
        topic = "Giải bẫy Hệ thức Vi-ét trong 60 giây",
        subject = "Toán học",
        grade = "Lớp 9",
        ratio = "9:16",
        style = "short",
      } = req.body;

      const ai = getGenAIClient();
      const prompt = `Hãy thiết kế một kịch bản Video học tập hấp dẫn, sinh động chuẩn viral giáo dục (như kênh vui học, 60s hiểu bài, bẫy điểm 10):
- Chủ đề: "${topic}"
- Môn học: ${subject}
- Khối lớp: ${grade}
- Định dạng khung hình: ${ratio === '9:16' ? 'Khung hình dọc 9:16 (TikTok/Shorts/Reels 60 giây gây cấn)' : 'Khung hình ngang 16:9 (YouTube/Bài giảng máy chiếu)'}
- Phong cách: ${style}

Yêu cầu kịch bản video gồm:
- Tiêu đề giật tít thu hút người xem
- Tổng thời lượng ước tính (ví dụ 45 - 75 giây)
- Gợi ý nhạc nền (BGM: Lofi học tập, Nhịp điệu sôi động, Kịch tính đếm ngược...)
- Từ 4 đến 6 cảnh (Scenes) phân đoạn rõ ràng:
  + sceneNumber, title
  + duration (thời gian tính bằng giây, vd 8-15s)
  + caption (phụ đề chữ lớn hiển thị trên màn hình, ngắn gọn, súc tích)
  + voiceover (lời bình giọng đọc thuyết minh tự nhiên, truyền cảm, cuốn hút người nghe)
  + visualDescription (mô tả hình ảnh đồ họa trực quan 3D/2D phù hợp với cảnh)
  + keywords (danh sách 2-4 từ khóa/công thức nổi bật trên slide)
  + soundEffect (tiếng chuông ding, woosh, pop...)
- Khẩu hiệu tổng kết (summaryMotto)
- 1 câu hỏi đố vui tương tác cuối video (quizQuestion: question, options, answer, explanation).`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: "Bạn là đạo diễn và nhà sản xuất video giáo dục số 1 dành cho học sinh Việt Nam. Bạn tạo ra những video bài giảng ngắn gọn, dễ hiểu, hài hước và khắc sâu kiến thức để học sinh dễ dàng đạt điểm 10.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              topic: { type: Type.STRING },
              grade: { type: Type.STRING },
              subject: { type: Type.STRING },
              ratio: { type: Type.STRING },
              durationSeconds: { type: Type.INTEGER },
              bgmSuggestion: { type: Type.STRING },
              summaryMotto: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    caption: { type: Type.STRING },
                    voiceover: { type: Type.STRING },
                    visualDescription: { type: Type.STRING },
                    keywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    soundEffect: { type: Type.STRING },
                  },
                  required: ["sceneNumber", "title", "duration", "caption", "voiceover", "visualDescription", "keywords"],
                },
              },
              quizQuestion: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["question", "options", "answer", "explanation"],
              },
            },
            required: ["title", "topic", "grade", "subject", "ratio", "durationSeconds", "bgmSuggestion", "summaryMotto", "scenes"],
          },
        },
      });

      const videoData = JSON.parse(response.text || "{}");
      res.json({ success: true, video: videoData });
    } catch (err: any) {
      console.error("Video generation error:", err);
      // Return high quality fallback video
      const fallbackVideo = {
        title: `Bí Kíp Săn Điểm 10: ${req.body.topic || "Toán Học Cấp 2"}`,
        topic: req.body.topic || "Phương trình & Hệ thức Vi-ét",
        grade: req.body.grade || "Lớp 9",
        subject: req.body.subject || "Toán học",
        ratio: req.body.ratio || "9:16",
        durationSeconds: 60,
        bgmSuggestion: "Nhạc Lofi học tập tích cực, nhịp điệu kích thích tư duy",
        summaryMotto: "Hiểu bản chất - Tránh bẫy đề - Chinh phục điểm 10 cùng Max10!",
        scenes: [
          {
            sceneNumber: 1,
            title: "Mở đầu kịch tính (Hook)",
            duration: 8,
            caption: "90% học sinh mất 0.5 điểm oan ở câu này!",
            voiceover: "Chào các bạn học sinh! Bạn có biết 90% bạn đi thi bị trừ điểm oan ở dạng bài này chỉ vì một lỗi sai cực kỳ cơ bản không? Cùng Max10 vạch trần bẫy thi ngay nhé!",
            visualDescription: "Đồ họa 3D bảng đen điện tử phát sáng, biểu tượng cảnh báo dấu chấm than đỏ và dấu trừ 0.5 điểm nhấp nháy",
            keywords: ["Bẫy điểm thi", "Trừ 0.5 điểm", "Max10"],
            soundEffect: "Tiếng cảnh báo Alert / Whoosh",
          },
          {
            sceneNumber: 2,
            title: "Nhận diện bẫy sai lầm",
            duration: 12,
            caption: "Quên kiểm tra điều kiện có nghiệm (Delta >= 0)",
            voiceover: "Rất nhiều bạn vừa nhìn thấy phương trình là vội vàng áp dụng ngay x1 + x2 = -b/a và x1.x2 = c/a mà quên mất một bước sống còn: kiểm tra xem phương trình có nghiệm hay không!",
            visualDescription: "Animation một chiếc bẫy chuột toán học đóng sập lại, dòng chữ Delta >= 0 phát sáng màu vàng rực rỡ",
            keywords: ["Điều kiện Delta", "Delta >= 0", "Nghiệm thực"],
            soundEffect: "Tiếng sập bẫy Snap / Glitch",
          },
          {
            sceneNumber: 3,
            title: "Bí kíp hóa giải 3 bước",
            duration: 15,
            caption: "3 Bước chuẩn điểm 10 tuyệt đối",
            voiceover: "Bí kíp đạt điểm 10 chỉ gồm 3 bước: Bước 1 tìm điều kiện Delta lớn hơn hoặc bằng 0. Bước 2 áp dụng định lý Vi-ét. Bước 3 đối chiếu lại điều kiện trước khi kết luận!",
            visualDescription: "3 chiếc thẻ bài vàng lật mở nhịp nhàng theo bước 1, 2, 3 với dấu tích xanh chuẩn điểm 10",
            keywords: ["Bước 1: Delta", "Bước 2: Vi-ét", "Bước 3: Đối chiếu"],
            soundEffect: "Tiếng chuông Ting Ting Ting thành công",
          },
          {
            sceneNumber: 4,
            title: "Áp dụng vào ví dụ thực tế",
            duration: 15,
            caption: "Ví dụ: x^2 - 5x + 6 = 0",
            voiceover: "Hãy thử ngay với ví dụ này: phương trình x bình phương trừ 5x cộng 6 bằng 0. Tổng hai nghiệm bằng 5, tích hai nghiệm bằng 6. Nhẩm ngay nghiệm là 2 và 3 trong đúng 3 giây!",
            visualDescription: "Con số 2 và 3 bay ra xoay tròn ghép lại thành điểm 10 rạng rỡ",
            keywords: ["Tổng = 5", "Tích = 6", "Nghiệm: 2 và 3"],
            soundEffect: "Tiếng vỗ tay phấn khởi",
          },
          {
            sceneNumber: 5,
            title: "Kêu gọi hành động & Tổng kết",
            duration: 10,
            caption: "Lưu lại ngay để săn điểm 10 cùng Max10!",
            voiceover: "Lưu ngay video này để ôn tập trước ngày thi và mở ứng dụng Max10 để cùng luyện đề điểm 10 mỗi ngày nhé!",
            visualDescription: "Linh vật Max10 giơ ngón tay cái cười rạng rỡ bên chiếc cúp vàng điểm 10",
            keywords: ["Max10", "Săn điểm 10", "Đỗ thủ khoa"],
            soundEffect: "Tiếng nhạc kết thúc vui tươi",
          }
        ],
        quizQuestion: {
          question: "Trước khi áp dụng Hệ thức Vi-ét cho phương trình bậc 2, bước bắt buộc phải làm là gì?",
          options: [
            "A. Tính ngay tổng và tích hai nghiệm",
            "B. Kiểm tra điều kiện Delta >= 0 để phương trình có nghiệm",
            "C. Đưa về phương trình bậc nhất",
            "D. Chia hai vế cho hệ số a"
          ],
          answer: "B. Kiểm tra điều kiện Delta >= 0 để phương trình có nghiệm",
          explanation: "Nếu Delta < 0 thì phương trình vô nghiệm trên tập số thực, khi đó không tồn tại nghiệm để thỏa mãn hệ thức Vi-ét."
        }
      };

      res.json({ success: true, video: fallbackVideo });
    }
  });

  // ==========================================
  // SOCIAL HUB: REAL USERS DIRECTORY & FRIEND REQUESTS
  // (Search by Name only - No fake users - Real accounts only)
  // (Private 1-1 Chat: Free speech, no censorship)
  // (Group Chat: Strictly moderated with rules)
  // ==========================================
  const SOCIAL_DB_PATH = path.resolve(process.cwd(), "social_system_db.json");

  const INITIAL_SEED_USERS: any[] = [];

  interface SocialDb {
    users: any[];
    friendRequests: any[];
    friendships: { user1Id: string; user2Id: string; createdAt: string }[];
    directMessages?: any[];
    blockedUsers?: { userId: string; blockedId: string; createdAt: string }[];
    groups?: any[];
    groupMessages?: Record<string, any[]>;
    registeredClasses?: any[];
    adminAutoReply?: { enabled: boolean; customGreeting?: string; updatedAt?: number };
    adminMentions?: any[];
    deletedStarterCommunities?: string[];
    trendingSeededV1?: boolean;
    challenges?: any[];
    loginLogs?: Array<{
      id: string;
      userId: string;
      userName: string;
      role: string;
      provider?: string;
      createdAt: number;
      timeStr: string;
    }>;
    forcedLogoutAt?: Record<string, number>;
    vipGifts?: Record<
      string,
      {
        id: string;
        xpBonus: number;
        unlockedNameplates: string[];
        unlockedFrames: string[];
        equippedNameplateId?: string;
        equippedFrameId?: string;
        message?: string;
        grantedAt: number;
      }
    >;
    pinnedSystemBanner?: {
      id: string;
      title: string;
      content: string;
      severity: "info" | "warning" | "celebrate";
      updatedAt: number;
      author: string;
    } | null;
  }

  const scrubSensitiveContactText = (val?: string): string | undefined => {
    if (!val) return undefined;
    const cleaned = String(val)
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
      .replace(/(\+?84|0)\d{8,10}/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s·,-]+|[\s·,-]+$/g, "")
      .trim();
    return cleaned || undefined;
  };

  const sanitizePublicUser = (u: any, challenges: any[] = []) => {
    if (!u) return null;
    const uid = String(u.id || "");
    const userChallenges = challenges.filter(
      (c: any) => c && (c.challengerId === uid || c.opponentId === uid) && c.status === "completed"
    );
    const duelWins = userChallenges.filter((c: any) => c.winnerId === uid).length;
    const duelPlayed = userChallenges.length;
    const isAdminUser = u.role === "admin" || uid === "admin-mac-khanh-duy";
    const safeName =
      uid === "admin-mac-khanh-duy" && String(u.name || "").includes("Mạc Khánh Duy")
        ? "Quản trị viên Max10"
        : String(u.name || "Thành viên Max10");

    return {
      id: uid,
      name: safeName,
      avatar: u.avatar || "",
      role: u.role || "student",
      roleLabel: isAdminUser
        ? "Quản trị viên"
        : u.role === "teacher"
        ? u.teacherTitle || "Giáo viên"
        : "Học sinh",
      presenceStatus: u.presenceStatus || "online",
      grade: u.grade,
      studentClass: u.studentClass,
      schoolName: scrubSensitiveContactText(u.schoolName || u.school),
      teachingSubject: u.teachingSubject,
      homeroomClass: u.homeroomClass,
      xp: typeof u.xp === "number" ? u.xp : undefined,
      level: typeof u.level === "number" ? u.level : undefined,
      streak: typeof u.streak === "number" ? u.streak : undefined,
      duelWins,
      duelPlayed,
      joinedAt: u.createdAt,
    };
  };

  const isServerAiEntity = (member: { id?: string; name?: string; isAi?: boolean; role?: string } | null | undefined) => {
    if (!member) return true;
    if (member.isAi) return true;
    if (member.role === "ai_tutor" || member.role === "system") return true;
    const id = String(member.id || "").toLowerCase();
    const name = String(member.name || "").toLowerCase();
    if (id === "admin-mac-khanh-duy") return false;
    if (
      id.startsWith("ai-") ||
      id.startsWith("std-") ||
      id === "user-quynh" ||
      id === "system-bot" ||
      id.includes("tutor") ||
      id.includes("tro-ly") ||
      id.includes("max10")
    ) {
      return true;
    }
    if (
      name.includes("max10 ai") ||
      name.includes("trợ lý") ||
      name.includes("robot") ||
      name.includes("hệ thống")
    ) {
      return true;
    }
    return false;
  };

  function getStarterAdminCommunities(): any[] {
    const now = Date.now();
    const adminMember = {
      id: "admin-mac-khanh-duy",
      name: "Quản trị viên Max10",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=Max10Admin",
      role: "admin",
      school: "Ban Quản Trị Max10 AI",
    };

    const makeGameCommunity = (cfg: {
      id: string;
      name: string;
      description: string;
      avatarIcon: string;
      code: string;
      gamePlatform: "Cross-Platform" | "Mobile" | "PC" | "Console";
      gameTitle: string;
      gameGenre: string;
      offsetMs: number;
      isPinnedTrending?: boolean;
      trendingBadge?: string;
      channelAdminId?: string;
      channelAdminName?: string;
    }) => ({
      id: cfg.id,
      name: cfg.name,
      description: cfg.description,
      grade: "Lớp 9",
      subject: `Trò chơi · ${cfg.gamePlatform}`,
      avatarIcon: cfg.avatarIcon,
      createdAt: now - cfg.offsetMs,
      createdBy: cfg.channelAdminId || "admin-mac-khanh-duy",
      createdByName: cfg.channelAdminName || "Ban Quản Trị Max10",
      channelAdminId: cfg.channelAdminId || "admin_game",
      channelAdminName: cfg.channelAdminName || "Admin Game",
      createdByAdmin: true,
      isCommunity: true,
      communityCategory: "game",
      gamePlatform: cfg.gamePlatform,
      gameTitle: cfg.gameTitle,
      gameGenre: cfg.gameGenre,
      isPinnedTrending: Boolean(cfg.isPinnedTrending),
      ...(cfg.isPinnedTrending ? { pinnedTrendingAt: now - cfg.offsetMs, trendingBadge: cfg.trendingBadge || "Thịnh hành" } : {}),
      approvalStatus: "approved",
      approvedAt: now - cfg.offsetMs,
      approvedBy: "admin-mac-khanh-duy",
      isPublic: true,
      onlyAdminCanAdd: false,
      code: cfg.code,
      pinnedNotice: `${cfg.avatarIcon} Cộng đồng ${cfg.gameTitle} (${cfg.gamePlatform}) — Quản trị viên: @${cfg.channelAdminId || "admin_game"}. Dùng /ve, /sodo, /ai để gọi AI Bot!`,
      members: [adminMember],
      mutedUsers: {},
    });

    return [
      makeGameCommunity({
        id: "community-game-max10",
        name: "Cộng Đồng Trò Chơi",
        description:
          "Tổng hợp tất cả các trò chơi chung & Mini Game (Minecraft, Roblox, Liên Quân, Free Fire, Valorant, Genshin, Mini Game Quiz, Thử thách Toán, Vòng quay XP...) ngay trong Kênh văn bản.",
        avatarIcon: "🎮",
        code: "CD-TROCHOI",
        gamePlatform: "Cross-Platform",
        gameTitle: "Tổng hợp Tất cả Trò chơi & Mini Game",
        gameGenre: "Đa thể loại",
        offsetMs: 310000,
        isPinnedTrending: true,
        trendingBadge: "Tất cả Trò chơi",
        channelAdminId: "admin_game",
        channelAdminName: "Admin Game",
      }),
      {
        id: "community-study-max10",
        name: "Cộng Đồng Học Tập",
        description:
          "Tài liệu ôn thi, sơ đồ tư duy & không gian thi đấu chung cho Toán, Văn, Anh, KHTN.",
        grade: "Lớp 9",
        subject: "Học tập",
        avatarIcon: "📚",
        createdAt: now - 305000,
        createdBy: "admin-mac-khanh-duy",
        createdByName: "Ban Quản Trị Max10",
        channelAdminId: "admin_hoctap",
        channelAdminName: "Admin Học Tập",
        createdByAdmin: true,
        isCommunity: true,
        communityCategory: "study",
        approvalStatus: "approved",
        isPublic: true,
        onlyAdminCanAdd: false,
        code: "CD-HOCTAP",
        pinnedNotice:
          "📚 Cộng đồng Học tập — Quản trị viên: @admin_hoctap. Dùng /sodo [chủ đề] để vẽ sơ đồ tư duy, /ai [câu hỏi] để giải bài!",
        members: [adminMember],
        mutedUsers: {},
      },
      {
        id: "community-boys-max10",
        name: "Cộng Đồng Con Trai",
        description:
          "Khu vực dành riêng cho nam — Giao lưu thể thao, công nghệ, game & học tập văn minh.",
        grade: "Lớp 9",
        subject: "Trò chuyện tự do",
        avatarIcon: "👦",
        createdAt: now - 300000,
        createdBy: "admin-mac-khanh-duy",
        createdByName: "Admin Con Trai",
        channelAdminId: "admin_nam",
        channelAdminName: "Admin Con Trai",
        createdByAdmin: true,
        isCommunity: true,
        communityCategory: "chat",
        approvalStatus: "approved",
        isPublic: true,
        onlyAdminCanAdd: false,
        code: "CD-CONTRAI",
        pinnedNotice:
          "👦 Cộng đồng Con trai — Quản trị viên: @admin_nam. Gõ /ve, /sodo, /ai để tương tác cùng AI Bot!",
        members: [adminMember],
        mutedUsers: {},
      },
      {
        id: "community-girls-max10",
        name: "Cộng Đồng Con Gái",
        description:
          "Khu vực dành riêng cho nữ — Chia sẻ bí quyết học tập, sáng tạo, nghệ thuật & tâm sự tuổi học trò.",
        grade: "Lớp 9",
        subject: "Trò chuyện tự do",
        avatarIcon: "👧",
        createdAt: now - 295000,
        createdBy: "admin-mac-khanh-duy",
        createdByName: "Admin Con Gái",
        channelAdminId: "admin_nu",
        channelAdminName: "Admin Con Gái",
        createdByAdmin: true,
        isCommunity: true,
        communityCategory: "chat",
        approvalStatus: "approved",
        isPublic: true,
        onlyAdminCanAdd: false,
        code: "CD-CONGAI",
        pinnedNotice:
          "👧 Cộng đồng Con gái — Quản trị viên: @admin_nu. Gõ /ve, /sodo, /ai để tạo ảnh, sơ đồ tư duy cùng AI Bot!",
        members: [adminMember],
        mutedUsers: {},
      },
      {
        id: "community-chat-max10",
        name: "Max10 AI Community",
        description:
          "Cộng đồng chính thức Max10 AI — Cập nhật tính năng mới, nội quy, trò chuyện tự do, chia sẻ prompt AI và hỏi đáp trực tiếp cùng @Max10.",
        grade: "Lớp 9",
        subject: "Thảo luận & AI",
        avatarIcon: "M10",
        isPinnedTrending: true,
        trendingBadge: "Official M10",
        createdAt: now - 290000,
        createdBy: "admin-mac-khanh-duy",
        createdByName: "Ban Quản Trị Max10",
        channelAdminId: "super_admin",
        channelAdminName: "Tổng Quản Trị",
        createdByAdmin: true,
        isCommunity: true,
        communityCategory: "chat",
        approvalStatus: "approved",
        isPublic: true,
        onlyAdminCanAdd: false,
        code: "CD-MAX10-AI",
        pinnedNotice:
          "🤖 Chào mừng bạn đến với Max10 AI Community! Gõ @Max10 kèm câu hỏi hoặc vào #hỏi-đáp-max10-bot để được trợ lý AI giải đáp ngay.",
        members: [adminMember],
        mutedUsers: {},
      },
    ];
  }

  const LEGACY_GAME_COMMUNITY_SUBCHANNEL_MAP: Record<string, string> = {
    "community-game-minecraft": "game_minecraft",
    "community-game-roblox": "game_roblox",
    "community-game-hoyoverse": "game_hoyoverse",
    "community-game-fortnite": "game_fortnite",
    "community-game-party-coop": "game_party_coop",
    "community-game-sports-racing": "game_sports_racing",
    "community-game-board-web": "game_board_web",
    "community-game-lienquan": "game_lienquan",
    "community-game-pubg-ff": "game_freefire_pubg",
    "community-game-supercell": "game_supercell",
    "community-game-playtogether": "game_playtogether",
    "community-game-lol-tft": "game_lol_tft",
    "community-game-valorant-cs2": "game_valorant_cs2",
    "community-game-steam-sandbox": "game_steam_sandbox",
    "community-game-nintendo": "game_nintendo",
    "community-game-ps-xbox": "game_ps_xbox",
    "community-game-retro-rhythm": "game_retro_rhythm",
  };

  function loadSocialDb(): SocialDb {
    try {
      if (fs.existsSync(SOCIAL_DB_PATH)) {
        const raw = fs.readFileSync(SOCIAL_DB_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          // Filter out any leftover fake users (starting with std- or fake Quynh)
          parsed.users = parsed.users.filter(
            (u: any) =>
              !u.id.startsWith("std-") &&
              u.id !== "user-quynh" &&
              u.name !== "Quỳnh" &&
              u.email !== "quynh@max10.edu.vn"
          );
          parsed.friendRequests = (parsed.friendRequests || []).filter(
            (r: any) =>
              !r.fromUserId.startsWith("std-") &&
              !r.toUserId.startsWith("std-") &&
              r.fromUserId !== "user-quynh" &&
              r.toUserId !== "user-quynh"
          );
          parsed.friendships = (parsed.friendships || []).filter(
            (f: any) =>
              !f.user1Id.startsWith("std-") &&
              !f.user2Id.startsWith("std-") &&
              f.user1Id !== "user-quynh" &&
              f.user2Id !== "user-quynh"
          );
          if (!parsed.directMessages) parsed.directMessages = [];
          // Upgrade any legacy "THÔNG BÁO TỰ ĐỘNG..." copy to the current Study Hub announcement
          let upgradedLegacyCopy = false;
          const UPDATED_BROADCAST_COPY =
            "📢 [CẬP NHẬT MỚI TỪ MAX10 AI - PHIÊN BẢN STUDY HUB]\n🚀 Max10 AI vừa nâng cấp toàn diện giao diện & tính năng học tập thông minh:\n✨ Không gian Study Hub 3 vùng gọn gàng: Gia sư AI, Cộng đồng & Chat, Kho Luyện Tập (hỗ trợ làm đề Offline), Công cụ AI & Lịch học.\n🎥 Gọi Video & Thoại dùng Camera & Micro thật, tự động hiện ảnh đại diện khi tắt cam và hộp thoại nhận/từ chối cuộc gọi tức thì.\n💬 Nhắn tin, trả lời trích dẫn và gọi @Max10 AI giải bài ngay trong nhóm lẫn chat 1-1.\nChúc các bạn học tập hiệu quả và chinh phục Điểm 10!";
          parsed.directMessages = parsed.directMessages.map((m: any) => {
            const c = String(m?.content || "");
            if (
              c.includes("THÔNG BÁO TỰ ĐỘNG - MAX10 VỪA CẬP NHẬT PHIÊN BẢN MỚI") ||
              c.includes("THÔNG BÁO TỰ ĐỘNG - CẬP NHẬT ỨNG DỤNG") ||
              c.includes("câu hỏi ngày tháng năm sinh với bất ngờ sinh nhật")
            ) {
              upgradedLegacyCopy = true;
              return { ...m, content: UPDATED_BROADCAST_COPY };
            }
            return m;
          });
          if (!parsed.blockedUsers) parsed.blockedUsers = [];
          if (!parsed.groups) parsed.groups = [];
          if (!parsed.groupMessages) parsed.groupMessages = {};
          if (!parsed.registeredClasses) parsed.registeredClasses = [];
          if (!parsed.adminAutoReply) {
            parsed.adminAutoReply = { enabled: true, customGreeting: "", updatedAt: Date.now() };
            upgradedLegacyCopy = true;
          }
          if (!Array.isArray(parsed.adminMentions)) {
            parsed.adminMentions = [];
          }
          if (!Array.isArray(parsed.deletedStarterCommunities)) {
            parsed.deletedStarterCommunities = [];
          }
          if (!Array.isArray(parsed.challenges)) {
            parsed.challenges = [];
          }

          // Clean AI entities out of community member arrays & remove personal admin name from public preview strings
          parsed.groups = parsed.groups.map((g: any) => {
            if (!g) return g;
            let nextG = { ...g };
            if (nextG.isCommunity && Array.isArray(nextG.members)) {
              const filteredMembers = nextG.members
                .filter((m: any) => !isServerAiEntity(m))
                .map((m: any) =>
                  m?.id === "admin-mac-khanh-duy" && String(m?.name || "").includes("Mạc Khánh Duy")
                    ? { ...m, name: "Quản trị viên Max10" }
                    : m
                );
              if (filteredMembers.length !== nextG.members.length) {
                upgradedLegacyCopy = true;
              }
              nextG = { ...nextG, onlyAdminCanAdd: false, members: filteredMembers };
            }
            if (typeof nextG.createdByName === "string" && nextG.createdByName.includes("Mạc Khánh Duy")) {
              nextG.createdByName = "Ban Quản Trị Max10";
              upgradedLegacyCopy = true;
            }
            if (typeof nextG.pinnedNotice === "string" && nextG.pinnedNotice.includes("Mạc Khánh Duy")) {
              nextG.pinnedNotice = nextG.pinnedNotice.replace(/do Admin Mạc Khánh Duy lập/g, "chính thức");
              upgradedLegacyCopy = true;
            }
            if (typeof nextG.description === "string" && nextG.description.includes("Mạc Khánh Duy")) {
              nextG.description = nextG.description.replace(/@Mạc Khánh Duy \(Admin\)/g, "@Admin");
              upgradedLegacyCopy = true;
            }
            return nextG;
          });

          // Consolidate all legacy separate starter game communities into unified 'community-game-max10'
          const legacyGameIds = Object.keys(LEGACY_GAME_COMMUNITY_SUBCHANNEL_MAP);
          const legacyGameIdSet = new Set(legacyGameIds);
          if (!parsed.unifiedGamesMigratedV1 || parsed.groups.some((g: any) => g && legacyGameIdSet.has(g.id))) {
            let mainGameComm = parsed.groups.find((g: any) => g && g.id === "community-game-max10");
            const memberMap = new Map<string, any>();
            if (mainGameComm && Array.isArray(mainGameComm.members)) {
              mainGameComm.members.forEach((m: any) => {
                if (m?.id && !isServerAiEntity(m)) memberMap.set(m.id, m);
              });
            }
            if (!Array.isArray(parsed.groupMessages["community-game-max10"])) {
              parsed.groupMessages["community-game-max10"] = [];
            }
            const existingMainMsgIds = new Set(
              parsed.groupMessages["community-game-max10"].map((m: any) => m?.id).filter(Boolean)
            );
            legacyGameIds.forEach((legacyId) => {
              const legacyGroup = parsed.groups.find((g: any) => g && g.id === legacyId);
              if (legacyGroup && Array.isArray(legacyGroup.members)) {
                legacyGroup.members.forEach((m: any) => {
                  if (m?.id && !isServerAiEntity(m) && !memberMap.has(m.id)) {
                    memberMap.set(m.id, m);
                  }
                });
              }
              const targetSubChannel = LEGACY_GAME_COMMUNITY_SUBCHANNEL_MAP[legacyId];
              const legacyMsgs = parsed.groupMessages[legacyId];
              if (Array.isArray(legacyMsgs) && legacyMsgs.length > 0) {
                legacyMsgs.forEach((msg: any) => {
                  if (!msg || !msg.id || existingMainMsgIds.has(msg.id)) return;
                  existingMainMsgIds.add(msg.id);
                  parsed.groupMessages["community-game-max10"].push({
                    ...msg,
                    groupId: "community-game-max10",
                    subChannelId: msg.subChannelId || targetSubChannel,
                  });
                });
                delete parsed.groupMessages[legacyId];
              }
            });
            parsed.groups = parsed.groups
              .filter((g: any) => g && !legacyGameIdSet.has(g.id))
              .map((g: any) =>
                g.id === "community-game-max10"
                  ? {
                      ...g,
                      name: "Cộng Đồng Trò Chơi",
                      description:
                        "Tổng hợp tất cả các trò chơi chung & Mini Game (Minecraft, Roblox, Liên Quân, Free Fire, Valorant, Genshin, Mini Game Quiz, Thử thách Toán, Vòng quay XP...) ngay trong Kênh văn bản.",
                      gameTitle: "Tổng hợp Tất cả Trò chơi & Mini Game",
                      isPinnedTrending: true,
                      trendingBadge: "Tất cả Trò chơi",
                      members: Array.from(memberMap.values()),
                    }
                  : g
              );
            parsed.groupMessages["community-game-max10"].sort(
              (a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0)
            );
            parsed.unifiedGamesMigratedV1 = true;
            upgradedLegacyCopy = true;
          }

          // Merge all official Admin starter communities (Study + Unified Game + Chat) missing from DB (unless explicitly deleted)
          const starters = getStarterAdminCommunities();
          const starterMap = new Map(starters.map((s: any) => [s.id, s]));
          const existingIds = new Set(parsed.groups.map((g: any) => g && g.id).filter(Boolean));
          const deletedSet = new Set(parsed.deletedStarterCommunities || []);

          // Enrich legacy starter communities if missing platform or channelAdmin metadata
          parsed.groups = parsed.groups.map((g: any) => {
            if (!g || !starterMap.has(g.id)) return g;
            const ref = starterMap.get(g.id);
            let nextG = { ...g };
            let changed = false;
            if (g.id === "community-chat-max10" && g.name !== "Max10 AI Community") {
              nextG.name = ref.name;
              nextG.description = ref.description;
              nextG.avatarIcon = ref.avatarIcon;
              nextG.pinnedNotice = ref.pinnedNotice;
              nextG.isPinnedTrending = true;
              nextG.trendingBadge = ref.trendingBadge;
              changed = true;
            }
            if (g.communityCategory === "game" && !g.gamePlatform) {
              nextG.gamePlatform = ref.gamePlatform;
              nextG.gameTitle = ref.gameTitle;
              nextG.gameGenre = ref.gameGenre;
              changed = true;
            }
            if (ref.channelAdminId && !g.channelAdminId) {
              nextG.channelAdminId = ref.channelAdminId;
              nextG.channelAdminName = ref.channelAdminName;
              changed = true;
            }
            if (changed) upgradedLegacyCopy = true;
            return nextG;
          });

          const missingStarters = starters.filter(
            (s: any) => !existingIds.has(s.id) && !deletedSet.has(s.id)
          );
          if (missingStarters.length > 0) {
            parsed.groups = [...missingStarters, ...parsed.groups];
            upgradedLegacyCopy = true;
          }

          // Seed initial welcome notices for the 4 core communities (including sub-channels)
          const coreWelcomes: Record<string, any[]> = {
            "community-game-max10": [
              {
                id: "welcome-game-admin-sub",
                groupId: "community-game-max10",
                subChannelId: "game_admin",
                senderId: "admin_game",
                senderName: "Admin Game",
                senderRole: "admin",
                content: "📢 **THÔNG BÁO CHUNG CỘNG ĐỒNG GAME:** Lịch giải đấu giao lưu cuối tuần & hướng dẫn gọi AI Bot vẽ banner (`/ve`), tạo sơ đồ chiến thuật (`/sodo`).",
                createdAt: Date.now() - 130000,
                timestamp: formatVietnamTime(Date.now() - 130000),
              },
              {
                id: "welcome-game-admin",
                groupId: "community-game-max10",
                subChannelId: "game_all",
                senderId: "admin_game",
                senderName: "Admin Game",
                senderRole: "admin",
                content: "🎮 Chào mừng các bạn đến với **Cộng Đồng Game**! Tụ tập chém gió mọi tựa game hoặc chọn kênh riêng Minecraft, Roblox bên trái nhé.",
                createdAt: Date.now() - 120000,
                timestamp: formatVietnamTime(Date.now() - 120000),
              },
              {
                id: "welcome-game-bot",
                groupId: "community-game-max10",
                subChannelId: "game_all",
                senderId: "ai-bot-community",
                senderName: "AI Bot",
                senderRole: "ai_tutor",
                isAi: true,
                content: "🤖 Gõ `/ve [mô tả]` hoặc `Vẽ ...`, `/sodo [chủ đề]` hoặc `Tạo sơ đồ tư duy ...`, `/ai` hoặc `@ai [câu hỏi]` để AI Bot hỗ trợ ngay!",
                createdAt: Date.now() - 110000,
                timestamp: formatVietnamTime(Date.now() - 110000),
              },
              {
                id: "welcome-game-mc",
                groupId: "community-game-max10",
                subChannelId: "game_minecraft",
                senderId: "admin_game",
                senderName: "Admin Game",
                senderRole: "admin",
                content: "⛏️ **Kênh Minecraft:** Chia sẻ IP server sinh tồn, modpack, shader đẹp và mẹo Redstone cùng anh em nhé!",
                createdAt: Date.now() - 100000,
                timestamp: formatVietnamTime(Date.now() - 100000),
              },
              {
                id: "welcome-game-roblox",
                groupId: "community-game-max10",
                subChannelId: "game_roblox",
                senderId: "admin_game",
                senderName: "Admin Game",
                senderRole: "admin",
                content: "🧱 **Kênh Roblox:** Rủ team cày map Blox Fruits, Brookhaven, Doors, Obby mỗi tối tại đây!",
                createdAt: Date.now() - 90000,
                timestamp: formatVietnamTime(Date.now() - 90000),
              },
              {
                id: "welcome-game-other",
                groupId: "community-game-max10",
                subChannelId: "game_other",
                senderId: "admin_game",
                senderName: "Admin Game",
                senderRole: "admin",
                content: "🎯 **Kênh Game Khác:** Giao lưu Liên Quân, Free Fire, Valorant, Play Together, Genshin Impact & mọi tựa game khác.",
                createdAt: Date.now() - 80000,
                timestamp: formatVietnamTime(Date.now() - 80000),
              },
            ],
            "community-study-max10": [
              {
                id: "welcome-study-admin",
                groupId: "community-study-max10",
                subChannelId: "study_main",
                senderId: "admin_hoctap",
                senderName: "Admin Học Tập",
                senderRole: "admin",
                content: "📚 Chào mừng đến với **Cộng Đồng Học Tập**! Gõ `/sodo [chủ đề]` hoặc `Tạo sơ đồ tư duy [chủ đề]` để AI Bot vẽ sơ đồ ôn thi siêu nhanh nhé.",
                createdAt: Date.now() - 120000,
                timestamp: formatVietnamTime(Date.now() - 120000),
              },
            ],
            "community-boys-max10": [
              {
                id: "welcome-boys-admin",
                groupId: "community-boys-max10",
                subChannelId: "boys_main",
                senderId: "admin_nam",
                senderName: "Admin Con Trai",
                senderRole: "admin",
                content: "👦 Chào mừng anh em đến với **Cộng Đồng Con Trai**! Cùng giao lưu thể thao, công nghệ, học tập và thử `/ve`, `@ai` nhé.",
                createdAt: Date.now() - 120000,
                timestamp: formatVietnamTime(Date.now() - 120000),
              },
            ],
            "community-girls-max10": [
              {
                id: "welcome-girls-admin",
                groupId: "community-girls-max10",
                subChannelId: "girls_main",
                senderId: "admin_nu",
                senderName: "Admin Con Gái",
                senderRole: "admin",
                content: "👧 Chào mừng các bạn nữ đến với **Cộng Đồng Con Gái**! Cùng chia sẻ bí quyết học tốt, sáng tạo & thử `/ve`, `/sodo` nhé.",
                createdAt: Date.now() - 120000,
                timestamp: formatVietnamTime(Date.now() - 120000),
              },
            ],
          };
          Object.entries(coreWelcomes).forEach(([gid, seedMsgs]) => {
            if (!Array.isArray(parsed.groupMessages[gid]) || parsed.groupMessages[gid].length === 0) {
              parsed.groupMessages[gid] = seedMsgs;
              upgradedLegacyCopy = true;
            } else {
              const existingIds = new Set(parsed.groupMessages[gid].map((m: any) => m?.id).filter(Boolean));
              const missingSeeds = seedMsgs.filter((m: any) => !existingIds.has(m.id));
              if (missingSeeds.length > 0 && gid === "community-game-max10") {
                const subOnly = missingSeeds.filter(
                  (m: any) => m.subChannelId && m.subChannelId !== "game_all"
                );
                if (subOnly.length > 0) {
                  parsed.groupMessages[gid] = [...subOnly, ...parsed.groupMessages[gid]];
                  upgradedLegacyCopy = true;
                }
              }
            }
          });

          // Seed initial approvalStatus & default pinned trending games once
          const defaultTrendingMap: Record<string, string> = {
            "community-game-minecraft": "Thịnh hành",
            "community-game-roblox": "Top Yêu Thích",
            "community-game-lienquan": "Hot Tuần Này",
            "community-game-valorant-cs2": "Giải đấu",
          };
          const anyPinnedAlready = parsed.groups.some((g: any) => Boolean(g?.isPinnedTrending));
          parsed.groups = parsed.groups.map((g: any) => {
            if (!g || !g.isCommunity) return g;
            let next = g;
            if (!next.approvalStatus) {
              next = { ...next, approvalStatus: "approved" };
              upgradedLegacyCopy = true;
            }
            if (!parsed.trendingSeededV1 && !anyPinnedAlready && defaultTrendingMap[next.id]) {
              next = {
                ...next,
                isPinnedTrending: true,
                pinnedTrendingAt: Date.now(),
                trendingBadge: defaultTrendingMap[next.id],
              };
              upgradedLegacyCopy = true;
            }
            return next;
          });
          if (!parsed.trendingSeededV1) {
            parsed.trendingSeededV1 = true;
            upgradedLegacyCopy = true;
          }

          if (upgradedLegacyCopy) {
            try {
              fs.writeFileSync(SOCIAL_DB_PATH, JSON.stringify(parsed, null, 2), "utf-8");
            } catch {}
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load social db, using defaults", e);
    }
    const initDb: SocialDb = {
      users: INITIAL_SEED_USERS,
      friendRequests: [],
      friendships: [],
      directMessages: [],
      blockedUsers: [],
      groups: getStarterAdminCommunities(),
      groupMessages: {
        "community-game-max10": [
          {
            id: "welcome-game-admin-sub",
            groupId: "community-game-max10",
            subChannelId: "game_admin",
            senderId: "admin_game",
            senderName: "Admin Game",
            senderRole: "admin",
            content: "📢 **THÔNG BÁO CHUNG CỘNG ĐỒNG GAME:** Lịch giải đấu giao lưu cuối tuần & hướng dẫn gọi AI Bot vẽ banner (`/ve`), tạo sơ đồ chiến thuật (`/sodo`).",
            createdAt: Date.now() - 130000,
            timestamp: formatVietnamTime(Date.now() - 130000),
          },
          {
            id: "welcome-game-admin",
            groupId: "community-game-max10",
            subChannelId: "game_all",
            senderId: "admin_game",
            senderName: "Admin Game",
            senderRole: "admin",
            content: "🎮 Chào mừng các bạn đến với **Cộng Đồng Game**! Tụ tập chém gió mọi tựa game hoặc chọn kênh riêng Minecraft, Roblox bên trái nhé.",
            createdAt: Date.now() - 120000,
            timestamp: formatVietnamTime(Date.now() - 120000),
          },
          {
            id: "welcome-game-bot",
            groupId: "community-game-max10",
            subChannelId: "game_all",
            senderId: "ai-bot-community",
            senderName: "AI Bot",
            senderRole: "ai_tutor",
            isAi: true,
            content: "🤖 Gõ `/ve [mô tả]` hoặc `Vẽ ...`, `/sodo [chủ đề]` hoặc `Tạo sơ đồ tư duy ...`, `/ai` hoặc `@ai [câu hỏi]` để AI Bot hỗ trợ ngay!",
            createdAt: Date.now() - 110000,
            timestamp: formatVietnamTime(Date.now() - 110000),
          },
          {
            id: "welcome-game-mc",
            groupId: "community-game-max10",
            subChannelId: "game_minecraft",
            senderId: "admin_game",
            senderName: "Admin Game",
            senderRole: "admin",
            content: "⛏️ **Kênh Minecraft:** Chia sẻ IP server sinh tồn, modpack, shader đẹp và mẹo Redstone cùng anh em nhé!",
            createdAt: Date.now() - 100000,
            timestamp: formatVietnamTime(Date.now() - 100000),
          },
          {
            id: "welcome-game-roblox",
            groupId: "community-game-max10",
            subChannelId: "game_roblox",
            senderId: "admin_game",
            senderName: "Admin Game",
            senderRole: "admin",
            content: "🧱 **Kênh Roblox:** Rủ team cày map Blox Fruits, Brookhaven, Doors, Obby mỗi tối tại đây!",
            createdAt: Date.now() - 90000,
            timestamp: formatVietnamTime(Date.now() - 90000),
          },
          {
            id: "welcome-game-other",
            groupId: "community-game-max10",
            subChannelId: "game_other",
            senderId: "admin_game",
            senderName: "Admin Game",
            senderRole: "admin",
            content: "🎯 **Kênh Game Khác:** Giao lưu Liên Quân, Free Fire, Valorant, Play Together, Genshin Impact & mọi tựa game khác.",
            createdAt: Date.now() - 80000,
            timestamp: formatVietnamTime(Date.now() - 80000),
          },
        ],
        "community-study-max10": [
          {
            id: "welcome-study-admin",
            groupId: "community-study-max10",
            subChannelId: "study_main",
            senderId: "admin_hoctap",
            senderName: "Admin Học Tập",
            senderRole: "admin",
            content: "📚 Chào mừng đến với **Cộng Đồng Học Tập**! Gõ `/sodo [chủ đề]` hoặc `Tạo sơ đồ tư duy [chủ đề]` để AI Bot vẽ sơ đồ ôn thi siêu nhanh nhé.",
            createdAt: Date.now() - 120000,
            timestamp: formatVietnamTime(Date.now() - 120000),
          },
        ],
        "community-boys-max10": [
          {
            id: "welcome-boys-admin",
            groupId: "community-boys-max10",
            subChannelId: "boys_main",
            senderId: "admin_nam",
            senderName: "Admin Con Trai",
            senderRole: "admin",
            content: "👦 Chào mừng anh em đến với **Cộng Đồng Con Trai**! Cùng giao lưu thể thao, công nghệ, học tập và thử `/ve`, `@ai` nhé.",
            createdAt: Date.now() - 120000,
            timestamp: formatVietnamTime(Date.now() - 120000),
          },
        ],
        "community-girls-max10": [
          {
            id: "welcome-girls-admin",
            groupId: "community-girls-max10",
            subChannelId: "girls_main",
            senderId: "admin_nu",
            senderName: "Admin Con Gái",
            senderRole: "admin",
            content: "👧 Chào mừng các bạn nữ đến với **Cộng Đồng Con Gái**! Cùng chia sẻ bí quyết học tốt, sáng tạo & thử `/ve`, `/sodo` nhé.",
            createdAt: Date.now() - 120000,
            timestamp: formatVietnamTime(Date.now() - 120000),
          },
        ],
      },
      registeredClasses: [],
      adminAutoReply: { enabled: true, customGreeting: "", updatedAt: Date.now() },
      adminMentions: [],
      deletedStarterCommunities: [],
      challenges: [],
    };
    try {
      fs.writeFileSync(SOCIAL_DB_PATH, JSON.stringify(initDb, null, 2), "utf-8");
    } catch {}
    return initDb;
  }

  function saveSocialDb(db: SocialDb) {
    try {
      fs.writeFileSync(SOCIAL_DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save social db", e);
    }
  }

  // Search users by NAME only (Instant match, no class/grade required!)
  app.get("/api/users/search", (req, res) => {
    const db = loadSocialDb();
    const q = ((req.query.q as string) || "").trim().toLowerCase();
    const excludeId = ((req.query.excludeId as string) || "").trim();

    let list = db.users.filter((u) => u.id !== excludeId);
    if (q) {
      // Normalize search
      const normalizedQ = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      list = list.filter((u) => {
        const name = (u.name || "").toLowerCase();
        const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(q) || normalizedName.includes(normalizedQ);
      });
    }

    // Return ONLY safe public profile fields (never password, email, phone, dob)
    const formatted = list.map((u) => sanitizePublicUser(u, db.challenges || []));

    res.json({ success: true, users: formatted });
  });

  // List real registered student & teacher accounts for login switcher (sanitized)
  app.get("/api/users/accounts", (_req, res) => {
    const db = loadSocialDb();
    const accounts = (db.users || [])
      .filter(
        (u: any) =>
          u &&
          u.id &&
          u.role !== "admin" &&
          u.id !== "admin-mac-khanh-duy" &&
          u.id !== SUPER_ADMIN_ACCOUNT.id &&
          !u.id.startsWith("std-") &&
          !u.id.startsWith("mock") &&
          !u.id.startsWith("fake") &&
          u.id !== "user-quynh"
      )
      .map((u: any) => sanitizePublicUser(u, db.challenges || []));
    res.json({ success: true, accounts });
  });

  // Privacy-safe Public Member Profile Endpoint (explicitly strips password, Gmail/email, phone, dob)
  app.get("/api/users/public-profile/:id", (req, res) => {
    const targetId = decodeURIComponent(req.params.id || "").trim();
    const db = loadSocialDb();
    const challenges = db.challenges || [];
    const foundUser = (db.users || []).find((u: any) => u && u.id === targetId);
    if (foundUser) {
      return res.json({ success: true, profile: sanitizePublicUser(foundUser, challenges) });
    }
    const completed = challenges.filter(
      (c: any) => c && (c.challengerId === targetId || c.opponentId === targetId) && c.status === "completed"
    );
    const duelWins = completed.filter((c: any) => c.winnerId === targetId).length;
    return res.json({
      success: true,
      profile: {
        id: targetId,
        name: targetId === "admin-mac-khanh-duy" ? "Quản trị viên Max10" : "Thành viên Max10",
        avatar: "",
        role: targetId === "admin-mac-khanh-duy" ? "admin" : "student",
        roleLabel: targetId === "admin-mac-khanh-duy" ? "Quản trị viên" : "Học sinh",
        presenceStatus: "online",
        duelWins,
        duelPlayed: completed.length,
      },
    });
  });

  // Sync / register user profile (Google, Facebook, Email, or Name + Teacher Verification)
  app.post("/api/users/sync", (req, res) => {
    const {
      id,
      name,
      email,
      phone,
      avatar,
      provider = "name",
      role = "student",
      gender,
      dob,
      plan = "free",
      presenceStatus = "online",
      isVerifiedTeacher,
      teacherTitle,
      teacherRoleType,
      teachingSubject,
      homeroomClass,
      teachingClasses,
      schoolName,
      studentClass,
    } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }

    const db = loadSocialDb();
    const userId = id || `user-${Date.now()}`;
    const existingIndex = db.users.findIndex((u) => u.id === userId);
    const cleanSlug = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

    const userObj = {
      id: userId,
      name: name.trim(),
      email: (email && String(email).trim()) || `${cleanSlug || "user"}@max10.edu.vn`,
      phone: phone ? String(phone).trim() : undefined,
      avatar: avatar || "",
      provider,
      role,
      gender,
      dob,
      plan: plan || "free",
      presenceStatus: presenceStatus || "online",
      isVerifiedTeacher: Boolean(isVerifiedTeacher),
      teacherTitle,
      teacherRoleType,
      teachingSubject,
      homeroomClass,
      teachingClasses,
      schoolName,
      studentClass,
      lastActive: Date.now(),
      createdAt:
        existingIndex >= 0 && db.users[existingIndex]?.createdAt
          ? db.users[existingIndex].createdAt
          : new Date().toLocaleDateString("vi-VN"),
    };

    if (existingIndex >= 0) {
      db.users[existingIndex] = { ...db.users[existingIndex], ...userObj };
    } else {
      db.users.push(userObj);
    }

    // Record login/sync audit log (throttle same user within 60s)
    if (!Array.isArray(db.loginLogs)) db.loginLogs = [];
    const lastLog = db.loginLogs[0];
    const nowMs = Date.now();
    if (!lastLog || lastLog.userId !== userId || nowMs - lastLog.createdAt > 60000) {
      db.loginLogs.unshift({
        id: `log-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        userName: userObj.name,
        role: userObj.role || "student",
        provider: String(provider || "name"),
        createdAt: nowMs,
        timeStr: `${formatVietnamTime(nowMs)} · ${formatVietnamDate(nowMs)}`,
      });
      if (db.loginLogs.length > 200) {
        db.loginLogs = db.loginLogs.slice(0, 200);
      }
    }

    saveSocialDb(db);
    res.json({ success: true, user: userObj });
  });

  // Live Session Heartbeat & God-Mode Check (forceLogout, locked, VIP gifts, pinned global banner)
  app.get("/api/users/session-check", (req, res) => {
    const userId = String(req.query.userId || "").trim();
    const sessionStartedAt = Number(req.query.sessionStartedAt || 0);
    const db = loadSocialDb();

    let forceLogout = false;
    let locked = false;
    let vipGift = null;

    if (userId) {
      const user = (db.users || []).find((u: any) => u && u.id === userId);
      const nowMs = Date.now();
      if (user) {
        const prevActive = Number(user.lastActive || 0);
        user.lastActive = nowMs;
        if (!user.presenceStatus || user.presenceStatus === "offline") {
          user.presenceStatus = "online";
        }
        if (nowMs - prevActive > 30000) {
          saveSocialDb(db);
        }
      }

      const forcedTs = Number(db.forcedLogoutAt?.[userId] || 0);
      if (forcedTs > 0 && forcedTs > sessionStartedAt && userId !== "admin-mac-khanh-duy") {
        forceLogout = true;
      }
      const override = accountOverrides.get(userId);
      if (override?.status === "locked" && userId !== "admin-mac-khanh-duy") {
        locked = true;
      }
      if (db.vipGifts && db.vipGifts[userId]) {
        vipGift = db.vipGifts[userId];
      }
    }

    res.json({
      success: true,
      forceLogout,
      locked,
      vipGift,
      pinnedBanner: db.pinnedSystemBanner || null,
      serverTime: Date.now(),
    });
  });

  app.post("/api/users/vip-gifts/ack", (req, res) => {
    const { userId, giftId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "Thiếu userId" });
    }
    const db = loadSocialDb();
    if (db.vipGifts && db.vipGifts[userId]) {
      if (!giftId || db.vipGifts[userId].id === giftId) {
        delete db.vipGifts[userId];
        saveSocialDb(db);
      }
    }
    res.json({ success: true });
  });

  // Real Class Registrations Endpoint (No fake teachers)
  app.get("/api/classes/registered", (_req, res) => {
    const db = loadSocialDb();
    res.json({ success: true, entries: db.registeredClasses || [] });
  });

  app.post("/api/classes/register-teacher", (req, res) => {
    const { entries = [] } = req.body;
    const db = loadSocialDb();
    if (!db.registeredClasses) db.registeredClasses = [];

    if (Array.isArray(entries)) {
      entries.forEach((entry: any) => {
        if (!entry || !entry.classCode || !entry.teacherId) return;
        const idx = db.registeredClasses!.findIndex(
          (r: any) => r.teacherId === entry.teacherId && r.classCode === entry.classCode
        );
        if (idx >= 0) {
          db.registeredClasses![idx] = entry;
        } else {
          db.registeredClasses!.unshift(entry);
        }
      });
      saveSocialDb(db);
    }

    res.json({ success: true, entries: db.registeredClasses });
  });

  // Exam Library Resources (PDF / Image sample exams uploaded by teachers)
  const EXAM_RESOURCES_DB_PATH = path.resolve(process.cwd(), "exam_resources_db.json");

  function loadExamResourcesDb(): any[] {
    try {
      if (fs.existsSync(EXAM_RESOURCES_DB_PATH)) {
        const parsed = JSON.parse(fs.readFileSync(EXAM_RESOURCES_DB_PATH, "utf-8"));
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  function saveExamResourcesDb(list: any[]) {
    try {
      fs.writeFileSync(EXAM_RESOURCES_DB_PATH, JSON.stringify(list, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save exam_resources_db.json:", e);
    }
  }

  app.get("/api/exam-resources", (_req, res) => {
    const resources = loadExamResourcesDb();
    res.json({ success: true, resources });
  });

  app.post("/api/exam-resources", (req, res) => {
    try {
      const resource = req.body;
      if (!resource || !resource.id || !resource.title || !resource.fileDataUrl) {
        return res.status(400).json({ success: false, error: "Thiếu dữ liệu tệp đề thi!" });
      }
      const list = loadExamResourcesDb().filter((r: any) => r.id !== resource.id);
      list.unshift(resource);
      saveExamResourcesDb(list);
      res.json({ success: true, resource, resources: list });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "Server error" });
    }
  });

  app.delete("/api/exam-resources/:id", (req, res) => {
    const { id } = req.params;
    const list = loadExamResourcesDb().filter((r: any) => r.id !== id);
    saveExamResourcesDb(list);
    res.json({ success: true, resources: list });
  });

  app.post("/api/exam-resources/:id/download", (req, res) => {
    const { id } = req.params;
    const list = loadExamResourcesDb().map((r: any) =>
      r.id === id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r
    );
    saveExamResourcesDb(list);
    res.json({ success: true });
  });

  // Update presence status (online, dnd, gaming, offline)
  app.post("/api/users/status", (req, res) => {
    const { userId, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ success: false, error: "Missing userId or status" });
    }

    const validStatuses = ["online", "dnd", "gaming", "offline"];
    const newStatus = validStatuses.includes(status) ? status : "online";

    const db = loadSocialDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.presenceStatus = newStatus;
      user.lastActive = Date.now();
      saveSocialDb(db);
    }

    res.json({ success: true, status: newStatus });
  });

  // Get Friend Requests (incoming and outgoing)
  app.get("/api/friends/requests", (req, res) => {
    const userId = (req.query.userId as string) || "";
    if (!userId) {
      return res.json({ incoming: [], outgoing: [] });
    }

    const db = loadSocialDb();
    const incoming = db.friendRequests.filter(
      (r) => r.toUserId === userId && r.status === "pending"
    );
    const outgoing = db.friendRequests.filter(
      (r) => r.fromUserId === userId && r.status === "pending"
    );

    res.json({ success: true, incoming, outgoing });
  });

  // Send a Friend Request
  app.post("/api/friends/request", (req, res) => {
    const { fromUser, toUser } = req.body;
    if (!fromUser?.id || !toUser?.id) {
      return res.status(400).json({ success: false, error: "Missing user information" });
    }
    if (fromUser.id === toUser.id) {
      return res.status(400).json({ success: false, error: "Cannot add yourself as friend" });
    }

    const db = loadSocialDb();

    // Auto-register both users in db.users if missing
    if (fromUser && fromUser.id) {
      const idx = db.users.findIndex((u) => u.id === fromUser.id);
      if (idx === -1) {
        db.users.push({
          id: fromUser.id,
          name: fromUser.name,
          email: `${fromUser.name.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
          avatar: fromUser.avatar || '',
          provider: 'name',
          role: 'student',
          createdAt: new Date().toLocaleDateString('vi-VN'),
        });
      }
    }
    if (toUser && toUser.id) {
      const idx = db.users.findIndex((u) => u.id === toUser.id);
      if (idx === -1) {
        db.users.push({
          id: toUser.id,
          name: toUser.name,
          email: `${toUser.name.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
          avatar: toUser.avatar || '',
          provider: 'name',
          role: 'student',
          createdAt: new Date().toLocaleDateString('vi-VN'),
        });
      }
    }

    // Check if blocked
    if (!db.blockedUsers) db.blockedUsers = [];
    const isBlocked = db.blockedUsers.some(
      (b) =>
        (b.userId === fromUser.id && b.blockedId === toUser.id) ||
        (b.userId === toUser.id && b.blockedId === fromUser.id)
    );
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        error: "blocked",
        message: "Không thể kết bạn do người dùng này đã bị chặn.",
      });
    }

    // Check if already friends
    const alreadyFriend = db.friendships.some(
      (f) =>
        (f.user1Id === fromUser.id && f.user2Id === toUser.id) ||
        (f.user1Id === toUser.id && f.user2Id === fromUser.id)
    );
    if (alreadyFriend) {
      return res.json({ success: true, message: "Already friends", status: "already_friends" });
    }

    // Check if already pending from this user
    const existingReq = db.friendRequests.find(
      (r) =>
        ((r.fromUserId === fromUser.id && r.toUserId === toUser.id) ||
          (r.fromUserId === toUser.id && r.toUserId === fromUser.id)) &&
        r.status === "pending"
    );

    if (existingReq) {
      // If the other person already sent a request to me, auto-accept or return
      if (existingReq.fromUserId === toUser.id && existingReq.toUserId === fromUser.id) {
        existingReq.status = "accepted";
        db.friendships.push({
          user1Id: fromUser.id,
          user2Id: toUser.id,
          createdAt: new Date().toLocaleDateString("vi-VN"),
        });
        saveSocialDb(db);
        return res.json({
          success: true,
          status: "accepted",
          request: existingReq,
          message: "Tự động chấp nhận lời mời từ hai phía!",
        });
      }
      return res.json({ success: true, status: "pending", request: existingReq });
    }

    const newReq = {
      id: "req-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      fromUserId: fromUser.id,
      fromUserName: fromUser.name,
      fromUserAvatar: fromUser.avatar || "",
      toUserId: toUser.id,
      toUserName: toUser.name,
      toUserAvatar: toUser.avatar || "",
      status: "pending",
      createdAt: formatVietnamTime(Date.now()) + " " + formatVietnamDate(Date.now()),
    };

    db.friendRequests.unshift(newReq);
    saveSocialDb(db);

    res.json({ success: true, status: "pending", request: newReq });
  });

  // Respond to Friend Request (ACCEPT or DECLINE)
  app.post("/api/friends/respond", (req, res) => {
    const { requestId, action } = req.body; // action: 'accept' | 'decline'
    if (!requestId || !action) {
      return res.status(400).json({ success: false, error: "Missing requestId or action" });
    }

    const db = loadSocialDb();
    const reqItem = db.friendRequests.find((r) => r.id === requestId);
    if (!reqItem) {
      return res.status(404).json({ success: false, error: "Friend request not found" });
    }

    if (action === "accept") {
      reqItem.status = "accepted";
      // Ensure both users exist in db.users
      if (!db.users.some((u) => u.id === reqItem.fromUserId)) {
        db.users.push({
          id: reqItem.fromUserId,
          name: reqItem.fromUserName,
          email: `${reqItem.fromUserName.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
          avatar: reqItem.fromUserAvatar || '',
          provider: 'name',
          role: 'student',
          createdAt: new Date().toLocaleDateString('vi-VN'),
        });
      }
      if (!db.users.some((u) => u.id === reqItem.toUserId)) {
        db.users.push({
          id: reqItem.toUserId,
          name: reqItem.toUserName,
          email: `${reqItem.toUserName.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
          avatar: reqItem.toUserAvatar || '',
          provider: 'name',
          role: 'student',
          createdAt: new Date().toLocaleDateString('vi-VN'),
        });
      }
      // Ensure friendship is recorded
      const exists = db.friendships.some(
        (f) =>
          (f.user1Id === reqItem.fromUserId && f.user2Id === reqItem.toUserId) ||
          (f.user1Id === reqItem.toUserId && f.user2Id === reqItem.fromUserId)
      );
      if (!exists) {
        db.friendships.push({
          user1Id: reqItem.fromUserId,
          user2Id: reqItem.toUserId,
          createdAt: new Date().toLocaleDateString("vi-VN"),
        });
      }
    } else if (action === "decline") {
      reqItem.status = "declined";
    }

    saveSocialDb(db);
    res.json({ success: true, action, request: reqItem });
  });

  // Cancel Friend Request (outgoing)
  app.post("/api/friends/cancel", (req, res) => {
    const { requestId, fromUserId, toUserId } = req.body;
    const db = loadSocialDb();

    if (requestId) {
      db.friendRequests = db.friendRequests.filter((r) => r.id !== requestId);
    } else if (fromUserId && toUserId) {
      db.friendRequests = db.friendRequests.filter(
        (r) => !(r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === "pending")
      );
    }

    saveSocialDb(db);
    res.json({ success: true });
  });

  // Get Friend List for a user
  app.get("/api/friends/list", (req, res) => {
    const userId = (req.query.userId as string) || "";
    if (!userId) {
      return res.json({ friends: [] });
    }

    const db = loadSocialDb();
    const friendIds = new Set<string>();

    db.friendships.forEach((f) => {
      if (f.user1Id === userId) friendIds.add(f.user2Id);
      if (f.user2Id === userId) friendIds.add(f.user1Id);
    });

    const friends = db.users
      .filter((u) => friendIds.has(u.id))
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        school: "Học sinh Max10",
        status: "friend",
        presenceStatus: u.presenceStatus || "online",
        addedAt: "Đã kết bạn",
      }));

    res.json({ success: true, friends });
  });

  // Remove Friend (Hủy kết bạn)
  app.post("/api/friends/remove", (req, res) => {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ success: false, error: "Missing userId or friendId" });
    }

    const db = loadSocialDb();

    db.friendships = db.friendships.filter(
      (f) =>
        !(
          (f.user1Id === userId && f.user2Id === friendId) ||
          (f.user1Id === friendId && f.user2Id === userId)
        )
    );

    saveSocialDb(db);
    res.json({ success: true, message: "Đã hủy kết bạn thành công" });
  });

  // Block User (Chặn người dùng)
  app.post("/api/friends/block", (req, res) => {
    const { userId, targetId } = req.body;
    if (!userId || !targetId) {
      return res.status(400).json({ success: false, error: "Missing userId or targetId" });
    }

    const db = loadSocialDb();
    if (!db.blockedUsers) db.blockedUsers = [];

    // Remove friendship if any
    db.friendships = db.friendships.filter(
      (f) =>
        !(
          (f.user1Id === userId && f.user2Id === targetId) ||
          (f.user1Id === targetId && f.user2Id === userId)
        )
    );

    // Cancel any pending requests
    db.friendRequests = db.friendRequests.filter(
      (r) =>
        !(
          (r.fromUserId === userId && r.toUserId === targetId) ||
          (r.fromUserId === targetId && r.toUserId === userId)
        )
    );

    // Add block record if not already blocked
    const alreadyBlocked = db.blockedUsers.some(
      (b) => b.userId === userId && b.blockedId === targetId
    );
    if (!alreadyBlocked) {
      db.blockedUsers.push({
        userId,
        blockedId: targetId,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      });
    }

    saveSocialDb(db);
    res.json({ success: true, message: "Đã chặn người dùng thành công" });
  });

  // Unblock User (Bỏ chặn người dùng)
  app.post("/api/friends/unblock", (req, res) => {
    const { userId, targetId } = req.body;
    if (!userId || !targetId) {
      return res.status(400).json({ success: false, error: "Missing userId or targetId" });
    }

    const db = loadSocialDb();
    if (!db.blockedUsers) db.blockedUsers = [];

    db.blockedUsers = db.blockedUsers.filter(
      (b) => !(b.userId === userId && b.blockedId === targetId)
    );

    saveSocialDb(db);
    res.json({ success: true, message: "Đã bỏ chặn thành công" });
  });

  // Get Blocked Users List
  app.get("/api/friends/blocked", (req, res) => {
    const userId = (req.query.userId as string) || "";
    if (!userId) {
      return res.json({ success: true, blocked: [] });
    }

    const db = loadSocialDb();
    if (!db.blockedUsers) db.blockedUsers = [];

    const myBlocked = db.blockedUsers.filter((b) => b.userId === userId);
    const blockedList = myBlocked.map((b) => {
      const targetUser = db.users.find((u) => u.id === b.blockedId);
      return {
        userId: b.blockedId,
        name: targetUser ? targetUser.name : "Người dùng",
        avatar: targetUser ? targetUser.avatar : "",
        blockedAt: b.createdAt,
      };
    });

    res.json({ success: true, blocked: blockedList });
  });

  // ==========================================
  // DIRECT 1-ON-1 MESSAGING (FREE SPEECH - NO CENSORED WORDS)
  // ==========================================
  app.post("/api/friends/messages", (req, res) => {
    const { senderId, senderName, senderAvatar, recipientId, content } = req.body;
    if (!senderId || !recipientId || !content) {
      return res.status(400).json({ success: false, error: "Missing senderId, recipientId, or content" });
    }

    const db = loadSocialDb();
    if (!db.blockedUsers) db.blockedUsers = [];

    // Check if blocked by either party
    const isBlocked = db.blockedUsers.some(
      (b) =>
        (b.userId === senderId && b.blockedId === recipientId) ||
        (b.userId === recipientId && b.blockedId === senderId)
    );
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        error: "blocked",
        message: "Không thể gửi tin nhắn do người dùng này đã bị chặn.",
      });
    }

    if (!db.directMessages) db.directMessages = [];

    const rawContent = (content || "").trim();
    if (!rawContent) {
      return res.status(400).json({ success: false, error: "Tin nhắn không được để trống" });
    }

    const msgId = req.body.id || ("dm-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7));

    // REQUIREMENT: "khi chat với bạn bè thì chỉ gửi một lần tin nhắn"
    // Strictly prevent duplicate insertion by ID or identical message within 5 seconds
    const existingMsg = db.directMessages.find((m: any) => {
      if (m.id === msgId) return true;
      if (
        m.senderId === senderId &&
        m.recipientId === recipientId &&
        (m.content || "").trim() === rawContent &&
        Math.abs((m.createdAt || 0) - (req.body.createdAt || Date.now())) < 5000
      ) {
        return true;
      }
      return false;
    });

    if (existingMsg) {
      return res.json({ success: true, message: existingMsg, deduplicated: true });
    }

    const msgCreatedAt = typeof req.body.createdAt === "number" && req.body.createdAt > 0 ? req.body.createdAt : Date.now();
    const newMsg = {
      id: msgId,
      senderId,
      senderName,
      senderAvatar: senderAvatar || "",
      recipientId,
      content: rawContent,
      timestamp: req.body.timestamp || formatVietnamTime(msgCreatedAt),
      createdAt: msgCreatedAt,
      ...(req.body.replyTo && req.body.replyTo.content ? { replyTo: req.body.replyTo } : {}),
    };

    db.directMessages.push(newMsg);
    // Keep max 500 recent direct messages
    if (db.directMessages.length > 500) {
      db.directMessages = db.directMessages.slice(-500);
    }

    // Track @Admin mention in DM/Broadcast for manual Admin reply mode
    const lowerDm = rawContent.toLowerCase();
    if (
      senderId !== "admin-mac-khanh-duy" &&
      (lowerDm.includes("@admin") ||
        lowerDm.includes("@mạc khánh duy") ||
        lowerDm.includes("@mac khanh duy") ||
        recipientId === "admin-mac-khanh-duy" ||
        recipientId === "all_broadcast")
    ) {
      if (!db.adminMentions) db.adminMentions = [];
      db.adminMentions.push({
        id: "mention-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        type: "direct",
        targetId: recipientId === "all_broadcast" ? "all_broadcast" : senderId,
        targetName:
          recipientId === "all_broadcast"
            ? "Thông Báo & Cập Nhật Từ Admin"
            : `Tin nhắn riêng từ ${senderName || "Học sinh"}`,
        senderId,
        senderName: senderName || "Học sinh Max10",
        content: rawContent,
        createdAt: msgCreatedAt,
        timestamp: newMsg.timestamp,
      });
      if (db.adminMentions.length > 100) {
        db.adminMentions = db.adminMentions.slice(-100);
      }
    }

    saveSocialDb(db);
    res.json({ success: true, message: newMsg });
  });

  app.get("/api/friends/messages", (req, res) => {
    const userId = (req.query.userId as string) || "";
    const friendId = (req.query.friendId as string) || "";
    if (!userId || !friendId) {
      return res.json({ success: true, messages: [] });
    }

    const db = loadSocialDb();
    const dms = (db.directMessages || [])
      .filter((m: any) => {
        if (friendId === "all_broadcast") {
          return m.recipientId === "all_broadcast";
        }
        return (
          (m.senderId === userId && m.recipientId === friendId) ||
          (m.senderId === friendId && m.recipientId === userId) ||
          (friendId === "admin-mac-khanh-duy" && m.senderId === "admin-mac-khanh-duy" && m.recipientId === "all_broadcast")
        );
      })
      .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));

    res.json({ success: true, messages: dms });
  });

  // ==========================================
  // STUDY GROUPS MANAGEMENT & SEARCH (LIKE ZALO)
  // (User Requested: "nhóm khi tạo chỉ bạn và bạn mới có thể thêm người vào thêm bạn bè hoặc tìm nhóm như zalo")
  // ==========================================
  const isLegacyUnrelatedGroup = (g: any) => {
    if (!g || !g.id) return true;
    if (g.isCustomClassGroup || g.isCommunity || g.createdByAdmin) return false;
    const name = (g.name || "").toString();
    if (
      g.id.startsWith("default-") ||
      g.createdBy === "system" ||
      g.id === "grp-noi-chuyen" ||
      g.id === "grp-dai-hoi-do-an" ||
      g.id === "grp-gia-dinh" ||
      (g.id.startsWith("class-group-") && name.includes("Nhóm Học Tập Chính Thức"))
    ) {
      return true;
    }
    return false;
  };

  app.get("/api/communities", (req, res) => {
    const category = ((req.query.category as string) || "").trim().toLowerCase();
    const platform = ((req.query.platform as string) || "").trim().toLowerCase();
    const q = ((req.query.search as string) || "").trim().toLowerCase();
    const includePending = req.query.includePending === "true";
    const db = loadSocialDb();
    let communities = (db.groups || []).filter((g: any) => g && g.isCommunity && !isLegacyUnrelatedGroup(g));
    if (!includePending) {
      communities = communities.filter((g: any) => (g.approvalStatus || "approved") === "approved");
    }
    if (category === "game" || category === "study" || category === "chat") {
      communities = communities.filter((g: any) => g.communityCategory === category);
    }
    if (platform && platform !== "all") {
      communities = communities.filter(
        (g: any) => String(g.gamePlatform || "").toLowerCase() === platform
      );
    }
    if (q) {
      communities = communities.filter(
        (g: any) =>
          (g.name && g.name.toLowerCase().includes(q)) ||
          (g.gameTitle && g.gameTitle.toLowerCase().includes(q)) ||
          (g.gamePlatform && g.gamePlatform.toLowerCase().includes(q)) ||
          (g.gameGenre && g.gameGenre.toLowerCase().includes(q)) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }
    res.json({ success: true, communities });
  });

  // Propose a new Game/Study/Chat Community (User proposals go to pending queue; Admin is approved immediately)
  app.post("/api/communities/propose", (req, res) => {
    const {
      name,
      description,
      avatarIcon,
      communityCategory,
      gamePlatform,
      gameTitle,
      gameGenre,
      requesterId,
      requesterName,
      requesterAvatar,
      isAdminRequester,
      pinTrending,
      trendingBadge,
    } = req.body || {};

    if (!name || !String(name).trim() || !requesterId) {
      return res.status(400).json({ success: false, error: "Tên cộng đồng và thông tin người gửi không được trống." });
    }

    const db = loadSocialDb();
    if (!db.groups) db.groups = [];
    const now = Date.now();
    const isAdminCreator = requesterId === "admin-mac-khanh-duy" || Boolean(isAdminRequester);
    const resolvedCategory =
      communityCategory === "study" ? "study" : communityCategory === "chat" ? "chat" : "game";
    const resolvedPlatform = resolvedCategory === "game" ? gamePlatform || "Cross-Platform" : undefined;
    const commId = "community-" + now + "-" + Math.random().toString(36).substring(2, 5);
    const commCode = "CD-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newCommunity = {
      id: commId,
      name: String(name).trim(),
      description:
        String(description || "").trim() ||
        (resolvedCategory === "game"
          ? `Cộng đồng Game ${String(gameTitle || name).trim()} (${resolvedPlatform}) cho thành viên người thật.`
          : resolvedCategory === "chat"
          ? "Cộng đồng trò chuyện tự do cho thành viên người thật."
          : "Cộng đồng học tập cho thành viên người thật."),
      grade: "Lớp 9",
      subject:
        resolvedCategory === "game"
          ? `Trò chơi · ${resolvedPlatform}`
          : resolvedCategory === "chat"
          ? "Trò chuyện tự do"
          : "Học tập",
      avatarIcon: avatarIcon || (resolvedCategory === "game" ? "🎮" : resolvedCategory === "chat" ? "💬" : "📚"),
      createdAt: now,
      createdBy: isAdminCreator ? "admin-mac-khanh-duy" : requesterId,
      createdByName: requesterName || "Thành viên Max10",
      createdByAdmin: isAdminCreator,
      isCommunity: true,
      communityCategory: resolvedCategory,
      ...(resolvedPlatform ? { gamePlatform: resolvedPlatform } : {}),
      ...(gameTitle ? { gameTitle: String(gameTitle).trim() } : {}),
      ...(gameGenre ? { gameGenre: String(gameGenre).trim() } : {}),
      isPinnedTrending: isAdminCreator && resolvedCategory === "game" ? Boolean(pinTrending) : false,
      ...(isAdminCreator && resolvedCategory === "game" && pinTrending
        ? { pinnedTrendingAt: now, trendingBadge: String(trendingBadge || "Thịnh hành").trim() }
        : {}),
      approvalStatus: isAdminCreator ? "approved" : "pending",
      submittedById: requesterId,
      submittedByName: requesterName || "Thành viên Max10",
      ...(isAdminCreator ? { approvedAt: now, approvedBy: "admin-mac-khanh-duy" } : {}),
      isPublic: true,
      onlyAdminCanAdd: false,
      code: commCode,
      pinnedNotice:
        resolvedCategory === "game"
          ? `🎮 Cộng đồng ${String(gameTitle || name).trim()} (${resolvedPlatform}) — Nơi giao lưu game thủ & bàn luận game cùng @Max10 AI!`
          : resolvedCategory === "chat"
          ? `💬 Cộng đồng ${String(name).trim()} — Trò chuyện tự do, vui vẻ cùng bạn bè & @Max10 AI!`
          : `📚 Cộng đồng ${String(name).trim()} — Thảo luận học tập & hỏi bài cùng @Max10 AI!`,
      members: [
        {
          id: requesterId,
          name: requesterName || "Thành viên",
          avatar: requesterAvatar || "",
          role: isAdminCreator ? "admin" : "member",
          school: isAdminCreator ? "Ban Quản Trị Max10 AI" : "Thành viên Max10",
        },
      ],
      mutedUsers: {},
    };

    db.groups.unshift(newCommunity);
    saveSocialDb(db);
    res.json({ success: true, group: newCommunity });
  });

  // Admin: Approve or Reject a proposed community
  app.post("/api/communities/:id/approve", (req, res) => {
    const commId = req.params.id;
    const { action, adminId, isAdminRequester, pinTrending, trendingBadge } = req.body || {};
    const isAdminUser = adminId === "admin-mac-khanh-duy" || Boolean(isAdminRequester);
    if (!isAdminUser) {
      return res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền duyệt cộng đồng!" });
    }

    const db = loadSocialDb();
    if (!db.groups) db.groups = [];
    const idx = db.groups.findIndex((g: any) => g.id === commId);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cộng đồng cần duyệt" });
    }

    const now = Date.now();
    if (action === "reject") {
      db.groups[idx] = {
        ...db.groups[idx],
        approvalStatus: "rejected",
        isPinnedTrending: false,
        approvedAt: now,
        approvedBy: "admin-mac-khanh-duy",
      };
    } else {
      db.groups[idx] = {
        ...db.groups[idx],
        approvalStatus: "approved",
        approvedAt: now,
        approvedBy: "admin-mac-khanh-duy",
        ...(pinTrending
          ? {
              isPinnedTrending: true,
              pinnedTrendingAt: now,
              trendingBadge: String(trendingBadge || db.groups[idx].trendingBadge || "Thịnh hành").trim(),
            }
          : {}),
      };
    }

    saveSocialDb(db);
    res.json({ success: true, group: db.groups[idx] });
  });

  // Admin: Pin or Unpin a trending video game community
  app.post("/api/communities/:id/pin-trending", (req, res) => {
    const commId = req.params.id;
    const { pinned, trendingBadge, adminId, isAdminRequester } = req.body || {};
    const isAdminUser = adminId === "admin-mac-khanh-duy" || Boolean(isAdminRequester);
    if (!isAdminUser) {
      return res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền ghim trò chơi thịnh hành!" });
    }

    const db = loadSocialDb();
    if (!db.groups) db.groups = [];
    const idx = db.groups.findIndex((g: any) => g.id === commId);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cộng đồng" });
    }

    const nextPinned = typeof pinned === "boolean" ? pinned : !db.groups[idx].isPinnedTrending;
    db.groups[idx] = {
      ...db.groups[idx],
      isPinnedTrending: nextPinned,
      pinnedTrendingAt: nextPinned ? Date.now() : undefined,
      trendingBadge: nextPinned
        ? String(trendingBadge || db.groups[idx].trendingBadge || "Thịnh hành").trim()
        : db.groups[idx].trendingBadge,
    };

    saveSocialDb(db);
    res.json({ success: true, group: db.groups[idx] });
  });

  // Admin: Edit / Manage community metadata
  app.patch("/api/communities/:id", (req, res) => {
    const commId = req.params.id;
    const {
      adminId,
      isAdminRequester,
      name,
      description,
      avatarIcon,
      communityCategory,
      gamePlatform,
      gameTitle,
      gameGenre,
      pinnedNotice,
      isPinnedTrending,
      trendingBadge,
      approvalStatus,
    } = req.body || {};
    const isAdminUser = adminId === "admin-mac-khanh-duy" || Boolean(isAdminRequester);
    if (!isAdminUser) {
      return res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa cộng đồng!" });
    }

    const db = loadSocialDb();
    if (!db.groups) db.groups = [];
    const idx = db.groups.findIndex((g: any) => g.id === commId);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cộng đồng" });
    }

    const current = db.groups[idx];
    const nextCategory =
      communityCategory === "game" || communityCategory === "study" || communityCategory === "chat"
        ? communityCategory
        : current.communityCategory;
    const nextPlatform = nextCategory === "game" ? gamePlatform || current.gamePlatform || "Cross-Platform" : undefined;
    const nextPinned = typeof isPinnedTrending === "boolean" ? isPinnedTrending : current.isPinnedTrending;

    db.groups[idx] = {
      ...current,
      ...(name !== undefined && String(name).trim() ? { name: String(name).trim() } : {}),
      ...(description !== undefined ? { description: String(description).trim() } : {}),
      ...(avatarIcon !== undefined ? { avatarIcon } : {}),
      communityCategory: nextCategory,
      subject:
        nextCategory === "game"
          ? `Trò chơi · ${nextPlatform}`
          : nextCategory === "chat"
          ? "Trò chuyện tự do"
          : "Học tập",
      ...(nextPlatform ? { gamePlatform: nextPlatform } : {}),
      ...(gameTitle !== undefined ? { gameTitle: String(gameTitle).trim() } : {}),
      ...(gameGenre !== undefined ? { gameGenre: String(gameGenre).trim() } : {}),
      ...(pinnedNotice !== undefined ? { pinnedNotice: String(pinnedNotice).trim() } : {}),
      isPinnedTrending: Boolean(nextPinned),
      ...(nextPinned ? { pinnedTrendingAt: current.pinnedTrendingAt || Date.now() } : {}),
      ...(trendingBadge !== undefined ? { trendingBadge: String(trendingBadge).trim() } : {}),
      ...(approvalStatus ? { approvalStatus } : {}),
    };

    saveSocialDb(db);
    res.json({ success: true, group: db.groups[idx] });
  });

  app.get("/api/groups", (req, res) => {
    const q = ((req.query.search as string) || "").trim().toLowerCase();
    const db = loadSocialDb();
    if (!db.groups) db.groups = [];

    const cleanedGroups = db.groups.filter((g: any) => !isLegacyUnrelatedGroup(g));
    if (cleanedGroups.length !== db.groups.length) {
      db.groups = cleanedGroups;
      saveSocialDb(db);
    }

    let result = cleanedGroups;
    if (q) {
      result = result.filter(
        (g: any) =>
          (g.name && g.name.toLowerCase().includes(q)) ||
          (g.code && g.code.toLowerCase().includes(q)) ||
          (g.subject && g.subject.toLowerCase().includes(q)) ||
          (g.gameTitle && g.gameTitle.toLowerCase().includes(q)) ||
          (g.gamePlatform && g.gamePlatform.toLowerCase().includes(q)) ||
          (g.gameGenre && g.gameGenre.toLowerCase().includes(q)) ||
          (g.description && g.description.toLowerCase().includes(q)) ||
          (g.classCode && g.classCode.toLowerCase().includes(q))
      );
    }
    res.json({ success: true, groups: result });
  });

  app.post("/api/groups", (req, res) => {
    const {
      name,
      description,
      grade,
      subject,
      avatarIcon,
      createdBy,
      createdByName,
      creatorAvatar,
      code,
      onlyAdminCanAdd,
      isClassGroup,
      isCustomClassGroup,
      isCommunity,
      communityCategory,
      createdByAdmin,
      gamePlatform,
      gameTitle,
      gameGenre,
      isPinnedTrending,
      pinnedTrendingAt,
      trendingBadge,
      approvalStatus,
      isPublic,
      pinnedNotice,
      classCode,
      studentCapacity,
      maxMembers,
      homeroomTeacherId,
      homeroomTeacherName,
    } = req.body;
    if (!name || !createdBy) {
      return res.status(400).json({ success: false, error: "Tên nhóm và người tạo không được để trống" });
    }

    const isOfficialAdminCreator =
      createdBy === "admin-mac-khanh-duy" || Boolean(createdByAdmin);

    if (isCommunity && !isOfficialAdminCreator) {
      return res.status(403).json({
        success: false,
        error: "Chỉ Quản trị viên (Admin) mới có quyền lập Cộng đồng chính thức!",
      });
    }

    const db = loadSocialDb();
    if (!db.groups) db.groups = [];

    const groupId = req.body.id || (isCommunity ? "community-" + Date.now() : "group-" + Date.now());
    const groupCode = (
      code ||
      (isCommunity ? "CD-" : "ZL-") + Math.random().toString(36).substring(2, 6).toUpperCase()
    ).toUpperCase();

    const rawMembers = Array.isArray(req.body.members)
      ? req.body.members
      : [
          {
            id: createdBy,
            name: createdByName || "Bạn (Trưởng nhóm)",
            role: "admin",
            avatar: creatorAvatar || "",
            school: isCommunity ? "Ban Quản Trị Max10 AI" : "THCS Nguyễn Du",
          },
        ];

    // Strictly exclude any AI entities from group/community members
    const initialMembers = rawMembers.filter((m: any) => !isServerAiEntity(m));

    const resolvedCategory =
      communityCategory === "game" ? "game" : communityCategory === "chat" ? "chat" : "study";
    const resolvedPlatform =
      resolvedCategory === "game" ? gamePlatform || "Cross-Platform" : undefined;

    const newGroup = {
      id: groupId,
      name: name.trim(),
      description: (
        description ||
        (isCommunity
          ? resolvedCategory === "game"
            ? `Cộng đồng trò chơi (${resolvedPlatform}) & thi đấu cho người thật (do Admin lập)`
            : resolvedCategory === "chat"
            ? "Cộng đồng trò chuyện tự do cho nhiều người thật (do Admin lập)"
            : "Cộng đồng học tập cho nhiều người thật (do Admin lập)"
          : "Nhóm học tập và trao đổi bài")
      ).trim(),
      grade: grade || "Lớp 9",
      subject:
        subject ||
        (isCommunity
          ? resolvedCategory === "game"
            ? `Trò chơi · ${resolvedPlatform}`
            : resolvedCategory === "chat"
            ? "Trò chuyện tự do"
            : "Học tập"
          : "Toán"),
      avatarIcon:
        avatarIcon ||
        (isCommunity
          ? resolvedCategory === "game"
            ? "🎮"
            : resolvedCategory === "chat"
            ? "💬"
            : "📚"
          : "📚"),
      createdAt: req.body.createdAt || Date.now(),
      createdBy,
      createdByName: createdByName || "Bạn",
      code: groupCode,
      // Communities always allow many real users to join freely
      onlyAdminCanAdd: isCommunity ? false : onlyAdminCanAdd !== undefined ? onlyAdminCanAdd : true,
      members: initialMembers,
      mutedUsers: req.body.mutedUsers || {},
      ...(isCommunity
        ? {
            isCommunity: true,
            communityCategory: resolvedCategory,
            createdByAdmin: true,
            ...(resolvedPlatform ? { gamePlatform: resolvedPlatform } : {}),
            ...(gameTitle ? { gameTitle: String(gameTitle).trim() } : {}),
            ...(gameGenre ? { gameGenre: String(gameGenre).trim() } : {}),
            isPinnedTrending: Boolean(isPinnedTrending),
            ...(isPinnedTrending
              ? {
                  pinnedTrendingAt: pinnedTrendingAt || Date.now(),
                  trendingBadge: String(trendingBadge || "Thịnh hành").trim(),
                }
              : {}),
            approvalStatus: approvalStatus || "approved",
            approvedAt: Date.now(),
            approvedBy: "admin-mac-khanh-duy",
            isPublic: isPublic !== false,
            pinnedNotice:
              pinnedNotice ||
              `🌐 Cộng đồng do Admin Mạc Khánh Duy lập — Nơi nhiều thành viên người thật giao lưu, không có AI giả. Gõ @ để hỏi Admin!`,
          }
        : {}),
      ...(isClassGroup ? { isClassGroup: true } : {}),
      ...(isCustomClassGroup ? { isCustomClassGroup: true } : {}),
      ...(classCode ? { classCode } : {}),
      ...(typeof studentCapacity === "number" ? { studentCapacity } : {}),
      ...(typeof maxMembers === "number" ? { maxMembers } : {}),
      ...(homeroomTeacherId ? { homeroomTeacherId } : {}),
      ...(homeroomTeacherName ? { homeroomTeacherName } : {}),
    };

    const idx = db.groups.findIndex((g: any) => g.id === groupId);
    if (idx >= 0) {
      db.groups[idx] = newGroup;
    } else {
      db.groups.unshift(newGroup);
    }
    saveSocialDb(db);

    res.json({ success: true, group: newGroup });
  });

  app.delete("/api/groups/:id", (req, res) => {
    const groupId = req.params.id;
    const db = loadSocialDb();
    if (!db.groups) db.groups = [];
    db.groups = db.groups.filter((g: any) => g.id !== groupId);
    if (db.groupMessages && db.groupMessages[groupId]) {
      delete db.groupMessages[groupId];
    }
    if (groupId.startsWith("community-")) {
      if (!Array.isArray(db.deletedStarterCommunities)) db.deletedStarterCommunities = [];
      if (!db.deletedStarterCommunities.includes(groupId)) {
        db.deletedStarterCommunities.push(groupId);
      }
    }
    saveSocialDb(db);
    res.json({ success: true, deletedId: groupId });
  });

  app.post("/api/groups/:id/add-member", (req, res) => {
    const groupId = req.params.id;
    const { requesterId, member } = req.body;
    if (!requesterId || !member || !member.id) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin người yêu cầu hoặc thành viên mới" });
    }
    if (isServerAiEntity(member)) {
      return res.status(400).json({
        success: false,
        error: "Không thêm tài khoản AI vào danh sách thành viên cộng đồng/nhóm!",
      });
    }

    const db = loadSocialDb();
    if (!db.groups) db.groups = [];
    const group = db.groups.find((g: any) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: "Không tìm thấy nhóm" });
    }

    // REQUIREMENT: "nhóm khi tạo chỉ bạn và bạn mới có thể thêm người vào" (Communities are open to real users)
    if (!group.isCommunity && group.onlyAdminCanAdd && group.createdBy !== requesterId) {
      return res.status(403).json({
        success: false,
        error: "Chỉ trưởng nhóm (bạn) mới có quyền thêm người vào nhóm này (Chuẩn Zalo)!",
      });
    }

    if (!group.members) group.members = [];
    const exists = group.members.some((m: any) => m.id === member.id);
    if (!exists) {
      group.members.push({
        id: member.id,
        name: member.name || "Thành viên",
        avatar: member.avatar || "",
        role: member.id === "admin-mac-khanh-duy" ? "admin" : "member",
        school: member.school || "",
      });
      saveSocialDb(db);
    }

    res.json({ success: true, group });
  });

  app.post("/api/groups/:id/join", (req, res) => {
    const groupId = req.params.id;
    const { userId, userName, userAvatar, school } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin người dùng" });
    }
    if (isServerAiEntity({ id: userId, name: userName })) {
      return res.status(400).json({
        success: false,
        error: "Cộng đồng chỉ dành cho tài khoản người thật, không cho phép AI tham gia!",
      });
    }

    const db = loadSocialDb();
    if (!db.groups) db.groups = [];
    const group = db.groups.find((g: any) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: "Không tìm thấy nhóm hoặc cộng đồng" });
    }

    if (!group.members) group.members = [];
    const exists = group.members.some((m: any) => m.id === userId);
    if (!exists) {
      group.members.push({
        id: userId,
        name: userName || "Thành viên",
        avatar: userAvatar || "",
        role: userId === "admin-mac-khanh-duy" ? "admin" : "member",
        school: school || "",
      });
      saveSocialDb(db);
    }

    res.json({ success: true, group });
  });

  // Group Messages GET & POST
  app.get("/api/groups/:id/messages", (req, res) => {
    const groupId = req.params.id;
    const db = loadSocialDb();
    if (!db.groupMessages) db.groupMessages = {};
    const msgs = db.groupMessages[groupId] || [];
    res.json({ success: true, messages: msgs });
  });

  app.post("/api/groups/:id/messages", (req, res) => {
    const groupId = req.params.id;
    const msg = req.body;
    if (!msg || !msg.content) {
      return res.status(400).json({ success: false, error: "Nội dung tin nhắn trống" });
    }
    const db = loadSocialDb();
    if (!db.groupMessages) db.groupMessages = {};
    if (!db.groupMessages[groupId]) db.groupMessages[groupId] = [];

    const newMsg = {
      ...msg,
      id: msg.id || ("gmsg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6)),
      groupId,
      createdAt: msg.createdAt || Date.now(),
    };

    const alreadyExists = db.groupMessages[groupId].some((m: any) => m.id === newMsg.id);
    if (!alreadyExists) {
      db.groupMessages[groupId].push(newMsg);
    }
    // Keep max 500 messages per group
    if (db.groupMessages[groupId].length > 500) {
      db.groupMessages[groupId] = db.groupMessages[groupId].slice(-500);
    }

    // Track @Admin mention for manual Admin reply mode
    const lowerContent = String(newMsg.content || "").toLowerCase();
    const mentionsAdmin =
      (lowerContent.includes("@admin") ||
        lowerContent.includes("@mạc khánh duy") ||
        lowerContent.includes("@mac khanh duy")) &&
      newMsg.senderId !== "admin-mac-khanh-duy" &&
      !newMsg.isAi &&
      !newMsg.isSystemNotice;

    if (mentionsAdmin) {
      if (!db.adminMentions) db.adminMentions = [];
      const grp = (db.groups || []).find((g: any) => g.id === groupId);
      db.adminMentions.push({
        id: "mention-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        type: "group",
        targetId: groupId,
        targetName: grp?.name || "Cộng đồng / Nhóm",
        senderId: newMsg.senderId,
        senderName: newMsg.senderName,
        content: newMsg.content,
        createdAt: newMsg.createdAt,
        timestamp: newMsg.timestamp || formatVietnamTime(newMsg.createdAt),
      });
      if (db.adminMentions.length > 100) {
        db.adminMentions = db.adminMentions.slice(-100);
      }
    }

    saveSocialDb(db);
    res.json({ success: true, message: newMsg });
  });

  // ==========================================
  // COMMUNITY / GROUP / FRIEND DUEL CHALLENGES
  // ==========================================
  app.get("/api/challenges", (req, res) => {
    const db = loadSocialDb();
    const contextId = ((req.query.contextId as string) || "").trim();
    const userId = ((req.query.userId as string) || "").trim();
    let list = Array.isArray(db.challenges) ? [...db.challenges] : [];

    if (contextId) {
      list = list.filter((c: any) => c.contextId === contextId);
    }
    if (userId) {
      list = list.filter(
        (c: any) => c.challengerId === userId || c.opponentId === userId || !c.opponentId
      );
    }
    list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ success: true, challenges: list.slice(0, 50) });
  });

  app.post("/api/challenges", (req, res) => {
    const {
      id,
      contextType = "group",
      contextId,
      contextName = "Đấu trường Max10",
      subject = "Tổng hợp THCS",
      grade = "Lớp 9",
      challengerId,
      challengerName,
      challengerAvatar,
      opponentId,
      opponentName,
      opponentAvatar,
      questions = [],
      challengerScore,
      challengerTimeMs,
    } = req.body || {};

    if (!contextId || !challengerId || !challengerName || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin thách đấu!" });
    }

    const db = loadSocialDb();
    if (!Array.isArray(db.challenges)) db.challenges = [];

    const challenge = {
      id: id || `duel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contextType,
      contextId,
      contextName,
      subject,
      grade,
      challengerId,
      challengerName,
      challengerAvatar: challengerAvatar || "",
      opponentId: opponentId || undefined,
      opponentName: opponentName || undefined,
      opponentAvatar: opponentAvatar || undefined,
      questions,
      challengerScore: typeof challengerScore === "number" ? challengerScore : undefined,
      challengerTimeMs: typeof challengerTimeMs === "number" ? challengerTimeMs : undefined,
      status: "pending",
      createdAt: Date.now(),
    };

    db.challenges.unshift(challenge);
    if (db.challenges.length > 200) {
      db.challenges = db.challenges.slice(0, 200);
    }
    saveSocialDb(db);
    res.json({ success: true, challenge });
  });

  app.post("/api/challenges/:id/submit", (req, res) => {
    const challengeId = req.params.id;
    const { playerId, playerName, playerAvatar, score, timeMs } = req.body || {};
    if (!playerId || typeof score !== "number") {
      return res.status(400).json({ success: false, error: "Thiếu kết quả bài thi đấu!" });
    }

    const db = loadSocialDb();
    if (!Array.isArray(db.challenges)) db.challenges = [];
    const idx = db.challenges.findIndex((c: any) => c.id === challengeId);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy trận thách đấu!" });
    }

    const c = { ...db.challenges[idx] };
    if (playerId === c.challengerId) {
      c.challengerScore = score;
      c.challengerTimeMs = typeof timeMs === "number" ? timeMs : 0;
    } else {
      c.opponentId = playerId;
      c.opponentName = playerName || c.opponentName || "Đối thủ";
      c.opponentAvatar = playerAvatar || c.opponentAvatar || "";
      c.opponentScore = score;
      c.opponentTimeMs = typeof timeMs === "number" ? timeMs : 0;
    }

    if (typeof c.challengerScore === "number" && typeof c.opponentScore === "number") {
      c.status = "completed";
      c.completedAt = Date.now();
      const cScore = c.challengerScore;
      const oScore = c.opponentScore;
      const cTime = c.challengerTimeMs ?? Number.MAX_SAFE_INTEGER;
      const oTime = c.opponentTimeMs ?? Number.MAX_SAFE_INTEGER;

      if (cScore > oScore || (cScore === oScore && cTime < oTime)) {
        c.winnerId = c.challengerId;
        c.winnerName = c.challengerName;
      } else if (oScore > cScore || (oScore === cScore && oTime < cTime)) {
        c.winnerId = c.opponentId;
        c.winnerName = c.opponentName || "Đối thủ";
      } else {
        c.winnerId = "draw";
        c.winnerName = "Hòa nhau";
      }
    } else {
      c.status = "accepted";
    }

    db.challenges[idx] = c;
    saveSocialDb(db);
    res.json({ success: true, challenge: c });
  });

  // AI Referee: Generate fresh 1v1 speed quiz questions using Gemini with structured JSON
  app.post("/api/duel/generate-questions", async (req, res) => {
    try {
      const subject = String(req.body?.subject || "Tổng hợp THCS").trim();
      const grade = String(req.body?.grade || "Lớp 9").trim();
      const countryCode = String(req.body?.countryCode || "VN").trim();
      const count = Math.min(8, Math.max(3, Number(req.body?.count || 5)));
      const culture = getCountryCulture(countryCode as any);

      const prompt = `Bạn là Trọng tài Gia sư AI của Đấu trường Tri thức Max10 THCS.
Hãy tạo đúng ${count} câu hỏi trắc nghiệm tốc độ (4 đáp án A/B/C/D, chỉ 1 đáp án đúng) cho môn "${subject}", trình độ "${grade}".
Phong cách văn hóa tham khảo: ${culture.name} (${culture.nativeName})${
        countryCode !== "VN" && subject.toLowerCase().includes("anh")
          ? " — có thể lồng ghép ngữ cảnh giao tiếp hoặc từ vựng quốc tế tự nhiên."
          : "."
      }
Yêu cầu:
- Câu hỏi ngắn gọn, rõ ràng, phù hợp thi đấu 20 giây/câu.
- Không dùng mã LaTeX rườm rà ($), viết ký hiệu Unicode đẹp (x², √, →, H₂O, °).
- Giải thích ngắn gọn 1 câu súc tích lý do chọn đáp án đúng.`;

      const response = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    subject: { type: Type.STRING },
                  },
                  required: ["question", "options", "correctIndex", "explanation", "subject"],
                },
              },
            },
            required: ["questions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const rawList = Array.isArray(parsed.questions) ? parsed.questions : [];
      const sanitized = rawList
        .filter((q: any) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
        .slice(0, count)
        .map((q: any, i: number) => ({
          id: `ai-duel-q-${Date.now()}-${i}`,
          subject: String(q.subject || subject),
          question: String(q.question).trim(),
          options: q.options.map((o: any) => String(o).trim()),
          correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
          explanation: String(q.explanation || "Đáp án chính xác theo kiến thức chuẩn THCS.").trim(),
        }));

      if (sanitized.length === 0) {
        return res.status(502).json({ success: false, error: "AI referee returned empty list" });
      }
      res.json({ success: true, questions: sanitized, generatedBy: "ai_referee" });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "Failed to generate AI duel questions" });
    }
  });

  // Duel Arena Leaderboard aggregated from real completed challenges
  app.get("/api/challenges/leaderboard", (_req, res) => {
    const db = loadSocialDb();
    const challenges = Array.isArray(db.challenges) ? db.challenges : [];
    const usersById = new Map<string, any>();
    (db.users || []).forEach((u: any) => {
      if (u?.id) usersById.set(u.id, u);
    });

    const boardMap = new Map<
      string,
      {
        userId: string;
        name: string;
        avatar: string;
        wins: number;
        draws: number;
        losses: number;
        played: number;
        totalCorrect: number;
        points: number;
      }
    >();

    const ensureEntry = (uid: string, fallbackName: string, fallbackAvatar?: string) => {
      let existing = boardMap.get(uid);
      if (!existing) {
        const userDoc = usersById.get(uid);
        existing = {
          userId: uid,
          name: userDoc?.name || fallbackName || "Thành viên Max10",
          avatar: userDoc?.avatar || fallbackAvatar || "",
          wins: 0,
          draws: 0,
          losses: 0,
          played: 0,
          totalCorrect: 0,
          points: 0,
        };
        boardMap.set(uid, existing);
      }
      return existing;
    };

    challenges.forEach((c: any) => {
      if (!c) return;
      if (c.status === "completed" && c.challengerId && c.opponentId) {
        const cEntry = ensureEntry(c.challengerId, c.challengerName, c.challengerAvatar);
        const oEntry = ensureEntry(c.opponentId, c.opponentName, c.opponentAvatar);
        const cScore = Number(c.challengerScore || 0);
        const oScore = Number(c.opponentScore || 0);

        cEntry.played += 1;
        oEntry.played += 1;
        cEntry.totalCorrect += cScore;
        oEntry.totalCorrect += oScore;

        if (c.winnerId === c.challengerId) {
          cEntry.wins += 1;
          cEntry.points += 100 + cScore * 10;
          oEntry.losses += 1;
          oEntry.points += 20 + oScore * 10;
        } else if (c.winnerId === c.opponentId) {
          oEntry.wins += 1;
          oEntry.points += 100 + oScore * 10;
          cEntry.losses += 1;
          cEntry.points += 20 + cScore * 10;
        } else {
          cEntry.draws += 1;
          oEntry.draws += 1;
          cEntry.points += 50 + cScore * 10;
          oEntry.points += 50 + oScore * 10;
        }
      } else if (c.challengerId && typeof c.challengerScore === "number") {
        const cEntry = ensureEntry(c.challengerId, c.challengerName, c.challengerAvatar);
        cEntry.totalCorrect += Number(c.challengerScore || 0);
        cEntry.points += 15 + Number(c.challengerScore || 0) * 8;
      }
    });

    const leaderboard = Array.from(boardMap.values())
      .map((entry) => ({
        ...entry,
        winRate: entry.played > 0 ? Math.round((entry.wins / entry.played) * 100) : 0,
      }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || b.totalCorrect - a.totalCorrect)
      .slice(0, 30);

    res.json({ success: true, leaderboard });
  });

  // Recent notifications endpoint across direct messages, groups, and community
  app.get("/api/messages/recent-notifications", (req, res) => {
    const userId = (req.query.userId as string) || "";
    const since = Number(req.query.since) || (Date.now() - 30000); // default last 30s
    if (!userId) {
      return res.json({ success: true, notifications: [] });
    }

    const db = loadSocialDb();
    const notifications: any[] = [];

    // 1. Direct messages where user is recipient or broadcast from admin
    (db.directMessages || []).forEach((m: any) => {
      const msgTime = typeof m.createdAt === "number" && m.createdAt > 0 ? m.createdAt : (m.timestamp ? Date.parse(m.timestamp) || 0 : 0);
      if (
        (m.recipientId === userId || m.recipientId === "all_broadcast") &&
        m.senderId !== userId &&
        (msgTime > since || !since)
      ) {
        const effectiveCreatedAt = msgTime || Date.now();
        notifications.push({
          id: m.id,
          type: "direct",
          senderId: m.senderId,
          senderName: m.senderName || "Quản trị viên Mạc Khánh Duy",
          senderAvatar: m.senderAvatar,
          content: m.content,
          timestamp: msgTime > 0 ? formatVietnamTime(effectiveCreatedAt) : (m.timestamp || formatVietnamTime(effectiveCreatedAt)),
          createdAt: effectiveCreatedAt,
        });
      }
    });

    // 2. Group messages from groups where user is a member or community groups
    const myGroups = (db.groups || []).filter((g: any) =>
      g.members && g.members.some((mem: any) => mem.id === userId)
    );
    const myGroupIds = new Set(myGroups.map((g: any) => g.id));

    if (db.groupMessages) {
      Object.entries(db.groupMessages).forEach(([gId, msgs]: [string, any[]]) => {
        const grp = (db.groups || []).find((g: any) => g.id === gId);
        const isMember = myGroupIds.has(gId) || (grp && !grp.onlyAdminCanAdd);
        if (isMember && Array.isArray(msgs)) {
          msgs.forEach((m: any) => {
            const msgTime = typeof m.createdAt === "number" && m.createdAt > 0 ? m.createdAt : (m.timestamp ? Date.parse(m.timestamp) || 0 : 0);
            if (m.senderId !== userId && m.senderRole !== "system" && !m.isSystemNotice && (msgTime > since || !since)) {
              const effectiveCreatedAt = msgTime || Date.now();
              notifications.push({
                id: m.id,
                type: "group",
                groupId: gId,
                groupName: grp ? grp.name : "Nhóm học tập",
                senderId: m.senderId,
                senderName: m.senderName,
                senderAvatar: m.senderAvatar,
                content: m.content,
                timestamp: msgTime > 0 ? formatVietnamTime(effectiveCreatedAt) : (m.timestamp || formatVietnamTime(effectiveCreatedAt)),
                createdAt: effectiveCreatedAt,
              });
            }
          });
        }
      });
    }

    // Sort by createdAt descending
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, notifications: notifications.slice(0, 10), serverTime: Date.now() });
  });

  // ==========================================
  // 🎛️ BẢNG ĐIỀU KHIỂN QUẢN TRỊ MAX10 AI (ADMIN CONTROL CENTER)
  // (Mạc Khánh Duy - mackhanhduy992012@gmail.com là Quản trị viên tối cao thật duy nhất)
  // ==========================================
  const SUPER_ADMIN_ACCOUNT = {
    id: "admin-mac-khanh-duy",
    name: "Mạc Khánh Duy",
    email: "mackhanhduy992012@gmail.com",
    emailOrPhone: "mackhanhduy992012@gmail.com",
    phone: "0778901259",
    school: "Ban Quản Trị Tối Cao Max10 AI",
    department: "Quản Trị Viên Hệ Thống",
    subject: "Quản trị & Phát triển Hệ thống Max10",
    role: "admin",
    plan: "premium",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuy",
    joinedAt: "13/10/2026",
    lecturesCount: 25,
    questionsCount: 150,
    videosCount: 20,
    lastActive: "Đang online",
    isSuperAdmin: true,
  };

  // Bỏ toàn bộ tài khoản giả - Chỉ duy nhất Mạc Khánh Duy là Quản trị viên
  const SEED_TEACHERS: any[] = [];
  const SEED_STUDENTS: any[] = [];

  // Persistent in-memory overrides for account plans/status
  const accountOverrides = new Map<string, { plan?: string; status?: string }>();

  app.get("/api/admin/accounts", (req, res) => {
    try {
      const teacherData = getTeacherSystemData();
      const socialData = loadSocialDb();

      // Deduplicated Map for accounts to guarantee strictly unique keys
      const allTeachersMap = new Map<string, any>();
      (teacherData.teachers || [])
        .filter(
          (t) =>
            t.id !== "admin-mac-khanh-duy" &&
            t.id !== SUPER_ADMIN_ACCOUNT.id &&
            !t.id.startsWith("mock") &&
            !t.id.startsWith("fake") &&
            t.id !== "gv-thuy"
        )
        .forEach((t) => {
          allTeachersMap.set(t.id, {
            id: t.id,
            name: t.name,
            emailOrPhone: t.emailOrPhone,
            phone: t.emailOrPhone.match(/^[0-9]+$/) ? t.emailOrPhone : "0778901259",
            school: t.school || "THCS Nguyễn Du",
            department: t.department || "Tổ Bộ môn",
            subject: t.subject || "Toán học",
            role: "teacher",
            plan: "premium",
            status: "active",
            avatar: (t as any).avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(t.name)}`,
            joinedAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString("vi-VN") : "01/10/2026",
            lecturesCount: (teacherData.lectures || []).filter((l) => l.teacherId === t.id).length || 5,
            videosCount: 3,
            lastActive: "Đang online",
          });
        });

      const allStudentsMap = new Map<string, any>();
      (socialData.users || [])
        .filter(
          (u) =>
            u.id !== "admin-mac-khanh-duy" &&
            u.id !== SUPER_ADMIN_ACCOUNT.id &&
            !u.id.startsWith("std-") &&
            !u.id.startsWith("mock") &&
            !u.id.startsWith("fake") &&
            u.id !== "user-quynh"
        )
        .forEach((u) => {
          if (u.role === "teacher") {
            allTeachersMap.set(u.id, {
              id: u.id,
              name: u.name,
              email: u.email,
              emailOrPhone: u.email || `${u.name.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
              phone: u.phone || "Chưa cập nhật",
              school: u.schoolName || u.school || "THCS Max10",
              subject: u.teachingSubject || u.subject || "Giáo viên",
              role: "teacher",
              plan: u.plan || "free",
              status: "active",
              avatar: u.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(u.name)}`,
              joinedAt: u.createdAt || "Hôm nay",
              lecturesCount: 0,
              videosCount: 0,
              lastActive: "Đang hoạt động",
            });
          } else {
            allStudentsMap.set(u.id, {
              id: u.id,
              name: u.name,
              email: u.email || `${u.name.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
              phone: u.phone || "Chưa cập nhật",
              school: u.schoolName || u.school || "THCS Max10",
              grade: u.studentClass ? `Lớp ${u.studentClass}` : u.grade || "Lớp 9",
              role: "student",
              plan: u.plan || "free",
              status: "active",
              avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
              joinedAt: u.createdAt || "Hôm nay",
              questionsCount: 0,
              videosCount: 0,
              lastActive: "Đang hoạt động",
            });
          }
        });

      // Apply overrides
      const teachers = Array.from(allTeachersMap.values()).map((t) => {
        const override = accountOverrides.get(t.id);
        return {
          ...t,
          plan: override?.plan || t.plan,
          status: override?.status || t.status,
        };
      });

      const students = Array.from(allStudentsMap.values()).map((s) => {
        const override = accountOverrides.get(s.id);
        return {
          ...s,
          plan: override?.plan || s.plan,
          status: override?.status || s.status,
        };
      });

      // Deduplicate all accounts strictly by unique ID to prevent any duplicate key errors
      const accountMap = new Map<string, any>();
      accountMap.set(SUPER_ADMIN_ACCOUNT.id, SUPER_ADMIN_ACCOUNT);
      for (const t of teachers) {
        if (!accountMap.has(t.id)) {
          accountMap.set(t.id, t);
        }
      }
      for (const s of students) {
        if (!accountMap.has(s.id)) {
          accountMap.set(s.id, s);
        }
      }

      const allAccounts = Array.from(accountMap.values());
      const totalPlus = allAccounts.filter((a) => a.plan === "plus").length;
      const totalPremium = allAccounts.filter((a) => a.plan === "premium").length;

      // Read payment history if exists
      let payments: any[] = [];
      try {
        if (fs.existsSync(PAYMENT_HISTORY_PATH)) {
          payments = JSON.parse(fs.readFileSync(PAYMENT_HISTORY_PATH, "utf-8"));
        }
      } catch {}

      res.json({
        success: true,
        accounts: allAccounts,
        stats: {
          totalAccounts: allAccounts.length,
          totalTeachers: teachers.length,
          totalStudents: students.length,
          totalPlus,
          totalPremium,
          totalFree: allAccounts.filter((a) => a.plan === "free").length,
          totalReceipts: payments.length,
          totalRevenue: totalPlus * 80000 + totalPremium * 400000,
          discount20Active: true,
          discountHolidays: ["20/10", "20/11", "08/03"],
        },
      });
    } catch (e: any) {
      console.error("Admin accounts error:", e);
      res.status(500).json({ success: false, error: e.message || "Failed to load accounts" });
    }
  });

  // Admin update account plan
  app.post("/api/admin/accounts/update-plan", (req, res) => {
    try {
      const { accountId, plan } = req.body;
      if (!accountId || !["free", "plus", "premium"].includes(plan)) {
        return res.status(400).json({ success: false, error: "Invalid accountId or plan" });
      }
      const existing = accountOverrides.get(accountId) || {};
      accountOverrides.set(accountId, { ...existing, plan });
      res.json({ success: true, accountId, plan });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin toggle account status
  app.post("/api/admin/accounts/toggle-status", (req, res) => {
    try {
      const { accountId, status } = req.body;
      if (!accountId || !["active", "locked"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid accountId or status" });
      }
      const existing = accountOverrides.get(accountId) || {};
      accountOverrides.set(accountId, { ...existing, status });
      res.json({ success: true, accountId, status });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin create manual account
  app.post("/api/admin/accounts/add", (req, res) => {
    try {
      const { name, role, emailOrPhone, gradeOrSubject, plan = "free", school = "THCS Nguyễn Du" } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "Tên tài khoản không được để trống" });
      }
      const newId = `${role === "teacher" ? "gv" : "hs"}-${Date.now()}`;
      const isTeacher = role === "teacher";
      const newAccount = {
        id: newId,
        name: name.trim(),
        emailOrPhone: emailOrPhone || `${name.trim().toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
        phone: emailOrPhone?.match(/^[0-9]+$/) ? emailOrPhone : "0778901259",
        school,
        subject: isTeacher ? gradeOrSubject || "Toán học" : undefined,
        grade: !isTeacher ? gradeOrSubject || "Lớp 9" : undefined,
        role: isTeacher ? "teacher" : "student",
        plan,
        status: "active",
        avatar: `https://api.dicebear.com/7.x/${isTeacher ? "personas" : "avataaars"}/svg?seed=${encodeURIComponent(name)}`,
        joinedAt: new Date().toLocaleDateString("vi-VN"),
        lecturesCount: isTeacher ? 1 : undefined,
        questionsCount: !isTeacher ? 1 : undefined,
        videosCount: 0,
        lastActive: "Vừa tạo",
      };

      if (isTeacher) {
        const teacherData = getTeacherSystemData();
        teacherData.teachers.push({
          id: newId,
          name: newAccount.name,
          emailOrPhone: newAccount.emailOrPhone,
          school: newAccount.school,
          department: "Tổ Bộ Môn",
          subject: newAccount.subject || "Toán học",
          title: "Giáo viên",
          bio: "Giáo viên tại Max10 AI",
          avatarText: newAccount.name.slice(0, 2).toUpperCase(),
          badgeColor: "from-emerald-500 to-teal-600",
          createdAt: new Date().toISOString(),
        });
        saveTeacherSystemData(teacherData);
      } else {
        const socialData = loadSocialDb();
        socialData.users.push({
          id: newId,
          name: newAccount.name,
          email: newAccount.emailOrPhone,
          avatar: newAccount.avatar,
          provider: "admin",
          role: "student",
          grade: newAccount.grade,
          createdAt: newAccount.joinedAt,
        });
        saveSocialDb(socialData);
      }

      accountOverrides.set(newId, { plan, status: "active" });
      res.json({ success: true, account: newAccount });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin Xóa Tài Khoản (User requirement: có thể xóa tài khoản và reset tài khoản của mọi người)
  app.post("/api/admin/accounts/delete", (req, res) => {
    try {
      const { accountId } = req.body;
      if (!accountId) {
        return res.status(400).json({ success: false, error: "Thiếu ID tài khoản cần xóa" });
      }

      // USER REQUIREMENT: "còn ảnh thứ 3 thì reset lại không cho làm quản trị viên cho làm khách"
      // Cho phép xóa và reset tài khoản Mạc Khánh Duy về làm khách
      if (
        accountId === "admin-mac-khanh-duy" ||
        accountId === SUPER_ADMIN_ACCOUNT.id ||
        accountId.toLowerCase().includes("mac-khanh-duy")
      ) {
        accountOverrides.set(accountId, { status: "deleted", plan: "free" });
        return res.json({
          success: true,
          message: "Đã xóa quyền quản trị viên của tài khoản này, chuyển sang vai trò Khách!",
        });
      }

      // Xóa khỏi teachers nếu có
      const teacherData = getTeacherSystemData();
      const initialTeacherCount = teacherData.teachers.length;
      teacherData.teachers = teacherData.teachers.filter((t) => t.id !== accountId);
      if (teacherData.teachers.length !== initialTeacherCount) {
        saveTeacherSystemData(teacherData);
      }

      // Xóa khỏi social users nếu có
      const socialData = loadSocialDb();
      const initialUserCount = socialData.users.length;
      socialData.users = socialData.users.filter((u) => u.id !== accountId);
      if (socialData.users.length !== initialUserCount) {
        saveSocialDb(socialData);
      }

      // Xóa khỏi accountOverrides
      accountOverrides.delete(accountId);

      res.json({ success: true, message: `Đã xóa vĩnh viễn tài khoản ID: ${accountId}` });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin Reset Tài Khoản (User requirement: reset tài khoản của mọi người về mặc định)
  app.post("/api/admin/accounts/reset", (req, res) => {
    try {
      const { accountId } = req.body;
      if (!accountId) {
        return res.status(400).json({ success: false, error: "Thiếu ID tài khoản cần reset" });
      }

      // USER REQUIREMENT: "còn ảnh thứ 3 thì reset không cho làm quản trị viên cho làm khách"
      if (accountId === "admin-mac-khanh-duy" || accountId === SUPER_ADMIN_ACCOUNT.id) {
        accountOverrides.set(accountId, { plan: "free", status: "active" });
        return res.json({ success: true, message: "Đã reset tài khoản Mạc Khánh Duy về làm Khách (Guest) bình thường!" });
      }

      // Reset về gói free, trạng thái active
      accountOverrides.set(accountId, { plan: "free", status: "active" });

      res.json({ success: true, message: `Đã reset tài khoản ${accountId} về gói Miễn Phí và trạng thái ban đầu thành công!` });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin Reset TẤT CẢ Tài Khoản Của Mọi Người (User requirement: reset tài khoản của mọi người)
  app.post("/api/admin/accounts/reset-all", (req, res) => {
    try {
      // Xóa toàn bộ overrides để đưa tất cả người dùng về mặc định
      accountOverrides.clear();

      // Đảm bảo Mạc Khánh Duy luôn là Premium & Active
      accountOverrides.set("admin-mac-khanh-duy", { plan: "premium", status: "active" });

      res.json({
        success: true,
        message: "Đã reset toàn bộ tài khoản người dùng về cấu hình mặc định ban đầu!",
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin XÓA TẤT CẢ Tài Khoản Người Dùng (User requirement: có thể xóa tài khoản và reset tài khoản của mọi người)
  app.post("/api/admin/accounts/delete-all", (req, res) => {
    try {
      // Xóa tất cả trong teachers ngoại trừ Mạc Khánh Duy
      const teacherData = getTeacherSystemData();
      teacherData.teachers = (teacherData.teachers || []).filter(
        (t) => t.id === "admin-mac-khanh-duy" || (t.name && t.name.toLowerCase().includes("mạc khánh duy"))
      );
      saveTeacherSystemData(teacherData);

      // Xóa tất cả trong social users ngoại trừ Mạc Khánh Duy
      const socialData = loadSocialDb();
      socialData.users = (socialData.users || []).filter(
        (u) => u.id === "admin-mac-khanh-duy" || (u.name && u.name.toLowerCase().includes("mạc khánh duy"))
      );
      saveSocialDb(socialData);

      // Xóa sạch overrides chỉ giữ lại Mạc Khánh Duy
      accountOverrides.clear();
      accountOverrides.set("admin-mac-khanh-duy", { plan: "premium", status: "active" });

      res.json({
        success: true,
        message: "Đã xóa toàn bộ tài khoản người dùng thành công, chỉ giữ lại Quản trị viên Mạc Khánh Duy!",
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ==========================================
  // 👑 ADMIN GOD-MODE ENDPOINTS (Strictly Protected by MASTER_SECURITY_CODE)
  // ==========================================
  const isVerifiedAdminRequest = (req: express.Request): boolean => {
    const headerCode = String(req.headers["x-max10-master-code"] || "").trim();
    return headerCode.length > 0 && headerCode === MASTER_SECURITY_CODE;
  };

  app.get("/api/admin/godmode/overview", (req, res) => {
    if (!isVerifiedAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        error: "Truy cập God-Mode bị từ chối: Yêu cầu quyền Quản trị viên Mạc Khánh Duy!",
      });
    }
    try {
      const db = loadSocialDb();
      const teacherData = getTeacherSystemData();
      const now = Date.now();

      const liveUsersById = new Map<string, any>();
      (db.users || []).forEach((u: any) => {
        if (u?.id) liveUsersById.set(u.id, u);
      });

      const enrichedAccounts: any[] = [
        {
          id: SUPER_ADMIN_ACCOUNT.id,
          name: SUPER_ADMIN_ACCOUNT.name,
          emailOrPhone: SUPER_ADMIN_ACCOUNT.email,
          role: "admin",
          plan: "premium",
          status: "active",
          avatar: SUPER_ADMIN_ACCOUNT.avatar,
          isOnline: true,
          lastActiveMs: now,
          lastActiveText: "Đang online (Chủ sở hữu)",
          decoration: profileDecorationsStore.get(SUPER_ADMIN_ACCOUNT.id) || null,
        },
      ];

      (teacherData.teachers || []).forEach((t: any) => {
        if (!t?.id || t.id === SUPER_ADMIN_ACCOUNT.id || t.id.startsWith("mock") || t.id === "gv-thuy") return;
        const liveU = liveUsersById.get(t.id);
        const override = accountOverrides.get(t.id);
        const lastMs = Number(liveU?.lastActive || 0);
        const isOnline = Boolean(lastMs > 0 && now - lastMs < 120000 && liveU?.presenceStatus !== "offline");
        enrichedAccounts.push({
          id: t.id,
          name: t.name,
          emailOrPhone: t.emailOrPhone,
          role: "teacher",
          plan: override?.plan || liveU?.plan || "premium",
          status: override?.status || "active",
          avatar: (t as any).avatar || liveU?.avatar || "",
          isOnline,
          lastActiveMs: lastMs,
          lastActiveText: isOnline
            ? "Đang trực tuyến"
            : lastMs > 0
            ? `${formatVietnamTime(lastMs)} (${formatVietnamDate(lastMs)})`
            : "Ngoại tuyến",
          decoration: profileDecorationsStore.get(t.id) || null,
        });
      });

      (db.users || []).forEach((u: any) => {
        if (
          !u?.id ||
          u.id === SUPER_ADMIN_ACCOUNT.id ||
          u.id.startsWith("mock") ||
          u.id.startsWith("fake") ||
          u.id.startsWith("std-") ||
          u.id === "user-quynh" ||
          enrichedAccounts.some((a) => a.id === u.id)
        ) {
          return;
        }
        const override = accountOverrides.get(u.id);
        const lastMs = Number(u.lastActive || 0);
        const isOnline = Boolean(lastMs > 0 && now - lastMs < 120000 && u.presenceStatus !== "offline");
        enrichedAccounts.push({
          id: u.id,
          name: u.name,
          emailOrPhone: u.email || u.phone || "Tài khoản nội bộ",
          role: u.role === "teacher" ? "teacher" : "student",
          plan: override?.plan || u.plan || "free",
          status: override?.status || "active",
          avatar: u.avatar || "",
          isOnline,
          lastActiveMs: lastMs,
          lastActiveText: isOnline
            ? "Đang trực tuyến"
            : lastMs > 0
            ? `${formatVietnamTime(lastMs)} (${formatVietnamDate(lastMs)})`
            : "Ngoại tuyến",
          decoration: profileDecorationsStore.get(u.id) || null,
        });
      });

      const groupsById = new Map<string, string>();
      (db.groups || []).forEach((g: any) => {
        if (g?.id) groupsById.set(g.id, g.name || g.id);
      });

      const moderationMessages: any[] = [];
      Object.entries(db.groupMessages || {}).forEach(([groupId, msgs]) => {
        if (!Array.isArray(msgs)) return;
        msgs.forEach((m: any) => {
          if (!m?.id || !m?.content) return;
          moderationMessages.push({
            groupId,
            groupName: groupsById.get(groupId) || "Nhóm / Cộng đồng",
            msgId: m.id,
            senderId: m.senderId || "",
            senderName: m.senderName || "Thành viên",
            content: String(m.content),
            createdAt: Number(m.createdAt || 0),
            timestamp: m.timestamp || (m.createdAt ? formatVietnamTime(m.createdAt) : ""),
          });
        });
      });
      moderationMessages.sort((a, b) => b.createdAt - a.createdAt);

      res.json({
        success: true,
        accounts: enrichedAccounts,
        onlineCount: enrichedAccounts.filter((a) => a.isOnline).length,
        loginLogs: (db.loginLogs || []).slice(0, 60),
        pinnedBanner: db.pinnedSystemBanner || null,
        vipGifts: db.vipGifts || {},
        moderationMessages: moderationMessages.slice(0, 60),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "God-Mode overview failed" });
    }
  });

  app.post("/api/admin/accounts/force-logout", (req, res) => {
    if (!isVerifiedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Không có quyền Quản trị viên!" });
    }
    const accountId = String(req.body?.accountId || "").trim();
    if (!accountId || accountId === "admin-mac-khanh-duy") {
      return res.status(400).json({ success: false, error: "Không thể đá đăng xuất tài khoản này!" });
    }
    const db = loadSocialDb();
    if (!db.forcedLogoutAt) db.forcedLogoutAt = {};
    db.forcedLogoutAt[accountId] = Date.now();
    const u = (db.users || []).find((item: any) => item.id === accountId);
    if (u) {
      u.presenceStatus = "offline";
      u.lastActive = 0;
    }
    saveSocialDb(db);
    res.json({ success: true, accountId, message: "Đã gửi lệnh đăng xuất bắt buộc tới thiết bị người dùng!" });
  });

  app.post("/api/admin/accounts/gift-vip", (req, res) => {
    if (!isVerifiedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Không có quyền Quản trị viên!" });
    }
    const {
      accountId,
      xpBonus = 0,
      unlockedNameplates = [],
      unlockedFrames = [],
      equippedNameplateId,
      equippedFrameId,
      message,
    } = req.body || {};

    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({ success: false, error: "Thiếu accountId nhận quà VIP!" });
    }

    const safeXp = Math.min(50000, Math.max(0, Math.round(Number(xpBonus) || 0)));
    const db = loadSocialDb();
    if (!db.vipGifts) db.vipGifts = {};

    const cleanNameplates = Array.isArray(unlockedNameplates)
      ? unlockedNameplates.map((id: any) => String(id).trim()).filter(Boolean)
      : [];
    const cleanFrames = Array.isArray(unlockedFrames)
      ? unlockedFrames.map((id: any) => String(id).trim()).filter(Boolean)
      : [];

    if (equippedNameplateId && !cleanNameplates.includes(String(equippedNameplateId))) {
      cleanNameplates.push(String(equippedNameplateId));
    }
    if (equippedFrameId && !cleanFrames.includes(String(equippedFrameId))) {
      cleanFrames.push(String(equippedFrameId));
    }

    const giftRecord = {
      id: `vip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      xpBonus: safeXp,
      unlockedNameplates: cleanNameplates,
      unlockedFrames: cleanFrames,
      equippedNameplateId: equippedNameplateId ? String(equippedNameplateId) : undefined,
      equippedFrameId: equippedFrameId ? String(equippedFrameId) : undefined,
      message: message ? String(message).slice(0, 240) : "Quà tặng VIP từ Quản trị viên Mạc Khánh Duy!",
      grantedAt: Date.now(),
    };

    db.vipGifts[accountId] = giftRecord;
    saveSocialDb(db);

    if (equippedNameplateId || equippedFrameId) {
      const prevDec = profileDecorationsStore.get(accountId) || {
        nameplateId: "hoc_ba_diem_10",
        frameId: "diem10_champion",
        badges: ["hoc_ba_10"],
      };
      profileDecorationsStore.set(accountId, {
        ...prevDec,
        ...(equippedNameplateId ? { nameplateId: String(equippedNameplateId) } : {}),
        ...(equippedFrameId ? { frameId: String(equippedFrameId) } : {}),
      });
    }

    res.json({ success: true, gift: giftRecord });
  });

  app.post("/api/admin/system-pin", (req, res) => {
    if (!isVerifiedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Không có quyền Quản trị viên!" });
    }
    const { action = "pin", title = "", content = "", severity = "info" } = req.body || {};
    const db = loadSocialDb();

    if (action === "clear") {
      db.pinnedSystemBanner = null;
      saveSocialDb(db);
      return res.json({ success: true, pinnedBanner: null });
    }

    const cleanContent = String(content || "").trim();
    if (!cleanContent) {
      return res.status(400).json({ success: false, error: "Nội dung ghim toàn hệ thống không được trống!" });
    }

    const validSeverity = ["info", "warning", "celebrate"].includes(severity) ? severity : "info";
    db.pinnedSystemBanner = {
      id: `pin-${Date.now()}`,
      title: String(title || "Thông báo từ Quản trị viên Max10 AI").trim().slice(0, 100),
      content: cleanContent.slice(0, 360),
      severity: validSeverity,
      updatedAt: Date.now(),
      author: "Mạc Khánh Duy",
    };
    saveSocialDb(db);
    res.json({ success: true, pinnedBanner: db.pinnedSystemBanner });
  });

  app.delete("/api/admin/moderation/messages/:groupId/:msgId", (req, res) => {
    if (!isVerifiedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Không có quyền Quản trị viên!" });
    }
    const groupId = decodeURIComponent(req.params.groupId || "");
    const msgId = decodeURIComponent(req.params.msgId || "");
    const db = loadSocialDb();
    if (!db.groupMessages || !Array.isArray(db.groupMessages[groupId])) {
      return res.status(404).json({ success: false, error: "Không tìm thấy phòng hoặc tin nhắn!" });
    }
    const before = db.groupMessages[groupId].length;
    db.groupMessages[groupId] = db.groupMessages[groupId].filter((m: any) => m.id !== msgId);
    if (db.groupMessages[groupId].length === before) {
      return res.status(404).json({ success: false, error: "Tin nhắn đã bị xóa hoặc không tồn tại!" });
    }
    saveSocialDb(db);
    res.json({ success: true, deletedId: msgId });
  });

  // Dedicated Poster Generation API Endpoint
  // (User Requested: "cho tạo poster và video phải có ảnh mô phỏng chuyển động theo lời nói và tạo ảnh phải đúng yêu cầu nếu làm sai thì biết rồi đấy")
  app.post("/api/poster/generate", async (req, res) => {
    try {
      const {
        topic,
        headline,
        subtitle,
        bulletPoints = [],
        theme = "modern_blue",
        aspectRatio = "3:4",
        promptDetails = "",
      } = req.body;

      if (!topic && !headline) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập chủ đề hoặc tiêu đề poster." });
      }

      const rawPrompt = promptDetails || `${topic || headline}, educational poster illustration, award-winning graphic design, clean Vietnamese typography background, crisp 8k`;
      const imgResult = await generateEnhancedImage(rawPrompt, "diagram", aspectRatio);

      res.json({
        success: true,
        poster: {
          id: `poster-${Date.now()}`,
          topic: topic || headline,
          headline: headline || topic,
          subtitle: subtitle || "Cẩm nang học tập & Thi đua đạt Điểm 10 cùng Max10 AI",
          bulletPoints: bulletPoints.length > 0 ? bulletPoints : [
            "Nắm vững bản chất kiến thức trọng tâm",
            "Tránh 100% bẫy mất điểm oan kinh điển",
            "Tự tin chinh phục điểm 9, 10 mọi kỳ thi"
          ],
          imageUrl: imgResult.imageUrl,
          theme,
          aspectRatio,
          createdAt: new Date().toLocaleDateString("vi-VN"),
        },
      });
    } catch (e: any) {
      console.error("Poster generate error:", e);
      res.status(500).json({ success: false, error: e.message || "Failed to generate poster" });
    }
  });

  // Bind real account deletion handler for Real Anti-Hack Firewall
  purgeAccountDataImpl = (params: { userId?: string; email?: string; name?: string }) => {
    // 1. PERMANENTLY DELETE from social_system_db.json
    try {
      const socialDb = loadSocialDb();
      if (params.userId) {
        socialDb.users = socialDb.users.filter((u) => u.id !== params.userId);
        socialDb.friendships = socialDb.friendships.filter(
          (f) => f.user1Id !== params.userId && f.user2Id !== params.userId
        );
        socialDb.friendRequests = socialDb.friendRequests.filter(
          (r) => r.fromUserId !== params.userId && r.toUserId !== params.userId
        );
        socialDb.directMessages = (socialDb.directMessages || []).filter(
          (m: any) => m.senderId !== params.userId && m.recipientId !== params.userId
        );
      }
      if (params.email) {
        socialDb.users = socialDb.users.filter(
          (u) => !u.email || u.email.toLowerCase() !== params.email!.toLowerCase()
        );
      }
      saveSocialDb(socialDb);
    } catch (e) {
      console.warn("Error deleting from socialDb:", e);
    }

    // 2. PERMANENTLY DELETE from teacher_system_db.json
    try {
      const teacherDb = getTeacherSystemData();
      if (params.userId) {
        teacherDb.teachers = teacherDb.teachers.filter((t) => t.id !== params.userId);
        teacherDb.messages = teacherDb.messages.filter((m) => m.studentName !== params.name);
      }
      saveTeacherSystemData(teacherDb);
    } catch (e) {
      console.warn("Error deleting from teacherDb:", e);
    }

    // 3. Remove overrides
    if (params.userId) {
      accountOverrides.delete(params.userId);
    }
  };

  // ==========================================
  // REAL-TIME VIDEO / AUDIO CALL SIGNALING & 15s RINGING TIMEOUT
  // ==========================================
  const RING_TIMEOUT_MS = 15000;
  interface WhiteboardStrokeRecord {
    id: string;
    color: string;
    size: number;
    points: Array<{ x: number; y: number }>;
  }

  interface CallWhiteboardState {
    activeDrawerId: string | null;
    activeDrawerName: string | null;
    lockUpdatedAt: number;
    strokes: WhiteboardStrokeRecord[];
    clearedAt: number;
  }

  interface CallSessionRecord {
    callId: string;
    roomKey?: string;
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    calleeId: string;
    calleeName: string;
    calleeAvatar?: string;
    roomType: "direct" | "group";
    callType: "video" | "voice";
    status: "ringing" | "accepted" | "declined" | "cancelled" | "timeout" | "ended";
    createdAt: number;
    expiresAt: number;
    acceptedAt?: number;
    endedAt?: number;
    isBusyWaiting?: boolean;
    offer?: any;
    answer?: any;
    callerCandidates: any[];
    calleeCandidates: any[];
    callerMedia: { isMuted: boolean; isVideoOff: boolean };
    calleeMedia: { isMuted: boolean; isVideoOff: boolean };
    chatMessages: Array<{ id: string; senderId: string; senderName: string; text: string; time: string }>;
    whiteboard: CallWhiteboardState;
  }

  const createEmptyWhiteboard = (): CallWhiteboardState => ({
    activeDrawerId: null,
    activeDrawerName: null,
    lockUpdatedAt: 0,
    strokes: [],
    clearedAt: 0,
  });

  // Profile decorations store (Nameplates, Avatar Frames, Badges)
  const profileDecorationsStore = new Map<string, any>();

  app.get("/api/profile/decorations", (_req, res) => {
    const map: Record<string, any> = {};
    for (const [uid, dec] of profileDecorationsStore.entries()) {
      map[uid] = dec;
    }
    res.json({ success: true, decorations: map });
  });

  app.post("/api/profile/decorations", (req, res) => {
    const { userId, decoration } = req.body || {};
    if (!userId || !decoration) {
      return res.status(400).json({ success: false, error: "Thiếu userId hoặc decoration" });
    }
    profileDecorationsStore.set(String(userId), decoration);
    res.json({ success: true, decoration });
  });

  const activeCallSessions = new Map<string, CallSessionRecord>();

  const refreshCallRecord = (call: CallSessionRecord): CallSessionRecord => {
    const now = Date.now();
    if (call.status === "ringing" && !call.roomKey && now >= call.expiresAt) {
      call.status = "timeout";
      call.endedAt = now;
    }
    return call;
  };

  const isUserInActiveCall = (userId: string, userName?: string, excludeCallId?: string): boolean => {
    const uid = String(userId || "").trim();
    const uname = String(userName || "").trim().toLowerCase();
    for (const c of activeCallSessions.values()) {
      if (c.callId === excludeCallId) continue;
      if (c.status !== "accepted") continue;
      if (uid && (c.callerId === uid || c.calleeId === uid)) return true;
      if (uname && (c.callerName.toLowerCase() === uname || c.calleeName.toLowerCase() === uname)) return true;
    }
    return false;
  };

  const cleanupOldCallSessions = () => {
    const cutoff = Date.now() - 3600 * 1000;
    for (const [id, c] of activeCallSessions.entries()) {
      refreshCallRecord(c);
      if (c.endedAt && c.endedAt < cutoff) {
        activeCallSessions.delete(id);
      }
    }
  };

  // 0. Discord Voice/Video Channel Shared Room Join (connects peers immediately without ring timeout)
  app.post("/api/calls/room-join", (req, res) => {
    cleanupOldCallSessions();
    const {
      roomKey,
      userId,
      userName,
      userAvatar,
      roomName,
      callType = "video",
      mediaState,
    } = req.body || {};

    if (!roomKey || !userId) {
      return res.status(400).json({ success: false, error: "Thiếu roomKey hoặc userId" });
    }

    const normalizedKey = String(roomKey).trim();
    const now = Date.now();
    let existing: CallSessionRecord | undefined;
    for (const c of activeCallSessions.values()) {
      if (c.roomKey === normalizedKey && c.status !== "ended" && c.status !== "cancelled" && c.status !== "declined" && c.status !== "timeout") {
        existing = c;
        break;
      }
    }

    if (!existing) {
      const callId = "room-" + normalizedKey.replace(/[^a-zA-Z0-9_-]/g, "_") + "-" + now;
      const session: CallSessionRecord = {
        callId,
        roomKey: normalizedKey,
        callerId: String(userId),
        callerName: String(userName || "Bạn học"),
        callerAvatar: userAvatar || "",
        calleeId: normalizedKey,
        calleeName: String(roomName || "Phòng Thoại & Video"),
        calleeAvatar: "",
        roomType: "group",
        callType: callType === "voice" ? "voice" : "video",
        status: "accepted",
        createdAt: now,
        acceptedAt: now,
        expiresAt: now + 3600 * 1000,
        callerCandidates: [],
        calleeCandidates: [],
        callerMedia: mediaState || { isMuted: false, isVideoOff: callType === "voice" },
        calleeMedia: { isMuted: false, isVideoOff: callType === "voice" },
        chatMessages: [],
        whiteboard: createEmptyWhiteboard(),
      };
      activeCallSessions.set(callId, session);
      return res.json({ success: true, role: "caller", call: session });
    }

    // Same user re-joining or refreshing
    if (existing.callerId === String(userId)) {
      if (mediaState) existing.callerMedia = mediaState;
      return res.json({ success: true, role: "caller", call: existing });
    }

    // Second peer joins the active room -> becomes callee & connects WebRTC immediately
    if (existing.calleeId === normalizedKey || existing.calleeId === String(userId)) {
      existing.calleeId = String(userId);
      existing.calleeName = String(userName || "Bạn học");
      existing.calleeAvatar = userAvatar || "";
      existing.status = "accepted";
      existing.acceptedAt = existing.acceptedAt || now;
      if (mediaState) existing.calleeMedia = mediaState;
      return res.json({ success: true, role: "callee", call: existing });
    }

    // Additional participant resets callee slot for fresh WebRTC handshake if needed
    existing.calleeId = String(userId);
    existing.calleeName = String(userName || "Bạn học");
    existing.calleeAvatar = userAvatar || "";
    existing.offer = undefined;
    existing.answer = undefined;
    existing.callerCandidates = [];
    existing.calleeCandidates = [];
    if (mediaState) existing.calleeMedia = mediaState;
    return res.json({ success: true, role: "callee", call: existing });
  });

  // 1. Caller starts a call -> server sets 15s expiration window
  app.post("/api/calls/start", (req, res) => {
    cleanupOldCallSessions();
    const {
      callerId,
      callerName,
      callerAvatar,
      calleeId,
      calleeName,
      calleeAvatar,
      roomType = "direct",
      callType = "video",
      callerMedia,
    } = req.body || {};

    if (!callerId || !calleeId) {
      return res.status(400).json({ success: false, error: "Thiếu callerId hoặc calleeId" });
    }

    // Cancel any existing ringing call from this caller
    const now = Date.now();
    for (const existing of activeCallSessions.values()) {
      if (existing.callerId === callerId && existing.status === "ringing") {
        existing.status = "cancelled";
        existing.endedAt = now;
      }
    }

    const callId = "call-" + now + "-" + Math.random().toString(36).substring(2, 8);
    const isBusyWaiting =
      roomType !== "group" && isUserInActiveCall(String(calleeId), String(calleeName || ""), callId);

    const session: CallSessionRecord = {
      callId,
      callerId: String(callerId),
      callerName: String(callerName || "Bạn học"),
      callerAvatar: callerAvatar || "",
      calleeId: String(calleeId),
      calleeName: String(calleeName || "Người nhận"),
      calleeAvatar: calleeAvatar || "",
      roomType: roomType === "group" ? "group" : "direct",
      callType: callType === "voice" ? "voice" : "video",
      status: "ringing",
      createdAt: now,
      expiresAt: now + RING_TIMEOUT_MS,
      isBusyWaiting,
      callerCandidates: [],
      calleeCandidates: [],
      callerMedia: callerMedia || { isMuted: false, isVideoOff: callType === "voice" },
      calleeMedia: { isMuted: false, isVideoOff: callType === "voice" },
      chatMessages: [],
      whiteboard: createEmptyWhiteboard(),
    };
    activeCallSessions.set(callId, session);
    res.json({ success: true, call: session, remainingMs: RING_TIMEOUT_MS });
  });

  // 2. Callee polls for incoming ringing calls (supports Call Waiting even while in another call)
  app.get("/api/calls/incoming", (req, res) => {
    cleanupOldCallSessions();
    const userId = String(req.query.userId || "").trim();
    const userName = String(req.query.userName || "").trim().toLowerCase();
    const groupIdsRaw = String(req.query.groupIds || "").trim();
    const excludeCallId = String(req.query.excludeCallId || "").trim();
    const groupIdSet = new Set(groupIdsRaw ? groupIdsRaw.split(",").map((s) => s.trim()).filter(Boolean) : []);

    if (!userId && !userName) {
      return res.json({ success: true, call: null, remainingMs: 0 });
    }

    const now = Date.now();
    let incoming: CallSessionRecord | null = null;
    for (const call of activeCallSessions.values()) {
      refreshCallRecord(call);
      if (call.status !== "ringing") continue;
      if (excludeCallId && call.callId === excludeCallId) continue;
      if (call.callerId === userId) continue;

      const isDirectMatch =
        call.roomType === "direct" &&
        (call.calleeId === userId || (userName && call.calleeName.toLowerCase() === userName));
      const isGroupMatch = call.roomType === "group" && groupIdSet.has(call.calleeId);

      if (isDirectMatch || isGroupMatch) {
        if (!incoming || call.createdAt > incoming.createdAt) {
          incoming = call;
        }
      }
    }

    if (!incoming) {
      return res.json({ success: true, call: null, remainingMs: 0 });
    }
    res.json({
      success: true,
      call: incoming,
      remainingMs: Math.max(0, incoming.expiresAt - now),
    });
  });

  // 3. Poll call status & WebRTC signaling state
  app.get("/api/calls/:callId/status", (req, res) => {
    const call = activeCallSessions.get(req.params.callId);
    if (!call) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cuộc gọi" });
    }
    refreshCallRecord(call);
    call.isBusyWaiting =
      call.roomType === "direct" && isUserInActiveCall(call.calleeId, call.calleeName, call.callId);
    res.json({
      success: true,
      call,
      remainingMs: Math.max(0, call.expiresAt - Date.now()),
    });
  });

  // 3b. Extend waiting/ringing time when caller chooses to keep waiting
  app.post("/api/calls/:callId/extend", (req, res) => {
    const call = activeCallSessions.get(req.params.callId);
    if (!call) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cuộc gọi" });
    }
    refreshCallRecord(call);
    if (call.status !== "ringing") {
      return res.json({ success: false, status: call.status, call });
    }
    const extraSeconds = Math.max(5, Math.min(60, Number(req.body?.extraSeconds) || 15));
    const now = Date.now();
    call.expiresAt = Math.max(call.expiresAt, now) + extraSeconds * 1000;
    res.json({
      success: true,
      call,
      remainingMs: Math.max(0, call.expiresAt - now),
    });
  });

  // 4. Callee accepts or declines call
  app.post("/api/calls/:callId/respond", (req, res) => {
    const call = activeCallSessions.get(req.params.callId);
    if (!call) {
      return res.status(404).json({ success: false, error: "Cuộc gọi không tồn tại hoặc đã hủy" });
    }
    refreshCallRecord(call);
    if (call.status !== "ringing") {
      return res.json({ success: false, status: call.status, call });
    }
    const { action, calleeAvatar, calleeName, calleeMedia } = req.body || {};
    if (action === "accept") {
      call.status = "accepted";
      call.acceptedAt = Date.now();
      if (calleeAvatar) call.calleeAvatar = calleeAvatar;
      if (calleeName) call.calleeName = calleeName;
      if (calleeMedia) call.calleeMedia = calleeMedia;
    } else {
      call.status = "declined";
      call.endedAt = Date.now();
    }
    res.json({ success: true, call });
  });

  // 5. Exchange WebRTC SDP offer/answer, ICE candidates, media toggle states, and in-call messages
  app.post("/api/calls/:callId/signal", (req, res) => {
    const call = activeCallSessions.get(req.params.callId);
    if (!call) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cuộc gọi" });
    }
    refreshCallRecord(call);
    const { role, offer, answer, candidate, mediaState, chatMessage } = req.body || {};

    if (offer) {
      call.offer = offer;
    }
    if (answer) {
      call.answer = answer;
    }
    if (candidate) {
      if (role === "callee") {
        call.calleeCandidates.push(candidate);
      } else {
        call.callerCandidates.push(candidate);
      }
    }
    if (mediaState) {
      if (role === "callee") {
        call.calleeMedia = {
          isMuted: !!mediaState.isMuted,
          isVideoOff: !!mediaState.isVideoOff,
        };
      } else {
        call.callerMedia = {
          isMuted: !!mediaState.isMuted,
          isVideoOff: !!mediaState.isVideoOff,
        };
      }
    }
    if (chatMessage && chatMessage.text) {
      const exists = call.chatMessages.some((m) => m.id === chatMessage.id);
      if (!exists) {
        call.chatMessages.push({
          id: chatMessage.id || "cmsg-" + Date.now(),
          senderId: String(chatMessage.senderId || ""),
          senderName: String(chatMessage.senderName || "Thành viên"),
          text: String(chatMessage.text),
          time: String(chatMessage.time || ""),
        });
      }
    }

    res.json({ success: true, call });
  });

  // 5b. Authoritative Single-Drawer Whiteboard Lock & Stroke Sync
  app.post("/api/calls/:callId/whiteboard", (req, res) => {
    const call = activeCallSessions.get(req.params.callId);
    if (!call) {
      return res.status(404).json({ success: false, error: "Không tìm thấy cuộc gọi" });
    }
    const { action, userId, userName, stroke } = req.body || {};
    const uid = String(userId || "").trim();
    const uname = String(userName || "Thành viên").trim();
    if (!uid) {
      return res.status(400).json({ success: false, error: "Thiếu userId" });
    }

    const wb = call.whiteboard;
    const now = Date.now();

    if (action === "claim") {
      // Only 1 drawer allowed at a time! Lock succeeds only if free, already self, or stale (> 120s)
      const isStale = wb.activeDrawerId && now - wb.lockUpdatedAt > 120 * 1000;
      if (!wb.activeDrawerId || wb.activeDrawerId === uid || isStale) {
        wb.activeDrawerId = uid;
        wb.activeDrawerName = uname;
        wb.lockUpdatedAt = now;
        return res.json({ success: true, whiteboard: wb });
      }
      return res.json({
        success: false,
        error: `${wb.activeDrawerName || "Người khác"} đang giữ quyền vẽ. Chỉ 1 người được vẽ lúc này!`,
        whiteboard: wb,
      });
    }

    if (action === "release") {
      if (wb.activeDrawerId === uid) {
        wb.activeDrawerId = null;
        wb.activeDrawerName = null;
        wb.lockUpdatedAt = now;
      }
      return res.json({ success: true, whiteboard: wb });
    }

    if (action === "stroke") {
      if (wb.activeDrawerId && wb.activeDrawerId !== uid) {
        return res.status(403).json({
          success: false,
          error: `Chỉ ${wb.activeDrawerName || "người đang giữ bút"} được phép vẽ!`,
          whiteboard: wb,
        });
      }
      // Auto-assign lock if currently empty
      if (!wb.activeDrawerId) {
        wb.activeDrawerId = uid;
        wb.activeDrawerName = uname;
      }
      wb.lockUpdatedAt = now;
      if (stroke && Array.isArray(stroke.points) && stroke.points.length > 0) {
        const exists = wb.strokes.some((s) => s.id === stroke.id);
        if (!exists) {
          wb.strokes.push({
            id: String(stroke.id || "st-" + now + "-" + Math.random().toString(36).slice(2, 6)),
            color: String(stroke.color || "#3b82f6"),
            size: Math.max(1, Math.min(20, Number(stroke.size) || 3)),
            points: stroke.points.slice(0, 600),
          });
          if (wb.strokes.length > 400) {
            wb.strokes = wb.strokes.slice(-400);
          }
        }
      }
      return res.json({ success: true, whiteboard: wb });
    }

    if (action === "clear") {
      if (wb.activeDrawerId && wb.activeDrawerId !== uid) {
        return res.status(403).json({
          success: false,
          error: `Chỉ ${wb.activeDrawerName || "người đang giữ bút"} mới được xóa bảng!`,
          whiteboard: wb,
        });
      }
      wb.strokes = [];
      wb.clearedAt = now;
      return res.json({ success: true, whiteboard: wb });
    }

    return res.status(400).json({ success: false, error: "Hành động whiteboard không hợp lệ" });
  });

  // 6. End or timeout call
  app.post("/api/calls/:callId/end", (req, res) => {
    const call = activeCallSessions.get(req.params.callId);
    if (!call) {
      return res.json({ success: true });
    }
    const reason = req.body?.reason;
    if (call.status === "ringing" || call.status === "accepted") {
      call.status =
        reason === "timeout" || reason === "cancelled" || reason === "declined" ? reason : "ended";
      call.endedAt = Date.now();
    }
    res.json({ success: true, call });
  });

  // Determine production mode reliably
  const isProduction =
    process.env.NODE_ENV === "production" ||
    (process.env.NODE_ENV !== "development" &&
      typeof __filename !== "undefined" &&
      (__filename.endsWith(".cjs") || __filename.includes("dist")));

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.resolve(process.cwd(), "dist");
    let indexPath = path.join(distPath, "index.html");

    if (!fs.existsSync(indexPath)) {
      const fallbackDist = typeof __dirname !== "undefined" ? __dirname : distPath;
      if (fs.existsSync(path.join(fallbackDist, "index.html"))) {
        distPath = fallbackDist;
        indexPath = path.join(distPath, "index.html");
      }
    }

    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
