async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

async function init() {
  const me = await api('/api/me');
  if (!me.loggedIn) {
    // Might be the very first admin setup, or just a normal visitor.
    document.getElementById('setupBox').classList.remove('hidden');
    return;
  }
  if (me.isAdmin) {
    document.getElementById('adminOnlyBox').classList.remove('hidden');
    loadOwnedGames();
    loadSettingsIntoForm();
  } else {
    document.getElementById('notAllowedBox').classList.remove('hidden');
  }
}

async function doAdminSetup(e) {
  e.preventDefault();
  try {
    await api('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupKey: document.getElementById('setupKey').value,
        email: document.getElementById('setupEmail').value,
        password: document.getElementById('setupPassword').value,
      }),
    });
    location.reload();
  } catch (err) {
    document.getElementById('setupError').textContent = err.message;
  }
  return false;
}

async function addGame(e) {
  e.preventDefault();
  const form = new FormData();
  form.append('title', document.getElementById('title').value);
  form.append('description', document.getElementById('description').value);
  form.append('priceDollars', document.getElementById('price').value);
  const file = document.getElementById('gameFile').files[0];
  if (file) form.append('gameFile', file);

  try {
    await api('/api/admin/games', { method: 'POST', body: form });
    location.reload();
  } catch (err) {
    document.getElementById('addError').textContent = err.message;
  }
  return false;
}

async function loadOwnedGames() {
  const games = await api('/api/games');
  const list = document.getElementById('ownedGames');
  list.innerHTML = games.map(g => `
    <li>
      <span>${g.title} — $${(g.price_cents / 100).toFixed(2)}</span>
      <button class="secondary" onclick="removeGame(${g.id})">Remove</button>
    </li>
  `).join('') || '<p style="color:var(--muted)">No games yet.</p>';
}

async function removeGame(id) {
  if (!confirm('Remove this game?')) return;
  await api(`/api/admin/games/${id}`, { method: 'DELETE' });
  loadOwnedGames();
}

async function loadSettingsIntoForm() {
  const settings = await api('/api/settings');
  document.getElementById('siteTitleInput').value = settings.site_title || '';
  document.getElementById('siteTaglineInput').value = settings.site_tagline || '';
  document.getElementById('accentColorInput').value = settings.accent_color || '#8b7cff';
}

async function saveSettings(e) {
  e.preventDefault();
  try {
    await api('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_title: document.getElementById('siteTitleInput').value,
        site_tagline: document.getElementById('siteTaglineInput').value,
        accent_color: document.getElementById('accentColorInput').value,
      }),
    });
    document.getElementById('settingsSaved').textContent = 'Saved! Refresh the storefront to see it.';
    setTimeout(() => { document.getElementById('settingsSaved').textContent = ''; }, 3000);
  } catch (err) {
    document.getElementById('settingsSaved').textContent = err.message;
  }
  return false;
}

init();
