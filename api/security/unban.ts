const MASTER_SECURITY_CODE = "duykobell123";

export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { securityCode } = body;

    if (securityCode !== MASTER_SECURITY_CODE) {
      return res.status(403).json({
        success: false,
        error: "Mã bảo mật chống hack không chính xác! Hành vi tiếp tục bị ngăn chặn.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã gỡ chặn thành công với mã bảo mật duykobell123!",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Lỗi xử lý mở khóa.",
    });
  }
}
