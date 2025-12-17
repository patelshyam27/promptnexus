import { GoogleGenAI } from "@google/genai";

// Initialize the client.
// Note: In a real production app, you should be careful about exposing keys, 
// but for this frontend demo, we use process.env.API_KEY as requested.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const optimizePromptWithGemini = async (originalPrompt: string): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key not found. Returning original prompt.");
    return originalPrompt;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert prompt engineer. Optimize the following prompt to be more effective for a large language model. 
      Make it clearer, more specific, and structured. Do not lose the original intent.
      
      Original Prompt:
      "${originalPrompt}"
      
      Return ONLY the optimized prompt text, no explanations.`,
    });

    return response.text?.trim() || originalPrompt;
  } catch (error) {
    console.error("Error optimizing prompt with Gemini:", error);
    return originalPrompt;
  }
};

export const generateDescriptionWithGemini = async (content: string): Promise<string> => {
    if (!apiKey) {
        return "A user submitted prompt.";
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a very short (one sentence, max 15 words) description for this AI prompt:
            
            "${content}"`,
        });
        return response.text?.trim() || "A user submitted prompt.";
    } catch (error) {
        console.error("Error generating description:", error);
        return "A user submitted prompt.";
    }
}