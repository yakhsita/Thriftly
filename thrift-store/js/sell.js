let selectedFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  // Prefill address from profile
  const { data: profile, error } = await db.from('profiles').select('address').eq('id', user.id).maybeSingle();
  console.log(profile);
  console.log(error);
  if (profile?.address) {
    document.getElementById('pickup_address').value = profile.address;
  }

  // Image preview
  document.getElementById('img-input').addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    const preview = document.getElementById('img-previews');
    preview.innerHTML = '';
    selectedFiles.forEach(f => {
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.src = url;
      img.className = 'img-preview-thumb';
      preview.appendChild(img);
    });
  });
});

async function submitListing() {
  const user = await getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return; }

  const title = document.getElementById('title').value.trim();
  const price = document.getElementById('price').value;
  const category = document.getElementById('category').value;

  if (!title || !price || !category) {
    showToast('Please fill in title, price, and category.');
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Listing…';
  btn.disabled = true;

  let imageUrl = null;

  // Upload image using ImgBB
  if (selectedFiles.length > 0) {
    const file = selectedFiles[0];

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        "https://api.imgbb.com/1/upload?key=02d4f9aa8b24eb1566d2476ca9aceef5",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      console.log("IMGBB RESPONSE:", result);

      if (result.success) {
        imageUrl = result.data.url; // FINAL IMAGE LINK
      } else {
        showToast("Image upload failed");
        return;
      }

    } catch (err) {
      console.error(err);
      showToast("Image upload error");
      return;
    }
  }

  const listing = {
    seller_id: user.id,
    title,
    description: document.getElementById('description').value.trim(),
    category,
    price: parseFloat(price),
    condition: document.getElementById('condition').value,
    size_dimension: document.getElementById('size_dimension').value.trim(),
    pickup_address: document.getElementById('pickup_address').value.trim(),
    image_url: imageUrl,
    status: 'available',
  };

  const { error } = await db.from('products').insert(listing);

  if (error) {
    showToast('Error posting listing: ' + error.message);
    btn.textContent = 'Post Listing';
    btn.disabled = false;
    return;
  }

  showToast('🎉 Listing posted successfully!');
  setTimeout(() => window.location.href = 'index.html', 1500);
}