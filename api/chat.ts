import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const FALLBACK_MODELS = [
  "gemini-4-hydrogen",
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
      mode = "tutor",
      isThinking = false,
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
    const useHighThinking = Boolean(
      isThinking || mode === "grade_10_secret" || mode === "trap_detector" || Boolean(image?.data)
    );

    const systemInstruction = `Bạn là "Max10 AI Ultra" — Siêu Trợ Lý AI Thế Hệ Mới và Gia Sư Điểm 10 toàn năng dành cho "${userName}" (${grade}, môn ${subject}).
- Với bài tập / đề thi mọi môn (Toán, Văn, Anh, KHTN, Lý, Hóa, Sinh, Sử, Địa, Tin...): tự kiểm tra kỹ 100%, đưa đáp án chuẩn xác ngay đầu, trình bày 2 góc nhìn (Cách chuẩn tự luận 10/10 + Mẹo giải nhanh/kiểm tra lại), chỉ rõ "⚠️ BẪY ĐIỂM 10", viết ký hiệu chuẩn SGK (×, ·, x², √, →, H₂O, △ABC), KHÔNG dùng mã LaTeX thô.
- Với yêu cầu đa năng (lập trình, viết lách, dịch thuật, tóm tắt, sáng tạo): trả lời sắc bén, có cấu trúc Markdown sạch đẹp, code chuẩn xác, đi thẳng vào giải pháp tốt nhất.
- Cuối câu trả lời luôn tặng 1 mục ngắn "🎯 Gợi ý bước tiếp theo" để người dùng học sâu hoặc luyện tiếp ngay.`;

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
                "Hãy đọc kỹ đề bài trong ảnh này, kiểm tra dữ kiện chính xác và hướng dẫn giải chi tiết từng bước để đạt điểm 10.",
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
        const config: any = { systemInstruction };
        if (model.startsWith("gemini-4-") || model.includes("2.5")) {
          config.thinkingConfig = {
            thinkingLevel: useHighThinking ? ThinkingLevel.HIGH : ThinkingLevel.MEDIUM,
          };
        }
        if (!model.startsWith("gemini-4-")) {
          config.temperature = 0.7;
        }
        const response = await ai.models.generateContent({
          model,
          contents: contentsPayload,
          config,
        });
        if (response?.text) {
          return res.status(200).json({
            success: true,
            reply: response.text,
            modelEngine: "Max10 Gemini 4 Ultra",
          });
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
