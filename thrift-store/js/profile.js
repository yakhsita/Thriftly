document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  // Load profile info
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  const name = profile?.full_name || user.email.split('@')[0];
  document.getElementById('avatar-initials').textContent = name.charAt(0).toUpperCase();
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-email').textContent = user.email;

  loadOrders(user);
  loadFavorites(user);
  prefillSettings(user, profile);
});

async function loadOrders(user) {
  const { data: orders } = await db.from('orders')
    .select('*, products(title, price, category)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  const el = document.getElementById('orders-list');
  if (!orders || orders.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      <h3>No orders yet</h3>
      <p>Start shopping to see your orders here</p>
    </div>`;
    return;
  }

  el.innerHTML = orders.map(o => {
    const statusClass = o.order_status === 'delivered' ? 'status-delivered'
      : o.order_status === 'cancelled' ? 'status-cancelled' : 'status-pending';
    return `
      <div class="order-item">
        <div>
          <div style="font-weight:600;font-size:15px;margin-bottom:3px;">${o.products?.title || 'Product'}</div>
          <div style="font-size:12px;color:var(--text3);">${o.products?.category || ''} · ${formatPrice(o.products?.price || 0)}</div>
        </div>
        <span class="order-status ${statusClass}">${o.order_status}</span>
      </div>`;
  }).join('');
}

async function loadFavorites(user) {
  const { data: favs } = await db.from('favorites')
    .select('*, products(*)')
    .eq('user_id', user.id);

  const el = document.getElementById('favs-list');
  if (!favs || favs.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>
      <h3>No favorites yet</h3>
      <p>Tap ♥ on any item to save it here</p>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="products-grid">${favs.map(f => buildProductCard(f.products)).join('')}</div>`;
}

function prefillSettings(user, profile) {
  document.getElementById('set-name').value = profile?.full_name || '';
  document.getElementById('set-address').value = profile?.address || '';
  document.getElementById('set-phone').value = profile?.phone || '';
}

async function saveSettings() {
  const user = await getCurrentUser();
  if (!user) return;

  const btn = document.getElementById('save-settings-btn');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  await db.from('profiles').upsert({
    id: user.id,
    full_name: document.getElementById('set-name').value.trim(),
    address: document.getElementById('set-address').value.trim(),
    phone: document.getElementById('set-phone').value.trim(),
  });

  showToast('✅ Settings saved!');
  btn.textContent = 'Save Changes';
  btn.disabled = false;
}

async function changePassword() {
  const np = document.getElementById('new-password').value;
  const cp = document.getElementById('confirm-password').value;
  if (np !== cp) { showToast('Passwords do not match'); return; }
  if (np.length < 6) { showToast('Password must be 6+ characters'); return; }

  const { error } = await db.auth.updateUser({ password: np });
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('✅ Password updated!');
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

function switchTab(tab) {
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}