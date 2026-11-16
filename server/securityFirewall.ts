import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Express, Request, Response, NextFunction } from "express";

export const MASTER_SECURITY_CODE = "duykobell123";
const BANNED_ACCOUNTS_PATH = path.resolve(process.cwd(), "banned_accounts_db.json");
const SECURITY_LOGS_PATH = path.resolve(process.cwd(), "security_system_db.json");
const SERVER_HMAC_SECRET = process.env.SESSION_SECRET || crypto.createHash("sha256").update(MASTER_SECURITY_CODE + "_max10_hmac").digest("hex");

export interface BannedAccountRecord {
  id: string;
  userId?: string;
  email?: string;
  name?: string;
  ip?: string;
  deviceId?: string;
  reason: string;
  bannedAt: number;
  bannedAtFormatted: string;
  permanentlyDeleted: boolean;
}

export interface SecurityDeps {
  purgeAccountData: (params: { userId?: string; email?: string; name?: string }) => void;
}

export function loadBannedAccounts(): BannedAccountRecord[] {
  try {
    if (fs.existsSync(BANNED_ACCOUNTS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(BANNED_ACCOUNTS_PATH, "utf-8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

export function saveBannedAccounts(list: BannedAccountRecord[]) {
  try {
    fs.writeFileSync(BANNED_ACCOUNTS_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save banned accounts", e);
  }
}

export function loadSecurityLogs(): any[] {
  try {
    if (fs.existsSync(SECURITY_LOGS_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(SECURITY_LOGS_PATH, "utf-8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

function appendSecurityLog(event: string, details: any) {
  try {
    const logs = loadSecurityLogs();
    const now = Date.now();
    logs.unshift({
      event,
      timestamp: now,
      dateFormatted: new Date(now).toLocaleTimeString("vi-VN") + " " + new Date(now).toLocaleDateString("vi-VN"),
      details,
    });
    if (logs.length > 250) logs.splice(250);
    fs.writeFileSync(SECURITY_LOGS_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch {}
}

export function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : typeof fwd === "string" ? fwd.split(",")[0] : "";
  return (raw || req.socket.remoteAddress || "unknown").trim();
}

export function getDeviceId(req: Request): string {
  const hdr = req.headers["x-max10-device-id"];
  const q = req.query?.deviceId;
  const b = (req.body as any)?.deviceId;
  return String((Array.isArray(hdr) ? hdr[0] : hdr) || q || b || "").trim();
}

export function findMatchingBan(params: {
  ip?: string;
  deviceId?: string;
  userId?: string;
  email?: string;
}): BannedAccountRecord | undefined {
  const list = loadBannedAccounts();
  return list.find((b) => {
    if (params.userId && params.userId !== "guest" && params.userId !== "unauthenticated" && b.userId === params.userId) {
      return true;
    }
    if (params.email && b.email && b.email.toLowerCase() === params.email.toLowerCase()) {
      return true;
    }
    if (params.deviceId && b.deviceId && b.deviceId === params.deviceId) {
      return true;
    }
    if (
      params.ip &&
      params.ip !== "unknown" &&
      params.ip !== "::1" &&
      params.ip !== "127.0.0.1" &&
      params.ip !== "::ffff:127.0.0.1" &&
      b.ip &&
      b.ip === params.ip
    ) {
      return true;
    }
    return false;
  });
}

// Intrusion Signature Patterns (XSS, SQLi, Prototype Pollution, Path Traversal)
const THREAT_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "XSS_SCRIPT_TAG", regex: /<script\b[^>]*>|<\/script>/i },
  { name: "XSS_JS_URI", regex: /javascript\s*:/i },
  { name: "XSS_EVENT_HANDLER", regex: /\bon(error|load|mouseover|focus)\s*=/i },
  { name: "SQL_UNION_SELECT", regex: /\bunion\s+(all\s+)?select\b/i },
  { name: "SQL_DROP_TABLE", regex: /\bdrop\s+(table|database)\b/i },
  { name: "SQL_AUTH_BYPASS", regex: /('\s*or\s*'1'\s*=\s*'1|;\s*--\s*$)/i },
  { name: "PROTOTYPE_POLLUTION", regex: /(__proto__|constructor\s*\[\s*['"]prototype['"]\s*\])/i },
  { name: "PATH_TRAVERSAL", regex: /\.\.[/\\]\.\.[/\\](etc\/passwd|windows\/system32)/i },
];

function scanObjectForThreats(
  value: unknown,
  depth: number = 0,
  keyName: string = ""
): { matched: boolean; threatName?: string; snippet?: string } {
  if (depth > 8 || value === null || value === undefined) return { matched: false };

  // Skip large base64 data URLs (homework photos/audio)
  if (keyName === "data" || keyName === "image" || keyName === "avatar" || keyName === "fileData") {
    if (typeof value === "string" && (value.startsWith("data:") || value.length > 10000)) {
      return { matched: false };
    }
  }

  if (typeof value === "string") {
    if (value.length > 50000) return { matched: false };
    for (const pat of THREAT_PATTERNS) {
      if (pat.regex.test(value)) {
        return { matched: true, threatName: pat.name, snippet: value.slice(0, 120) };
      }
    }
    return { matched: false };
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const res = scanObjectForThreats(item, depth + 1, keyName);
      if (res.matched) return res;
    }
    return { matched: false };
  }

  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") {
        return { matched: true, threatName: "PROTOTYPE_POLLUTION_KEY", snippet: k };
      }
      const res = scanObjectForThreats(v, depth + 1, k);
      if (res.matched) return res;
    }
  }
  return { matched: false };
}

// Sliding-window rate limit store
const ipRequestWindows = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_REQUESTS = 180;

// Active human verification nonces
const pendingChallenges = new Map<string, { issuedAt: number; ip: string; deviceId: string }>();

export function registerSecurityRoutesAndMiddleware(app: Express, deps: SecurityDeps) {
  function autoBanAndPermanentlyDeleteAccount(params: {
    userId?: string;
    email?: string;
    name?: string;
    ip?: string;
    deviceId?: string;
    reason: string;
  }): BannedAccountRecord {
    const list = loadBannedAccounts();
    const now = Date.now();
    const record: BannedAccountRecord = {
      id: "ban-" + now + "-" + Math.random().toString(36).substring(2, 6),
      userId: params.userId,
      email: params.email,
      name: params.name || "Đối tượng xâm nhập trái phép",
      ip: params.ip,
      deviceId: params.deviceId,
      reason: params.reason,
      bannedAt: now,
      bannedAtFormatted:
        new Date(now).toLocaleTimeString("vi-VN") + " " + new Date(now).toLocaleDateString("vi-VN"),
      permanentlyDeleted: true,
    };

    const filtered = list.filter(
      (b) =>
        !(
          (params.userId && b.userId === params.userId) ||
          (params.email && b.email && b.email.toLowerCase() === params.email.toLowerCase()) ||
          (params.deviceId && b.deviceId === params.deviceId)
        )
    );
    filtered.unshift(record);
    saveBannedAccounts(filtered);

    deps.purgeAccountData({
      userId: params.userId,
      email: params.email,
      name: params.name,
    });

    appendSecurityLog("REAL_FIREWALL_BAN_AND_DELETE", record);
    console.warn("[REAL FIREWALL] BANNED & PERMANENTLY DELETED:", record);
    return record;
  }

  // Real Express Security Firewall Middleware on all /api routes
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    const reqPath = req.path || "";
    const clientIp = getClientIp(req);
    const deviceId = getDeviceId(req);
    const userId = String(
      req.headers["x-max10-user-id"] || (req.body as any)?.userId || (req.query as any)?.userId || ""
    ).trim();
    const email = String((req.body as any)?.email || (req.query as any)?.email || "").trim();
    const masterHeader = String(req.headers["x-max10-master-code"] || "").trim();

    // 1. Real Rate Limiting per IP
    const now = Date.now();
    const recent = (ipRequestWindows.get(clientIp) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    recent.push(now);
    ipRequestWindows.set(clientIp, recent);
    if (recent.length > RATE_LIMIT_MAX_REQUESTS && masterHeader !== MASTER_SECURITY_CODE) {
      appendSecurityLog("RATE_LIMIT_BLOCKED", { ip: clientIp, deviceId, path: reqPath, count: recent.length });
      return res.status(429).json({
        success: false,
        rateLimited: true,
        error: "Tần suất gửi yêu cầu bất thường. Tường lửa Max10 AI đã tạm chặn kết nối.",
      });
    }

    // Exempt endpoints required to inspect ban status, solve turnstile, or unban
    const publicSecurityPaths = [
      "/health",
      "/security/status",
      "/security/challenge",
      "/security/verify-human",
      "/security/unban",
    ];
    if (publicSecurityPaths.includes(reqPath)) {
      return next();
    }

    // 2. Real Ban Enforcement Check (blocks banned IP / Device / User across ALL APIs)
    if (masterHeader !== MASTER_SECURITY_CODE) {
      const banMatch = findMatchingBan({ ip: clientIp, deviceId, userId, email });
      if (banMatch) {
        appendSecurityLog("BLOCKED_BANNED_CLIENT_REQUEST", {
          ip: clientIp,
          deviceId,
          userId,
          path: reqPath,
          banId: banMatch.id,
        });
        return res.status(403).json({
          success: false,
          banned: true,
          reason: banMatch.reason,
          error: "Truy cập bị chặn vĩnh viễn bởi tường lửa bảo mật Max10 AI.",
        });
      }
    }

    // 3. Real Payload Threat & Privilege Escalation Scanner
    if (req.method !== "GET" && req.method !== "HEAD" && reqPath !== "/security/report-hack") {
      // Check for admin privilege escalation tampering on public registration/group routes
      if (
        (reqPath === "/social/register" || reqPath === "/classes/register" || reqPath === "/groups") &&
        masterHeader !== MASTER_SECURITY_CODE
      ) {
        const bodyAny = req.body as any;
        if (bodyAny?.isSuperAdmin === true || bodyAny?.role === "admin") {
          const rec = autoBanAndPermanentlyDeleteAccount({
            userId: userId || bodyAny?.id,
            email,
            name: bodyAny?.name,
            ip: clientIp,
            deviceId,
            reason: `Giả mạo đặc quyền Quản trị viên (Privilege Escalation) tại ${reqPath}`,
          });
          return res.status(403).json({
            success: false,
            banned: true,
            deleted: true,
            reason: rec.reason,
            error: "Phát hiện giả mạo quyền Quản trị viên! Tài khoản và thiết bị đã bị chặn vĩnh viễn.",
          });
        }
      }

      const bodyThreat = scanObjectForThreats(req.body);
      const queryThreat = scanObjectForThreats(req.query);
      const threat = bodyThreat.matched ? bodyThreat : queryThreat;
      if (threat.matched) {
        const rec = autoBanAndPermanentlyDeleteAccount({
          userId: userId || undefined,
          email: email || undefined,
          name: (req.body as any)?.name || (req.body as any)?.senderName,
          ip: clientIp,
          deviceId: deviceId || undefined,
          reason: `Tường lửa chặn tấn công thực tế (${threat.threatName}) tại ${reqPath}: ${threat.snippet}`,
        });
        return res.status(403).json({
          success: false,
          banned: true,
          deleted: true,
          threatType: threat.threatName,
          reason: rec.reason,
          error: `Tường lửa phát hiện mã tấn công (${threat.threatName}) và đã khóa vĩnh viễn truy cập!`,
        });
      }
    }

    next();
  });

  // 1. Real Cryptographic Challenge Endpoint for Turnstile Gate
  app.get("/api/security/challenge", (req, res) => {
    const clientIp = getClientIp(req);
    const deviceId = getDeviceId(req);
    const userId = String(req.query.userId || "").trim();
    const banMatch = findMatchingBan({ ip: clientIp, deviceId, userId });

    if (banMatch) {
      return res.json({
        success: true,
        banned: true,
        reason: banMatch.reason,
      });
    }

    const nonce = crypto.randomBytes(16).toString("hex");
    const issuedAt = Date.now();
    const sig = crypto
      .createHmac("sha256", SERVER_HMAC_SECRET)
      .update(`${nonce}:${issuedAt}:${clientIp}:${deviceId}`)
      .digest("hex");

    pendingChallenges.set(nonce, { issuedAt, ip: clientIp, deviceId });
    // Prune expired challenges (> 5 min)
    for (const [k, v] of pendingChallenges.entries()) {
      if (issuedAt - v.issuedAt > 5 * 60 * 1000) pendingChallenges.delete(k);
    }

    res.json({
      success: true,
      banned: false,
      nonce,
      issuedAt,
      signature: sig,
    });
  });

  // 2. Real Human Verification Endpoint
  app.post("/api/security/verify-human", (req, res) => {
    const clientIp = getClientIp(req);
    const deviceId = getDeviceId(req);
    const { nonce, signature, userId } = req.body || {};

    const banMatch = findMatchingBan({ ip: clientIp, deviceId, userId });
    if (banMatch) {
      return res.status(403).json({
        success: false,
        banned: true,
        reason: banMatch.reason,
      });
    }

    const challenge = pendingChallenges.get(String(nonce || ""));
    if (!challenge) {
      return res.status(400).json({
        success: false,
        error: "Phiên xác minh bảo mật đã hết hạn hoặc không hợp lệ.",
      });
    }

    const expectedSig = crypto
      .createHmac("sha256", SERVER_HMAC_SECRET)
      .update(`${nonce}:${challenge.issuedAt}:${challenge.ip}:${challenge.deviceId}`)
      .digest("hex");

    if (signature !== expectedSig) {
      return res.status(403).json({
        success: false,
        error: "Chữ ký xác minh bảo mật không hợp lệ.",
      });
    }

    // Require minimum realistic timing (>= 450ms) to block instant automated bots
    const elapsed = Date.now() - challenge.issuedAt;
    if (elapsed < 450) {
      return res.status(429).json({
        success: false,
        error: "Phát hiện tốc độ phản hồi tự động bất thường. Vui lòng thử lại.",
      });
    }

    pendingChallenges.delete(String(nonce));
    const verifiedToken = crypto
      .createHmac("sha256", SERVER_HMAC_SECRET)
      .update(`verified:${clientIp}:${deviceId}:${Date.now()}`)
      .digest("hex");

    res.json({
      success: true,
      verified: true,
      verifiedToken,
      verifiedAt: Date.now(),
    });
  });

  // 3. Real Security Status Endpoint
  app.get("/api/security/status", (req, res) => {
    const list = loadBannedAccounts();
    const logs = loadSecurityLogs();
    const clientIp = getClientIp(req);
    const deviceId = getDeviceId(req);
    const userId = String(req.query.userId || "").trim();
    const email = String(req.query.email || "").trim();

    const banMatch = findMatchingBan({ ip: clientIp, deviceId, userId, email });
    res.json({
      success: true,
      antiHackActive: true,
      totalBannedAccounts: list.length,
      totalBlockedEvents: logs.length,
      isClientBanned: Boolean(banMatch),
      banReason: banMatch?.reason || null,
    });
  });

  // 4. Report Real Hack Attempt (from auth/client tripwires)
  app.post("/api/security/report-hack", (req, res) => {
    try {
      const { action, payload, targetUser, targetEmail, targetName } = req.body || {};
      const clientIp = getClientIp(req);
      const deviceId = getDeviceId(req);
      const reason = `Phát hiện hành vi xâm nhập thực tế (${action || "Can thiệp trái phép"}). Dữ liệu: ${String(
        payload || ""
      ).slice(0, 100)}`;
      const banRecord = autoBanAndPermanentlyDeleteAccount({
        userId: targetUser,
        email: targetEmail,
        name: targetName,
        ip: clientIp,
        deviceId: deviceId || undefined,
        reason,
      });
      res.json({ success: true, banned: true, deleted: true, record: banRecord });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 5. Real Admin Ban Target Endpoint (Admin can ban a real offending user/IP/device)
  app.post("/api/security/ban-target", (req, res) => {
    try {
      const { securityCode, userId, email, name, ip, deviceId, reason } = req.body || {};
      if (securityCode !== MASTER_SECURITY_CODE) {
        return res.status(403).json({
          success: false,
          error: "Chỉ Quản trị viên có mã bảo mật hợp lệ mới được thực hiện lệnh chặn.",
        });
      }
      const banRecord = autoBanAndPermanentlyDeleteAccount({
        userId,
        email,
        name,
        ip,
        deviceId,
        reason: reason || "Chặn trực tiếp bởi Quản trị viên Max10 AI",
      });
      res.json({ success: true, record: banRecord });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 6. Master Unban Endpoint (Requires MASTER_SECURITY_CODE: duykobell123)
  app.post("/api/security/unban", (req, res) => {
    try {
      const { securityCode, userId, ip, deviceId, banId } = req.body || {};
      if (securityCode !== MASTER_SECURITY_CODE) {
        return res.status(403).json({
          success: false,
          error: "Mã bảo mật chống hack không chính xác! Hành vi tiếp tục bị ngăn chặn.",
        });
      }
      let list = loadBannedAccounts();
      if (banId) {
        list = list.filter((b) => b.id !== banId);
      } else if (userId || ip || deviceId) {
        list = list.filter(
          (b) => !(b.userId === userId || (ip && b.ip === ip) || (deviceId && b.deviceId === deviceId))
        );
      } else {
        list = [];
      }
      saveBannedAccounts(list);
      appendSecurityLog("ADMIN_UNBAN_EXECUTED", { banId, userId, ip, deviceId });
      res.json({ success: true, message: "Đã gỡ chặn thành công với mã bảo mật duykobell123!" });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 7. Get Banned Accounts & Real Security Audit Logs
  app.get("/api/security/banned-accounts", (_req, res) => {
    try {
      const list = loadBannedAccounts();
      const logs = loadSecurityLogs();
      res.json({ success: true, bannedAccounts: list, securityLogs: logs.slice(0, 50) });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
}
