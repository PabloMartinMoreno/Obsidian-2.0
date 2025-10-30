## 1. 👑 Front vs. Back

El texto divide el desarrollo web en dos mundos que, aunque distintos, se necesitan mutuamente. "Full Stack" es simplemente alguien que trabaja en ambos.

### Front End (Lo que se ve)

- **Qué es:** El lado del cliente. Todo lo que el usuario ve e interactúa en su navegador.
    
- **Tecnologías clave:** HTML (la estructura), CSS (el estilo) y JavaScript (la interactividad).
    
- **Ejecución:** El código se interpreta y ejecuta **en el navegador del usuario**.
    
- **Importancia:** Incluye el diseño de la interfaz (UI) y la experiencia de usuario (UX).
    
- **Problema de rendimiento:** Un Front End mal optimizado hace que _toda_ la aplicación se sienta lenta, incluso si el servidor (Back End) es un cohete. Debe ser _responsive_ (adaptarse a móviles, tablets, etc.).
    

### Back End (Lo que no se ve)

- **Qué es:** El lado del servidor. Es el cerebro de la operación, donde reside toda la lógica de negocio y se procesan los datos. El usuario nunca lo ve.
    
- **Los 4 Componentes Principales:**
    
    1. **Servidores Back End:** El hardware y sistema operativo (Linux, Windows) donde corre todo.
        
    2. **Servidores Web:** El software que recibe las peticiones HTTP (Apache, NGINX, IIS).
        
    3. **Bases de Datos:** Donde se almacena la información (MySQL, MSSQL, MongoDB, etc.).
        
    4. **Frameworks de Desarrollo:** El "andamio" sobre el que se construye la lógica (Laravel, Django, Spring, ASP.NET).
        
- **Seguridad:** Se puede (y se debe) aislar cada componente (ej. la BDD en un servidor, la app en otro, o usar _contenedores_ como Docker) para mitigar el impacto de un ataque.
    

## 2. 🕵️‍♂️ Seguridad

Esta es la parte más importante. La seguridad se aborda de forma diferente en cada lado.

- **Whitebox Pentesting (Caja Blanca):** Se aplica al **Front End**. Como su código (HTML, JS) es público y visible para todos en el navegador, podemos analizarlo directamente en busca de fallos.
    
- **Blackbox Pentesting (Caja Negra):** Se aplica al **Back End**. No tenemos acceso al código fuente. Atacamos "a ciegas" probando entradas, como en una **Inyección SQL** o **Inyección de Comandos**, para ver si la lógica del servidor falla.
    
- **El "cambio de juego" (LFI):** A veces, una vulnerabilidad como **Local File Inclusion (LFI)** nos permite _leer el código fuente_ del Back End. Esto es oro puro para un pentester, ya que convierte una prueba de caja negra en una de caja blanca.
    

### Errores de Desarrollador y el OWASP Top 10

El texto lista 20 errores comunes, pero el resumen es simple: **la mayoría de las vulnerabilidades nacen de la confianza**. Los errores más graves son:

- Confiar en los datos que vienen del cliente (sin validarlos).
    
- Inventar métodos de seguridad propios (en lugar de usar estándares probados).
    
- Almacenar contraseñas en texto plano (un pecado capital).
    
- Confiar en código de terceros sin verificarlo.
    

Estos errores conducen directamente a la lista de vulnerabilidades **OWASP Top 10**, que es el estándar de la industria para los riesgos más críticos en aplicaciones web. Los mencionados incluyen:

1. Control de Acceso Roto (IDOR, etc.)
    
2. Fallos Criptográficos (mala encriptación)
    
3. **Inyección** (SQLi, Command Injection)
    
4. Diseño Inseguro
    
5. Configuración de Seguridad Incorrecta
    
6. Componentes Vulnerables y Desactualizados
    
7. Fallos de Identificación y Autenticación
    
8. Fallos de Integridad de Software y Datos
    
9. Fallos de Registro y Monitoreo de Seguridad
    
10. Server-Side Request Forgery (SSRF)
    

## 3. 🔧 Conceptos Técnicos Fundamentales

### HTML (El Esqueleto)

- **Qué es:** HyperText Markup Language. No es un lenguaje de programación, sino de _marcado_. Define la estructura básica de una web (títulos, párrafos, formularios).
    
- **DOM (Document Object Model):** Este es el concepto **clave**. El navegador no lee el HTML como texto, lo convierte en un "árbol" de objetos llamado DOM. JavaScript puede manipular este árbol para cambiar la página dinámicamente. _Entender el DOM es esencial para realizar ataques de XSS (Cross-Site Scripting)_.
    

### URL Encoding (Codificación de URL)

- **Por qué existe:** Las URLs solo pueden usar un conjunto limitado de caracteres ASCII.
    
- **Cómo funciona:** Los caracteres especiales (como espacios, comillas, etc.) se reemplazan con un símbolo de porcentaje (`%`) seguido de dos dígitos hexadecimales.
    
- **Ejemplos cruciales:**
    - `espacio` se convierte en `%20` (o a veces `+`)
    - `'` (comilla simple) se convierte en `%27`
    - `"` (comillas dobles) se convierte en `%22`
        
- **Importancia:** Es fundamental para un atacante, ya que permite "contrabandear" caracteres peligrosos en una URL para que el servidor los interprete, evadiendo filtros simples.
    

