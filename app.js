// ====== УТИЛИТЫ/DOM ===========================================================
const $ = (sel, root = document) => root.querySelector(sel);

const listView = $('#listView');
const detailView = $('#detailView');
const cardsRoot = $('#cards');
const detailImg = $('#detailImg');
const detailTitle = $('#detailTitle');
const detailShort = $('#detailShort');
const detailBullets = $('#detailBullets');
const detailLong = $('#detailLong');
const usernameSlot = $('#usernameSlot');
const backBtn = $('#backBtn');         
const consultBtn = $('#consultBtn');
const buyBtn = $('#buyBtn');
const cartBtn = $('#cartBtn');
const cartCount = $('#cartCount');
const toastEl = $('#toast');
const consultModal = $('#consultModal');
const themeModeSelect = $('#themeMode');
const consultForm = $('#consultForm');
const consultCancel = $('#consultCancel');
const consultProductTitle = $('#consultProductTitle');
const cName = $('#cName');
const cContact = $('#cContact');
const cMsg = $('#cMsg');
const tg = window.Telegram?.WebApp;
const inTelegram = Boolean(tg && typeof tg.initData !== 'undefined');
const requestModal = $('#requestModal');
const requestForm = $('#requestForm');
const requestCancel = $('#requestCancel');
const requestProductTitle = $('#requestProductTitle');
const rPhone = $('#rPhone');
const rName = $('#rName');
const rUseUsername = $('#rUseUsername');
const rUsernamePreview = $('#rUsernamePreview');
const rCity = $('#rCity');
const rComment = $('#rComment');
const consultBtnMain = $('#consultBtnMain');

let requestContext = null;

function closeRequest(){
  requestModal?.classList.add('hidden');
  requestContext = null;
}

function modalShow(el){
  el.classList.remove('hidden');
  requestAnimationFrame(()=> el.classList.add('show'));
}
function modalHide(el){
  el.classList.remove('show');
  setTimeout(()=> el.classList.add('hidden'), 200);
}

function openRequest(product){
  requestContext = product || null;

  if (requestProductTitle) {
    requestProductTitle.textContent = product ? product.title : '';
  }

  const tUser = tg?.initDataUnsafe?.user;
  if (tUser && rName && !rName.value.trim()) {
    rName.value = [tUser.first_name, tUser.last_name].filter(Boolean).join(' ');
  }

  if (rPhone) rPhone.value = '';
  if (rCity && !rCity.value) rCity.value = 'Санкт-Петербург';
  if (rComment) rComment.value = '';

  if (requestModal) modalShow(requestModal);
}

requestCancel.addEventListener('click', closeRequest);

requestModal.addEventListener('click', (e)=>{
  if (e.target === requestModal) closeRequest();
});

requestForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name  = rName?.value?.trim()  || '';
  const phone = rPhone?.value?.trim() || '';
  const city  = (window.rCity?.value || '').trim();
  const comment = (window.rComment?.value || '').trim();
  const okName  = name.length >= 2;
  const okPhone = /^[+0-9()\-\s]{6,}$/.test(phone);
  if (!okName || !okPhone) { toast('Заполните имя и корректный телефон'); return; }

  const serviceTitle = requestContext ? requestContext.title : 'Заявка';

  const payload = {
    type: 'lead',
    action: 'send_request_form',
    ts: Date.now(),
    service: serviceTitle,
    name,
    phone,
    city,
    comment,
    include_username: Boolean(tg?.initDataUnsafe?.user?.username),
    username: tg?.initDataUnsafe?.user?.username || null,
    from: tg?.initDataUnsafe?.user || null
  };

  try {
    sendToBot(payload);
    tg?.HapticFeedback?.notificationOccurred?.('success');
    toast('Заявка отправлена');
    closeRequest();
  } catch (err) {
    console.error('[Request Form] sendData error:', err);
    tg?.HapticFeedback?.notificationOccurred?.('error');
    tg?.showAlert?.('Не удалось отправить заявку');
  }

});

if (inTelegram) {
  tg.ready();
  tg.expand();
  if (tg?.BackButton?.onClick) {
    tg.BackButton.onClick(() => { if (location.hash.startsWith('#/product/')) location.hash = '#/'; })};
  tg.onEvent('themeChanged', applyThemeFromTelegram);
  const username = tg.initDataUnsafe?.user?.username;
  if (username) usernameSlot.textContent = `@${username}`;
  backBtn.addEventListener('click', () => { if (location.hash.startsWith('#/product/')) location.hash = '#/'; });
} else {
  usernameSlot.textContent = 'Откройте через Telegram для полного функционала';
}

async function sendToBot(payload) {
  const API = window.__API_URL;
  try {
    console.log('[sendToBot] payload:', payload);

    if (!API) throw new Error('API_URL не задан');

    const res = await fetch(`${API}/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({ ok: false, error: 'empty' }));

    console.log('[sendToBot] response:', data);

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    tg?.HapticFeedback?.notificationOccurred?.('success');
    toast('Заявка отправлена');
  } catch (err) {
    console.error('[sendToBot] error:', err);
    tg?.HapticFeedback?.notificationOccurred?.('error');
    toast('Ошибка отправки: ' + (err.message || 'неизвестно'));
  }
}

function applyThemeFromTelegram() {
  if (!inTelegram) return;

  const tp = tg.themeParams || {};
  const root = document.documentElement;
  const set = (v, val, fb) => root.style.setProperty(v, val || fb);

  set('--bg', tp.bg_color, '#0e1117');
  set('--text', tp.text_color, '#e6edf3');
  set('--hint', tp.hint_color, '#8b949e');
  set('--link', tp.link_color, '#4495ff');
  set('--btn', tp.button_color, '#2ea043');
  set('--btn-text', tp.button_text_color, '#ffffff');
  set('--card', tp.secondary_bg_color, '#161b22');
  set('--sep', tp.section_separator_color, 'rgba(255,255,255,.08)');

  updateImagesByMode('auto');
}
applyThemeFromTelegram();

// ---------------- THEME / COLOR FROM IMAGE ----------------------------------
function getStoredThemeMode(){
  if (inTelegram) return 'auto';
  try{ return localStorage.getItem('themeMode') || 'auto'; }catch(e){ return 'auto'; }
}
function saveStoredThemeMode(m){
  if (inTelegram) return;
  try{ localStorage.setItem('themeMode', m); }catch(e){}
}


function rgbToCss(r,g,b){ return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`; }

function luminance(r,g,b){ return 0.2126*r + 0.7152*g + 0.0722*b; }

function clamp(v, a=0, b=255){ return Math.max(a, Math.min(b, v)); }

function mixColor(r,g,b, factor){ 
  return { r: clamp(r*factor), g: clamp(g*factor), b: clamp(b*factor) };
}

// --- IMAGES: light/dark variants --------------------------------------------
const DARK_SUFFIX = '-gold';
const NO_IMAGE_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
     <rect width="100%" height="100%" fill="#161b22"/>
     <text x="50%" y="50%" fill="#8b949e" dy=".3em" font-family="Arial" font-size="20" text-anchor="middle">
       Нет изображения
     </text>
   </svg>`
);

function splitExt(path){
  const m = String(path || '').match(/^(.*)\.([a-z0-9]+)$/i);
  if (!m) return { base: path, ext: '' };
  return { base: m[1], ext: m[2].toLowerCase() };
}

function uniq(arr){
  const s = new Set();
  const out = [];
  for (const x of arr) if (x && !s.has(x)) { s.add(x); out.push(x); }
  return out;
}

function buildImageCandidates(orig, isDark){
  const { base, ext } = splitExt(orig);
  const c = [];

  if (isDark) {
    if (ext) c.push(`${base}${DARK_SUFFIX}.${ext}`);
    c.push(`${base}${DARK_SUFFIX}.jpg`, `${base}${DARK_SUFFIX}.jpeg`, `${base}${DARK_SUFFIX}.png`);
  }
  c.push(orig);

  if (ext === 'png') c.push(`${base}.jpg`, `${base}.jpeg`);
  if (ext === 'jpg' || ext === 'jpeg') c.push(`${base}.png`);

  return uniq(c);
}

function setImgWithFallback(imgEl, candidates){
  let i = 0;
  imgEl.onerror = () => {
    i++;
    if (i < candidates.length) {
      imgEl.src = candidates[i];
    } else {
      imgEl.onerror = null;
      imgEl.src = NO_IMAGE_SVG;
    }
  };
  imgEl.src = candidates[i];
}

function parseCssColor(str){
  if (!str) return null;
  str = str.trim();
  if (str.startsWith('rgb')){
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(p=>parseFloat(p));
    return { r: parts[0], g: parts[1], b: parts[2] };
  }
  if (str.startsWith('#')){
    const hex = str.slice(1);
    if (hex.length===3){
      const r = parseInt(hex[0]+hex[0],16);
      const g = parseInt(hex[1]+hex[1],16);
      const b = parseInt(hex[2]+hex[2],16);
      return {r,g,b};
    }
    if (hex.length===6){
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      return {r,g,b};
    }
  }
  return null;
}

function detectDarkFromCss(){
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '';
  const col = parseCssColor(bg) || {r:14,g:17,b:23};
  return luminance(col.r,col.g,col.b) < 140;
}

function updateImagesByMode(mode){
  const isDark = (mode === 'dark') || (mode === 'auto' && detectDarkFromCss());

  const imgs = cardsRoot.querySelectorAll('img');
  imgs.forEach(img => {
    const orig = img.dataset.original || img.getAttribute('data-original') || img.src;
    img.dataset.original = orig;
    setImgWithFallback(img, buildImageCandidates(orig, isDark));
  });

  if (!detailView.classList.contains('hidden') && detailImg){
    const orig = detailImg.dataset.original || detailImg.src;
    detailImg.dataset.original = orig;
    setImgWithFallback(detailImg, buildImageCandidates(orig, isDark));
  }
}

async function extractAverageColor(imgEl){
  return new Promise((resolve)=>{
    try{
      const img = imgEl;
      const canvas = document.createElement('canvas');
      const w = 64, h = 64;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0,0,w,h).data;
      let r=0,g=0,b=0,c=0;
      const step = 4*4; // sample every 4th pixel
      for (let i=0;i<data.length;i+=step){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; c++; }
      if (c===0) return resolve({r:16,g:20,b:28});
      resolve({ r: r/c, g: g/c, b: b/c });
    }catch(err){ resolve({r:16,g:20,b:28}); }
  });
}

function applyColorsFromPhoto(rgb){
  const root = document.documentElement;
  const {r,g,b} = rgb;
  const primary = rgbToCss(r,g,b);
  // decide bg/text by luminance
  const lum = luminance(r,g,b);
  const isDark = lum < 140;
  // background slightly adjusted
  const bg = isDark ? 'rgb(10,12,16)' : 'rgb(250,250,250)';
  const text = isDark ? 'rgb(230,235,240)' : 'rgb(18,20,22)';
  // card color - mix primary with bg
  const cardMix = mixColor(r,g,b, isDark ? 0.35 : 0.9);
  const card = rgbToCss(cardMix.r, cardMix.g, cardMix.b);

  root.style.setProperty('--btn', primary);
  root.style.setProperty('--link', primary);
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--text', text);
  root.style.setProperty('--card', card);
  root.style.setProperty('--sep', isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)');
}

async function applyThemeMode(mode){
  if (!mode) mode = getStoredThemeMode();
  if (themeModeSelect) themeModeSelect.value = mode;
  saveStoredThemeMode(mode);
  if (mode === 'light'){
    document.documentElement.style.setProperty('--bg', '#ffffff');
    document.documentElement.style.setProperty('--text', '#0b1220');
    document.documentElement.style.setProperty('--card', '#f6f7f8');
    document.documentElement.style.setProperty('--btn', '#0b84ff');
    document.documentElement.style.setProperty('--link', '#0b84ff');
    updateImagesByMode(mode);
    return;
  }
  if (mode === 'dark'){
    document.documentElement.style.setProperty('--bg', '#0e1117');
    document.documentElement.style.setProperty('--text', '#e6edf3');
    document.documentElement.style.setProperty('--card', '#161b22');
    document.documentElement.style.setProperty('--btn', '#2ea043');
    document.documentElement.style.setProperty('--link', '#4495ff');
    updateImagesByMode(mode);
    return;
  }
  applyThemeFromTelegram();
  updateImagesByMode(mode);
}

if (themeModeSelect && !inTelegram) {
  themeModeSelect.addEventListener('change', (e)=>{ applyThemeMode(e.target.value); });
} else if (themeModeSelect && inTelegram) {
  themeModeSelect.value = 'auto';
  themeModeSelect.disabled = true;
  themeModeSelect.parentElement?.classList.add('hidden'); 
}

detailImg.addEventListener('load', async ()=>{
  if (inTelegram) return;

  try{
    const mode = getStoredThemeMode();
    if (mode !== 'auto') return;
    const rgb = await extractAverageColor(detailImg);
    applyColorsFromPhoto(rgb);
  }catch(err){ console.warn('color extract error', err); }
});

applyThemeMode(getStoredThemeMode());

// ============== СОСТОЯНИЕ КОРЗИНЫ/ЗАЯВКИ ===================
let CART = loadCart();
function loadCart(){ try{ return JSON.parse(sessionStorage.getItem('cart') || '{"items":[]}'); }catch(e){ return {items:[]}; } }
function saveCart(){ sessionStorage.setItem('cart', JSON.stringify(CART)); }
function inCart(id){ return CART.items.some(x => x.id === id); }

// ============ ДАННЫЕ ТОВАРОВ ================
const PRODUCTS = [
  { id:'tma', title:'Telegram Mini App (ТМА)', img:'./assets/cards/tma.png',
    short:'Ваш сайт прямо в Telegram',
    long:[
      'Идеально для витрин, форм заявок и мини-сервисов внутри Telegram.',
      'Поддержка MainButton/BackButton, themeParams, sendData для связи с ботом.',
      'Быстрый деплой на любой статический хостинг и готовность к модерации.'
    ],
    bullets:[
      'Поддержка Telegram.WebApp API (MainButton, BackButton, theme)',
      'Готовая структура для каталога/форм/оплаты',
      'Быстрый деплой на любой статический хостинг'
    ]},
  { id:'tg-bot', title:'TG-бот (классический бот)', img:'./assets/cards/tg-bot.png',
    short:'Продажи и поддержка без лишних движений',
    long:[
      'Подходит для рассылок, обработки заявок, FAQ и интеграций.',
      'Варианты подключения: webhook или long polling.',
      'Готовые сценарии для быстрых запусков.'
    ],
    bullets:[
      'Inline-кнопки, меню, webhooks/long-polling',
      'Интеграции (CRM, таблицы, платежи)',
      'Готовые шаблоны сценариев'
    ]},
  { id:'tma-chatbot',title:'ТМА с чат-ботом', img:'./assets/cards/tma-chatbot.png',
    short:'Ассистент который продаёт за вас',
    long:[
      'Показывайте товары/услуги во фронте ТМА и отвечайте на вопросы диалогом в чате.',
      'Сбор лидов через sendData, аналитика источников, масштабирование сценариев.',
      'Удобно для продаж и поддержки внутри одного UX.'
    ],
    bullets:[
      'UI на WebApp + диалог в чате',
      'Отправка заявок из ТМА в бота',
      'Готово к масштабированию'
    ]},
];

// ============= UI ВСПОМОГАТЕЛЬНЫЕ ===============
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.style.opacity = '1';
  setTimeout(()=>{ toastEl.style.opacity='0'; setTimeout(()=>toastEl.classList.add('hidden'),200); },1600);
}

function updateCartUI(){
  const n = CART.items.length;
  cartCount.textContent = n;
  if (n>0) {
    cartBtn.classList.remove('hidden');
  } else {
    cartBtn.classList.add('hidden');
  }
}

// ============ КАРТОЧКИ =================
function renderCards() {
  cardsRoot.innerHTML = '';
  PRODUCTS.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card rounded-xl overflow-hidden transition hover:scale-[1.01] card-appear';
    card.style.setProperty('--delay', `${i * 60}ms`);

    const link = document.createElement('a');
    link.href = `#/product/${p.id}`;
    link.setAttribute('aria-label', `Подробнее: ${p.title}`);
    link.className = 'block';

    const img = document.createElement('img');
    img.dataset.original = p.img;

    const mode = getStoredThemeMode();
    const isDark = (mode === 'dark') || (mode === 'auto' && detectDarkFromCss());

    setImgWithFallback(img, buildImageCandidates(p.img, isDark));

    img.alt = p.title;
    img.loading = 'lazy';
    img.className = 'w-full img-cover';

    img.onerror = () => {
      const orig = img.dataset.original || p.img;
      const fallback = orig;
      if (img.src !== fallback){ img.onerror = null; img.src = fallback; return; }
      if (fallback.endsWith('.png')){
        const jpg = fallback.replace('.png', '.jpg');
        img.onerror = () => { img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="%23161b22"/><text x="50%" y="50%" fill="%238b949e" dy=".3em" font-family="Arial" font-size="20" text-anchor="middle">Нет изображения</text></svg>'; };
        img.src = jpg; return;
      }
      img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="%23161b22"/><text x="50%" y="50%" fill="%238b949e" dy=".3em" font-family="Arial" font-size="20" text-anchor="middle">Нет изображения</text></svg>';
    };

    link.appendChild(img);

    const body = document.createElement('div');
    body.className = 'p-4 space-y-2';

    const h3 = document.createElement('h3');
    h3.textContent = p.title;
    h3.className = 'font-semibold';

    const small = document.createElement('p');
    small.textContent = p.short;
    small.className = 'text-sm muted';

    const more = document.createElement('a');
    more.href = `#/product/${p.id}`;
    more.className = 'link text-sm';
    more.textContent = 'Подробнее →';

    body.append(h3, small, more);
    card.append(link, body);
    cardsRoot.appendChild(card);
  });
}


function switchViews(hideEl, showEl) {
  if (hideEl && !hideEl.classList.contains('hidden')) {
    hideEl.classList.remove('view-enter'); hideEl.classList.add('view-leave');
    setTimeout(() => {
      hideEl.classList.add('hidden'); hideEl.classList.remove('view-leave');
      showEl.classList.remove('hidden'); showEl.classList.add('view-enter');
      setTimeout(() => showEl.classList.remove('view-enter'), 220);
    }, 180);
  } else {
    showEl.classList.remove('hidden'); showEl.classList.add('view-enter');
    setTimeout(() => showEl.classList.remove('view-enter'), 220);
  }
}

// =========== ОТПРАВКА =========================
function prepareSend(product, action, viaMainButton = false) {
  const payload = {
    v: 1,
    type: 'lead',
    action,
    product: { id: product.id, title: product.title },
    selected: product.title,   // 🆕 сюда пишем, что выбрал клиент
    at: new Date().toISOString()
  };

  console.log('[buyBtn] click. payload ->', payload);

  if (!inTelegram) {
    alert('Откройте через Telegram, чтобы отправить заявку.\n\n' + JSON.stringify(payload, null, 2));
    return;
  }

  try {
    sendToBot(payload);
  } catch (err) {
    console.error('[sendData] error:', err);
    tg?.HapticFeedback?.notificationOccurred?.('error');
    toast('Ошибка отправки: ' + (err?.message || 'неизвестно'));
  }
}

function addToCart(product){
  if (inCart(product.id)) { toast('Уже в заявке'); return; }
  CART.items.push({ id: product.id, title: product.title });
  saveCart(); toast('Добавлено в заявку'); tg?.HapticFeedback?.notificationOccurred?.('success'); updateCartUI();
}

function sendCart(){
  if (CART.items.length === 0) return;
  const payload = { v:1, type:'lead', action:'send_cart', items:CART.items, at:new Date().toISOString() };
  try {
    sendToBot(payload);
    tg?.HapticFeedback?.notificationOccurred?.('success');
    toast('Заявка отправлена');
  } catch (err) {
    console.error('[Request Form] sendData error:', err);
    tg?.HapticFeedback?.notificationOccurred?.('error');
    tg?.showAlert?.('Не удалось отправить заявку');
  }
  CART = { items:[] }; saveCart(); updateCartUI();
}
cartBtn.addEventListener('click', ()=>{ if (CART.items.length) sendCart(); });

let consultContext = null;
function openConsult(product){
  consultContext = product || null;
  consultProductTitle.textContent = product ? product.title : 'Общая консультация';
  cName.value = ''; cContact.value = ''; cMsg.value = '';
  modalShow(consultModal);
}
function closeConsult(){ modalHide(consultModal); consultContext = null; }

consultCancel.addEventListener('click', closeConsult);
consultModal.addEventListener('click', (e)=>{
  if (e.target === consultModal) closeConsult();
});

if (consultBtnMain) {
  consultBtnMain.addEventListener('click', () => openConsult(null));
}

consultForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const contact = cContact.value.trim();
  if (!contact) { toast('Укажите контакт'); return; }

  const payload = {
    v: 1,
    type: 'lead',
    action: 'consult',
    product: consultContext ? { id: consultContext.id, title: consultContext.title } : null,
    name: cName.value.trim() || null,
    contact,
    message: cMsg.value.trim() || null,
    at: new Date().toISOString()
  };

  try {
    sendToBot(payload);
    tg?.HapticFeedback?.notificationOccurred?.('success');
    toast('Заявка отправлена');
    closeRequest();
  } catch (err) {
    console.error('[Request Form] sendData error:', err);
    tg?.HapticFeedback?.notificationOccurred?.('error');
    tg?.showAlert?.('Не удалось отправить заявку');
  }
  closeConsult();
});

// ======= ЭКРАНЫ ===================
function showDetail(productId){
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return showList();

  // choose correct image variant for current theme
  const mode = getStoredThemeMode();
  const isDark = (mode === 'dark') || (mode === 'auto' && detectDarkFromCss());

  detailImg.dataset.original = p.img;
  setImgWithFallback(detailImg, buildImageCandidates(p.img, isDark));
  detailImg.alt = p.title;

  setImgWithFallback(detailImg, buildImageCandidates(p.img, isDark));
  detailImg.dataset.original = p.img;
  detailImg.alt = p.title;
  detailImg.onerror = () => { if (detailImg.src !== p.img){ detailImg.onerror = null; detailImg.src = p.img; } };
  detailTitle.textContent = p.title; detailShort.textContent = p.short;

  detailBullets.innerHTML = '';
  const ul = document.createElement('ul'); ul.className = 'list-disc ml-5';
  p.bullets.forEach(b => { const li=document.createElement('li'); li.textContent=b; ul.appendChild(li); });
  detailBullets.appendChild(ul);

  detailLong.innerHTML = '';
  (p.long||[]).forEach(par => { const el=document.createElement('p'); el.textContent=par; detailLong.appendChild(el); });

  backBtn.classList.remove('hidden');

  if (consultBtn) consultBtn.onclick = () => openConsult(p);

  buyBtn.textContent = 'Отправить заявку';
  buyBtn.onclick = () => openRequest(p);


  switchViews(listView, detailView);
}

function showList(){
  backBtn.classList.add('hidden');
  switchViews(detailView, listView);
  updateCartUI();
}

// ========= РОУТЕР/СТАРТ ================
function router(){
  const hash = location.hash || '#/';
  if (hash.startsWith('#/product/')) showDetail(hash.replace('#/product/',''));
  else showList();
}

function getStartParam(){
  const fromInit = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  const sp = new URLSearchParams(location.search);
  return (fromInit || sp.get('tgWebAppStartParam') || sp.get('s') || '').trim();
}
function handleStartParam(raw){
  if (!raw) return;
  const v = String(raw).toLowerCase();
  const alias = { tgbot:'tg-bot', 'tma+chatbot':'tma-chatbot', tma_chatbot:'tma-chatbot' };
  let id = v.startsWith('product:') ? v.split(':')[1] : v; id = alias[id] || id;
  if (['tma','tg-bot','tma-chatbot'].includes(id)) location.hash = `#/product/${id}`;
}

renderCards();
updateCartUI();
handleStartParam(getStartParam());
window.addEventListener('hashchange', router);
router();
