# PRUEBA_FRONT_LOGIN

Frontend estático para la API de autenticación de `Prueba_API_LOGIN`.

Este proyecto ofrece:

- Página de **Login** con formulario de autenticación.
- Página de **Registro** para crear nuevos usuarios.
- **Dashboard de usuario** para consumir endpoints protegidos.
- **Admin Dashboard** para acceder a la ruta exclusiva de administradores.
- Separación de HTML, CSS y JavaScript clásica.

## Estructura del proyecto

```
PRUEBA_FRONT_LOGIN/
├── admin.html
├── dashboard.html
├── index.html
├── README.md
├── scripts.js
└── styles.css
```

## Cómo usar

1. Ejecuta la API backend de `Prueba_API_LOGIN` en `http://localhost:5000`.
2. Abre `index.html` en tu navegador.
3. Utiliza la sección de login o registro.

### Páginas disponibles

- `index.html` - Página de login y registro.
- `dashboard.html` - Dashboard de usuario autenticado.
- `admin.html` - Dashboard exclusivo para admin.

## Funcionalidades implementadas

### Login

- Consume `POST /api/auth/login`.
- Guarda el token JWT en `localStorage`.
- Redirige al usuario al dashboard.

### Registro

- Consume `POST /api/auth/register`.
- Permite crear un usuario nuevo.
- Mantiene el frontend separado en formularios claros.

### Dashboard de usuario

- Consume `GET /api/users/profile`.
- Consume `GET /api/users/protected-zone`.
- Permite cerrar sesión.
- Navega al admin dashboard cuando el usuario lo solicita.

### Admin Dashboard

- Consume `GET /api/users/admin-zone`.
- Muestra estadísticas de usuarios retornadas por la API.
- Disponible solo para usuarios con rol `admin`.

## Configuración de la API

La URL de la API está configurada en `scripts.js`:

```js
const API_BASE_URL = 'https://ominous-space-waffle-49555xw9q96f7rj6-5000.app.github.dev';
```

Si el backend corre en otra dirección o puerto, actualiza ese valor.

## Observaciones

- El frontend es puro HTML/CSS/JS sin frameworks.
- Se utiliza `fetch` para comunicarse con la API.
- El token JWT se almacena en `localStorage` para mantener la sesión.
- Las llamadas protegidas incluyen el header `Authorization: Bearer {token}`.

## Pruebas rápidas

- Accede con credenciales admin desde el backend: `admin@example.com / Admin@123`.
- Accede con credenciales de usuario regular: `test@example.com / Test@123`.
- Prueba registro de usuario nuevo y visualiza el dashboard.
- Verifica que el admin dashboard solo funciona con token admin.
