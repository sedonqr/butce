import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: transactions } = await supabase.from('transactions').select('*').gte('created_at', sevenDaysAgo);

    let income = 0, expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += parseFloat(t.amount);
      else expense += parseFloat(t.amount);
    });

    await resend.emails.send({
      from: 'Bütçe <onboarding@resend.dev>',
      to: process.env.MY_EMAIL,
      subject: '📊 Haftalık Bütçe Özetin',
      html: `<h2>Haftalık Özet</h2><p><b>Toplam Gelir:</b> ₺${income}</p><p><b>Toplam Gider:</b> ₺${expense}</p><p><b>Kalan:</b> ₺${income - expense}</p>`
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}