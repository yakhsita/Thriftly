document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;
  loadCart(user);
});

async function loadCart(user) {
  const { data: cartItems } = await db.from('cart')
    .select('*, products(*)')
    .eq('user_id', user.id);

  const listEl = document.getElementById('cart-list');
  const summaryEl = document.getElementById('cart-summary');
  const emptyEl = document.getElementById('cart-empty');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!cartItems || cartItems.length === 0) {
    listEl.style.display = 'none';
    summaryEl.style.display = 'none';
    checkoutBtn.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.style.display = 'block';
  summaryEl.style.display = 'block';
  checkoutBtn.style.display = 'block';

  listEl.innerHTML = cartItems.map(item => {
    const p = item.products;
    const emoji = catEmoji[p?.category] || '📦';
    const imgHTML = p?.image_url
      ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;">`
      : `<span>${emoji}</span>`;

    return `
      <div class="cart-item" id="cart-item-${item.id}">
        <div class="cart-item-img">${imgHTML}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${p?.title || 'Item'}</div>
          <div class="cart-item-cat">${p?.category || ''} · ${p?.condition || 'Used'}</div>
          <div class="cart-item-price">${formatPrice(p?.price || 0)}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>`;
  }).join('');

  // Calculate totals
  const subtotal = cartItems.reduce((sum, i) => sum + (i.products?.price || 0), 0);
  document.getElementById('subtotal').textContent = formatPrice(subtotal);
  document.getElementById('total').textContent = formatPrice(subtotal);
}

async function removeFromCart(cartId) {
  await db.from('cart').delete().eq('id', cartId);
  document.getElementById('cart-item-' + cartId)?.remove();
  showToast('Removed from cart');
  // Refresh to recalculate totals
  const user = await getCurrentUser();
  loadCart(user);
}

async function checkout() {
  const user = await getCurrentUser();
  if (!user) return;

  const { data: cartItems } = await db.from('cart')
    .select('product_id').eq('user_id', user.id);

  if (!cartItems || cartItems.length === 0) return;

  // Insert orders
  const orders = cartItems.map(i => ({
    buyer_id: user.id,
    product_id: i.product_id,
    order_status: 'pending'
  }));

  await db.from('orders').insert(orders);

  // Mark products as sold
  const productIds = cartItems.map(i => i.product_id);
  await db.from('products').update({ status: 'sold' }).in('id', productIds);

  // Clear cart
  await db.from('cart').delete().eq('user_id', user.id);

  showToast('🎉 Order placed successfully!');
  setTimeout(() => window.location.href = 'profile.html', 1800);
}