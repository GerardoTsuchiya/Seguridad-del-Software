---
estado: completo
materia: Seguridad del Software
tipo: proyecto
tags: [seguridad-del-software, owasp, a10-2025, manejo-de-excepciones, express, nodejs, uabc]
fecha: 2026-05-07
related: ["[[express-middleware-errores]]", "[[codigos-de-estado-http]]", "[[jwt-autenticacion]]"]
---

# A10:2025 — Mishandling of Exceptional Conditions

> Nota guía para el proyecto del 2do Parcial de Seguridad del Software. Contiene la teoría OWASP, la documentación del proyecto y la estructura completa de la exposición de 30 minutos.

**Repositorio:** https://github.com/GerardoTsuchiya/Seguridad-del-Software  
**Rama vulnerable:** `main` | **Rama corregida:** `fixed`

---

## 1. ¿Qué es A10:2025 según OWASP?

### Definición

**A10:2025 - Mishandling of Exceptional Conditions** ("Manejo incorrecto de condiciones excepcionales") es una categoría del OWASP Top 10 2025 que describe vulnerabilidades causadas cuando una aplicación no define correctamente qué debe ocurrir cuando algo falla.

Una condición excepcional es cualquier situación no contemplada en el flujo normal: un parámetro que falta, un token inválido, una entrada con formato inesperado, un servicio externo que no responde. Cuando el código no maneja esas situaciones de forma explícita y segura, el sistema puede:

- **Permitir acceso que debería estar bloqueado** (failing open)
- **Revelar información interna al usuario** (información sensible en errores)
- **Ejecutar operaciones incompletas** (parámetros faltantes con valores por defecto inseguros)
- **Dejar de funcionar parcial o totalmente** (excepción no controlada / DoS)

### Por qué es importante

El manejo de errores suele diseñarse al final del desarrollo, como algo secundario. Pero desde la perspectiva de seguridad, los errores son exactamente el momento en que el atacante actúa: provoca condiciones anómalas a propósito para observar cómo responde el sistema.

Esta categoría afecta los tres pilares de la seguridad:

| Pilar | Cómo se ve afectado |
|---|---|
| **Confidencialidad** | Stack traces y mensajes de error revelan estructura interna |
| **Integridad** | Operaciones incompletas modifican datos con valores inseguros |
| **Disponibilidad** | Excepciones no controladas interrumpen el servicio |

### Dónde aparece en el mundo real

- Servidores en producción con **modo debug activo** (Django, Rails) que muestran código fuente al visitante.
- APIs que devuelven mensajes de excepción SQL con nombres de tablas y columnas.
- Sistemas de autenticación con SSO que dejan pasar al usuario cuando el proveedor de identidad está caído.
- Servicios de pago que aprueban transacciones cuando el módulo antifraude lanza una excepción.
- Controles de acceso físico (torniquetes, cerraduras inteligentes) que abren la puerta si pierden conexión al servidor.

### Relación con otras categorías OWASP

A10 no es una falla aislada: cuando se maneja mal una excepción, frecuentemente se combinan otras vulnerabilidades:

- **A01 - Broken Access Control**: el failing open es una falla de control de acceso causada por un error no manejado.
- **A05 - Injection**: errores de SQL mal manejados exponen la estructura de la base de datos.
- **A09 - Security Logging Failures**: al no separar los logs internos de las respuestas al usuario, se filtran detalles técnicos.

---

## 2. El proyecto

### Descripción general

Se desarrolló una aplicación web con **Node.js + Express** que simula un panel administrativo. La app contiene cuatro rutas intencionalmente vulnerables para demostrar distintos tipos de fallas de manejo de excepciones.

El proyecto tiene dos ramas:

- `main`: versión vulnerable, para el ataque en vivo (Red Team).
- `fixed`: versión corregida, para la defensa (Blue Team).

Adicionalmente se desarrolló una **app móvil con Expo** que permite a los asistentes interactuar con las vulnerabilidades desde sus teléfonos en tiempo real durante la presentación.

### Stack tecnológico

| Componente | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Datos en memoria | Arreglos JS en `data.js` |
| Autenticación | Middleware manual con token Bearer |
| App móvil | Expo (React Native) con React Navigation |
| CORS | Habilitado para permitir conexiones desde la app |

### Estructura de archivos

```
A10-2025_Avance/
├── src/
│   ├── app.js       # Servidor y rutas
│   ├── auth.js      # Middleware de autenticación
│   └── data.js      # Usuarios y reportes en memoria
├── mobile/
│   ├── App.tsx      # Navegación principal (IS_FIXED controla la rama)
│   ├── config.js    # IP del servidor para la app móvil
│   ├── screens/     # Una pantalla por vulnerabilidad
│   └── components/  # AttackResult, VulnInfo
├── package.json
└── README.md
```

### Cómo correr la app

**Backend:**
```bash
npm install
npm start
# Servidor en http://localhost:3000
```

**App Expo (para la presentación en vivo):**
```bash
# Editar mobile/config.js con la IP de la laptop
# Asegurarse que laptop y teléfonos estén en la misma red WiFi

cd mobile
npx expo start
# Escanear el QR con Expo Go
```

---

## 3. Las cuatro vulnerabilidades

### 3.1 Failing Open — `/admin`

**Qué es:** El sistema toma la decisión más permisiva ante un error de autenticación, en lugar de la más restrictiva.

**Código vulnerable (`auth.js` en `main`):**
```js
function insecureAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            throw new Error("Falta el encabezado de autorización");
        }
        if (authorization !== "Bearer admin-token") {
            throw new Error("Token inválido");
        }
        req.user = { id: 1, name: "Ana Torres", role: "admin" };
        next();
    } catch (error) {
        console.error("Validación fallida:", error.message);
        next(); // ← VULNERABILIDAD: el error se ignora y la petición continúa
    }
}
```

**Ataque:**
```bash
curl http://localhost:3000/admin
# Resultado: muestra el panel administrativo sin token
```

**Por qué es peligroso:** El `catch` no responde con error, llama a `next()` y deja pasar la petición. Cualquier persona sin credenciales puede acceder al panel.

**Código corregido (`auth.js` en `fixed`):**
```js
function secureAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return res.status(401).json({ error: 'Token requerido' });
        }
        if (authorization !== 'Bearer admin-token') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.user = { id: 1, name: 'Ana Torres', role: 'admin' };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Error de autenticación' });
        // ↑ CORRECCIÓN: cualquier error bloquea el acceso con 401
    }
}
```

**Principio aplicado:** *Fail closed* — ante cualquier error de seguridad, denegar el acceso.

**Casos reales documentados:**

> **CVE-2023-20198 — Cisco IOS XE (octubre 2023, CVSS 10.0)**
> El componente de UI web de IOS XE tenía una falla en el middleware de autenticación: una petición HTTP crafteada hacia `/webui/logoutconfirm.html` con un header `X-Auth-Token` vacío o malformado provocaba que el proceso de autenticación lanzara una excepción interna. En lugar de denegar el acceso, el sistema retornaba un token de sesión válido con privilegios de nivel 15 (máximo administrativo). Se explotó activamente antes de que Cisco publicara el parche; más de 40,000 dispositivos fueron comprometidos según datos de Censys y Shodan. Los atacantes instalaban una backdoor persistente vía implante Lua en el sistema de archivos.

> **CVE-2022-40684 — Fortinet FortiOS / FortiProxy (octubre 2022, CVSS 9.8)**
> El endpoint de API de administración (`/api/v2/cmdb/`) implementaba autenticación vía módulo FGFM. Si el cliente enviaba el header `Forwarded: for=127.0.0.1` (simulando una petición desde localhost), el módulo de autenticación lo clasificaba como tráfico interno de confianza y omitía la verificación de credenciales por completo. El resultado era acceso read-write a la configuración completa del firewall, incluyendo la capacidad de crear cuentas de administrador y modificar reglas. Fortinet notificó en privado a clientes antes del aviso público porque ya había explotación activa en la red.

---

### 3.2 Exposición de errores sensibles — `/debug-user`

**Qué es:** Cuando ocurre un error, el servidor devuelve detalles técnicos internos directamente al usuario.

**Código vulnerable (`app.js` en `main`):**
```js
app.get('/debug-user', (req, res) => {
    try {
        if (!req.query.id) throw new Error("Falta el parámetro 'id'");
        const userId = parseInt(req.query.id);
        if (isNaN(userId)) throw new Error("El id debe ser un número");
        const user = users.find(u => u.id === userId);
        if (!user) throw new Error("Usuario no encontrado");
        res.json(user);
    } catch (error) {
        res.status(500).json({
            error: "Error al buscar el usuario",
            message: error.message,
            stacktrace: error.stack,   // ← VULNERABILIDAD: árbol de llamadas expuesto
            path: req.path,            // ← ruta interna del archivo
            originalUrl: req.originalUrl,
            query: req.query
        });
    }
});
```

**Ataque:**
```bash
curl http://localhost:3000/debug-user
# Resultado: stack trace completo con rutas y nombres de archivos internos
```

**Por qué es peligroso:** El atacante obtiene: framework usado, rutas de archivos del servidor, lógica interna, parámetros esperados. Con esa información puede construir ataques dirigidos.

**Código corregido (`app.js` en `fixed`):**
```js
app.get('/debug-user', (req, res, next) => {
    try {
        if (!req.query.id) {
            return res.status(400).json({ error: 'Parámetro id requerido' });
        }
        const userId = parseInt(req.query.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'El parámetro id debe ser un número' });
        }
        const user = users.find(u => u.id === userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ id: user.id, name: user.name, role: user.role });
    } catch (error) {
        next(error); // ← pasa al manejador central, no expone nada al usuario
    }
});

// Manejador central de errores (al final de app.js):
app.use((err, req, res, next) => {
    console.error('Error interno:', err.message); // solo en logs del servidor
    res.status(500).json({ error: 'Error interno del servidor' });
});
```

**Principio aplicado:** Los detalles técnicos solo van a los logs del servidor. El usuario solo recibe mensajes genéricos y códigos HTTP adecuados.

**Casos reales documentados:**

> **Cloudbleed — Cloudflare (febrero 2017)**
> El parser HTML de Cloudflare (escrito en C con Ragel) tenía un bug de buffer over-read: ante ciertos patrones de HTML malformado, el parser leía más allá del buffer asignado y retornaba memoria adyacente del proceso al cliente HTTP como parte del contenido de la página. Esa memoria contenía fragmentos de otras peticiones HTTP procesadas por el mismo worker: cookies de sesión, tokens de autenticación, passwords en texto claro y headers privados de otros usuarios. Google Project Zero lo descubrió porque los bots de Bing y Google estaban indexando páginas con esa memoria filtrada. El bug estuvo activo durante aproximadamente 6 meses (septiembre 2016 – febrero 2017) afectando millones de sitios detrás de Cloudflare.

> **Django `DEBUG=True` en producción (patrón recurrente)**
> Cuando `DEBUG=True` está activo en Django, cualquier excepción no manejada genera una página HTML detallada que expone: stack trace completo con nombres de archivos y números de línea, valores de todas las variables locales en cada frame, y el contenido completo de `settings.py` incluyendo `SECRET_KEY`, contraseñas de base de datos y credenciales de servicios cloud. Instalaciones gubernamentales y empresariales documentadas en HackerOne (reports #152569 y #362331) permitieron a investigadores obtener credenciales de base de datos directamente desde la página de error 500.

---

### 3.3 Parámetros faltantes mal manejados — `/admin/change-role`

**Qué es:** Cuando faltan datos obligatorios en una operación sensible, el servidor usa valores por defecto inseguros en lugar de rechazar la petición.

**Código vulnerable (`app.js` en `main`):**
```js
app.post('/admin/change-role', (req, res) => {
    try {
        var { userId, role } = req.body;

        if (!userId) {
            userId = 1;       // ← VULNERABILIDAD: asigna userId 1 (el admin) por defecto
        }
        if (!role) {
            role = 'admin';   // ← VULNERABILIDAD: asigna el rol más alto por defecto
        }

        const user = users.find(u => u.id === parseInt(userId));
        if (user) {
            user.role = role;
            res.json({ message: "Rol actualizado con éxito", user });
        } else {
            res.status(404).json({ error: "Usuario no encontrado" });
        }
    } catch (error) { ... }
});
```

**Ataque:**
```bash
curl -X POST http://localhost:3000/admin/change-role \
  -H "Content-Type: application/json" \
  -d '{"userId":"2"}'
# Resultado: usuario 2 queda con rol "admin" aunque no se envió el role
```

**Por qué es peligroso:** Una petición incompleta resulta en escalada de privilegios. El atacante no necesita saber el formato correcto: puede enviar datos parciales y el servidor completa los valores por él.

**Código corregido (`app.js` en `fixed`):**
```js
app.post('/admin/change-role', (req, res, next) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) {
            return res.status(400).json({ error: 'userId y role son requeridos' });
            // ↑ CORRECCIÓN: aborta la operación si faltan datos
        }
        const validRoles = require('./data').roles;
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Rol no válido' });
        }
        const user = users.find(u => u.id === parseInt(userId));
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        user.role = role;
        res.json({ message: 'Rol actualizado', userId: user.id, newRole: user.role });
    } catch (error) {
        next(error);
    }
});
```

**Principio aplicado:** Las operaciones sensibles deben abortarse completamente si faltan datos. No se asumen valores por defecto en operaciones de modificación de privilegios.

**Casos reales documentados:**

> **Parler API — enero 2021**
> Tras la suspensión de Parler por AWS, una archivista (@donk_enby) descubrió que la API pública de Parler no requería autenticación para endpoints de lectura y los IDs de posts eran enteros secuenciales sin rate limiting ni validación de rango (`/v1/post?id=1`, `/v1/post?id=2`…). Las URLs de videos y fotos retornaban metadatos EXIF originales sin stripping, incluyendo coordenadas GPS precisas. Mediante un script de enumeración secuencial simple se descargaron aproximadamente 70 TB de contenido (videos, fotos, posts) en ~48 horas. Los metadatos GPS de videos grabados el 6 de enero de 2021 en el Capitolio de EE. UU. fueron utilizados posteriormente por investigadores del FBI.

> **Enumeración de cuentas — API de Facebook/Instagram (2019)**
> El endpoint de recuperación de contraseña de Meta retornaba respuestas HTTP diferentes según si el email o teléfono existía en la base de datos: HTTP 200 con `{"exists": true}` para cuentas válidas, HTTP 400 para inexistentes. Sin rate limiting efectivo y sin validar correctamente los parámetros de paginación. El investigador Saugat Pokharel demostró la enumeración masiva de millones de números de teléfono y los reportó vía HackerOne. Meta pagó $30,000 USD de bug bounty y corrigió normalizando las respuestas y agregando rate limiting.

---

### 3.4 Excepción no controlada / DoS simple — `/reports`

**Qué es:** Una entrada no validada provoca una excepción que expone información interna y puede afectar la disponibilidad del servicio.

**Código vulnerable (`app.js` en `main`):**
```js
app.get('/reports', (req, res) => {
    try {
        const month = req.query.month;
        const report = reports[month]; // ← sin validación: si month=0 o month=abc,
                                       //   report es undefined
        res.json({
            month: report.month,       // ← VULNERABILIDAD: TypeError al leer .month de undefined
            incidents: report.incidents,
            ...
        });
    } catch (error) {
        res.status(500).json({
            error: "Error al buscar el reporte",
            message: error.message,    // "Cannot read properties of undefined"
            stacktrace: error.stack,   // ← árbol de llamadas expuesto
            path: req.path,
            query: req.query
        });
    }
});
```

**Ataques:**
```bash
curl "http://localhost:3000/reports"           # sin parámetro
curl "http://localhost:3000/reports?month=0"   # mes inválido
curl "http://localhost:3000/reports?month=abc" # tipo incorrecto
# Resultado: error técnico con stack trace y nombre de variable interna
```

**Por qué es peligroso:** Un atacante puede enviar entradas inválidas de forma masiva para saturar el servidor o para obtener información del sistema. En esta demo el servidor sigue activo, pero en sistemas más complejos una excepción no controlada puede dejar el proceso en estado inconsistente.

**Código corregido (`app.js` en `fixed`):**
```js
app.get('/reports', (req, res, next) => {
    try {
        const month = req.query.month;
        if (!month) {
            return res.status(400).json({ error: 'Parámetro month requerido' });
        }
        const monthNum = parseInt(month);
        if (isNaN(monthNum) || !reports[monthNum]) {
            return res.status(400).json({ error: 'Mes inválido. Use un número entre 1 y 3' });
        }
        const report = reports[monthNum];
        res.json({ month: report.month, incidents: report.incidents, status: report.status });
    } catch (error) {
        next(error); // manejador central, sin exposición de detalles
    }
});
```

**Principio aplicado:** Validar la entrada antes de operar. Si el parámetro no cumple el formato esperado, rechazar con `400 Bad Request` antes de intentar acceder a los datos.

**Casos reales documentados:**

> **Cloudflare — Outage global del 2 de julio de 2019 (27 minutos)**
> Cloudflare desplegó una nueva regla WAF para detectar ataques de path traversal. La expresión regular incluida en la regla causaba backtracking catastrófico exponencial O(2ⁿ) ante tráfico real de producción: un solo hilo de CPU llegaba al 100% intentando evaluar cada petición entrante. Cloudflare no tenía mecanismo de circuit-breaker ni timeout por regla en su motor de regex. El resultado fue que todos los CPUs de todos los puntos de presencia globales se saturaron simultáneamente. El outage duró 27 minutos y afectó aproximadamente el 15–20% del tráfico de internet de ese momento. El post-mortem oficial de Cloudflare está publicado en su blog.

> **CVE-2018-12121 — Node.js HTTP DoS (noviembre 2018, CVSS 7.5)**
> El parser HTTP interno de Node.js no validaba correctamente el tamaño de los headers HTTP entrantes. Un atacante podía enviar una petición HTTP con headers de longitud máxima (~80 KB cada uno) repetidos miles de veces. El servidor intentaba parsear todos los headers antes de retornar cualquier error, consumiendo CPU y memoria de forma proporcional al tamaño total de la petición, sin necesidad de completar un handshake válido. Afectaba todas las versiones de Node.js anteriores a 6.15.0, 8.14.0, 10.14.0 y 11.3.0. El fix fue agregar un límite de 8 KB por header y rechazar la conexión inmediatamente al excederlo.

---

## 4. App móvil para la presentación

### Objetivo

La app Expo permite que los asistentes participen en la demo desde sus teléfonos. Cada pantalla muestra:

1. Una descripción corta de la vulnerabilidad.
2. Una sección "¿Por qué es una vulnerabilidad?" con la causa raíz y casos reales.
3. Botones para ejecutar el ataque desde el teléfono.
4. La respuesta del servidor en tiempo real.

En la rama `fixed`, la sección educativa desaparece y el banner "Versión segura 🔒" aparece en cada pantalla.

### Pantallas

| Pantalla | Tab | Vulnerabilidad |
|---|---|---|
| FailingOpenScreen | Auth | Failing open en `/admin` |
| SensitiveErrorScreen | Error | Errores sensibles en `/debug-user` |
| MissingParamScreen | Param | Parámetros faltantes en `/admin/change-role` |
| DosScreen | DoS | Excepción no controlada en `/reports` |

### Configuración antes de la presentación

1. Correr `npm start` en la laptop (backend en puerto 3000).
2. Obtener la IP WiFi de la laptop (`ipconfig` → Dirección IPv4).
3. Editar `mobile/config.js`:
   ```js
   export const BASE_URL = 'http://TU_IP:3000';
   ```
4. Correr `npx expo start` desde la carpeta `mobile/`.
5. Compartir el QR con los asistentes para que lo escaneen con Expo Go.
6. Para pasar a la rama fixed: `git checkout fixed && npm start`. La app Expo no necesita reiniciarse.

---

## 5. Estructura de la exposición (30 minutos)

La exposición sigue cuatro actos. A continuación se describe qué decir y qué mostrar en cada uno.

---

### Acto 1 — El Concepto (~5 minutos)

**Objetivo:** que la audiencia entienda qué es A10:2025 antes de ver el ataque.

**Puntos a cubrir:**

1. **¿Qué son las condiciones excepcionales?**
   - Son situaciones que el flujo normal no contempla: parámetros que faltan, tokens inválidos, entradas inesperadas, servicios caídos.
   - El código siempre tiene dos caminos: el flujo feliz y lo que pasa cuando algo falla.

2. **¿Por qué es una categoría OWASP?**
   - El manejo de errores se diseña al final, como algo secundario.
   - El atacante actúa exactamente cuando el sistema está en estado de error.
   - Fue incluida en el Top 10 2025 porque muchas brechas reales se originan aquí.

3. **Los cuatro tipos de falla que veremos:**
   - Failing open: error en autenticación → el sistema deja pasar.
   - Errores sensibles: excepción → el sistema revela información interna.
   - Parámetros faltantes: datos incompletos → el sistema usa valores inseguros.
   - Excepción no controlada: entrada inválida → el sistema falla y expone detalles.

4. **Impacto en la tríada CIA:**
   - Confidencialidad: stack traces y rutas internas quedan expuestos.
   - Integridad: operaciones con datos incompletos modifican el estado.
   - Disponibilidad: excepciones sin manejar pueden interrumpir el servicio.

---

### Acto 2 — El Ataque en Vivo / Red Team (~10 minutos)

**Objetivo:** demostrar cada vulnerabilidad de forma visible para toda la audiencia.

**Preparación:** tener el backend corriendo en `main`, la app Expo activa y compartir el QR.

**Demo 1 — Failing Open:**
- Ir a `/admin` en el navegador sin ningún token.
- Mostrar que la app muestra el panel aunque no haya credenciales.
- Repetir desde la app Expo (botón "Sin token").

**Demo 2 — Errores sensibles:**
- Ir a `/debug-user` sin parámetro `id`.
- Mostrar la respuesta JSON con stack trace, ruta del archivo y parámetros.
- Repetir desde la app Expo.

**Demo 3 — Parámetros faltantes:**
- Enviar un POST a `/admin/change-role` con solo `{ "userId": "2" }`.
- Mostrar que el servidor responde `200 OK` y asigna rol `admin` al usuario 2.
- Repetir desde la app Expo.

**Demo 4 — DoS simple:**
- Ir a `/reports?month=0` y a `/reports?month=abc`.
- Mostrar el error técnico con `Cannot read properties of undefined` y stack trace.
- Repetir desde la app Expo.

---

### Acto 3 — La Causa Raíz (~7 minutos)

**Objetivo:** mostrar las líneas exactas del código que permiten cada vulnerabilidad.

| Vulnerabilidad | Archivo | Línea clave | Problema |
|---|---|---|---|
| Failing open | `src/auth.js` | `next()` en el `catch` | El error se silencia y la petición continúa |
| Errores sensibles | `src/app.js` | `stacktrace: error.stack` | El árbol de llamadas se envía al cliente |
| Parámetros faltantes | `src/app.js` | `userId = 1` / `role = 'admin'` | Valores por defecto inseguros en lugar de abortar |
| DoS simple | `src/app.js` | `reports[month]` sin validar | Acceso a propiedad de `undefined` |

**Mensaje central a transmitir:** todos estos errores tienen una causa común. El código no define qué debe pasar cuando algo sale mal, y el sistema improvisa de forma insegura.

---

### Acto 4 — La Solución / Blue Team (~8 minutos)

**Objetivo:** demostrar que las correcciones hacen que los mismos ataques fallen.

**Cambiar a la rama fixed:**
```bash
git checkout fixed
npm start
```

La app Expo detecta automáticamente el cambio (porque apunta al mismo servidor). El banner "Versión segura 🔒" aparece en cada pantalla.

**Repetir los cuatro ataques y mostrar los resultados correctos:**

| Ataque | Resultado esperado en `fixed` |
|---|---|
| `/admin` sin token | `401 Unauthorized` con `{ "error": "Token requerido" }` |
| `/debug-user` sin id | `400 Bad Request` con `{ "error": "Parámetro id requerido" }` |
| `change-role` sin role | `400 Bad Request` con `{ "error": "userId y role son requeridos" }` |
| `/reports?month=0` | `400 Bad Request` con `{ "error": "Mes inválido. Use un número entre 1 y 3" }` |

**Principios de defensa a mencionar:**

1. **Fail closed:** ante cualquier error de seguridad, denegar el acceso. Nunca llamar `next()` en un `catch` de autenticación.
2. **Mensajes genéricos al usuario:** el usuario solo ve un mensaje controlado. Los detalles técnicos van a los logs del servidor.
3. **Validar antes de operar:** verificar que los parámetros existen, tienen el tipo correcto y están dentro de los valores permitidos antes de ejecutar cualquier lógica.
4. **Abortar operaciones incompletas:** si faltan datos obligatorios en una operación sensible, rechazar con `400` sin modificar ningún estado.
5. **Manejador central de errores:** un solo punto en Express que captura cualquier excepción no manejada y devuelve una respuesta genérica, evitando que un error inesperado exponga información.

---

## 6. Consideraciones del proyecto

- **Sin base de datos real:** los datos están en memoria (`data.js`) para simplificar la demo y evitar tiempo de configuración. Esto es suficiente para demostrar las vulnerabilidades.
- **Autenticación simplificada:** el token válido es `Bearer admin-token` en texto plano, intencionalmente simple para la demo. En una app real se usaría JWT con firma criptográfica.
- **CORS habilitado:** fue necesario para que la app Expo en el teléfono pueda comunicarse con el backend en la laptop durante la presentación.
- **IS_FIXED en App.tsx:** la constante `IS_FIXED` en `mobile/App.tsx` controla el comportamiento visual de la app (banner y sección educativa). Se cambia a `true` en la rama `fixed` para reflejar la versión segura.
- **La app Expo no requiere reinicio:** solo el backend cambia de rama. La app móvil sigue apuntando al mismo servidor y refleja los cambios automáticamente.
- **La sección educativa solo está en `main`:** el componente `VulnInfo` en cada pantalla muestra la causa raíz y casos reales solo cuando `isFixed` es `false`. Sirve como guía durante la demo para la audiencia.

---

## 7. Resumen para las diapositivas

Estructura sugerida de slides basada en los 4 actos (aprox. 12-15 slides):

1. **Portada** — Título, nombres, OWASP A10:2025
2. **¿Qué son las condiciones excepcionales?** — Definición + flujo feliz vs. flujo de error
3. **¿Por qué importa?** — Impacto en CIA + estadísticas / ejemplos reales
4. **Las 4 fallas que demostraremos** — Tabla resumen
5. **Demo en vivo — Red Team** *(slide de transición, 1 slide por vulnerabilidad o slide único)*
6. **Vuln 1: Failing Open** — Diagrama / código antes
7. **Vuln 2: Errores Sensibles** — Diagrama / código antes
8. **Vuln 3: Parámetros Faltantes** — Diagrama / código antes
9. **Vuln 4: DoS Simple** — Diagrama / código antes
10. **La Causa Raíz** — Tabla con archivo, línea y problema (del Acto 3)
11. **La Solución — Blue Team** *(slide de transición)*
12. **Los 5 principios de defensa** — Fail closed, mensajes genéricos, validar antes, abortar incompletos, handler central
13. **Demo fixed en vivo** *(slide de transición)*
14. **Conclusión** — Una app segura trata los errores como parte del diseño, no como casos secundarios
15. **Preguntas**
