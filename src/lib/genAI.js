import "dotenv/config";
import {GoogleGenerativeAI} from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeTextWithGemini(text) {
    try {
        const model = genAI.getGenerativeModel({ model:"gemini-2.0-flash" });

        const prompt = `Analyze the following chat message. If it contains offensive, harmful, or inappropriate language, return "OFFENSIVE". Otherwise, return "SAFE". \n\n"${text}"`;
        
        const response = await model.generateContent(prompt);
        const result = response.response.text().trim();

        return result === "SAFE"; // ✅ Returns `true` if safe, `false` if offensive
    } catch (error) {
        console.error("Error analyzing text with Gemini:", error);
        return false; // Default to rejecting the message if API fails
    }
}

export default analyzeTextWithGemini;
