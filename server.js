import express from 'express';
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
    const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '';
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Anesthetic Drug Calculator <onboarding@resend.dev>',
        to: ['kunka10839@gmail.com'],
        subject: `Feedback — Anesthetic Drug Calculator${rating ? ` (${rating}★)` : ''}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#4f46e5">Feedback — Anesthetic Drug Calculator</h2>
            ${stars ? `<p><strong>Rating:</strong> ${stars}</p>` : ''}
            <p><strong>Message:</strong></p>
            <blockquote style="border-left:3px solid #4f46e5;padding-left:12px;color:#333">
              ${message.replace(/\n/g, '<br>')}
            </blockquote>
            <hr style="margin-top:24px;border:none;border-top:1px solid #eee">
            <p style="color:#999;font-size:12px">Sent from thai-anesthetic-drug-production-a376.up.railway.app</p>
          </div>
        `,
      }),
    });

    if (!r.ok) {
      const body = await r.text();
      console.error('Resend error:', r.status, body);
      return res.status(500).json({ error: 'Failed to send' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ error: 'Failed to send' });
  }
});

app.get('*', (_, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`Thai Anesthetic Drug → http://localhost:${PORT}`));
