const cartBtn = $('#cartBtn');
const cartCount = $('#cartCount');
const toastEl = $('#toast');

// Модалка консультации
const consultModal = $('#consultModal');
const consultForm = $('#consultForm');
const consultCancel = $('#consultCancel');
const consultProductTitle = $('#consultProductTitle');
const cName = $('#cName');
const cContact = $('#cContact');
const cMsg = $('#cMsg');

// Простая "корзина-заявка" в sessionStorage
let CART = loadCart();

function loadCart(){
  try { return JSON.parse(sessionStorage.getItem('cart') || '{"items":[]}'); }
  catch(e){ return { items: [] }; }
}
function saveCart(){ sessionStorage.setItem('cart', JSON.stringify(CART)); }
function inCart(id){ return CART.items.some(x => x.id === id); }

// ====== ДАННЫЕ ================================================================
const PRODUCTS = [
  {
    id: 'tma',
    title: 'Telegram Mini App (ТМА)',
    img: 'https://placehold.co/800x500/png?text=Telegram+Mini+App',
    short: 'Готовое мини-приложение в Telegram: быстрый старт, нативные кнопки, светлая/тёмная тема.',
    long: [
      'Идеально для витрин, форм заявок и мини-сервисов внутри Telegram.',
      'Поддержка MainButton/BackButton, themeParams, sendData для связи с ботом.',
      'Быстрый деплой на любой статический хостинг и готовность к модерации.'
    ],
    bullets: [
      'Поддержка Telegram.WebApp API (MainButton, BackButton, theme)',
      'Готовая структура для каталога/форм/оплаты',
      'Быстрый деплой на любой статический хостинг'
    ]
  },
  {
    id: 'tg-bot',
    title: 'TG-бот (классический бот)',
    img: 'https://placehold.co/800x500/png?text=Telegram+Bot',
    short: 'Бот с командами, меню и кнопками — для поддержки, продаж, заявок и автоматизации.',
    long: [
      'Подходит для рассылок, обработки заявок, FAQ и интеграций.',
      'Варианты подключения: webhook или long polling.',
      'Готовые сценарии для быстрых запусков.'
    ],
    bullets: [
      'Inline-кнопки, меню, webhooks/long-polling',
      'Интеграции (CRM, таблицы, платежи)',
      'Готовые шаблоны сценариев'
    ]
  },
  {
    id: 'tma-chatbot',
    title: 'ТМА с чат-ботом',
    img: 'https://placehold.co/800x500/png?text=TMA+%2B+Chatbot',
    short: 'Комбо: мини-приложение + диалоговый ассистент. Витрина + умные ответы в одном окне.',
    long: [
      'Показывайте товары/услуги во фронте ТМА и отвечайте на вопросы диалогом в чате.',
      'Сбор лидов через sendData, аналитика источников, масштабирование сценариев.',
      'Удобно для продаж и поддержки внутри одного UX.'
    ],
    bullets: [
      'UI на WebApp + диалог в чате',
      'Отправка заявок из ТМА в бота',
      'Готово к масштабированию'
    ]
  }
];

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
    if (inTelegram) {
      tg.MainButton.setParams({ text: `Отправить заявку (${n})` });
      tg.MainButton.show();
      tg.offEvent?.('mainButtonClicked');
      tg.onEvent('mainButtonClicked', sendCart);
    }
  } else {
    cartBtn.classList.add('hidden');
    if (location.hash.startsWith('#/product/')) {
      // на детальном экране, если корзина пуста — кнопка управляется showDetail()
    } else if (inTelegram) {
      tg.MainButton.hide();
      tg.offEvent?.('mainButtonClicked');
    }
  }
}

function addToCart(product){
  if (inCart(product.id)) {
    toast('Уже в заявке');
    return;
  }
  CART.items.push({ id: product.id, title: product.title });
  saveCart();
  toast('Добавлено в заявку');
  tg?.HapticFeedback?.notificationOccurred?.('success');
  updateCartUI();
}

function sendCart(){
  if (CART.items.length === 0) return;
  const payload = {
    v: 1,
    type: 'lead',
    action: 'send_cart',
    items: CART.items,
    at: new Date().toISOString()
  };
  if (inTelegram) {
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
    tg.MainButton.setParams({ text: 'Заявка отправлена ✅' });
    setTimeout(()=> updateCartUI(), 1500);
  } else {
    alert('Demo sendData:\n' + JSON.stringify(payload, null, 2));
  }
  CART = { items: [] };
  saveCart();
  updateCartUI();
}

let consultContext = null;

function openConsult(product){
  consultContext = product;
  consultProductTitle.textContent = product.title;
  cName.value = '';
  cContact.value = '';
  cMsg.value = '';
  consultModal.classList.remove('hidden');
}
function closeConsult(){
  consultModal.classList.add('hidden');
  consultContext = null;
}

consultCancel.addEventListener('click', closeConsult);
consultForm.addEventListener('submit', (e)=>{
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

  if (inTelegram) {
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
    tg.HapticFeedback?.notificationOccurred?.('success');
  } else {
    alert('Demo sendData:\n' + JSON.stringify(payload, null, 2));
  }
  closeConsult();
  toast('Запрос отправлен');
});

cartBtn.addEventListener('click', ()=>{
  if (CART.items.length === 0) return;
  if (!inTelegram) {
    if (!confirm(`Отправить заявку (${CART.items.length})?`)) return;
  }
  sendCart();
});


// ====== DOM ===================================================================
const $ = (sel, root = document) => root.querySelector(sel);
const listView = $('#listView');
const detailView = $('#detailView');
const cardsRoot = $('#cards');
const detailImg = $('#detailImg');
const detailTitle = $('#detailTitle');
const detailShort = $('#detailShort');
const detailBullets = $('#detailBullets');
const detailLong = $('#detailLong'); // <-- был пропущен
const usernameSlot = $('#usernameSlot');
const closeBtn = $('#backBtn');
const consultBtn = $('#consultBtn');
const buyBtn = $('#buyBtn');

// ====== TELEGRAM WEBAPP =======================================================
const tg = window.Telegram?.WebApp;
const inTelegram = Boolean(tg && typeof tg.initData !== 'undefined');

if (inTelegram) {
  tg.ready();
  tg.expand();
  tg.BackButton.onClick(() => {
    if (location.hash.startsWith('#/product/')) location.hash = '#/';
  });
  tg.onEvent('themeChanged', applyThemeFromTelegram);
  const username = tg.initDataUnsafe?.user?.username;
  if (username) usernameSlot.textContent = `@${username}`;
  backBtn.addEventListener('click', () => {
    if (location.hash.startsWith('#/product/')) location.hash = '#/';
  });
} else {
  usernameSlot.textContent = 'Откройте через Telegram для полного функционала';
}

function applyThemeFromTelegram() {
  if (!inTelegram) return;
  const tp = tg.themeParams || {};
  const root = document.documentElement;
  const set = (cssVar, val, fallback) => root.style.setProperty(cssVar, val || fallback);
  set('--bg', tp.bg_color, '#0e1117');
  set('--text', tp.text_color, '#e6edf3');
  set('--hint', tp.hint_color, '#8b949e');
  set('--link', tp.link_color, '#4495ff');
  set('--btn', tp.button_color, '#2ea043');
  set('--btn-text', tp.button_text_color, '#ffffff');
  set('--card', tp.secondary_bg_color, '#161b22');
  set('--sep', tp.section_separator_color, 'rgba(255,255,255,.08)');
}
applyThemeFromTelegram();

// ====== UI РЕНДЕР =============================================================
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
    img.src = p.img;
    img.alt = p.title;
    img.loading = 'lazy';
    img.className = 'w-full img-cover';
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

// плавный свитч экранов
function switchViews(hideEl, showEl) {
  if (hideEl && !hideEl.classList.contains('hidden')) {
    hideEl.classList.remove('view-enter');
    hideEl.classList.add('view-leave');
    setTimeout(() => {
      hideEl.classList.add('hidden');
      hideEl.classList.remove('view-leave');
      showEl.classList.remove('hidden');
      showEl.classList.add('view-enter');
      setTimeout(() => showEl.classList.remove('view-enter'), 220);
    }, 180);
  } else {
    showEl.classList.remove('hidden');
    showEl.classList.add('view-enter');
    setTimeout(() => showEl.classList.remove('view-enter'), 220);
  }
}

// ====== ОТПРАВКА ДАННЫХ БОТУ ===================================================
function prepareSend(product, action, viaMainButton = false) {
  const payload = {
    v: 1,
    type: 'lead',
    action,
    product: { id: product.id, title: product.title },
    at: new Date().toISOString()
  };
  if (inTelegram) {
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
    if (viaMainButton) {
      tg.HapticFeedback?.impactOccurred?.('light');
      tg.MainButton.setParams({ text: 'Заявка отправлена ✅' });
      setTimeout(() => tg.MainButton.setParams({ text: `Отправить заявку: ${product.title}` }), 1500);
    }
  } else {
    alert('Demo sendData:\n' + JSON.stringify(payload, null, 2));
  }
}

// ====== ЭКРАНЫ =================================================================
function showDetail(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return showList();

  detailImg.src = p.img;
  detailImg.alt = p.title;
  detailTitle.textContent = p.title;
  detailShort.textContent = p.short;

  // bullets
  detailBullets.innerHTML = '';
  const ul = document.createElement('ul');
  ul.className = 'list-disc ml-5';
  p.bullets.forEach(b => {
    const li = document.createElement('li');
    li.textContent = b;
    ul.appendChild(li);
  });
  detailBullets.appendChild(ul);

  // long
  detailLong.innerHTML = '';
  (p.long || []).forEach(par => {
    const para = document.createElement('p');
    para.textContent = par;
    detailLong.appendChild(para);
  });

  backBtn.classList.remove('hidden');

  consultBtn.onclick = () => openConsult(p);
  buyBtn.onclick = () => addToCart(p);

  // если корзина пуста — оставим кнопку по товару; если нет — показываем корзину
  if (inTelegram) {
    if (CART.items.length === 0) {
      tg.MainButton.setParams({ text: `Отправить заявку: ${p.title}` });
      tg.MainButton.show();
      tg.offEvent?.('mainButtonClicked');
      tg.onEvent('mainButtonClicked', () => prepareSend(p, 'send_request', true));
    } else {
      updateCartUI();
    }
  }


  consultBtn.onclick = () => prepareSend(p, 'consult');
  buyBtn.onclick = () => prepareSend(p, 'add_to_request');
}

function showList() {
  backBtn.classList.add('hidden');
  if (inTelegram) {
    tg.BackButton.hide();
    tg.MainButton.hide();
    tg.offEvent?.('mainButtonClicked');
    updateCartUI();
  }
}

// ====== РОУТЕР =================================================================
function router() {
  const hash = location.hash || '#/';
  if (hash.startsWith('#/product/')) {
    const id = hash.replace('#/product/', '');
    showDetail(id);
  } else {
    showList();
  }
}

// ====== START PARAM ============================================================
function getStartParam() {
  const fromInitData = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  const sp = new URLSearchParams(location.search);
  const fromTgParam = sp.get('tgWebAppStartParam');
  const fromCustom = sp.get('s');
  return (fromInitData || fromTgParam || fromCustom || '').trim();
}
function handleStartParam(raw) {
  if (!raw) return;
  const value = String(raw).toLowerCase();
  const aliasMap = { 'tgbot': 'tg-bot', 'tma+chatbot': 'tma-chatbot', 'tma_chatbot': 'tma-chatbot' };
  let productId = value.startsWith('product:') ? value.split(':')[1] : value;
  productId = aliasMap[productId] || productId;
  if (['tma', 'tg-bot', 'tma-chatbot'].includes(productId)) {
    location.hash = `#/product/${productId}`;
  }
}

// ====== BOOT ===================================================================
renderCards();
updateCartUI();
handleStartParam(getStartParam());
window.addEventListener('hashchange', router);
router();
