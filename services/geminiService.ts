
import { GoogleGenAI, Type } from "@google/genai";
import type { KeyAnswers, Scores } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const keyAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    multipleChoice: {
      type: Type.ARRAY,
      description: "Jawaban pilihan ganda biasa.",
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.INTEGER, description: "Nomor soal" },
          answer: { type: Type.STRING, description: "Huruf jawaban yang benar (A, B, C, D, atau E)" }
        },
        required: ["number", "answer"],
      }
    },
    complexMultipleChoice: {
      type: Type.ARRAY,
      description: "Jawaban pilihan ganda kompleks (jawaban benar bisa lebih dari satu).",
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.INTEGER, description: "Nomor soal" },
          answers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array berisi semua pilihan jawaban yang benar" }
        },
        required: ["number", "answers"],
      }
    },
    essay: {
      type: Type.ARRAY,
      description: "Jawaban untuk soal esai.",
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.INTEGER, description: "Nomor soal" },
          keyPoints: { type: Type.STRING, description: "Poin-poin kunci atau ringkasan dari jawaban esai yang benar." }
        },
        required: ["number", "keyPoints"],
      }
    }
  }
};

const gradingSchema = {
    type: Type.OBJECT,
    properties: {
        multipleChoiceScore: { type: Type.NUMBER, description: "Total skor untuk bagian pilihan ganda." },
        complexMultipleChoiceScore: { type: Type.NUMBER, description: "Total skor untuk bagian pilihan ganda kompleks." },
        essayScore: { type: Type.NUMBER, description: "Total skor untuk bagian esai." },
        totalScore: { type: Type.NUMBER, description: "Total skor keseluruhan." },
    },
    required: ["multipleChoiceScore", "complexMultipleChoiceScore", "essayScore", "totalScore"],
};


export const analyzeKeySheet = async (keyImageFile: File): Promise<KeyAnswers> => {
  const base64Image = await fileToBase64(keyImageFile);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: keyImageFile.type,
            data: base64Image,
          },
        },
        {
          text: "Anda adalah AI ahli dalam menganalisis dokumen pendidikan. Analisis gambar lembar jawaban kunci ini. Ekstrak semua jawaban untuk setiap jenis soal (Pilihan Ganda, Pilihan Ganda Kompleks, Esai) dan kembalikan dalam format JSON sesuai skema yang disediakan. Pastikan akurat.",
        },
      ],
    },
    config: {
        responseMimeType: "application/json",
        responseSchema: keyAnalysisSchema,
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText) as KeyAnswers;
};

export const gradeStudentSheet = async (
    studentImageBase64: string,
    mimeType: string,
    keyAnswers: KeyAnswers,
    scores: Scores
): Promise<{ multipleChoiceScore: number; complexMultipleChoiceScore: number; essayScore: number; totalScore: number; }> => {

    const prompt = `
        Anda adalah asisten penilaian AI. Tugas Anda adalah menilai lembar jawaban siswa berdasarkan kunci jawaban dan aturan penilaian yang diberikan.

        KUNCI JAWABAN:
        ${JSON.stringify(keyAnswers, null, 2)}

        ATURAN PENILAIAN:
        - Pilihan Ganda: ${scores.multipleChoice} poin per jawaban benar.
        - Pilihan Ganda Kompleks: ${scores.complexMultipleChoice} poin per soal jika semua jawaban benar. Tidak ada poin parsial.
        - Esai: Nilai maksimal ${scores.essay} poin per soal. Nilai berdasarkan kesesuaian jawaban siswa dengan poin kunci.

        INSTRUKSI:
        1. Analisis gambar lembar jawaban siswa yang disediakan.
        2. Bandingkan jawaban siswa dengan KUNCI JAWABAN.
        3. Hitung skor untuk setiap bagian sesuai ATURAN PENILAIAN.
        4. Kembalikan total skor untuk setiap bagian dan skor total keseluruhan dalam format JSON sesuai skema.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: studentImageBase64,
                    }
                },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: gradingSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
