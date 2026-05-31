async function signup() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const fullName = document.getElementById('full_name')?.value.trim() || '';
  const errEl = document.getElementById('error-msg');

  if (!email || !password) {
    errEl.textContent = 'Please fill all fields.';
    errEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('auth-btn');
  btn.textContent = 'Creating account…';
  btn.disabled = true;

  const { data, error } = await db.auth.signUp({ email, password });
  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    btn.textContent = 'Create Account';
    btn.disabled = false;
    return;
  }

  // Create profile row
  if (data.user) {
    const { error: profileError } = await db
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: fullName,
        address: '',
        phone: ''
      });

    if (profileError) {
      console.error("Profile Insert Error:", profileError);
    } else {
      console.log("Profile created successfully");
    }
  }


  showToast('Account created! Please check your email to confirm.');
  setTimeout(() => window.location.href = 'login.html', 2000);
}

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errEl = document.getElementById('error-msg');

  if (!email || !password) {
    errEl.textContent = 'Please enter email and password.';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('auth-btn');
  btn.textContent = 'Signing in…';
  btn.disabled = true;

  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    btn.textContent = 'Sign In';
    btn.disabled = false;
    return;
  }

  window.location.href = 'index.html';
}

async function logout() {
  await db.auth.signOut();
  window.location.href = 'login.html';
}