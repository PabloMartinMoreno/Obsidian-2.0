---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[Subdominio]]"
  - "[[Virtual Host|Virtual Host]]"
  - "[[Reconociendo un Subdominio de un Virtual Host]]"
---
# Subdominio vs Virtual Host

___

![[Subdominio#El Subdominio (Capa de red / DNS)]]

![[Virtual Host#El Virtual Host (Capa de aplicación / HTTP)]]


## Diferencias Clave

Para entender la diferencia, tengo que separar el **"¿A dónde voy?"** (Subdominio) del **"¿Qué me entregan?"** (Virtual Host).

### Diferencia de Capa y Ubicación

- **Subdominio:** Es un objeto de la **Capa de Red**. Vive en los servidores DNS. Es simplemente una entrada en una tabla que dice: `nombre -> IP`.
- **Virtual Host:** Es un objeto de la **Capa de Aplicación**. Vive dentro de la memoria y los archivos de configuración del servidor web (Nginx/Apache). Es un bloque de código que dice: `si el texto recibido es "nombre" -> busca en la carpeta X`.

### Diferencia de Función (El "Qué hace")

- **El Subdominio es un Direccionador:** Su única función es que mi paquete de datos sepa a qué dirección IP del mundo debe viajar. Una vez que el paquete llega a la puerta del servidor, el trabajo del subdominio termina.
- **El Virtual Host es un Clasificador:** Su función empieza cuando el paquete ya llegó al servidor. El servidor abre el paquete, lee el nombre que escribí en la URL y decide qué carpeta de su disco duro abrir.

### Diferencia de Dependencia

Esta es la parte más importante para entender que **no son lo mismo**:

- **Independencia del Subdominio:** Puedo crear un subdominio `correo.miweb.com` que apunte a una IP, pero esa IP puede ser un servidor de base de datos o de correo, no necesariamente un servidor web. El subdominio existe aunque no haya ninguna web detrás.
- **Independencia del Virtual Host:** Puedo configurar un Virtual Host llamado `secreto.local` en mi servidor. Este Virtual Host no necesita existir en ningún DNS del mundo. Si yo fuerzo a mi navegador a enviar ese nombre (editando mi `/etc/hosts` o usando `curl`), el servidor me entregará el contenido porque la regla existe internamente.

La distinción real no está en el nombre (que puede ser el mismo, ej. `dev.ejemplo.htb`), sino en **quién procesa la información** y **en qué momento de la conexión** ocurre.

___

## Cuadro comparativo 

|**Punto de Diferencia**|**Subdominio**|**Virtual Host**|
|---|---|---|
|**¿Qué es técnicamente?**|Un registro de texto en una zona DNS.|Un bloque de configuración en un archivo `.conf`.|
|**¿Quién lo procesa?**|Los servidores DNS de Internet.|El proceso `nginx`, `httpd` o `apache2`.|
|**Su responsabilidad es:**|Traducir un nombre en una IP.|Traducir un nombre en una ruta de archivos.|
|**Si falla o no existe:**|Mi computadora dice: "No se pudo encontrar la dirección".|El servidor me muestra su página por defecto (la de bienvenida).|

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
