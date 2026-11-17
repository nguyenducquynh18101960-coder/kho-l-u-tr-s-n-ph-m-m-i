import crypto from "crypto";

const MASTER_SECURITY_CODE = "duykobell123";
const HMAC_SECRET =
  process.env.SESSION_SECRET ||
  crypto
    .createHash("sha256")
    .update(MASTER_SECURITY_CODE + "_max10_hmac")
    .digest("hex");

export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { nonce, issuedAt, signature, deviceId: bodyDeviceId } = body;
    const hdr = req.headers?.["x-max10-device-id"];
    const deviceId = String(
      (Array.isArray(hdr) ? hdr[0] : hdr) || bodyDeviceId || ""
    ).trim();

    const issuedAtNum = Number(issuedAt);
    if (!nonce || !signature || !Number.isFinite(issuedAtNum)) {
      return res.status(400).json({
        success: false,
        error: "Phiên xác minh bảo mật đã hết hạn hoặc thiếu dữ liệu.",
      });
    }

    const expectedSig = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(`${nonce}:${issuedAtNum}:${deviceId}`)
      .digest("hex");

    if (signature !== expectedSig) {
      return res.status(403).json({
        success: false,
        error: "Chữ ký xác minh bảo mật không hợp lệ.",
      });
    }

    const elapsed = Date.now() - issuedAtNum;
    if (elapsed < 450) {
      return res.status(429).json({
        success: false,
        error: "Phát hiện tốc độ phản hồi tự động bất thường. Vui lòng thử lại.",
      });
    }
    if (elapsed > 10 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: "Phiên xác minh bảo mật đã hết hạn. Vui lòng thử lại.",
      });
    }

    const verifiedToken = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(`verified:${deviceId}:${Date.now()}`)
      .digest("hex");

    return res.status(200).json({
      success: true,
      verified: true,
      verifiedToken,
      verifiedAt: Date.now(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Lỗi xác minh bảo mật trên máy chủ.",
    });
  }
}
