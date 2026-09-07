export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const MY_EMAIL = process.env.MY_EMAIL;

    // Son 7 günün verilerini Supabase'den çek
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const supabaseRes = await fetch(
      `${SUPABASE_URL}/rest/v1/transactions?date=gte.${oneWeekAgo}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await supabaseRes.json();

    let totalIncome = 0;
    let totalExpense = 0;

    if (Array.isArray(data)) {
      data.forEach(item => {
        const amt = parseFloat(item.amount) || 0;
        if (item.type === 'income') totalIncome += amt;
        else totalExpense += amt;
      });
    }

    const netBalance = totalIncome - totalExpense;

    // Şık E-posta Şablonu
    const emailHtml = `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; max-width: 500px; margin: auto;">
        <h2 style="color: #eab308; margin-top: 0;">📊 Sedonar Bütçe - Haftalık Rapor</h2>
        <p style="color: #94a3b8; font-size: 14px;">Selam Sedonar, bu hafta yaptığın harcamaların ve gelirlerin özeti aşağıdadır:</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;" />
        
        <div style="margin-bottom: 12px; font-size: 16px;">
          <span>Bu Haftaki Toplam Gelir:</span>
          <strong style="color: #10b981; float: right;">+₺${totalIncome.toFixed(2)}</strong>
        </div>
        
        <div style="margin-bottom: 12px; font-size: 16px;">
          <span>Bu Haftaki Toplam Gider:</span>
          <strong style="color: #ef4444; float: right;">-₺${totalExpense.toFixed(2)}</strong>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;" />
        
        <div style="font-size: 18px; font-weight: bold;">
          <span>Haftalık Durum:</span>
          <span style="color: ${netBalance >= 0 ? '#10b981' : '#ef4444'}; float: right;">
            ₺${netBalance.toFixed(2)}
          </span>
        </div>
        
        <p style="font-size: 11px; color: #64748b; margin-top: 24px; text-align: center;">
          Bu e-posta Sedonar Bütçe Takibi uygulaması tarafından her Pazar otomatik olarak gönderilmektedir.
        </p>
      </div>
    `;

    // Resend ile Mail Gönder
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: MY_EMAIL,
        subject: '📊 Haftalık Bütçe Özetin (Pazar Raporu)',
        html: emailHtml
      })
    });

    const resendResult = await resendRes.json();
    return res.status(200).json({ success: true, resendResult });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
