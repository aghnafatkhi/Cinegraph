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
