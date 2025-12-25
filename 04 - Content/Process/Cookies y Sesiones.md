---
aliases:
tags:
  - type/concept
primary categories:
secondary categories:
tertiary categories:
type: Concept
linked:
---
# Cookies y Sesiones

Como [[HTTP]] es un protocolo **sin estado (stateless)**, estas herramientas permiten que la web "recuerde" al usuario.

***

## Cookies

Son pequeños fragmentos de texto que el servidor envía al navegador.

- **Almacenamiento:** Se guardan en el disco local del usuario.
- **Uso común:** Recordar preferencias, carritos de compra o rastreo publicitario.
- **Seguridad:** Pueden marcarse como `HttpOnly` para que no sean accesibles vía JavaScript.
    

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