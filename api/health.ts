export default function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(200).json({
    status: "ok",
    platform: "vercel",
    timestamp: new Date().toISOString(),
  });
}
