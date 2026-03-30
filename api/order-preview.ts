import type { VercelRequest, VercelResponse } from '@vercel/node';

// Parses a single Firestore REST value into a JS primitive
function parseValue(val: Record<string, unknown>): unknown {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('mapValue' in val) {
    const map = val.mapValue as { fields?: Record<string, Record<string, unknown>> };
    if (!map.fields) return {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(map.fields)) {
      out[k] = parseValue(v);
    }
    return out;
  }
  if ('arrayValue' in val) {
    const arr = val.arrayValue as { values?: Record<string, unknown>[] };
    return (arr.values ?? []).map(parseValue);
  }
  return null;
}

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  const host = `https://${req.headers.host}`;
  const spaUrl = `${host}?orderId=${encodeURIComponent(orderId)}`;
  const ogImage = `${host}/og-image.png`;

  if (!orderId) {
    res.redirect(302, '/');
    return;
  }

  let title = 'Ayala Cakes — הזמנה שלך';
  let description = 'לחץ לצפייה בפרטי ההזמנה';

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders/${orderId}`;
    const resp = await fetch(url);

    if (resp.ok) {
      const doc = await resp.json() as { fields?: Record<string, Record<string, unknown>> };

      if (doc.fields) {
        const customer = parseValue(doc.fields.customer) as { name?: string } | null;
        const totalPrice = doc.fields.totalPrice ? parseValue(doc.fields.totalPrice) : null;
        const eventDate = doc.fields.eventDate ? String(parseValue(doc.fields.eventDate)) : null;

        const name = customer?.name ?? '';
        const date = eventDate
          ? new Date(eventDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
          : '';

        title = `הזמנה #${orderId} — Ayala Cakes`;
        description = [name, date, totalPrice ? `₪${totalPrice}` : ''].filter(Boolean).join(' | ');
      }
    }
  } catch {
    // Firestore fetch failed — fall back to generic title/description
  }

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${escape(title)}</title>
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:image" content="${escape(ogImage)}" />
  <meta property="og:url" content="${escape(spaUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Ayala Cakes" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0;url=${escape(spaUrl)}" />
</head>
<body>
  <script>window.location.replace(${JSON.stringify(spaUrl)});</script>
  <p>מעביר אותך לפרטי ההזמנה...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
}
