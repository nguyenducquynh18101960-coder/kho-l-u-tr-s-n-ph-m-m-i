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

  try {
    const hdr = req.headers?.["x-max10-device-id"];
    const deviceId = String(
      (Array.isArray(hdr) ? hdr[0] : hdr) || req.query?.deviceId || ""
    ).trim();

    const nonce = crypto.randomBytes(16).toString("hex");
    const issuedAt = Date.now();
    const signature = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(`${nonce}:${issuedAt}:${deviceId}`)
      .digest("hex");

    return res.status(200).json({
      success: true,
      banned: false,
      nonce,
      issuedAt,
      signature,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Không thể khởi tạo thử thách bảo mật.",
    });
  }
}
