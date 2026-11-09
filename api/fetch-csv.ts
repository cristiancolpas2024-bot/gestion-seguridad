import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: any, res: any) {
  // Configurar CORS para permitir peticiones desde Vercel y cualquier origen del app
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const targetUrl = (req.query?.url || '') as string;
  if (!targetUrl) {
    res.status(400).send('URL requerida');
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      res.status(response.status).send(`Error Google Sheets: ${response.statusText}`);
      return;
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).send(text);
  } catch (e: any) {
    res.status(500).send(`Error proxy CSV: ${e.message}`);
  }
}
