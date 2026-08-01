import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Midtrans Client Setup
  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
  });

  // API Routes
  app.get('/api/youtube-videos', async (req, res) => {
    try {
      const channelId = (req.query.channelId as string) || 'UCyceXxcMMBRh_ujOMeN1tvw';
      const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`YouTube RSS returned status ${response.status}`);
      }
      const xml = await response.text();
      const entries = xml.split("<entry>");
      const videos = [];

      const decodeEntities = (s: string) => s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");

      for (let i = 1; i < entries.length; i++) {
        const chunk = entries[i];
        const videoIdMatch = chunk.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        const titleMatch = chunk.match(/<title>([^<]+)<\/title>/);
        const descMatch = chunk.match(/<media:description>([\s\S]*?)<\/media:description>/);
        const pubMatch = chunk.match(/<published>([^<]+)<\/published>/);
        const thumbMatch = chunk.match(/<media:thumbnail\s+url="([^"]+)"/);

        if (videoIdMatch && titleMatch) {
          const videoId = videoIdMatch[1].trim();
          const rawTitle = titleMatch[1].trim();
          const title = decodeEntities(rawTitle);
          const rawDesc = descMatch ? descMatch[1].trim() : "";
          const description = decodeEntities(rawDesc);
          const published = pubMatch ? pubMatch[1].trim() : "";
          const thumbnail = thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          
          let category = "Dokumentasi";
          if (title.toLowerCase().includes("aftermovie")) {
            category = "Aftermovie";
          } else if (title.toLowerCase().includes("kegiatan") || title.toLowerCase().includes("skulprize")) {
            category = "Kegiatan";
          }

          videos.push({
            id: `yt-${videoId}`,
            title,
            description,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: thumbnail,
            publishedAt: published,
            category
          });
        }
      }
      res.json(videos);
    } catch (error: any) {
      console.error("Error fetching YouTube RSS:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/payment/create', async (req, res) => {
    try {
      const { amount, orderId, customerDetails } = req.body;
      
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: customerDetails,
        credit_card: {
          secure: true
        }
      };

      const transaction = await snap.createTransaction(parameter);
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
