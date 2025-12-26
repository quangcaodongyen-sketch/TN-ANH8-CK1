
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types.ts";
import { CURRICULUM_INFO } from "../constants.ts";

export class QuizService {
  constructor() {}

  private getAI() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Critical: API_KEY is missing from process.env");
      throw new Error("Cấu hình API Key không tồn tại.");
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateQuestions(): Promise<Question[]> {
    const ai = this.getAI();
    const systemInstruction = `Bạn là một giáo viên tiếng Anh giàu kinh nghiệm. Hãy tạo 20 câu hỏi trắc nghiệm tiếng Anh lớp 8 chương trình Global Success (Kỳ 1).
    - Phân bổ: 14 câu từ Unit 4, 5, 6 (${CURRICULUM_INFO.units4to6}) và 6 câu từ Unit 1, 2, 3 (${CURRICULUM_INFO.units1to3}).
    - Mỗi câu có đúng 3 phương án lựa chọn (options).
    - Giải thích (explanation) bằng tiếng Việt súc tích, dễ hiểu cho học sinh.
    - Output luôn là một mảng JSON các đối tượng câu hỏi.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Hãy soạn đề thi ngay bây giờ.",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER, description: "Chỉ số 0, 1 hoặc 2 của câu trả lời đúng" },
                explanation: { type: Type.STRING },
                unit: { type: Type.INTEGER },
                topic: { type: Type.STRING }
              },
              required: ["id", "text", "options", "correctAnswer", "explanation", "unit", "topic"]
            }
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Mô hình không trả về dữ liệu.");
      return JSON.parse(text);
    } catch (error) {
      console.error("Chi tiết lỗi Gemini API:", error);
      throw error;
    }
  }
}
