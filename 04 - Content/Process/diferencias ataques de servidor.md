# SSRF

Es una vulnerabilidad que permite a un atacante manipular una aplicación web para que envíe solicitudes no autorizadas desde el servidor. Esta vulnerabilidad suele producirse cuando una aplicación realiza solicitudes HTTP a otros servidores basándose en la información proporcionada por el usuario. La explotación exitosa de SSRF puede permitir a un atacante acceder a sistemas internos, eludir cortafuegos y obtener información confidencial. 


SSRF (*Server-Side Request Forgery*) ocurre cuando una aplicación permite que el servidor haga requests HTTP hacia destinos controlados por el atacante.

El atacante aprovecha funciones como:

* carga de URLs
* importación de imágenes
* webhooks
* lectores RSS
* fetch remotos

## Objetivo típico

Acceder a recursos internos que normalmente no son accesibles desde Internet:

* `127.0.0.1`
* redes internas (`10.x.x.x`, `192.168.x.x`)
* metadata cloud (`169.254.169.254`)
* paneles internos

## Ejemplo

La aplicación recibe:

```http
POST /fetch
url=http://127.0.0.1:8080/admin
```

El servidor hace la request internamente y devuelve la respuesta al atacante.

## Impacto

* Port scanning interno
* Acceso a paneles internos
* Robo de credenciales cloud
* RCE indirecto
* Pivoting interno

---

# SSTI

Las aplicaciones web pueden utilizar motores de plantillas y plantillas del lado del servidor para generar respuestas, como contenido HTML, de forma dinámica. Esta generación suele basarse en la entrada del usuario, lo que permite que la aplicación web responda a dicha entrada de forma dinámica. Cuando un atacante logra inyectar código de plantilla, puede producirse una vulnerabilidad de inyección de plantillas del lado del servidor ( SSTI). Esta vulnerabilidad puede conllevar diversos riesgos de seguridad, como la fuga de datos e incluso el compromiso total del servidor mediante la ejecución remota de código. 

SSTI (*Server-Side Template Injection*) ocurre cuando el input del usuario se interpreta dentro de un motor de templates.

Motores comunes:

* Jinja2
* Twig
* Smarty
* Freemarker
* Velocity

## Ejemplo vulnerable

Python + Jinja2:

```python
template = "Hola " + user_input
render_template_string(template)
```

Input del atacante:

```jinja2
{{7*7}}
```

Resultado:

```text
49
```

Eso demuestra ejecución dentro del motor de templates.

## Impacto

Dependiendo del motor:

* lectura de archivos
* ejecución de comandos
* RCE
* acceso a variables internas

## Payload famoso (Jinja2)

```jinja2
{{ config.__class__.__init__.__globals__['os'].popen('id').read() }}
```

---

# SSI

De forma similar a las plantillas del lado del servidor, las inclusiones del lado del servidor (SSI) se pueden usar para generar respuestas HTML dinámicamente. Las directivas SSI indican al servidor web que incluya contenido adicional de forma dinámica. Estas directivas se insertan en los archivos HTML. Por ejemplo, las SSI se pueden usar para incluir contenido presente en todas las páginas HTML, como encabezados o pies de página. Cuando un atacante logra inyectar comandos en las directivas SSI, puede producirse una inyección de inclusiones del lado del servidor (SSI) . Esta inyección puede provocar fugas de datos o incluso la ejecución remota de código. 

SSI (*Server Side Includes*) es una tecnología vieja usada por servidores web para incluir contenido dinámico en HTML.

Ejemplo:

```html
<!--#echo var="DATE_LOCAL" -->
```

o:

```html
<!--#include file="header.html" -->
```

## Vulnerabilidad SSI Injection

Si el usuario puede inyectar directivas SSI en archivos procesados por el servidor:

```html
<!--#exec cmd="id" -->
```

el servidor puede ejecutar comandos.

## Impacto

* ejecución de comandos
* lectura de archivos
* RCE

## Diferencia clave

SSI no es un motor moderno de templates como SSTI.

SSI es una funcionalidad del servidor web (Apache, IIS, etc.).

---

# XSLT

La inyección en el servidor mediante XSLT (Extensible Stylesheet Language Transformations) es una vulnerabilidad que surge cuando un atacante puede manipular las transformaciones XSLT realizadas en el servidor. XSLT es un lenguaje utilizado para transformar documentos XML a otros formatos, como HTML, y se emplea comúnmente en aplicaciones web para generar contenido de forma dinámica. En el contexto de la inyección en el servidor mediante XSLT, los atacantes explotan las debilidades en el manejo de las transformaciones XSLT, lo que les permite inyectar y ejecutar código arbitrario en el servidor. 

XSLT (*Extensible Stylesheet Language Transformations*) se usa para transformar XML en:

* HTML
* texto
* otro XML

## Ejemplo

XML:

```xml
<user>
  <name>carlos</name>
</user>
```

XSLT:

```xml
<xsl:value-of select="user/name"/>
```

Resultado:

```html
carlos
```

---

# Vulnerabilidad XSLT Injection

Si el atacante controla partes del XSLT o del XML:

Puede:

* leer archivos locales
* hacer requests externas
* ejecutar extensiones peligrosas
* provocar XXE
* RCE en algunos motores

## Ejemplo peligroso

Algunos motores permiten:

```xml
<xsl:value-of select="document('file:///etc/passwd')"/>
```

o requests remotas:

```xml
document('http://internal-service/')
```

---

# Diferencias rápidas

| Tipo | Qué ataca                 | Dónde ocurre       | Objetivo típico   |
| ---- | ------------------------- | ------------------ | ----------------- |
| SSRF | Requests del servidor     | Networking/backend | Acceso interno    |
| SSTI | Motores de templates      | Backend            | Ejecutar código   |
| SSI  | Includes del servidor web | Web server         | Ejecutar comandos |
| XSLT | Transformaciones XML      | XML/XSL processors | Leer archivos/RCE |

---

# Relación entre ellas

Algunas pueden combinarse:

* SSRF → acceder a servicios internos XML/XSLT
* SSTI → ejecutar requests internas
* XSLT → SSRF mediante `document()`
* SSI → RCE directo en servidores viejos

Todas son vulnerabilidades *server-side*, pero atacan componentes distintos.
