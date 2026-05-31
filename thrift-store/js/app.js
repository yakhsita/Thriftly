function buildProductCard(p, trending = false) {
  const emoji = catEmoji[p.category] || '📦';
  const isSold = p.status === 'sold';

  const imgContent = p.image_url
    ? `<img src="${p.image_url}" alt="${p.title}" loading="lazy">`
    : `<div class="card-emoji">${emoji}</div>`;

  const soldOverlay = isSold
    ? `<div class="sold-overlay"><span>Sold Out</span></div>`
    : '';

  const trendingBadge = (trending && !isSold)
    ? `<div class="trending-badge">🔥 Trending</div>`
    : '';

  const favBtn = !isSold
    ? `<button class="fav-btn" onclick="toggleFav(event,${p.id})" id="fav-${p.id}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>`
    : '';

  return `
    <div class="product-card" onclick="${isSold ? '' : `openProduct(${p.id})`}" style="${isSold ? 'opacity:0.7;cursor:default;' : ''}">
      <div class="product-card-img">
        ${imgContent}
        ${soldOverlay}
        ${trendingBadge}
        ${favBtn}
      </div>
      <div class="product-card-body">
        <div class="product-card-title">${p.title}</div>
        <div class="product-card-meta">
          <span class="condition-badge">${p.condition || 'Used'}</span>
          ${p.category || ''}
        </div>
        <div class="product-card-price">${formatPrice(p.price || 0)}</div>
      </div>
    </div>`;
}

async function openProduct(id) {
  const { data: p } = await db.from('products').select('*').eq('id', id).single();
  if (!p) return;

  const emoji = catEmoji[p.category] || '📦';
  const imgHTML = p.image_url
    ? `<img src="${p.image_url}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;margin-bottom:14px;">`
    : `<div style="width:100%;aspect-ratio:4/3;background:var(--bg2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:60px;margin-bottom:14px;">${emoji}</div>`;

  document.getElementById('product-modal-body').innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:14px;">
      <div style="width:110px;height:82px;flex-shrink:0;border-radius:10px;overflow:hidden;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:28px;">
        ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;">` : emoji}
      </div>
      <div style="flex:1;min-width:0;">
        <h2 style="font-family:'Playfair Display',serif;font-size:17px;font-weight:700;margin-bottom:4px;line-height:1.3;">${p.title}</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
          <span class="condition-badge">${p.condition || 'Used'}</span>
          <span class="condition-badge">${p.category || ''}</span>
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--accent);">${formatPrice(p.price || 0)}</div>
      </div>
    </div>
    ${p.description ? `<p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:10px;border-top:1px solid var(--border);padding-top:10px;">${p.description}</p>` : ''}
    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">
      ${p.size_dimension ? `<p style="font-size:12px;color:var(--text3);">📐 ${p.size_dimension}</p>` : ''}
      ${p.pickup_address ? `<p style="font-size:12px;color:var(--text3);">📍 ${p.pickup_address}</p>` : ''}
    </div>
    <button class="btn-primary" onclick="addToCart(${p.id})">Add to Cart</button>
  `;
  openModal('product-modal');
}

async function toggleFav(e, productId) {
  e.stopPropagation();
  const user = await getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return; }

  const btn = document.getElementById('fav-' + productId);
  const { data: existing } = await db.from('favorites')
    .select('id').eq('user_id', user.id).eq('product_id', productId).single();

  if (existing) {
    await db.from('favorites').delete().eq('id', existing.id);
    btn.classList.remove('active');
    showToast('Removed from favorites');
  } else {
    await db.from('favorites').insert({ user_id: user.id, product_id: productId });
    btn.classList.add('active');
    showToast('❤️ Added to favorites');
  }
}

async function addToCart(productId) {
  const user = await getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return; }

  const { data: existing } = await db.from('cart')
    .select('id').eq('user_id', user.id).eq('product_id', productId).single();

  if (!existing) {
    await db.from('cart').insert({ user_id: user.id, product_id: productId, quantity: 1 });
  }
  showToast('🛒 Added to cart!');
  closeModal('product-modal');
}

async function doSearch(query) {
  if (!query.trim()) return;
  const { data } = await db.from('products')
    .select('*')
    .ilike('title', `%${query}%`);
  return data || [];
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}