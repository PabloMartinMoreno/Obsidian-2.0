---
aliases:
tags:
  - asset/web-app
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Archivos web

[Web Archives](https://web.archive.org/)

En el vertiginoso mundo digital, los sitios web aparecen y desaparecen, dejando solo trazos fugaces de su existencia. Sin embargo, gracias a la Wayback Machine del Internet Archive, tenemos una oportunidad única de volver al pasado y explorar las huellas digitales de los sitios tal como eran en su momento.

## ¿Qué es la Wayback Machine?

La Wayback Machine es un archivo digital de la World Wide Web y de otra información disponible en Internet. Fundada por el Internet Archive, una organización sin fines de lucro, archiva sitios web desde 1996.

Permite a los usuarios “viajar al pasado” y ver capturas de sitios web tal como aparecieron en distintos momentos de su historia. Estas instantáneas, conocidas como capturas o archivos, ofrecen una visión de versiones anteriores de un sitio web, incluyendo su diseño, contenido y funcionalidad.

## ¿Cómo funciona la Wayback Machine?

La Wayback Machine funciona mediante el uso de rastreadores web (web crawlers) que capturan instantáneas de los sitios a intervalos regulares de forma automatizada. Estos rastreadores navegan por la web siguiendo enlaces e indexando páginas, de manera similar a los rastreadores de los motores de búsqueda. Sin embargo, en lugar de limitarse a indexar la información para búsquedas, la Wayback Machine guarda el contenido completo de las páginas, incluyendo HTML, CSS, JavaScript, imágenes y otros recursos.

La operación de la Wayback Machine puede visualizarse en tres pasos:
![[Web Archives.png]]

* **Crawling (rastreo):** La Wayback Machine emplea rastreadores automatizados, a menudo llamados “bots”, para navegar sistemáticamente por Internet. Estos bots siguen enlaces de una página a otra, como haría una persona al hacer clic en hipervínculos, pero además descargan copias de las páginas que encuentran.
* **Archiving (archivo):** Las páginas descargadas, junto con sus recursos asociados como imágenes, hojas de estilos y scripts, se almacenan en el vasto archivo de la Wayback Machine. Cada página capturada se asocia a una fecha y hora específicas, creando una instantánea histórica del sitio en ese momento. Este proceso de archivado ocurre a intervalos regulares —a veces diarios, semanales o mensuales— según la popularidad del sitio y la frecuencia de sus actualizaciones.
* **Accessing (acceso):** Los usuarios pueden acceder a estas instantáneas archivadas a través de la interfaz de la Wayback Machine. Introduciendo la URL de un sitio y seleccionando una fecha, se puede ver cómo lucía el sitio en ese momento concreto. La Wayback Machine permite navegar páginas individuales y ofrece herramientas para buscar términos específicos dentro del contenido archivado o descargar sitios enteros para análisis sin conexión.

La frecuencia con la que la Wayback Machine archiva un sitio varía. Algunos sitios pueden archivarse varias veces al día, mientras que otros solo tendrán unas pocas capturas repartidas en varios años. Los factores que influyen en esta frecuencia incluyen la popularidad del sitio, su ritmo de cambios y los recursos disponibles para el Internet Archive.

Es importante señalar que la Wayback Machine no captura todas las páginas web. Prioriza sitios considerados de valor cultural, histórico o de investigación. Además, los propietarios de sitios pueden solicitar que su contenido sea excluido de la Wayback Machine, aunque esto no siempre garantiza la exclusión total.

## Por qué la Wayback Machine importa para el reconocimiento web

La Wayback Machine es una mina de información para el reconocimiento web y puede ser instrumental en varios escenarios. Su importancia radica en la capacidad de revelar el pasado de un sitio web, ofreciendo perspectivas valiosas que pueden no ser evidentes en su estado actual:

* **Descubrimiento de activos y vulnerabilidades ocultas:** Permite encontrar páginas antiguas, directorios, archivos o subdominios que ya no estén accesibles en el sitio actual y que podrían exponer información sensible o fallos de seguridad.
* **Seguimiento de cambios e identificación de patrones:** Al comparar capturas históricas, se puede observar cómo ha evolucionado un sitio, detectando cambios en la estructura, contenido, tecnologías y posibles vulnerabilidades.
* **Recolección de inteligencia:** El contenido archivado es una fuente valiosa de OSINT, proporcionando información sobre actividades pasadas del objetivo, estrategias de marketing, empleados y elecciones tecnológicas.
* **Reconocimiento sigiloso:** Acceder a instantáneas archivadas es una actividad pasiva que no interactúa directamente con la infraestructura objetivo, lo que la convierte en una forma menos detectable de recopilar información.

## Ejemplo: Wayback en HackTheBox

Podemos ver la primera versión archivada de HackTheBox introduciendo la página que buscamos en la Wayback Machine y seleccionando la captura más temprana disponible, que corresponde al **10 de junio de 2017 a las 04:23:01**.
