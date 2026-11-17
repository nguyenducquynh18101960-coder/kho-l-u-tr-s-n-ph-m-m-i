export default function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    success: true,
    antiHackActive: true,
    totalBannedAccounts: 0,
    totalBlockedEvents: 0,
    isClientBanned: false,
    banReason: null,
  });
}
