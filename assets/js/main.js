(() => {
  const WEBHOOK = 'https://api.webhook.site/REPLACE_WITH_YOUR_ID';
  const AB_KEY = 'ab-variant';

  const screens = [
    { id: 'wallet-overview', label: 'Wallet overview', alt: 'Wallet balance overview screen', asset: 'assets/images/1.png' },
    { id: 'staking-rewards', label: 'Staking rewards', alt: 'Projected staking rewards concept', asset: 'assets/images/2.png' },
    { id: 'cat-collections', label: 'Cat collections', alt: 'Collection of crypto cats grouped by traits', asset: 'assets/images/3.png' },
    { id: 'trade-tracker', label: 'Trade tracker', alt: 'Trade tracker timeline screen', asset: 'assets/images/4.png' },
    { id: 'alerts-center', label: 'Alerts center', alt: 'Notification center for key crypto events', asset: 'assets/images/5.png' },
    { id: 'gas-optimizer', label: 'Gas optimizer', alt: 'Gas fee optimization recommendations', asset: 'assets/images/6.png' },
    { id: 'multichain-bridge', label: 'Multichain bridge', alt: 'Multichain asset bridge flow', asset: 'assets/images/7.png' },
    { id: 'team-dashboard', label: 'Team dashboard', alt: 'Team dashboard with shared insights', asset: 'assets/images/8.png' }
  ];

  const variants = {
    A: 'keep every chain and cat in one tidy dashboard',
    B: 'stay on top of your CryptoCat portfolio without tab overload'
  };

  let abChoice = null;

  function renderScreens() {
    const grid = document.getElementById('screens');
    if (!grid) return null;

    grid.innerHTML = '';

    screens.forEach(screen => {
      const article = document.createElement('article');
      article.className = 'card';
      article.dataset.screenId = screen.id;

      const image = document.createElement('img');
      image.className = 'img';
      image.src = screen.asset;
      image.alt = screen.alt;

      const body = document.createElement('div');
      body.className = 'card-body';

      const label = document.createElement('span');
      label.className = 'muted';
      label.textContent = screen.label;

      const like = document.createElement('button');
      like.className = 'like';
      like.setAttribute('data-ev', 'like');
      like.innerHTML = '❤️ <span class="cnt">0</span>';

      body.appendChild(label);
      body.appendChild(like);

      article.appendChild(image);
      article.appendChild(body);

      grid.appendChild(article);
    });

    return grid;
  }

  function selectVariant() {
    const stored = localStorage.getItem(AB_KEY);
    if (stored === 'A' || stored === 'B') {
      abChoice = stored;
      return stored;
    }

    abChoice = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(AB_KEY, abChoice);
    return abChoice;
  }

  function updateHeadline() {
    const span = document.getElementById('headline-variant');
    if (!span) return;

    const key = selectVariant();
    span.textContent = variants[key];
  }

  function sendEvent(name, payload = {}) {
    try {
      if (window.plausible) {
        window.plausible(name, { props: payload });
      }
    } catch (error) {}

    if (!WEBHOOK) return;

    try {
      fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: name, payload, ab: abChoice, ts: Date.now() })
      });
    } catch (error) {}
  }

  function registerLikeHandlers(grid) {
    if (!grid) return;

    grid.querySelectorAll('.like').forEach(button => {
      button.addEventListener('click', () => {
        const card = button.closest('.card');
        const id = card ? card.dataset.screenId : undefined;
        const counter = button.querySelector('.cnt');
        const next = parseInt(counter ? counter.textContent : '0', 10) + 1;

        if (counter) {
          counter.textContent = String(next);
        }

        sendEvent('screen_like', { screen: id, like_count: next });
      });
    });
  }

  function registerCtaTracking() {
    document
      .querySelectorAll('[data-ev]')
      .forEach(element => element.addEventListener('click', event => sendEvent(event.currentTarget.dataset.ev)));
  }

  function maskEmail(value) {
    return value.replace(/(^[^@]{2}|(.*)@)./g, '$1*');
  }

  window.handleSubmit = function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const emailInput = form.querySelector('input[type=email]');
    const email = emailInput ? emailInput.value : '';

    sendEvent('waitlist_submit', { email_masked: maskEmail(email) });

    const url = new URL(form.action);
    url.searchParams.set('email', email);
    window.location.href = url.toString();
  };

  function stampYear() {
    const yearHolder = document.getElementById('y');
    if (yearHolder) {
      yearHolder.textContent = String(new Date().getFullYear());
    }
  }

  function init() {
    const grid = renderScreens();
    updateHeadline();
    registerLikeHandlers(grid);
    registerCtaTracking();
    stampYear();
    sendEvent('page_view', { variant: abChoice });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
