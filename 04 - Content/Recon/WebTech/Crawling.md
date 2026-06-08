---
aliases:
  - "Crawling & Spidering"
  - Spidering
tags:
  - asset/web-app
  - technique/recon/active
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Concept
linked:
  - "[[Creepy Crawlies]]"
  - "[[robots.txt]]"
  - "[[Web Fingerprinting]]"
---

# Crawling

Crawling, a menudo llamado _spidering_, es el proceso automatizado de recorrer sistemáticamente la World Wide Web. De forma similar a cómo una araña navega su telaraña, un _web crawler_ sigue enlaces de una página a otra recopilando información. Estos crawlers son esencialmente bots que usan algoritmos predefinidos para descubrir e indexar páginas web, haciéndolas accesibles a través de motores de búsqueda o para otros fines como análisis de datos y reconocimiento web.

## Cómo funcionan los web crawlers

La operación básica de un web crawler es sencilla pero potente. Comienza con una URL semilla, que es la página inicial a rastrear. El crawler obtiene esa página, analiza su contenido y extrae todos sus enlaces. Luego añade esos enlaces a una cola y los rastrea, repitiendo el proceso de forma iterativa. Según su alcance y configuración, el crawler puede explorar un sitio web entero o incluso una gran porción de la web.

Página inicial: empiezas con la homepage que contiene link1, link2 y link3.  
Código: txt

```
Homepage
├── link1
├── link2
└── link3
```

Visitando link1: visitar link1 muestra la homepage, link2, y también link4 y link5.  
Código: txt

```
link1 Page
├── Homepage
├── link2
├── link4
└── link5
```

Continuando el rastreo: el crawler sigue esos enlaces sistemáticamente, reuniendo todas las páginas accesibles y sus enlaces.

Este ejemplo ilustra cómo un web crawler descubre y recolecta información siguiendo enlaces de forma sistemática, diferenciándose del _fuzzing_, que consiste en adivinar enlaces potenciales.

## Tipos de estrategias de crawling

Existen principalmente dos estrategias de crawling.

### Crawling en anchura (Breadth-First Crawling)

Diagrama de flujo que muestra una URL semilla que lleva a la Página 1, que se ramifica a Página 2 y Página 3. Página 2 conecta a Página 4 y Página 5, mientras que Página 3 conecta a Página 6 y Página 7.

El crawling en anchura prioriza explorar la amplitud de un sitio antes que su profundidad. Comienza rastreando todos los enlaces de la página semilla, luego pasa a los enlaces de esas páginas, y así sucesivamente. Esto es útil para obtener una visión amplia de la estructura y el contenido de un sitio web.

### Crawling en profundidad (Depth-First Crawling)

Diagrama de flujo que muestra una URL semilla que lleva a la Página 1, luego a la Página 2. Página 2 conecta a Página 3, que se ramifica a Página 4 y Página 5.

En contraste, el crawling en profundidad prioriza la profundidad sobre la amplitud. Sigue una sola ruta de enlaces hasta donde sea posible antes de retroceder y explorar otras rutas. Esto puede ser útil para encontrar contenido específico o llegar a partes profundas de la estructura de un sitio.

La elección de la estrategia depende de los objetivos específicos del proceso de rastreo.

## Extracción de información valiosa

Los crawlers pueden extraer una amplia variedad de datos, cada uno con un propósito específico en el proceso de reconocimiento:

- **Enlaces (internos y externos):** Son los bloques fundamentales de la web, conectando páginas dentro de un sitio (enlaces internos) y hacia otros sitios (enlaces externos). Los crawlers recogen estos enlaces meticulosamente, permitiendo mapear la estructura del sitio, descubrir páginas ocultas e identificar relaciones con recursos externos.
    
- **Comentarios:** Las secciones de comentarios en blogs, foros u otras páginas interactivas pueden ser una mina de información. Los usuarios a menudo revelan sin querer detalles sensibles, procesos internos o pistas sobre vulnerabilidades.
    
- **Metadatos:** Los metadatos son datos sobre los datos. En páginas web incluyen títulos, descripciones, palabras clave, autor y fechas. Estos metadatos ofrecen contexto sobre el contenido, propósito y relevancia de una página para los objetivos de reconocimiento.
    
- **Archivos sensibles:** Los crawlers pueden configurarse para buscar activamente archivos sensibles que podrían estar expuestos por error en un sitio. Esto incluye copias de seguridad (.bak, .old), archivos de configuración (web.config, settings.php), archivos de registro (error_log, access_log) y otros archivos que contengan contraseñas, claves de API u otra información confidencial. Revisar cuidadosamente los archivos extraídos, especialmente backups y configuraciones, puede revelar credenciales de bases de datos, claves de cifrado o fragmentos de código fuente.
    

## La importancia del contexto

Entender el contexto que rodea los datos extraídos es fundamental.

Un dato aislado, como un comentario que mencione una versión específica de software, puede no parecer relevante por sí solo. Sin embargo, al combinarlo con otros hallazgos —por ejemplo, una versión desactualizada indicada en metadatos o un archivo de configuración potencialmente vulnerable descubierto mediante crawling— puede convertirse en un indicador crítico de una vulnerabilidad.

El verdadero valor de los datos extraídos reside en conectar los puntos y construir una imagen completa del paisaje digital del objetivo.

Por ejemplo, una lista de enlaces extraídos puede parecer inicialmente mundana. Pero al examinarla con más detalle, notas un patrón: varias URL apuntan a un directorio llamado `/files/`. Eso despierta tu curiosidad y decides visitar manualmente el directorio. Para tu sorpresa, el directorio tiene listado de archivos habilitado, exponiendo múltiples archivos, incluidos backups, documentos internos y posiblemente datos sensibles. Este hallazgo no habría sido evidente mirando enlaces individuales de forma aislada; el análisis contextual te llevó a ese descubrimiento.

De igual modo, comentarios aparentemente inocuos pueden adquirir relevancia cuando se correlacionan con otros hallazgos. Un comentario que mencione un "file server" puede no alertar inicialmente, pero si se combina con el descubrimiento del directorio `/files/`, refuerza la posibilidad de que el servidor de archivos sea accesible públicamente, exponiendo información sensible.

Por lo tanto, es esencial abordar el análisis de datos de manera holística, considerando las relaciones entre distintos puntos de datos y sus posibles implicancias para los objetivos de reconocimiento.