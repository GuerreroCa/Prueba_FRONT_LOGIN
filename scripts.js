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

  return fallback;
}

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(interpretApiError(payload, response.status));
  }
  return payload || {};
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    showMessage('Completa email y contraseña.', true);
    return;
  }

  try {
    const data = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    saveToken(data.token);
    showMessage('Login exitoso. Redirigiendo al dashboard...');
    setTimeout(() => window.location.href = 'dashboard.html', 800);
  } catch (error) {
    showMessage(error.message, true);
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
    const data = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    showMessage('Registro exitoso. Ya puedes iniciar sesión.');
  } catch (error) {
    showMessage(error.message, true);
  }
}

function redirectToLogin() {
  clearToken();
  window.location.href = 'index.html';
}

async function loadProfile() {
  try {
    const data = await request('/api/users/profile', {
      method: 'GET',
      headers: authHeaders()
    });
    renderOutput(data);
  } catch (error) {
    renderOutput({ error: error.message });
  }
}

async function loadProtectedZone() {
  try {
    const data = await request('/api/users/protected-zone', {
      method: 'GET',
      headers: authHeaders()
    });
    renderOutput({ success: true, action: 'protected-zone' });
  } catch (error) {
    renderOutput({ error: error.message });
  }
}

async function loadAdminZone() {
  try {
    const data = await request('/api/users/admin-zone', {
      method: 'GET',
      headers: authHeaders()
    });
    renderAdminOutput(data);
  } catch (error) {
    renderAdminOutput({ error: error.message });
  }
}

function renderOutput(data) {
  const output = document.getElementById('result-output');
  if (!output) return;

  if (data.error) {
    output.textContent = data.error;
    return;
  }

  if (data.action === 'protected-zone') {
    output.textContent = 'Acceso a la zona protegida verificado. Tu token es válido.';
    return;
  }

  if (data.id !== undefined) {
    output.textContent = JSON.stringify({
      mensaje: 'Perfil cargado correctamente.',
      perfil: {
        id: data.id,
        nombre: data.name,
        email: data.email,
        creadoEn: data.createdAt
      }
    }, null, 2);
    return;
  }

  const display = {
    mensaje: interpretApiSuccess(data, 'Operación completada correctamente.'),
    usuario: {
      id: data.userId,
      nombre: data.name,
      email: data.email
    }
  };

  output.textContent = JSON.stringify(display, null, 2);
}

function renderAdminOutput(data) {
  const output = document.getElementById('admin-output');
  if (!output) return;

  if (data.error) {
    output.textContent = data.error;
    return;
  }

  output.textContent = JSON.stringify({
    mensaje: interpretApiSuccess(data, 'Zona admin cargada correctamente.'),
    admin: {
      usuario: {
        id: data.userId,
        nombre: data.name,
        email: data.email
      },
      estadisticas: data.stats,
      accedidoEn: data.accessedAt
    }
  }, null, 2);
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

  renderOutput({ message: 'Token cargado. Presiona un botón para consultar la API.' });
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
