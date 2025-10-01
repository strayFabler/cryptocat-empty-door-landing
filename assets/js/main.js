(() => {
  const WEBHOOK = 'https://api.webhook.site/REPLACE_WITH_YOUR_ID';
  const AB_KEY = 'ab-variant';

  const INITIAL_PREVIEW_COUNT = 3;
  let remainingScreens = [];
  let showMoreButton = null;

  const screens = [
    { id: 'onboarding-fun', label: 'Bite‑sized lessons', alt: 'Onboarding screen showing playful orange cat and bite-sized crypto learning headline', asset: 'assets/images/1.png' },
    { id: 'habit-builder', label: 'Daily quests', alt: 'Illustration of shield and lock describing becoming crypto-smart in 10 minutes a day', asset: 'assets/images/2.png' },
    { id: 'rewards-flow', label: 'Play. Learn. Earn.', alt: 'Gamified screen with bitcoin coins encouraging sign up and login', asset: 'assets/images/3.png' },
    { id: 'sign-up', label: 'Sign up', alt: 'Email and password input screen for creating a CryptoCat account', asset: 'assets/images/4.png' },
    { id: 'home-dashboard', label: 'Your dashboard', alt: 'Home dashboard with progress bars and learning plan cards', asset: 'assets/images/5.png' },
    { id: 'course-catalog', label: 'Mentor paths', alt: 'Course listing view with categories like investing and security', asset: 'assets/images/6.png' },
    { id: 'progress-tracker', label: 'Progress tracker', alt: 'My courses screen with completion stats and play buttons', asset: 'assets/images/7.png' },
    { id: 'account-settings', label: 'Account & alerts', alt: 'Account screen with cat avatar and navigation items', asset: 'assets/images/8.png' }
  ];

  const variants = {
    A: 'Learn crypto safely with fun, bite‑sized cat lessons.',
    B: 'Turn crypto chaos into cat‑level fun — and real skills.'
  };

  let abChoice = null;

  function createCard(screen) {
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
    like.textContent = '♡ Like';

    const likedKey = `liked_${screen.id}`;
    if (localStorage.getItem(likedKey) === '1') {
      like.classList.add('liked');
      like.textContent = '❤️ Liked';
    }

    body.appendChild(label);
    body.appendChild(like);

    article.appendChild(image);
    article.appendChild(body);

    return article;
  }

  function renderScreens() {
    const grid = document.getElementById('screens');
    if (!grid) return null;

    grid.innerHTML = '';
    remainingScreens = [];

    const initialScreens = screens.slice(0, INITIAL_PREVIEW_COUNT);
    initialScreens.forEach(screen => {
      grid.appendChild(createCard(screen));
    });

    remainingScreens = screens.slice(INITIAL_PREVIEW_COUNT);

    if (showMoreButton && showMoreButton.parentElement) {
      showMoreButton.remove();
    }

    if (remainingScreens.length > 0) {
      if (!showMoreButton) {
        showMoreButton = document.createElement('button');
        showMoreButton.type = 'button';
        showMoreButton.className = 'btn btn-ghost show-more';
        showMoreButton.textContent = 'Show more screens';
        showMoreButton.addEventListener('click', () => {
          remainingScreens.forEach(screen => {
            grid.insertBefore(createCard(screen), showMoreButton);
          });
          remainingScreens = [];
          if (showMoreButton) showMoreButton.remove();
          registerLikeHandlers(grid);
        });
      }
      grid.appendChild(showMoreButton);
    }

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
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';
      button.addEventListener('click', () => {
        const card = button.closest('.card');
        const id = card ? card.dataset.screenId : undefined;
        const likedKey = `liked_${id}`;
        const nowLiked = !button.classList.contains('liked');
        button.classList.toggle('liked', nowLiked);
        button.textContent = nowLiked ? '❤️ Liked' : '♡ Like';
        try { localStorage.setItem(likedKey, nowLiked ? '1' : '0'); } catch(_) {}
        sendEvent(nowLiked ? 'screen_like' : 'screen_unlike', { screen: id });
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
