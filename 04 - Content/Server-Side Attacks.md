---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Server-Side Template Injection (SSTI)]]"
  - "[[Server-Side Includes (SSI) Injection]]"
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
---
# Server-Side Attacks

***

## Introducción a los Ataques del Lado del Servidor (Server-Side Attacks)

Los ataques del lado del servidor se dirigen a la aplicación o servicio que provee el servidor, a diferencia de los ataques del lado del cliente, que ocurren en la máquina del usuario y no en el servidor mismo. Comprender e identificar estas diferencias es esencial para realizar pruebas de penetración (_pentesting_) y _bug bounty hunting_.

Por ejemplo, vulnerabilidades como el **Cross-Site Scripting (XSS)** apuntan al navegador web (es decir, al cliente). En cambio, los ataques del lado del servidor apuntan directamente al servidor web. En este módulo, discutiremos cuatro clases de vulnerabilidades del lado del servidor:

- Server-Side Request Forgery (SSRF)
- Server-Side Template Injection (SSTI)
- Server-Side Includes (SSI) Injection
- eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection

### Server-Side Request Forgery (SSRF)

La Falsificación de Solicitudes del Lado del Servidor (SSRF) es una vulnerabilidad que permite a un atacante manipular una aplicación web para que envíe solicitudes no autorizadas desde el propio servidor. Esto suele ocurrir cuando la aplicación realiza peticiones HTTP a otros servidores basándose en datos introducidos por el usuario. La explotación exitosa de un SSRF puede permitir a un atacante acceder a sistemas internos, evadir cortafuegos (_firewalls_) y extraer información sensible.

### Server-Side Template Injection (SSTI)

Las aplicaciones web suelen utilizar motores de plantillas y _templates_ del lado del servidor para generar respuestas dinámicas, como contenido HTML. Esta generación a menudo se basa en la entrada del usuario, permitiendo que la aplicación responda dinámicamente. Si un atacante logra inyectar código de plantilla malicioso, se produce una vulnerabilidad de Inyección de Plantillas del Lado del Servidor (SSTI). El SSTI puede derivar en graves riesgos de seguridad, incluyendo la fuga de datos e incluso el compromiso total del servidor mediante la ejecución remota de código (RCE).

### Server-Side Includes (SSI) Injection

De manera similar a las plantillas, los _Server-Side Includes_ (SSI) pueden usarse para generar respuestas HTML dinámicas. Las directivas SSI instruyen al servidor web para incluir contenido adicional de forma dinámica; estas directivas se incrustan dentro de los archivos HTML. Por ejemplo, SSI se utiliza comúnmente para incluir contenido que se repite en todas las páginas, como encabezados o pies de página. Cuando un atacante logra inyectar comandos en estas directivas, ocurre una Inyección SSI. Esto puede conducir a la fuga de datos o a la ejecución remota de código.

### XSLT Server-Side Injection

La inyección del lado del servidor XSLT (_Extensible Stylesheet Language Transformations_) es una vulnerabilidad que surge cuando un atacante puede manipular las transformaciones XSLT realizadas por el servidor. XSLT es un lenguaje utilizado para transformar documentos XML en otros formatos (como HTML) y es común en aplicaciones web para generar contenido dinámico. En este contexto, los atacantes explotan debilidades en el manejo de estas transformaciones, lo que les permite inyectar y ejecutar código arbitrario en el servidor.

---
