# Descubrimiento mediante motores de búsqueda

Los motores de búsqueda actúan como nuestros guías en el vasto paisaje de Internet, ayudándonos a navegar por la aparentemente infinita cantidad de información. Sin embargo, más allá de su función principal de responder consultas cotidianas, los motores de búsqueda también contienen un tesoro de datos que puede ser invaluable para el reconocimiento web y la recolección de información. Esta práctica, conocida como descubrimiento mediante motores de búsqueda o recolección OSINT (Inteligencia de Fuentes Abiertas), consiste en usar motores de búsqueda como herramientas potentes para descubrir información sobre sitios web objetivo, organizaciones e individuos.

En esencia, el descubrimiento mediante motores de búsqueda aprovecha el inmenso poder de los algoritmos de búsqueda para extraer datos que pueden no ser fácilmente visibles en los sitios web. Profesionales de seguridad e investigadores pueden profundizar en la web indexada empleando operadores de búsqueda especializados, técnicas y herramientas, descubriendo desde información de empleados y documentos sensibles hasta páginas de inicio de sesión ocultas y credenciales expuestas.

## Por qué importa el descubrimiento mediante motores de búsqueda

El descubrimiento mediante motores de búsqueda es un componente crucial del reconocimiento web por varias razones:

* **Fuente abierta:** La información recopilada es públicamente accesible, lo que lo convierte en un método legal y ético para obtener información sobre un objetivo.
* **Amplitud de información:** Los motores indexan una gran porción de la web, ofreciendo una amplia variedad de fuentes potenciales.
* **Facilidad de uso:** Los motores de búsqueda son fáciles de usar y no requieren habilidades técnicas especializadas.
* **Rentable:** Es un recurso gratuito y fácilmente disponible para la recolección de información.

La información que se puede obtener de los motores de búsqueda puede aplicarse de varias maneras:

* **Evaluación de seguridad:** Identificación de vulnerabilidades, datos expuestos y vectores de ataque potenciales.
* **Inteligencia competitiva:** Recolección de información sobre productos, servicios y estrategias de competidores.
* **Periodismo de investigación:** Descubrimiento de conexiones ocultas, transacciones financieras y prácticas poco éticas.
* **Inteligencia de amenazas:** Identificación de amenazas emergentes, seguimiento de actores maliciosos y predicción de ataques potenciales.

Sin embargo, es importante notar que el descubrimiento mediante motores de búsqueda tiene limitaciones. Los motores no indexan toda la información y algunos datos pueden estar deliberadamente ocultos o protegidos.

## Operadores de búsqueda

Los operadores de búsqueda son como los códigos secretos de los motores. Estos comandos y modificadores especiales desbloquean un nuevo nivel de precisión y control, permitiéndote localizar tipos específicos de información dentro de la inmensidad de la web indexada.

Aunque la sintaxis exacta puede variar ligeramente entre motores de búsqueda, los principios subyacentes son consistentes. A continuación se muestran algunos operadores esenciales y avanzados:

| Operador                  |                                                       Descripción del operador | Ejemplo                                             | Descripción del ejemplo                                                                    |
| ------------------------- | -----------------------------------------------------------------------------: | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `site:`                   |                         Limita los resultados a un sitio o dominio específico. | `site:example.com`                                  | Encuentra todas las páginas públicamente accesibles en example.com.                        |
| `inurl:`                  |                         Encuentra páginas con un término específico en la URL. | `inurl:login`                                       | Busca páginas de inicio de sesión en cualquier sitio web.                                  |
| `filetype:`               |                                          Busca archivos de un tipo particular. | `filetype:pdf`                                      | Encuentra documentos PDF descargables.                                                     |
| `intitle:`                |                      Encuentra páginas con un término específico en el título. | `intitle:"confidential report"`                     | Busca documentos titulados "confidential report" o variaciones similares.                  |
| `intext:` o `inbody:`     |                   Busca un término dentro del texto del cuerpo de las páginas. | `intext:"password reset"`                           | Identifica páginas web que contienen el término “password reset”.                          |
| `cache:`                  |                Muestra la versión en caché de una página (si está disponible). | `cache:example.com`                                 | Ver la versión en caché de example.com para ver contenido previo.                          |
| `link:`                   |                     Encuentra páginas que enlazan a una página web específica. | `link:example.com`                                  | Identifica sitios web que enlazan a example.com.                                           |
| `related:`                |                       Encuentra sitios relacionados con una página específica. | `related:example.com`                               | Descubre sitios similares a example.com.                                                   |
| `info:`                   |                    Proporciona un resumen de información sobre una página web. | `info:example.com`                                  | Obtén datos básicos sobre example.com, como título y descripción.                          |
| `define:`                 |                               Proporciona definiciones de una palabra o frase. | `define:phishing`                                   | Obtén una definición de "phishing" desde diversas fuentes.                                 |
| `numrange:`               |                                   Busca números dentro de un rango específico. | `site:example.com numrange:1000-2000`               | Encuentra páginas en example.com que contengan números entre 1000 y 2000.                  |
| `allintext:`              | Encuentra páginas que contienen todas las palabras especificadas en el cuerpo. | `allintext:admin password reset`                    | Busca páginas que contengan tanto "admin" como "password reset" en el cuerpo.              |
| `allinurl:`               |    Encuentra páginas que contienen todas las palabras especificadas en la URL. | `allinurl:admin panel`                              | Busca páginas con "admin" y "panel" en la URL.                                             |
| `allintitle:`             | Encuentra páginas que contienen todas las palabras especificadas en el título. | `allintitle:confidential report 2023`               | Busca páginas con "confidential", "report" y "2023" en el título.                          |
| `AND`                     |         Restringe resultados exigiendo que todos los términos estén presentes. | `site:example.com AND (inurl:admin OR inurl:login)` | Encuentra páginas de admin o login específicamente en example.com.                         |
| `OR`                      |           Amplía resultados incluyendo páginas con cualquiera de los términos. | `"linux" OR "ubuntu" OR "debian"`                   | Busca páginas que mencionen Linux, Ubuntu o Debian.                                        |
| `NOT`                     |                      Excluye resultados que contengan el término especificado. | `site:bank.com NOT inurl:login`                     | Encuentra páginas en bank.com excluyendo páginas de login.                                 |
| `*` (comodín)             |                                       Representa cualquier carácter o palabra. | `site:socialnetwork.com filetype:pdf user* manual`  | Busca manuales de usuario (user guide, user handbook) en formato PDF en socialnetwork.com. |
| `..` (búsqueda por rango) |                 Encuentra resultados dentro de un rango numérico especificado. | `site:ecommerce.com "price" 100..500`               | Busca productos con precio entre 100 y 500 en un sitio de e-commerce.                      |
| `" "` (comillas)          |                                                          Busca frases exactas. | `"information security policy"`                     | Busca documentos que contengan exactamente la frase "information security policy".         |
| `-` (signo menos)         |                                Excluye términos de los resultados de búsqueda. | `site:news.com -inurl:sports`                       | Busca artículos en news.com excluyendo contenido deportivo.                                |

## Google Dorking

Google Dorking, también conocido como Google Hacking, es una técnica que aprovecha el poder de los operadores de búsqueda para descubrir información sensible, vulnerabilidades de seguridad o contenido oculto en sitios web utilizando Google Search.

Aquí algunos ejemplos comunes de Google Dorks; para más ejemplos, consulta la Google Hacking Database:

* **Encontrar páginas de inicio de sesión:**

  * `site:example.com inurl:login`
  * `site:example.com (inurl:login OR inurl:admin)`

* **Identificar archivos expuestos:**

  * `site:example.com filetype:pdf`
  * `site:example.com (filetype:xls OR filetype:docx)`

* **Descubrir archivos de configuración:**

  * `site:example.com inurl:config.php`
  * `site:example.com (ext:conf OR ext:cnf)` (busca extensiones comúnmente usadas para archivos de configuración)

* **Localizar backups de bases de datos:**

  * `site:example.com inurl:backup`
  * `site:example.com filetype:sql`

