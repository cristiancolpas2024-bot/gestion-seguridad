import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ruta del archivo de configuración fija en código
  const sourcesConfigPath = path.resolve(__dirname, 'src/config/sources.ts');

  // API para consultar los enlaces actualmente fijos
  app.get('/api/sources', (_req, res) => {
    try {
      if (fs.existsSync(sourcesConfigPath)) {
        const content = fs.readFileSync(sourcesConfigPath, 'utf-8');
        const m1 = content.match(/export const DEFAULT_URL_MENSUAL = (['"`])(.*)\1;/);
        const m2 = content.match(/export const DEFAULT_URL_CUMPLIMIENTO = (['"`])(.*)\1;/);
        res.json({
          urlMensual: m1 ? m1[2] : '',
          urlCumplimiento: m2 ? m2[2] : '',
        });
        return;
      }
    } catch (e) {
      console.error('Error reading sources config:', e);
    }
    res.json({ urlMensual: '', urlCumplimiento: '' });
  });

  // API para fijar permanentemente los enlaces en el código fuente (src/config/sources.ts)
  app.post('/api/sources', (req, res) => {
    try {
      const { urlMensual = '', urlCumplimiento = '' } = req.body;
      const cleanM = (urlMensual || '').trim();
      const cleanC = (urlCumplimiento || '').trim();

      const newContent = `/**
 * FUENTES POR DEFECTO PARA EL DASHBOARD DE ACIS (Google Sheets)
 * 
 * Regla: Se leen automáticamente al cargar la app (al montar)
 * sin que el usuario tenga que pegar el enlace cada vez.
 * Respeta el gid y single=true.
 */

// Pestaña "Mensual" (FUENTE 1):
export const DEFAULT_URL_MENSUAL = ${JSON.stringify(cleanM)};

// Pestaña "Cumplimiento" (FUENTE 2):
export const DEFAULT_URL_CUMPLIMIENTO = ${JSON.stringify(cleanC)};
`;

      fs.writeFileSync(sourcesConfigPath, newContent, 'utf-8');
      console.log(`[Config] Enlaces de Google Sheets fijados en el código:`);
      console.log(`  - Mensual: ${cleanM}`);
      console.log(`  - Cumplimiento: ${cleanC}`);

      res.json({
        success: true,
        message: 'Enlaces fijados permanentemente en el código',
        urlMensual: cleanM,
        urlCumplimiento: cleanC,
      });
    } catch (e: any) {
      console.error('Error saving sources config:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Proxy seguro para descargar CSVs evitando problemas de CORS en Google Sheets
  app.get('/api/fetch-csv', async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        res.status(400).send('URL requerida');
        return;
      }
      const response = await fetch(targetUrl, {
        headers: {
          'Accept': 'text/csv, text/plain, */*',
        },
      });
      if (!response.ok) {
        res.status(response.status).send(`Error Google Sheets: ${response.statusText}`);
        return;
      }
      const text = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(text);
    } catch (e: any) {
      res.status(500).send(`Error proxy CSV: ${e.message}`);
    }
  });

  // Integración con Vite para desarrollo full-stack
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
