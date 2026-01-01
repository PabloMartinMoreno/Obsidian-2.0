---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[Subdominios]]"
  - "[[04 - Content/Virtual Hosts|Virtual Hosts]]"
---
# Subdominio vs Virtual Host

***

![[04 - Content/Virtual Hosts#El Virtual Host (Capa de aplicación / HTTP)]]

![[Subdominios#El Subdominio (Capa de red / DNS)]]

## Diferencias Clave

|**Característica**|**Subdominio**|**Virtual Host**|
|---|---|---|
|**Nivel**|DNS (Red)|Software (Aplicación)|
|**Propósito**|Direccionar tráfico a una IP.|Separar contenido dentro de la IP.|
|**Dependencia**|Puede existir sin un servidor web (ej. apuntando a un servidor de correo).|Necesita que el tráfico llegue al servidor para actuar.|
|**Relación**|El "Nombre" de la carpeta.|La "Puerta" lógica que abre la carpeta.|

---

## ¿Cómo interactúan en la vida real?

1. **Uno escribe** `dev.ejemplo.com` en el navegador.
2. **DNS:** Resuelve que `dev.ejemplo.com` está en la IP `1.2.3.4`
3. **Conexión:** El navegador contacta a `1.2.3.4` y le envía una petición que dice: _"**Hola, vengo a ver el sitio"
4. **Virtual Host:** El servidor recibe la petición, lee el encabezado `Host: dev.ejemplo.com` y busca en su configuración. Si encuentra un Virtual Host con ese nombre, le sirve la web de desarrollo. Si no, le sirve la web por defecto (la principal).


---

## ⚠️ El matiz de Ciberseguridad (Fuzzing)

- **Subdomain Discovery:** Busca registros públicos en servidores DNS. Si el administrador no creó el registro DNS, no lo encontrará ahí.
- **VHost Discovery (Fuzzing):** A veces, los administradores configuran un Virtual Host (ej. `interno.empresa.com`) pero **no crean el registro DNS** para que nadie de afuera lo vea.
	- Si uno lanza una petición directa a la IP del servidor cambiando manualmente la cabecera `Host` (usando herramientas como `ffuf`), el servidor responderá con el sitio "oculto" porque el Virtual Host está ahí, esperando ser llamado, aunque no tenga una "dirección oficial" en el DNS.15
