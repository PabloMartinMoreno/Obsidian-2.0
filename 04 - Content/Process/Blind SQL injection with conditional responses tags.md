---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
---
# Blind SQL injection with conditional responses tags

---


> [!info] Contexto En una **Blind SQLi**, la aplicación **no devuelve el resultado de la consulta ni mensajes de error**. Lo que sí cambia es el **comportamiento de la respuesta** según si la consulta es verdadera o falsa. En este lab, el punto de inyección es la cookie `TrackingId`, y la pista observable es el mensaje **"Welcome back"**: aparece cuando la condición inyectada es **verdadera** y desaparece cuando es **falsa**.

## Idea general

La cookie se inserta en una consulta del estilo:

```sql
SELECT TrackingId FROM TrackingTable WHERE TrackingId = '<cookie>'
```

Como no vemos datos, extraemos información **bit a bit** transformando cada pregunta en una condición booleana (verdadero / falso) y observando si aparece "Welcome back".

> [!tip] Comentarios SQL Se usa `--` para comentar el resto de la query. La forma `-- -` (doble guion + espacio + guion) es más segura porque algunos motores exigen un espacio después de `--`. En este lab (PostgreSQL) ambas funcionan.

---

## Resolución

### 1. Confirmar el punto de inyección

Comparar una condición siempre verdadera contra una siempre falsa:

```sql
' AND '1'='1   -- aparece "Welcome back"  → TRUE
' AND '1'='2   -- NO aparece              → FALSE
```

Si el comportamiento cambia entre ambas, la inyección booleana funciona.

### 2. Confirmar que existe la tabla `users`

```sql
' AND (SELECT 'a' FROM users LIMIT 1)='a' -- -
```

> [!note] Si aparece "Welcome back", la tabla `users` existe. `LIMIT 1` evita errores si hay varias filas.

### 3. Confirmar que existe el usuario `administrator`

```sql
' AND (SELECT username FROM users WHERE username='administrator')='administrator' -- -
```

Si la condición es verdadera, el usuario `administrator` existe en la tabla.

### 4. Averiguar la longitud de la contraseña

Se prueba la longitud con un comparador (`>`) y se hace **búsqueda binaria** sobre el número:

```sql
' AND (SELECT username FROM users WHERE username='administrator' AND LENGTH(password)>1)='administrator' -- -
```

> [!tip] Búsqueda binaria En lugar de probar 1, 2, 3, 4… uno por uno, ir partiendo el rango: `>1` → `>20` → `>15` → `>17`… hasta acotar el valor exacto. Mucho más rápido.

### 5. Extraer la contraseña carácter por carácter

Se aísla cada posición con `SUBSTRING` y se compara contra cada carácter posible:

```sql
' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a' -- -
```

- El primer parámetro de `SUBSTRING(password, posición, longitud)` es la **posición** del carácter.
- Se itera la posición (1, 2, 3, …, N) y, en cada una, se prueba el conjunto de caracteres `a-z`, `0-9`.
- Cuando aparece "Welcome back", ese es el carácter correcto en esa posición.

---

## Automatización (recomendado)

> [!warning] Hacerlo a mano es inviable Probar cada posición × cada carácter posible son **cientos de peticiones**. Conviene automatizar con **Burp Suite Intruder**.

**Setup en Burp Intruder:**

|Posición|Ataque|Payloads|
|---|---|---|
|Longitud (paso 4)|_Sniper_|Números (búsqueda binaria)|
|Carácter (paso 5)|_Cluster bomb_|Posición + conjunto `a-z0-9`|

Flujo:

1. Enviar la request con la cookie manipulada a **Intruder**.
2. Marcar como posición de payload el **índice del carácter** y el **valor comparado**.
3. Lanzar el ataque y filtrar por la respuesta que contiene **"Welcome back"** (columna _Grep – Match_ sobre ese texto).
4. Ordenar resultados para leer la contraseña carácter por carácter.

> [!success] Resultado Reconstruir la contraseña completa del `administrator`, loguearse y resolver el lab.

---
