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

const TITLE_BAR_H = 28;

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

// Compute {x, y, w, h} for the browser frame given the available area.
// Sizes the frame so the content area matches the image's aspect ratio,
// then centers it in the available space.
function computeFrameBounds(availX, availY, availW, availH) {
  let frameW, frameH;

  if (state.screenshotImage && availH > TITLE_BAR_H + 10) {
    const img = state.screenshotImage;
    const imgRatio = img.width / img.height;

    // Start by fitting to full available width
    frameW = availW;
    frameH = TITLE_BAR_H + frameW / imgRatio;

    if (frameH > availH) {
      // Constrain by height instead
      frameH = availH;
      frameW = (frameH - TITLE_BAR_H) * imgRatio;
    }

    // Clamp in case floating-point drift pushed it over
    if (frameW > availW) {
      frameW = availW;
      frameH = TITLE_BAR_H + frameW / imgRatio;
    }
  } else {
    frameW = availW;
    frameH = Math.max(50, availH);
  }

  return {
    x: availX + (availW - frameW) / 2,
    y: availY + (availH - frameH) / 2,
    w: frameW,
    h: frameH,
  };
}

function drawBrowserFrame(x, y, w, h) {
  const r = state.cornerRadius;
  const isDark = state.frameTheme === 'dark';

  if (h <= TITLE_BAR_H + 10) return;

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

  ctx.save();
  drawRoundedRect(x, y, w, h, r);
  ctx.clip();

  // Title bar
  ctx.fillStyle = isDark ? '#2a2a2a' : '#ebebeb';
  ctx.fillRect(x, y, w, TITLE_BAR_H);

  // Traffic lights — small dots
  ['#ff5f57', '#ffbd2e', '#28c840'].forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(x + 12 + i * 14, y + TITLE_BAR_H / 2, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // Content area
  const contentY = y + TITLE_BAR_H;
  const contentH = h - TITLE_BAR_H;
  ctx.fillStyle = isDark ? '#1e1e1e' : '#ffffff';
  ctx.fillRect(x, contentY, w, contentH);

  if (state.screenshotImage) {
    // Frame was sized to match image ratio, so draw image to fill exactly
    ctx.drawImage(state.screenshotImage, x, contentY, w, contentH);
  } else {
    ctx.font = "400 16px 'Inter', sans-serif";
    ctx.fillStyle = isDark ? '#555' : '#aaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Capture or upload a screenshot to preview', x + w / 2, contentY + contentH / 2);
  }

  ctx.restore();

  // Thin full border drawn on top of clipped content
  ctx.save();
  drawRoundedRect(x, y, w, h, r);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// Renders the browser-frame layout with title/subtitle group centered in the canvas.
function renderWithFrame() {
  const p = state.padding;
  const sizes = FONT_SIZES[state.textSize];

  const titleH = state.titleText ? sizes.title : 0;
  const subtitleH = state.subtitleText ? sizes.subtitle : 0;
  const aboveFrame = titleH > 0 ? titleH + state.titleGap : 0;
  const belowFrame = subtitleH > 0 ? subtitleH + 12 : 0;

  const availW = canvas.width - 2 * p;
  const availH = canvas.height - 2 * p - aboveFrame - belowFrame;

  const frame = computeFrameBounds(p, p + aboveFrame, availW, availH);

  // Center the entire group (title + frame + subtitle) vertically within padding
  const groupH = aboveFrame + frame.h + belowFrame;
  const groupOffsetY = Math.max(0, (canvas.height - 2 * p - groupH) / 2);

  const frameX = frame.x;
  const frameY = p + groupOffsetY + aboveFrame;

  if (state.titleText) {
    ctx.font = `700 ${sizes.title}px 'Inter', sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(state.titleText, canvas.width / 2, p + groupOffsetY);
  }

  drawBrowserFrame(frameX, frameY, frame.w, frame.h);

  if (state.subtitleText) {
    ctx.font = `400 ${sizes.subtitle}px 'Inter', sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(state.subtitleText, canvas.width / 2, frameY + frame.h + 12);
  }
}

// Renders frameless screenshot with title/subtitle group centered in the canvas.
function drawScreenshotOnly() {
  const p = state.padding;
  const sizes = FONT_SIZES[state.textSize];

  const titleH = state.titleText ? sizes.title : 0;
  const subtitleH = state.subtitleText ? sizes.subtitle : 0;
  const aboveImg = titleH > 0 ? titleH + state.titleGap : 0;
  const belowImg = subtitleH > 0 ? subtitleH + 12 : 0;

  const availW = canvas.width - 2 * p;
  const availH = canvas.height - 2 * p - aboveImg - belowImg;

  if (!state.screenshotImage) {
    ctx.font = "400 16px 'Inter', sans-serif";
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Capture or upload a screenshot to preview', canvas.width / 2, canvas.height / 2);
    return;
  }

  const img = state.screenshotImage;
  const imgRatio = img.width / img.height;
  const areaRatio = availW / availH;

  let drawW, drawH;
  if (imgRatio > areaRatio) {
    drawW = availW;
    drawH = drawW / imgRatio;
  } else {
    drawH = availH;
    drawW = drawH * imgRatio;
  }

  const groupH = aboveImg + drawH + belowImg;
  const groupOffsetY = Math.max(0, (canvas.height - 2 * p - groupH) / 2);
  const drawX = p + (availW - drawW) / 2;
  const drawY = p + groupOffsetY + aboveImg;

  if (state.titleText) {
    ctx.font = `700 ${sizes.title}px 'Inter', sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(state.titleText, canvas.width / 2, p + groupOffsetY);
  }

  if (state.shadowEnabled) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    drawRoundedRect(drawX, drawY, drawW, drawH, state.cornerRadius);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  drawRoundedRect(drawX, drawY, drawW, drawH, state.cornerRadius);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();

  if (state.subtitleText) {
    ctx.font = `400 ${sizes.subtitle}px 'Inter', sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(state.subtitleText, canvas.width / 2, drawY + drawH + 12);
  }
}

// --- Main Render ---

function render() {
  canvas.width = state.canvasWidth;
  canvas.height = state.canvasHeight;
  drawBackground();
  if (state.frameEnabled) {
    renderWithFrame();
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
