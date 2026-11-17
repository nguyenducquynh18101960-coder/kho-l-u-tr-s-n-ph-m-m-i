import { GoogleGenAI } from "@google/genai";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const {
      grade = "Lớp 9",
      subject = "Toán học",
      messages: incomingMessages = [],
      message: singleMessage,
      image = null,
      userName = "Bạn học",
    } = body;

    const messages = Array.isArray(incomingMessages) ? [...incomingMessages] : [];
    if (messages.length === 0 && singleMessage) {
      messages.push({ role: "user", content: singleMessage });
    }

    const lastRawMsg = String(messages[messages.length - 1]?.content || "");
    const cleanCmd = lastRawMsg.trim().toLowerCase();
    if (
      ["thoat", "thoát", "exit", "quit", "tạm biệt", "tam biet"].includes(cleanCmd)
    ) {
      return res.status(200).json({
        success: true,
        reply:
          "🤖 **Max10 AI**: Tạm biệt nhé! Hẹn gặp lại bạn trong những buổi học tập tiếp theo cùng Max10 AI!",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        reply: `👋 Chào **${userName}**! Hiện máy chủ Vercel chưa được cấu hình biến môi trường \`GEMINI_API_KEY\`.\n\nĐể kích hoạt trả lời AI trực tiếp trên Vercel, quản trị viên hãy vào **Vercel Project Settings → Environment Variables** và thêm \`GEMINI_API_KEY\`, sau đó Redeploy lại nhé!`,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Bạn là Max10 AI - Gia sư Điểm 10 THCS thân thiện, chính xác 100%, đang đồng hành cùng học sinh "${userName}" (${grade}, môn ${subject}). Hãy giải chi tiết từng bước rõ ràng, chỉ ra "Bẫy Điểm 10" dễ mất điểm và trình bày công thức dễ hiểu bằng tiếng Việt.`;

    const contentsPayload = messages.map((msg: any, idx: number) => {
      const isLatestUser = idx === messages.length - 1 && msg.role === "user";
      if (isLatestUser && image?.data && image?.mimeType) {
        return {
          role: msg.role === "assistant" ? "model" : "user",
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            {
              text:
                msg.content ||
                "Hãy đọc đề bài trong ảnh này và hướng dẫn em giải chi tiết từng bước để đạt điểm 10.",
            },
          ],
        };
      }
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: String(msg.content || "") }],
      };
    });

    let lastError: any = null;
    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: contentsPayload,
          config: { systemInstruction, temperature: 0.7 },
        });
        if (response?.text) {
          return res.status(200).json({ success: true, reply: response.text });
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    return res.status(200).json({
      success: true,
      reply: `⚠️ Max10 AI tạm thời quá tải (${lastError?.message || "kết nối gián đoạn"}). Bạn vui lòng thử gửi lại câu hỏi sau giây lát nhé!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Lỗi xử lý trò chuyện trên Vercel.",
    });
  }
}
