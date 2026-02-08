const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/screenshot', async (req, res) => {
  const { url, width = 1280, height = 800 } = req.body;

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL. Must start with http:// or https://'
    });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // Allow extra time for rendering after load
    await new Promise(r => setTimeout(r, 1500));

    const screenshot = await page.screenshot({ encoding: 'base64' });

    res.json({
      success: true,
      image: screenshot,
      width,
      height
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    process.exit(1);
  } else {
    throw err;
  }
});
