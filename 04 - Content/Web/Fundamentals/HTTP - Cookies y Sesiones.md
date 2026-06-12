---
aliases:
tags:
  - asset/web-app
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
  - "[[Web Fundamentals]]"
kind: SubCheatSheet
linked:
  - "[[HTTP]]"
  - "[[Cookie Fingerprinting]]"
---
# Cookies y Sesiones

Como [[HTTP]] es un protocolo **sin estado (stateless)**, estas herramientas permiten que la web "recuerde" al usuario.

---

## Cookies

Son pequeños fragmentos de texto que el servidor envía al navegador.

- **Almacenamiento:** Se guardan en el disco local del usuario.
- **Uso común:** Recordar preferencias, carritos de compra o rastreo publicitario.

### Atributos de Seguridad

| **Atributo** | **Función** | **Relevancia ofensiva** |
|:---|:---|:---|
| `HttpOnly` | Cookie no accesible vía `document.cookie` (JS) | Sin él → robo de sesión vía XSS. |
| `Secure` | Cookie solo viaja por HTTPS | Sin él → captura en MITM/HTTP plano. |
| `SameSite=Strict/Lax/None` | Controla envío cross-site de la cookie | `None`/ausente → habilita CSRF. |
| `Domain` | Alcance de dominio (`.target.com` = subdominios) | Scope amplio → abuso cross-subdomain. |
| `Path` | Alcance de ruta (`/admin`) | Path-scoping como flag de privilegio. |
| `Expires` / `Max-Age` | Vida de la cookie | Persistente → ventana de replay larga. |

^http-cookies

> [!tip] Recon
> El nombre de la cookie de sesión delata el lenguaje/framework del backend → [[Cookie Fingerprinting]].


## Sesiones

Es un mecanismo para persistir datos del usuario en el lado del servidor.

- Funcionamiento: 
	1. El servidor crea un Session ID.
    2. Se envía ese ID al navegador mediante una cookie.
    3. En cada petición, el navegador envía el ID y el servidor "recuerda" quién es el usuario.

> [!TIP] Diferencia clave
> 
> Las Cookies viven en el cliente; la Sesión vive en el servidor.


---
