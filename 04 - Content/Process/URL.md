---
aliases:
  - Uniform Resource Locator
tags:
  - type/concept
primary categories:
secondary categories:
tertiary categories:
type: Concept
linked:
  - "[[HTTP]]"
---
# URL: Uniform Resource Locator

Una **URL** es la dirección específica que se utiliza para localizar un recurso en Internet (una página web, una imagen, un archivo). Es, en esencia, la "dirección postal" de un archivo en la red.

___

## Estructura de una URL

![[Pasted image 20251225152753.png]]

|**Componente**|**Ejemplo**|**Descripción**|
|---|---|---|
|**Esquema (Scheme)**|`http://` `https://`|Identifica el protocolo que el cliente utiliza para acceder al recurso. Termina con dos puntos y una doble barra (`://`).|
|**Usuario (User Info)**|`admin:password@`|Componente opcional que contiene las credenciales (separadas por `:`) para autenticarse ante el host. Se separa del host con una arroba (`@`).|
|**Host**|`ejemplo.com`|Indica la ubicación del recurso. Puede ser un nombre de dominio o una dirección IP.|
|**Puerto (Port)**|`:80`|Se separa del host por dos puntos (`:`). Si no se especifica, el esquema `http` usa por defecto el 80 y `https` el 443.|
|**Ruta (Path)**|`/dashboard.php`|Apunta al recurso específico (archivo o carpeta). Si no hay ruta, el servidor suele devolver un archivo por defecto (ej. `index.html`).|
|**Parámetros (Query String)**|`?login=true`|Comienza con un signo de interrogación (`?`) y contiene pares de parámetro y valor. Múltiples parámetros se separan con un ampersand (`&`).|
|**Fragmento (Fragment)**|`#status`|Procesado por el navegador en el lado del cliente para localizar una sección interna del recurso (como un encabezado o un ID específico).|

---

## Diferencia entre URL, URI y URN

Es común confundirlos, pero tienen jerarquías distintas:

> [!ABSTRACT] Analogía
> 
> - **URI (Uniform Resource Identifier):** Es el concepto general (como el nombre y dirección de una persona).
>     
> - **URL (Uniform Resource Locator):** Es la ubicación física (la dirección de su casa).
>     
> - **URN (Uniform Resource Name):** Es el nombre único (su número de identificación o DNI).
>     


---

## Caracteres Especiales y Encoding

Las URLs solo pueden contener ciertos caracteres (letras, números y algunos símbolos).

- Si una URL tiene espacios o caracteres especiales (como `ñ`), el navegador los convierte usando **Percent-encoding**.
- Ejemplo: Un espacio se convierte en `%20`.


---
