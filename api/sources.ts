import { DEFAULT_URL_MENSUAL, DEFAULT_URL_CUMPLIMIENTO } from '../src/config/sources';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { urlMensual, urlCumplimiento } = req.body || {};
    res.status(200).json({
      success: true,
      urlMensual: urlMensual || DEFAULT_URL_MENSUAL,
      urlCumplimiento: urlCumplimiento || DEFAULT_URL_CUMPLIMIENTO,
    });
    return;
  }

  res.status(200).json({
    urlMensual: DEFAULT_URL_MENSUAL,
    urlCumplimiento: DEFAULT_URL_CUMPLIMIENTO,
  });
}
