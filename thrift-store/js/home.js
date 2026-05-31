async function loadHome() {
  // Load latest products
  const { data: latest } = await db.from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  // Load "trending" (just older ones for demo)
  const { data: trending } = await db.from('products')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(6);

  const latestGrid = document.getElementById('latest-grid');
  const trendingRow = document.getElementById('trending-row');

  if (latestGrid) {
    if (!latest || latest.length === 0) {
      latestGrid.innerHTML = '<p style="color:var(--text3);padding:0 4px;font-size:14px;">No products yet. Be the first to sell!</p>';
    } else {
      latestGrid.innerHTML = latest.map(p => buildProductCard(p, false)).join('');
    }
  }

  if (trendingRow) {
    if (!trending || trending.length === 0) {
      trendingRow.innerHTML = '';
    } else {
      trendingRow.innerHTML = trending.map(p => buildProductCard(p, true)).join('');
    }
  }

  // Load user favorites to mark active
  const user = await getCurrentUser();
  if (user) {
    const { data: favs } = await db.from('favorites')
      .select('product_id').eq('user_id', user.id);
    if (favs) {
      favs.forEach(f => {
        const btn = document.getElementById('fav-' + f.product_id);
        if (btn) btn.classList.add('active');
      });
    }
  }
}

async function handleSearch(e) {
  if (e.key !== 'Enter' && e.type !== 'click') return;
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;

  const latestGrid = document.getElementById('latest-grid');
  latestGrid.innerHTML = '<div class="skeleton" style="height:200px;border-radius:14px;"></div><div class="skeleton" style="height:200px;border-radius:14px;"></div>';

  const results = await doSearch(q);
  document.getElementById('trending-section').style.display = 'none';
  document.getElementById('latest-label').querySelector('h2').textContent = `Results for "${q}"`;

  if (!results || results.length === 0) {
    latestGrid.innerHTML = '<p style="color:var(--text3);font-size:14px;padding:0 4px;grid-column:span 2;">No items found. Try a different search.</p>';
  } else {
    latestGrid.innerHTML = results.map(p => buildProductCard(p)).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadHome);