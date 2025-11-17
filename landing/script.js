// Optional micro-interactions for the landing page
(() => {
  // Gentle parallax on mouse move
  const art = document.querySelector('.hero-art');
  if (!art) return;
  const rings = [...art.querySelectorAll('.ring')];
  const sparks = [...art.querySelectorAll('.spark')];
  const move = (el, x, y, amt) => {
    el.style.transform = `translate(${x * amt}px, ${y * amt}px) scale(${el.classList.contains('ring') ? 1 : 1})`;
  };
  window.addEventListener('mousemove', (e) => {
    const { innerWidth:w, innerHeight:h } = window;
    const x = (e.clientX - w/2) / (w/2);
    const y = (e.clientY - h/2) / (h/2);
    rings.forEach((r,i) => move(r, x, y, (i+1)*2));
    sparks.forEach((s,i) => move(s, -x, -y, (i+1)*4));
  }, { passive: true });
})();

// Auth / API Integration
(() => {
  const API = 'http://localhost:5000/api/auth';
  const authModal = document.getElementById('authModal');
  const openAuth = document.getElementById('openAuth');
  const closeAuth = document.getElementById('closeAuth');
  const authForm = document.getElementById('authForm');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authMsg = document.getElementById('authMsg');
  const launchBtn = document.getElementById('launchBtn');
  const launchBtn2 = document.getElementById('launchBtn2');

  const showAuth = () => authModal.classList.add('active');
  const hideAuth = () => { authModal.classList.remove('active'); authMsg.textContent=''; };

  openAuth?.addEventListener('click', e => { e.preventDefault(); showAuth(); });
  closeAuth?.addEventListener('click', () => hideAuth());
  authModal?.addEventListener('click', e => { if (e.target === authModal) hideAuth(); });

  async function send(path, data) {
    try {
      const res = await fetch(`${API}/${path}`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(data)
      });
      let body = {};
      try { body = await res.json(); } catch {}
      return { ok: res.ok, body };
    } catch (err) {
      return { ok: false, body: { message: 'Cannot reach server. Is the backend running?' } };
    }
  }

  loginBtn?.addEventListener('click', async e => {
    e.preventDefault();
    if (loginBtn.classList.contains('loading') || registerBtn?.classList.contains('loading')) return;
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPass').value;
    loginBtn.classList.add('loading');
    try {
      const { ok, body } = await send('login', { email, password });
      authMsg.textContent = ok ? 'Login successful.' : (body.message || 'Login failed.');
      if (ok) {
        localStorage.setItem('sv_token', body.token);
        window.location.href = '../sorting-visualizer/index.html';
      }
    } finally {
      loginBtn.classList.remove('loading');
    }
  });

  registerBtn?.addEventListener('click', async e => {
    e.preventDefault();
    if (registerBtn.classList.contains('loading') || loginBtn?.classList.contains('loading')) return;
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPass').value;
    registerBtn.classList.add('loading');
    try {
      const { ok, body } = await send('register', { email, password });
      if (ok) {
        authMsg.textContent = 'Registration successful. Logging you in...';
        const loginRes = await send('login', { email, password });
        if (loginRes.ok) {
          localStorage.setItem('sv_token', loginRes.body.token);
          window.location.href = '../sorting-visualizer/index.html';
          return;
        }
        authMsg.textContent = 'Registration succeeded. Please sign in.';
      } else {
        authMsg.textContent = body.message || 'Registration failed.';
      }
    } finally {
      registerBtn.classList.remove('loading');
    }
  });

  function handleLaunch(e){
    e.preventDefault();
    const token = localStorage.getItem('sv_token');
    if (!token) { showAuth(); return; }
    window.location.href = '../sorting-visualizer/index.html';
  }
  launchBtn?.addEventListener('click', handleLaunch);
  launchBtn2?.addEventListener('click', handleLaunch);
})();
