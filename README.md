# A10:2025 Mishandling of Exceptional Conditions

Demo vulnerable para el tema **OWASP A10:2025 - Mishandling of Exceptional Conditions**.

La aplicacion simula un panel administrativo con errores intencionales de manejo de excepciones. Esta version corresponde a la rama `main`, que representa la aplicacion vulnerable para el avance de la evaluacion parcial.

> Aviso: esta app es solo para demo local y no debe publicarse como sistema real.

## Requisitos

- Node.js 18 o superior
- npm

## Instalacion y ejecucion

```bash
npm install
npm start
```

Abrir:

```txt
http://localhost:3000
```

## Vulnerabilidades implementadas

### 1. Acceso admin por failing open

**Ruta vulnerable:**

```txt
GET /admin
```

**Ataques para demo:**

```bash
curl http://localhost:3000/admin
```

```bash
curl -H "Authorization: Bearer token-invalido" http://localhost:3000/admin
```

**Resultado esperado en esta version vulnerable:**

La app muestra el panel administrativo aunque no exista un token valido.

**Causa raiz:**

El middleware de autenticacion captura el error, pero llama `next()` en lugar de responder `401 Unauthorized`. Eso significa que la aplicacion falla abierta.

### 2. Reconocimiento por errores sensibles

**Ruta vulnerable:**

```txt
GET /debug-user?id=1
```

**Ataques para demo:**

```bash
curl http://localhost:3000/debug-user
```

```bash
curl "http://localhost:3000/debug-user?id='"
```

**Resultado esperado en esta version vulnerable:**

La app responde con detalles tecnicos como stack trace, archivo interno y consulta simulada.

**Causa raiz:**

El servidor envia `err.stack` directamente al usuario. Esa informacion ayuda a un atacante a conocer estructura interna y construir ataques posteriores.

### 3. Cambio de rol con parametros faltantes

**Ruta vulnerable:**

```txt
POST /admin/change-role
```

**Ataques para demo en PowerShell:**

```powershell
curl.exe -X POST http://localhost:3000/admin/change-role -H "Content-Type: application/json" -d "{\"userId\":\"2\"}"
```

```powershell
curl.exe -X POST http://localhost:3000/admin/change-role -H "Content-Type: application/json" -d "{\"role\":\"admin\"}"
```

**Resultado esperado en esta version vulnerable:**

La app responde como si se hubiera recuperado del error y puede asignar `admin` al usuario `2`.

**Causa raiz:**

La ruta intenta adivinar valores faltantes despues de una excepcion y cambia el estado de la aplicacion de todos modos.

### 4. Denegacion de servicio simple por excepcion no controlada

**Ruta vulnerable:**

```txt
GET /reports?month=1
```

**Ataques para demo:**

```bash
curl "http://localhost:3000/reports"
```

```bash
curl "http://localhost:3000/reports?month=0"
```

```bash
curl "http://localhost:3000/reports?month=abc"
```

**Resultado esperado en esta version vulnerable:**

La ruta falla y la respuesta devuelve detalles tecnicos como el mensaje del error, stack trace, ruta interna y parametros recibidos.

**Causa raiz:**

La app usa el parametro `month` sin validarlo correctamente y maneja la excepcion filtrando detalles internos.

## Ramas esperadas para el proyecto completo

- `main`: version vulnerable.
- `fixed`: version corregida.

## Como se corregira en la rama fixed

- Falla de autenticacion: responder `401 Unauthorized`.
- Usuario sin permisos: responder `403 Forbidden`.
- Parametros faltantes o invalidos: responder `400 Bad Request`.
- Errores internos: responder mensaje generico al usuario.
- Detalles tecnicos: enviarlos solo a logs internos.
- Operaciones sensibles: abortar por completo si faltan datos.
- Manejador global de errores: centralizado y sin filtrar stack traces.

## App móvil (Expo)

La app permite a los asistentes interactuar con las vulnerabilidades desde sus teléfonos.

### Requisitos

- Expo Go instalado en el teléfono (Android o iOS)
- Laptop y teléfonos en la misma red WiFi

### Configuración antes de la presentación

1. Encontrar la IP de la laptop:
   - Windows: `ipconfig` → Dirección IPv4 del adaptador WiFi
2. Editar `mobile/config.js` y reemplazar la IP:
   ```js
   export const BASE_URL = 'http://TU_IP_AQUI:3000';
   ```

### Ejecución

En dos terminales separadas:

**Terminal 1 — Backend:**
```bash
npm start
```

**Terminal 2 — Expo:**
```bash
cd mobile
npx expo start
```

Compartir el QR que aparece en la terminal con los compañeros para que lo escaneen con Expo Go.

### Para la demo de la rama fixed

```bash
git checkout fixed
npm start
```

La app Expo no necesita reiniciarse; solo recarga o escanea el mismo QR.
