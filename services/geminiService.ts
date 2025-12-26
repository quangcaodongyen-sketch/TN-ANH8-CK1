
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";
import { CURRICULUM_INFO } from "../constants";

export class QuizService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateQuestions(): Promise<Question[]> {
    const prompt = `
      Hãy tạo 20 câu hỏi trắc nghiệm tiếng Anh lớp 8 chương trình Global Success (Kỳ 1).
      - Nội dung BÁM SÁT SGK Global Success 8.
      - 14 câu từ Unit 4, 5, 6 (70%): ${CURRICULUM_INFO.units4to6}
      - 6 câu từ Unit 1, 2, 3 (30%): ${CURRICULUM_INFO.units1to3}
      - Mỗi câu đúng 3 phương án lựa chọn.
      - Giải thích tiếng Việt ngắn gọn.
    `;

    try {
      const response = await this.ai.models.generateContent({
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

  async enhancePhoto(base64Image: string): Promise<string> {
    try {
      // Remove data URL prefix if exists
      const data = base64Image.split(',')[1] || base64Image;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: data,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: 'Transform this user portrait into a professional, cute student ID card photo. Enhance the lighting to be natural and bright, smooth the skin texture beautifully, and make the outfit look like a clean, stylish school uniform or appropriate student attire. The background should be a clean, solid professional blue or white. Ensure it looks high quality and charming for a certificate.',
            },
          ],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned from AI");
    } catch (error) {
      console.error("AI Photo Enhancement Error:", error);
      throw error;
    }
  }
}
