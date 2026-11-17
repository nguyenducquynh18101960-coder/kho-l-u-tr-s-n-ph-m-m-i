export default function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    isUpdating: false,
    version: "2026.11.17.1",
    publishedUrl: "https://max-ai-gia-s-i-m-10-thcs.ai.studio",
    message:
      "Max10 AI đã cập nhật! Chỉ cần xuất bản là cập nhật ngay chỉ sau 60 giây (không phải chờ 1 tiếng hay quay lại ngày hôm sau).",
    estimatedMinutes: 1,
    serverTime: Date.now(),
  });
}
