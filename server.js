import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// ── Feedback endpoint ──
app.post('/api/feedback', async (req, res) => {
  const { message, rating } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Anesthetic Drug Calculator" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Feedback — Anesthetic Drug Calculator${rating ? ` (${rating}★)` : ''}`,
      text: message,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#4f46e5">Feedback — Anesthetic Drug Calculator</h2>
          ${rating ? `<p><strong>Rating:</strong> ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</p>` : ''}
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #4f46e5;padding-left:12px;color:#333">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <hr style="margin-top:24px;border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">Sent from thai-anesthetic-drug-production-a376.up.railway.app</p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Feedback email error:', err.message);
    res.status(500).json({ error: 'Failed to send' });
  }
});

app.get('*', (_, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`Thai Anesthetic Drug → http://localhost:${PORT}`));
