const API_BASE_URL = 'https://ominous-space-waffle-49555xw9q96f7rj6-5000.app.github.dev';
const TOKEN_KEY = 'prueba_front_login_token';

const state = {
  token: localStorage.getItem(TOKEN_KEY) || ''
};

function showMessage(message, isError = false) {
  const box = document.getElementById('message-box');
  if (!box) return;
  box.textContent = message;
  box.style.borderColor = isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.3)';
  box.style.backgroundColor = isError ? 'rgba(248, 113, 113, 0.12)' : 'rgba(56, 189, 248, 0.14)';
}

function saveToken(token) {
  state.token = token;
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  state.token = '';
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${state.token}`
  };
}

function interpretApiError(payload, status) {
  const apiMessage = String(payload?.message || '').toLowerCase();

  if (status === 401) return 'No estás autorizado. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para acceder a este recurso.';
  if (status === 404) return 'No se encontró el recurso solicitado.';
  if (status >= 500) return 'Error del servidor. Intenta de nuevo más tarde.';

  if (apiMessage.includes('invalid credentials') || apiMessage.includes('credenciales inválidas') || apiMessage.includes('credenciales')) {
    return 'Email o contraseña incorrectos. Verifica tus datos.';
  }

  if (apiMessage.includes('user already exists') || apiMessage.includes('ya existe')) {
    return 'Ya existe un usuario registrado con ese correo.';
  }

  if (apiMessage.includes('passwords do not match') || apiMessage.includes('no coinciden')) {
    return 'Las contraseñas no coinciden. Revísalas e inténtalo otra vez.';
  }

  if (apiMessage.includes('token') && apiMessage.includes('expired')) {
    return 'La sesión expiró. Inicia sesión de nuevo.';
  }

  if (apiMessage.includes('token') && apiMessage.includes('invalid')) {
    return 'El token es inválido. Vuelve a iniciar sesión.';
  }

  return 'Ocurrió un error. Intenta de nuevo.';
}

function interpretApiSuccess(payload, fallback) {
  const apiMessage = String(payload?.message || '').toLowerCase();

  if (apiMessage.includes('register') || apiMessage.includes('registrado')) {
    return 'Registro completado con éxito.';
  }
  if (apiMessage.includes('login') || apiMessage.includes('inició sesión')) {
    return 'Has iniciado sesión correctamente.';
  }
  if (apiMessage.includes('admin')) {
    return 'Datos de administración cargados correctamente.';
  }
  if (apiMessage.includes('profile')) {
    return 'Perfil cargado correctamente.';
  }
  if (apiMessage.includes('accedido exitosamente') || apiMessage.includes('zona protegida')) {
    return 'Acceso a la zona protegida verificado. Tu token es válido.';
  }

  return fallback;
}

function setLoading(isLoading) {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.classList.toggle('hidden', !isLoading);
  }

  if (isLoading) {
    showMessage('Cargando...', false);
    const resultOutput = document.getElementById('result-output');
    const adminOutput = document.getElementById('admin-output');
    if (resultOutput) resultOutput.textContent = 'Cargando...';
    if (adminOutput) adminOutput.textContent = 'Cargando...';
  } else {
    showMessage('');
  }
}

async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(interpretApiError(payload, response.status));
    }
    return payload || {};
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (error instanceof TypeError || message.includes('failed to fetch') || message.includes('networkerror')) {
      throw new Error('No se pudo conectar al servidor. Verifica tu conexión o la URL de la API.');
    }
    throw error;
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    showMessage('Completa email y contraseña.', true);
    return;
  }

  let shouldKeepLoading = false;

  try {
    setLoading(true);
    const data = await request('/api/Auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    saveToken(data.token);
    showMessage('Login exitoso. Redirigiendo al dashboard...');
    shouldKeepLoading = true;
    setTimeout(() => window.location.href = 'dashboard.html', 800);
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    if (!shouldKeepLoading) {
      setLoading(false);
    }
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const confirmPassword = document.getElementById('register-confirm-password').value.trim();

  if (!name || !email || !password || !confirmPassword) {
    showMessage('Todos los campos de registro son obligatorios.', true);
    return;
  }

  try {
    setLoading(true);
    const data = await request('/api/Auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    showMessage('Registro exitoso. Ya puedes iniciar sesión.');
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    setLoading(false);
  }
}

function redirectToLogin() {
  clearToken();
  window.location.href = 'index.html';
}

async function loadProfile() {
  setLoading(true);
  try {
    const data = await request('/api/Users/profile', {
      method: 'GET',
      headers: authHeaders()
    });
    renderOutput(data);
  } catch (error) {
    renderOutput({ error: error.message });
  } finally {
    setLoading(false);
  }
}

async function loadProtectedZone() {
  setLoading(true);
  try {
    await request('/api/Users/protected-zone', {
      method: 'GET',
      headers: authHeaders()
    });
    renderOutput({ action: 'protected-zone' });
  } catch (error) {
    renderOutput({ error: error.message });
  } finally {
    setLoading(false);
  }
}

async function loadAdminZone() {
  setLoading(true);
  try {
    const data = await request('/api/Users/admin-zone', {
      method: 'GET',
      headers: authHeaders()
    });
    renderAdminOutput(data);
  } catch (error) {
    renderAdminOutput({ error: error.message });
  } finally {
    setLoading(false);
  }
}

function renderOutput(data) {
  const output = document.getElementById('result-output');
  if (!output) return;

  if (data.error) {
    output.textContent = data.error;
    return;
  }

  if (data.customMessage) {
    output.textContent = data.customMessage;
    return;
  }

  if (data.action === 'protected-zone') {
    output.textContent = 'Acceso a la zona protegida verificado. Tu token es válido.';
    return;
  }

  if (data.id !== undefined) {
    output.textContent = `Perfil cargado correctamente.\nID: ${data.id}\nNombre: ${data.name || '-'}\nEmail: ${data.email || '-'}\nCreado en: ${data.createdAt || '-'}`;
    return;
  }

  let message = interpretApiSuccess(data, 'Operación completada correctamente.');

  if (data.userId !== undefined || data.name || data.email) {
    const usuario = [
      data.userId !== undefined ? `ID: ${data.userId}` : null,
      data.name ? `Nombre: ${data.name}` : null,
      data.email ? `Email: ${data.email}` : null
    ].filter(Boolean).join('\n');

    output.textContent = `${message}${usuario ? `\n\nUsuario:\n${usuario}` : ''}`;
    return;
  }

  output.textContent = message;
}

function renderAdminOutput(data) {
  const output = document.getElementById('admin-output');
  if (!output) return;

  if (data.error) {
    output.textContent = data.error;
    return;
  }

  const lines = [];
  lines.push(interpretApiSuccess(data, 'Zona admin cargada correctamente.'));

  if (data.userId !== undefined || data.name || data.email) {
    lines.push('');
    lines.push('Usuario:');
    if (data.userId !== undefined) lines.push(`  ID: ${data.userId}`);
    if (data.name) lines.push(`  Nombre: ${data.name}`);
    if (data.email) lines.push(`  Email: ${data.email}`);
  }

  if (data.stats) {
    lines.push('');
    lines.push('Estadísticas:');
    lines.push(`  Total usuarios: ${data.stats.totalUsers ?? '-'} `);
    lines.push(`  Usuarios activos: ${data.stats.activeUsers ?? '-'} `);
    lines.push(`  Admins: ${data.stats.adminUsers ?? '-'} `);
    if (data.stats.updatedAt) lines.push(`  Actualizado: ${data.stats.updatedAt}`);
  }

  if (data.accessedAt) {
    lines.push('');
    lines.push(`Accedido en: ${data.accessedAt}`);
  }

  output.textContent = lines.join('\n');
}

function initLoginPage() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
}

function initDashboardPage() {
  state.token = localStorage.getItem(TOKEN_KEY) || '';
  if (!state.token) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('btn-profile')?.addEventListener('click', loadProfile);
  document.getElementById('btn-protected')?.addEventListener('click', loadProtectedZone);
  document.getElementById('btn-admin')?.addEventListener('click', () => window.location.href = 'admin.html');
  document.getElementById('btn-logout')?.addEventListener('click', redirectToLogin);

  renderOutput({ customMessage: 'Token cargado. Presiona un botón para consultar la API.' });
}

function initAdminPage() {
  state.token = localStorage.getItem(TOKEN_KEY) || '';
  if (!state.token) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('btn-refresh-admin')?.addEventListener('click', loadAdminZone);
  document.getElementById('btn-back')?.addEventListener('click', () => window.location.href = 'dashboard.html');
  document.getElementById('btn-logout')?.addEventListener('click', redirectToLogin);
  loadAdminZone();
}

function init() {
  if (document.getElementById('login-form')) {
    initLoginPage();
  }

  if (document.getElementById('result-output')) {
    initDashboardPage();
  }

  if (document.getElementById('admin-output')) {
    initAdminPage();
  }
}

window.addEventListener('DOMContentLoaded', init);
