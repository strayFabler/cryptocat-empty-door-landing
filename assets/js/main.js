(() => {
  const WEBHOOK = 'https://api.webhook.site/REPLACE_WITH_YOUR_ID';
  const AB_KEY = 'ab-variant';

  const screens = [
    { id: 'onboarding-fun', label: 'Bite-sized crypto lessons', alt: 'Onboarding screen showing playful orange cat and bite-sized crypto learning headline', asset: 'assets/images/1.png' },
    { id: 'habit-builder', label: 'Daily habit shield', alt: 'Illustration of shield and lock describing becoming crypto-smart in 10 minutes a day', asset: 'assets/images/2.png' },
    { id: 'rewards-flow', label: 'Play. Learn. Earn.', alt: 'Gamified screen with bitcoin coins encouraging sign up and login', asset: 'assets/images/3.png' },
    { id: 'sign-up', label: 'Sign-up form', alt: 'Email and password input screen for creating a CryptoCat account', asset: 'assets/images/4.png' },
    { id: 'home-dashboard', label: 'Learning dashboard', alt: 'Home dashboard with progress bars and learning plan cards', asset: 'assets/images/5.png' },
    { id: 'course-catalog', label: 'Course catalog', alt: 'Course listing view with categories like investing and security', asset: 'assets/images/6.png' },
    { id: 'progress-tracker', label: 'Course progress tracker', alt: 'My courses screen with completion stats and play buttons', asset: 'assets/images/7.png' },
    { id: 'account-settings', label: 'Account & favorites', alt: 'Account screen with cat avatar and navigation items', asset: 'assets/images/8.png' }
  ];

  const variants = {
    A: 'learn crypto with fun, bite-sized cat lessons',
    B: 'turn crypto chaos into cat-level fun'
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
