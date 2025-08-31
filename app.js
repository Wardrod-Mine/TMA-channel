// ====== БАЗОВЫЕ ДАННЫЕ ВИТРИНЫ =================================================
const PRODUCTS = [
  {
    id: 'tma',
    title: 'Telegram Mini App (ТМА)',
    img: 'https://placehold.co/800x500/png?text=Telegram+Mini+App',
    short: 'Готовое мини-приложение в Telegram: быстрый старт, нативные кнопки, светлая/тёмная тема.',
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
    bullets: [
      'UI на WebApp + диалог в чате',
      'Отправка заявок из ТМА в бота',
      'Готово к масштабированию'
    ]
  }
];

// ====== УТИЛИТЫ DOM =============================================================
const $ = (sel, root = document) => root.querySelector(sel);
const listView = $('#listView');
const detailView = $('#detailView');
const cardsRoot = $('#cards');
const detailImg = $('#detailImg');
const detailTitle = $('#detailTitle');
const detailShort = $('#detailShort');
const detailBullets = $('#detailBullets');
const usernameSlot = $('#usernameSlot');
const closeBtn = $('#closeBtn');
const consultBtn = $('#consultBtn');
const buyBtn = $('#buyBtn');

// ====== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ==========================================
const tg = window.Telegram?.WebApp;

// Безопасный гардер: приложение должно нормально работать и вне Telegram (в браузере)
const inTelegram = Boolean(tg && typeof tg.initData !== 'undefined');

if (inTelegram) {
  tg.ready();
  tg.expand();

  // Кнопка "Назад" Telegram — используем на детальной странице
  tg.BackButton.onClick(() => {
    // возвращаемся к списку
    if (location.hash.startsWith('#/product/')) {
      location.hash = '#/';
    }
  });

  // Реакция на смену темы клиентом Telegram
  tg.onEvent('themeChanged', applyThemeFromTelegram);

  // Показать ник (если есть) в шапке
  const username = tg.initDataUnsafe?.user?.username;
  if (username) usernameSlot.textContent = `@${username}`;

  // Кнопка "Закрыть" как дублирование для наглядности
  closeBtn.classList.remove('hidden');
  closeBtn.addEventListener('click', () => tg.close());
} else {
  // В браузере: покажем подсказку
  usernameSlot.textContent = 'Откройте через Telegram для полного функционала';
}

// Применяем цвета темы
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

// ====== РЕНДЕР КАРТОЧЕК =========================================================
function renderCards() {
  cardsRoot.innerHTML = '';
  PRODUCTS.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card rounded-xl overflow-hidden transition hover:scale-[1.01]';

    const link = document.createElement('a');
    link.href = `#/product/${p.id}`;
    link.setAttribute('aria-label', `Подробнее: ${p.title}`);
    link.className = 'block';

    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.title;
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

// ====== ДЕТАЛЬНЫЙ ЭКРАН =========================================================
function showDetail(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return showList();

  detailImg.src = p.img;
  detailImg.alt = p.title;
  detailTitle.textContent = p.title;
  detailShort.textContent = p.short;

  detailBullets.innerHTML = '';
  const ul = document.createElement('ul');
  ul.className = 'list-disc ml-5';
  p.bullets.forEach(b => {
    const li = document.createElement('li');
    li.textContent = b;
    ul.appendChild(li);
  });
  detailBullets.appendChild(ul);

  // Переключение экранов
  listView.classList.add('hidden');
  detailView.classList.remove('hidden');

  // Telegram UI: показать BackButton и MainButton
  if (inTelegram) {
    tg.BackButton.show();
    tg.MainButton.setParams({ text: `Отправить заявку: ${p.title}` });
    tg.MainButton.show();
    tg.onEvent('mainButtonClicked', onMainButton);
  }

  // Обычные кнопки на экране
  consultBtn.onclick = () => prepareSend(p, 'consult');
  buyBtn.onclick = () => prepareSend(p, 'add_to_request');

  function onMainButton() {
    prepareSend(p, 'send_request', true);
  }
}

// Подготовка и отправка данных в бота
function prepareSend(product, action, viaMainButton = false) {
  const payload = {
    v: 1,
    type: 'lead',
    action,
    product: { id: product.id, title: product.title },
    at: new Date().toISOString()
  };

  // ВАЖНО ПО БЕЗОПАСНОСТИ:
  // здесь НЕТ токенов. Отправляем только неперсональные данные.
  // В боте нужно валидировать tg.initData (HMAC) на бэкенде и уже там обрабатывать lead.

  if (inTelegram) {
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
    // Для UX можно подсветить MainButton
    if (viaMainButton) {
      tg.HapticFeedback?.impactOccurred?.('light');
      tg.MainButton.setParams({ text: 'Заявка отправлена ✅' });
      setTimeout(() => tg.MainButton.setParams({ text: `Отправить заявку: ${product.title}` }), 1500);
    }
  } else {
    // Фолбэк в браузере (для локальной отладки)
    alert('Demo sendData:\n' + JSON.stringify(payload, null, 2));
  }
}

// ====== СПИСОК ================================================================
function showList() {
  detailView.classList.add('hidden');
  listView.classList.remove('hidden');

  if (inTelegram) {
    tg.BackButton.hide();
    tg.MainButton.hide();
    tg.offEvent?.('mainButtonClicked'); // очистка обработчика на всякий случай
  }
}

// ====== РОУТЕР (хэш-маршруты) ===================================================
function router() {
  const hash = location.hash || '#/';
  if (hash.startsWith('#/product/')) {
    const id = hash.replace('#/product/', '');
    showDetail(id);
  } else {
    showList();
  }
}

// Рендер начальных карточек и запуск роутера
renderCards();
window.addEventListener('hashchange', router);
router();
