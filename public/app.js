// State
const state = {
  screenshotImage: null,
  screenshotURL: '',
  canvasWidth: 1200,
  canvasHeight: 675,
  bgColor1: '#667eea',
  bgColor2: '#764ba2',
  bgMode: 'gradient',
  frameEnabled: true,
  frameTheme: 'dark',
  titleText: '',
  subtitleText: '',
  textColor: '#ffffff',
  textSize: 'M',
  padding: 60,
  cornerRadius: 12,
  shadowEnabled: true,
  titleGap: 8,
};

// Constants
const GRADIENT_PRESETS = [
  { name: 'Purple Haze', color1: '#667eea', color2: '#764ba2' },
  { name: 'Sunset Burn', color1: '#f093fb', color2: '#f5576c' },
  { name: 'Ocean Breeze', color1: '#4facfe', color2: '#00f2fe' },
  { name: 'Warm Flame', color1: '#ff9a9e', color2: '#fad0c4' },
  { name: 'Night Fade', color1: '#a18cd1', color2: '#fbc2eb' },
  { name: 'Teal Dream', color1: '#0fd850', color2: '#f9f047' },
  { name: 'Peach Glow', color1: '#ffecd2', color2: '#fcb69f' },
  { name: 'Deep Space', color1: '#6a11cb', color2: '#2575fc' },
];

const FONT_SIZES = {
  S: { title: 28, subtitle: 18 },
  M: { title: 36, subtitle: 22 },
  L: { title: 48, subtitle: 28 },
};

// Canvas & Context
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');

// --- Drawing Functions ---

function drawBackground() {
  if (state.bgMode === 'solid') {
    ctx.fillStyle = state.bgColor1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, state.bgColor1);
    gradient.addColorStop(1, state.bgColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(text, maxWidth) {
  let width = ctx.measureText(text).width;
  if (width <= maxWidth) return text;
  while (width > maxWidth && text.length > 0) {
    text = text.slice(0, -1);
    width = ctx.measureText(text + '...').width;
  }
  return text + '...';
}

function drawTitle() {
  if (!state.titleText) return state.padding;
  const fontSize = FONT_SIZES[state.textSize].title;
  ctx.font = `700 ${fontSize}px 'Inter', sans-serif`;
  ctx.fillStyle = state.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const y = state.padding;
  ctx.fillText(state.titleText, canvas.width / 2, y);
  return y + fontSize + 16;
}

function drawBrowserFrame(startY) {
  const p = state.padding;
  const titleBarH = 40;
  const subtitleReserve = state.subtitleText ? FONT_SIZES[state.textSize].subtitle + 32 : 16;
  const x = p;
  const y = startY;
  const w = canvas.width - 2 * p;
  const h = canvas.height - y - subtitleReserve;
  const r = state.cornerRadius;

  if (h <= titleBarH + 10) return y + h;

  // Drop shadow
  if (state.shadowEnabled) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    drawRoundedRect(x, y, w, h, r);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fill();
    ctx.restore();
  }

  // Clip to rounded rect
  ctx.save();
  drawRoundedRect(x, y, w, h, r);
  ctx.clip();

  // Title bar
  const isDark = state.frameTheme === 'dark';
  ctx.fillStyle = isDark ? '#2d2d2d' : '#e8e8e8';
  ctx.fillRect(x, y, w, titleBarH);
  // Bottom border
  ctx.fillStyle = isDark ? '#3a3a3a' : '#d0d0d0';
  ctx.fillRect(x, y + titleBarH - 1, w, 1);

  // Traffic lights
  const lights = ['#ff5f57', '#ffbd2e', '#28c840'];
  lights.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(x + 16 + i * 20, y + titleBarH / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // Address bar
  const barMaxW = Math.min(360, w * 0.45);
  const barH = 24;
  const barX = x + w / 2 - barMaxW / 2;
  const barY = y + titleBarH / 2 - barH / 2;
  ctx.fillStyle = isDark ? '#1a1a1a' : '#ffffff';
  drawRoundedRect(barX, barY, barMaxW, barH, barH / 2);
  ctx.fill();

  // URL text in address bar
  if (state.screenshotURL) {
    ctx.font = "400 11px 'Inter', sans-serif";
    ctx.fillStyle = isDark ? '#888' : '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const urlText = truncateText(state.screenshotURL, barMaxW - 20);
    ctx.fillText(urlText, x + w / 2, y + titleBarH / 2);
  }

  // Content area
  const contentY = y + titleBarH;
  const contentH = h - titleBarH;
  ctx.fillStyle = isDark ? '#1e1e1e' : '#ffffff';
  ctx.fillRect(x, contentY, w, contentH);

  // Screenshot or placeholder
  if (state.screenshotImage) {
    const img = state.screenshotImage;
    const imgRatio = img.width / img.height;
    const areaRatio = w / contentH;
    let drawW, drawH, drawX, drawY;
    if (imgRatio > areaRatio) {
      // Image is wider than area — fit to width, align top
      drawW = w;
      drawH = drawW / imgRatio;
      drawX = x;
      drawY = contentY;
    } else {
      // Image is taller than area — fit to height, center horizontally
      drawH = contentH;
      drawW = drawH * imgRatio;
      drawX = x + (w - drawW) / 2;
      drawY = contentY;
    }
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    ctx.font = "400 16px 'Inter', sans-serif";
    ctx.fillStyle = isDark ? '#555' : '#aaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Capture or upload a screenshot to preview', x + w / 2, contentY + contentH / 2);
  }

  ctx.restore();

  return y + h;
}

function drawSubtitle(frameBottom) {
  if (!state.subtitleText) return;
  const fontSize = FONT_SIZES[state.textSize].subtitle;
  ctx.font = `400 ${fontSize}px 'Inter', sans-serif`;
  ctx.fillStyle = state.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(state.subtitleText, canvas.width / 2, frameBottom + 12);
}

// --- Main Render ---

function drawScreenshotOnly() {
  const p = state.padding;
  const x = p;
  const w = canvas.width - 2 * p;
  const h = canvas.height - 2 * p;
  const r = state.cornerRadius;

  if (h <= 10) return p + h;

  if (state.screenshotImage) {
    const img = state.screenshotImage;
    const imgRatio = img.width / img.height;
    const areaRatio = w / h;
    let drawW, drawH;
    if (imgRatio > areaRatio) {
      drawW = w;
      drawH = drawW / imgRatio;
    } else {
      drawH = h;
      drawW = drawH * imgRatio;
    }
    const drawX = x + (w - drawW) / 2;
    const drawY = p + (h - drawH) / 2;

    // Draw title just above the image
    if (state.titleText) {
      const fontSize = FONT_SIZES[state.textSize].title;
      ctx.font = `700 ${fontSize}px 'Inter', sans-serif`;
      ctx.fillStyle = state.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(state.titleText, canvas.width / 2, drawY - state.titleGap);
    }

    if (state.shadowEnabled) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 12;
      drawRoundedRect(drawX, drawY, drawW, drawH, r);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    drawRoundedRect(drawX, drawY, drawW, drawH, r);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Draw subtitle just below the image
    if (state.subtitleText) {
      const fontSize = FONT_SIZES[state.textSize].subtitle;
      ctx.font = `400 ${fontSize}px 'Inter', sans-serif`;
      ctx.fillStyle = state.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(state.subtitleText, canvas.width / 2, drawY + drawH + 12);
    }

    return drawY + drawH;
  } else {
    ctx.font = "400 16px 'Inter', sans-serif";
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Capture or upload a screenshot to preview', x + w / 2, p + h / 2);
    return p + h;
  }
}

function render() {
  canvas.width = state.canvasWidth;
  canvas.height = state.canvasHeight;
  drawBackground();
  if (state.frameEnabled) {
    const titleBottom = drawTitle();
    const frameBottom = drawBrowserFrame(titleBottom);
    drawSubtitle(frameBottom);
  } else {
    drawScreenshotOnly();
  }
}

// --- API Integration ---

async function captureScreenshot() {
  const urlInput = document.getElementById('url-input');
  const captureBtn = document.getElementById('capture-btn');
  const statusText = document.getElementById('status-text');
  const url = urlInput.value.trim();

  if (!url) {
    statusText.textContent = 'Please enter a URL';
    statusText.className = 'status-text error';
    return;
  }

  captureBtn.disabled = true;
  captureBtn.textContent = 'Capturing...';
  statusText.textContent = 'Taking screenshot...';
  statusText.className = 'status-text';

  try {
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, width: 1280, height: 800 }),
    });
    const data = await res.json();

    if (data.success) {
      const img = new Image();
      img.onload = () => {
        state.screenshotImage = img;
        state.screenshotURL = url;
        render();
        statusText.textContent = 'Screenshot captured!';
        statusText.className = 'status-text success';
      };
      img.src = 'data:image/png;base64,' + data.image;
    } else {
      statusText.textContent = data.error || 'Capture failed';
      statusText.className = 'status-text error';
    }
  } catch (err) {
    statusText.textContent = 'Network error: ' + err.message;
    statusText.className = 'status-text error';
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = 'Capture Screenshot';
  }
}

function handleUpload(file) {
  const statusText = document.getElementById('status-text');

  if (!file || !file.type.startsWith('image/')) {
    statusText.textContent = 'Please select an image file';
    statusText.className = 'status-text error';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.screenshotImage = img;
      state.screenshotURL = file.name;
      render();
      statusText.textContent = 'Image loaded!';
      statusText.className = 'status-text success';
    };
    img.onerror = () => {
      statusText.textContent = 'Failed to load image';
      statusText.className = 'status-text error';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'social-share.png';
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Controls & Events ---

function initGradientSwatches() {
  const container = document.getElementById('gradient-swatches');
  GRADIENT_PRESETS.forEach((preset, i) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch' + (i === 0 ? ' active' : '');
    swatch.style.background = `linear-gradient(135deg, ${preset.color1}, ${preset.color2})`;
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      state.bgColor1 = preset.color1;
      state.bgColor2 = preset.color2;
      document.getElementById('bg-color1').value = preset.color1;
      document.getElementById('bg-color2').value = preset.color2;
      render();
    });
    container.appendChild(swatch);
  });
}

function bindControls() {
  // Capture
  document.getElementById('capture-btn').addEventListener('click', captureScreenshot);

  // Upload
  const uploadInput = document.getElementById('upload-input');
  document.getElementById('upload-btn').addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleUpload(e.target.files[0]);
    e.target.value = '';
  });

  // Size presets
  const presetBtns = document.querySelectorAll('.preset-buttons button');
  const customInputs = document.getElementById('custom-size-inputs');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset.width) {
        state.canvasWidth = parseInt(btn.dataset.width);
        state.canvasHeight = parseInt(btn.dataset.height);
        customInputs.classList.add('hidden');
      } else {
        customInputs.classList.remove('hidden');
      }
      render();
    });
  });
  // Set first preset active
  presetBtns[0].classList.add('active');

  // Custom size inputs
  document.getElementById('custom-width').addEventListener('input', (e) => {
    state.canvasWidth = parseInt(e.target.value) || 1200;
    render();
  });
  document.getElementById('custom-height').addEventListener('input', (e) => {
    state.canvasHeight = parseInt(e.target.value) || 675;
    render();
  });

  // Background colors
  document.getElementById('bg-color1').addEventListener('input', (e) => {
    state.bgColor1 = e.target.value;
    document.querySelectorAll('.gradient-swatches .swatch').forEach(s => s.classList.remove('active'));
    render();
  });
  document.getElementById('bg-color2').addEventListener('input', (e) => {
    state.bgColor2 = e.target.value;
    document.querySelectorAll('.gradient-swatches .swatch').forEach(s => s.classList.remove('active'));
    render();
  });

  // Background mode
  document.getElementById('bg-mode').addEventListener('change', (e) => {
    state.bgMode = e.target.value;
    render();
  });

  // Frame toggle
  const frameToggle = document.getElementById('frame-toggle');
  const frameThemeSelect = document.getElementById('frame-theme');
  frameToggle.addEventListener('change', (e) => {
    state.frameEnabled = e.target.checked;
    frameThemeSelect.disabled = !e.target.checked;
    render();
  });

  // Frame theme
  frameThemeSelect.addEventListener('change', (e) => {
    state.frameTheme = e.target.value;
    render();
  });

  // Text inputs
  document.getElementById('title-input').addEventListener('input', (e) => {
    state.titleText = e.target.value;
    render();
  });
  document.getElementById('subtitle-input').addEventListener('input', (e) => {
    state.subtitleText = e.target.value;
    render();
  });

  // Text color
  document.getElementById('text-color').addEventListener('input', (e) => {
    state.textColor = e.target.value;
    render();
  });

  // Size toggles
  const sizeToggles = document.querySelectorAll('.size-toggles button');
  sizeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeToggles.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.textSize = btn.dataset.size;
      render();
    });
  });

  // Padding slider
  const paddingSlider = document.getElementById('padding-slider');
  const paddingValue = document.getElementById('padding-value');
  paddingSlider.addEventListener('input', (e) => {
    state.padding = parseInt(e.target.value);
    paddingValue.textContent = e.target.value;
    render();
  });

  // Radius slider
  const radiusSlider = document.getElementById('radius-slider');
  const radiusValue = document.getElementById('radius-value');
  radiusSlider.addEventListener('input', (e) => {
    state.cornerRadius = parseInt(e.target.value);
    radiusValue.textContent = e.target.value;
    render();
  });

  // Title gap slider
  const titleGapSlider = document.getElementById('title-gap-slider');
  const titleGapValue = document.getElementById('title-gap-value');
  titleGapSlider.addEventListener('input', (e) => {
    state.titleGap = parseInt(e.target.value);
    titleGapValue.textContent = e.target.value;
    render();
  });

  // Shadow toggle
  document.getElementById('shadow-toggle').addEventListener('change', (e) => {
    state.shadowEnabled = e.target.checked;
    render();
  });

  // Download
  document.getElementById('download-btn').addEventListener('click', downloadImage);
}

// --- Init ---

function init() {
  initGradientSwatches();
  bindControls();
  render();
}

document.addEventListener('DOMContentLoaded', init);
