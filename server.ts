import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up high JSON body limit to support sending base64 images if needed
  app.use(express.json({ limit: '10mb' }));

  // API Route for LockScreen Wallpaper Image Generation using Gemini Imagen
  app.post("/api/generate-lockscreen-wallpaper", async (req, res) => {
    try {
      const { prompt, style, ratio } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "پرامپت ارسال شده نامعتبر یا خالی است." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "کلید امنیتی جمینی (GEMINI_API_KEY) در سمت سرور تنظیم نشده است. لطفاً آن را در بخش Settings > Secrets اضافه کنید." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Augment prompt based on style for professional aesthetic LockScreen wallpapers
      let finalPrompt = prompt;
      if (style === 'neon-cyber') {
        finalPrompt = `${prompt}, beautiful cyber sci-fi landscape, glowing neon lines, holographic grids, futuristic gaming background, cyberpunk aesthetic, dark mode 4k digital art`;
      } else if (style === 'space-cosmic') {
        finalPrompt = `${prompt}, deep space interstellar dust, colorful cosmic nebulae, glowing stars and planets, high-tech HUD vector elements overlay, premium cosmic sci-fi wallpaper`;
      } else if (style === 'minimal-vector') {
        finalPrompt = `${prompt}, minimal vector illustration, sophisticated flat geometric shapes, dark background, modern elegant clean design, masterpiece digital art`;
      } else if (style === 'anime-fantasy') {
        finalPrompt = `${prompt}, anime aesthetic fantasy scenery, beautiful hand-drawn feel, soft volumetric lighting, magical gaming wallpaper, gorgeous environment illustration`;
      } else if (style === 'cyber-matrix') {
        finalPrompt = `${prompt}, hacking console digital rain matrix design, tech circuits glowing green/blue, system security shield, high-tech network interface`;
      }

      console.log(`Sending image generation request with prompt: "${finalPrompt}"`);

      // Using the Imagen model directly as specified in the gemini-api skill:
      // "Call generateImages to generate images with Imagen models"
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: ratio || '16:9',
        },
      });

      if (!response.generatedImages?.[0]?.image?.imageBytes) {
        throw new Error("پاسخی از سرویس هوش مصنوعی ایمجن جمینی دریافت نشد.");
      }

      const base64Bytes = response.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64Bytes}`;

      return res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error in AI wallpaper generation:", error);
      return res.status(500).json({ error: error?.message || "خطا در برقراری ارتباط با هوش مصنوعی جمینی." });
    }
  });

  // Vite middleware configuration for serving the frontend in dev or prod mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server successfully listening on port ${PORT}`);
  });
}

startServer();
