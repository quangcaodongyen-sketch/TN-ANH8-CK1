
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types.ts";
import { CURRICULUM_INFO } from "../constants.ts";

export class QuizService {
  constructor() {}

  private getAI() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key không tồn tại.");
    return new GoogleGenAI({ apiKey });
  }

  async generateQuestions(): Promise<Question[]> {
    const ai = this.getAI();
    const prompt = `
      Hãy tạo 20 câu hỏi trắc nghiệm tiếng Anh lớp 8 chương trình Global Success (Kỳ 1).
      - Nội dung BÁM SÁT SGK Global Success 8.
      - 14 câu từ Unit 4, 5, 6 (70%): ${CURRICULUM_INFO.units4to6}
      - 6 câu từ Unit 1, 2, 3 (30%): ${CURRICULUM_INFO.units1to3}
      - Mỗi câu đúng 3 phương án lựa chọn.
      - Giải thích tiếng Việt ngắn gọn.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                unit: { type: Type.INTEGER },
                topic: { type: Type.STRING }
              },
              required: ["id", "text", "options", "correctAnswer", "explanation", "unit", "topic"]
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Error generating questions:", error);
      throw error;
    }
  }
}
