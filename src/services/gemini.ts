import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Character {
  name: string;
  appearance: string;
  tone?: string;
}

export interface Scene {
  sceneNumber: number;
  audioScript: string;
  videoPrompt: string;
  negativePrompt: string;
}

export interface CharacterReference {
  name: string;
  referencePrompt: string;
}

export interface GenerationResult {
  episodeTitle: string;
  scenes: Scene[];
  characterReferences: CharacterReference[];
}

export async function generateScript(
  characters: Character[],
  situation: string,
  aspectRatio: "16:9" | "9:16",
  duration: number,
  topic: string = "Đời thường"
): Promise<GenerationResult> {
  const model = "gemini-3-flash-preview"; // Use standard model alias to avoid 404 errors

  const systemInstruction = `You are a professional Creative Director and AI Prompt Engineer specializing in 2D Vector Animation.
Your task is to transform diverse life situations into a highly detailed, scene-by-scene video script within ONE ABSOLUTELY FIXED CONSISTENT SETTING for the entire episode.

TOPIC: "${topic}"

CORE ARCHITECTURE (Chuyện Nhà Tý Style):
- ABSOLUTELY NO BACKGROUND CHANGES: The entire episode MUST take place in ONE SINGLE location (e.g., just the living room, just the classroom, just the cafe table). It is STRICTLY FORBIDDEN to switch or modify the background between scenes.
- FIXED POSING & LOCATION: To ensure 100% visual consistency, characters MUST remain in a fixed base pose and fixed coordinates within the frame throughout the entire episode (e.g., both characters sitting on the exact same sofa cushions from scene 1 to end). They MUST NOT walk, move to another room, or change their primary body orientation. Only facial expressions and minor arm/hand gestures are allowed to change.
- CONTRAST & COMEDY: If the situation implies a comparison (e.g., "then vs now", "honeymoon phase vs marriage", "expectation vs reality"), structure the script to highlight these contrasts through character dialogue and exaggerated reactions, while NEVER moving the characters from their seats/spots.
- DIALOGUE STYLE: Use natural, witty, and highly humorous everyday Vietnamese conversational language. Every line of dialogue should aim to be funny, featuring clever wordplay, self-deprecating humor, or exaggerated observations that make the audience laugh. While focus remains on relatable daily life situations and meaningful life reflections (triết lý sống), the delivery MUST be punchy and comedic (hài hước, dí dỏm). Think "funny but deep". Avoid heavy Gen Z slang, but prioritize "meme-worthy" wit.
- CAMERA: Maintain a consistent medium-shot or close-up perspective. Keep the frame stable. Focus on character interactions.
- VISUAL STYLE: Clean 2D digital animation still illustration, warm and cozy sitcom style reminiscent of the 'Chuyện Nhà Tý' series. 
- CHARACTER TRAITS: Simple facial features (large oval white eyes, black dot pupils, simple lines for mouth). Clean path-based outlines.
- FOCUS: Focus heavily on character facial expressions (smiling, frowning, big curious eyes, blushing, disgusted faces, angry veins) and hand gestures while speaking.
- CONSISTENCY: Describe characters and background IDENTICALLY in every scene prompt. Use the same vocabulary to describe the setting.

PROMPT ENGINEERING:
- All videoPrompts MUST be in English.
- Start each prompt with: "A clean 2D digital animation still illustration, rendered in a warm, cozy sitcom style reminiscent of the 'Chuyện Nhà Tý' series. No text, no watermark. Set in a [CONSISTENT LOCATION DESCRIPTION]..."
- ABSOLUTE FIXED ACTION: All characters must stay in one spot (sitting, standing, or lying down) which remains 100% UNCHANGED across all scene prompts.
- videoPrompt MUST describe specific facial expressions, eye focus, and mouth position for that scene's dialogue. Highlight emotional shifts (from romantic to disgusted, from happy to annoyed).
- EVERY scene's videoPrompt must include the EXACT SAME background description text to ensure AI consistency. Do not vary one word of the background description.

LANGUAGE:
- Audio script (audioScript) MUST be in Vietnamese.
- All technical prompts (videoPrompt, negativePrompt) MUST be in English.

OUTPUT FORMAT:
Return a JSON object exactly matching the requested schema.

Also generate a characterReferences array. For each character in the input, provide:
1. name: The character name.
2. referencePrompt: A specific English prompt matching this EXACT pattern: "A clean 2D digital animation still illustration, rendered in a warm, cozy sitcom style reminiscent of the 'Chuyện Nhà Tý' series. The focus is entirely on the [CHARACTER NAME AND DESCRIPTION], isolate, [POSE/EXPRESSION]. The entire character is set against a pure, clean white background. There are no furniture, objects, animals, or UI elements present."`;

  const charactersList = characters.map(c => `- ${c.name}: ${c.appearance}${c.tone ? ` (Voice Tone: ${c.tone})` : ''}`).join("\n");
  const prompt = `
INPUT DATA:
- Topic: ${topic}
- Characters:
${charactersList}
- Situation: ${situation}
- Aspect Ratio: ${aspectRatio}
- Duration: ${duration} Scenes

Generate a complete script for this episode influenced by the topic "${topic}". 
The dialogue MUST be natural, punchy, and incredibly witty, making sure each exchange is humorous (dí dỏm) and laugh-out-loud funny. It should incorporate meaningful life reflections (triết lý sống) but delivered through a comedic lens that feels sincere yet hilarious. Avoid heavy Gen Z slang.
All scenes MUST occur in the exact same location with the same background.
FIXED POSING: Characters MUST remain in one fixed spot (sitting, standing, or lying down) throughout ALL scenes. They MUST NOT change their physical location or base pose within the frame during the story.
For each scene, provide:
1. audioScript (Vietnamese): The voiceover or dialogue including SFX cues. Focus on natural, expressive conversation.
2. videoPrompt (English): A detailed Master Prompt for 2D Vector Animation. Mention "2D vector art style, flat vector colors, high-quality illustration, no text, no watermark". Focus ONLY on describing character facial expressions, lip-sync/mouth movement, and small hand gestures while maintaining their FIXED POSITION. You MUST keep the background description IDENTICAL for every scene's prompt.
3. negativePrompt (English): Standard exclusion list (text, letters, watermark, signature, 3D rendering, photorealistic, blurred lines, realistic shadows, complex grain textures, microphones, animals, non-human features, distorted anatomy).
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          episodeTitle: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                audioScript: { type: Type.STRING },
                videoPrompt: { type: Type.STRING },
                negativePrompt: { type: Type.STRING },
              },
              required: ["sceneNumber", "audioScript", "videoPrompt", "negativePrompt"],
            },
          },
          characterReferences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                referencePrompt: { type: Type.STRING },
              },
              required: ["name", "referencePrompt"],
            },
          },
        },
        required: ["episodeTitle", "scenes", "characterReferences"],
      },
    },
  });

  try {
    const parsed = JSON.parse(response.text) as GenerationResult;
    
    // Override character references with fixed prompts as requested by user
    if (parsed.characterReferences) {
      const fixedPrompts: Record<string, string> = {
        "Chồng Tèo": "A clean 2D digital animation still illustration, rendered in a warm, cozy sitcom style reminiscent of the 'Chuyện Nhà Tý' series. No text, no watermark. The focus is entirely on the Chồng Tèo, a young Vietnamese man with a gentle face, short neat black hair, large oval white eyes with black dot pupils, wearing a simple grey t-shirt, isolate, smiling warmly. The entire character is set against a pure, clean white background. There are no furniture, objects, animals, or UI elements present.",
        "Vợ Mai": "A clean 2D digital animation still illustration, rendered in a warm, cozy sitcom style reminiscent of the 'Chuyện Nhà Tý' series. No text, no watermark. The focus is entirely on the Vợ Mai, a young Vietnamese woman with long black hair in a high ponytail, large oval white eyes with black dot pupils, wearing pink pajamas with small cat patterns, isolate, giggling. The entire character is set against a pure, clean white background. There are no furniture, objects, animals, or UI elements present.",
        "Bé Tít": "A clean 2D digital animation still illustration, rendered in a warm, cozy sitcom style reminiscent of the 'Chuyện Nhà Tý' series. No text, no watermark. The focus is entirely on the Bé Tít, a young boy with monk-style hair, round chubby face, wearing patterned pajamas, isolate, standing pose. The entire character is set against a pure, clean white background. There are no furniture, objects, animals, or UI elements present."
      };

      parsed.characterReferences = parsed.characterReferences.map((ref, idx) => {
        const inputName = characters[idx]?.name || ref.name;
        // Check if inputName partially matches any of our keys
        const matchKey = Object.keys(fixedPrompts).find(key => 
          inputName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(inputName.toLowerCase())
        );

        return {
          name: inputName,
          referencePrompt: matchKey ? fixedPrompts[matchKey] : ref.referencePrompt
        };
      });

      // Ensure we at least have 2 if input had 2 but AI returned less (safety)
      if (parsed.characterReferences.length < characters.length) {
        for (let i = parsed.characterReferences.length; i < characters.length; i++) {
          const inputName = characters[i].name;
          const matchKey = Object.keys(fixedPrompts).find(key => 
            inputName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(inputName.toLowerCase())
          );
          if (matchKey) {
            parsed.characterReferences.push({
              name: inputName,
              referencePrompt: fixedPrompts[matchKey]
            });
          }
        }
      }
    }
    
    return parsed;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Invalid response format from AI");
  }
}
