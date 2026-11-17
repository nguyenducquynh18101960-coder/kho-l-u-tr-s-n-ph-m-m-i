export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  return res.status(200).json({
    success: true,
    user: body || null,
  });
}
