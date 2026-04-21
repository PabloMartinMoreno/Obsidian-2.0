---
aliases:
tags:
  - type/concept
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Herramientas de crawling

Son herramientas que automatizan el proceso de rastreo, haciéndolo más rápido y eficiente, y permitiéndote concentrarte en el análisis de los datos extraídos.

## Crawlers web populares

- **Burp Suite Spider:** Burp Suite, una plataforma muy usada para testing de aplicaciones web, incluye un crawler activo poderoso llamado _Spider_. Spider sobresale mapeando aplicaciones web, identificando contenido oculto y descubriendo potenciales vulnerabilidades.
    
- **OWASP ZAP (Zed Attack Proxy):** ZAP es un escáner de seguridad para aplicaciones web, libre y de código abierto. Puede usarse en modo automático y manual, e incluye un componente _spider_ para rastrear aplicaciones y detectar posibles vulnerabilidades.
    
- **Scrapy (framework en Python):** Scrapy es un framework versátil y escalable en Python para construir crawlers personalizados. Ofrece muchas funcionalidades para extraer datos estructurados, manejar escenarios de crawling complejos y automatizar el procesamiento. Su flexibilidad lo hace ideal para tareas de reconocimiento a medida.
    
- **Apache Nutch (crawler escalable):** Nutch es un crawler extensible y escalable escrito en Java. Está diseñado para manejar rastreos masivos por toda la web o enfocarse en dominios específicos. Requiere más expertise técnico para configurar, pero su potencia lo vuelve valioso en proyectos de reconocimiento a gran escala.
    

## Buenas prácticas éticas

Respetar prácticas éticas y responsables al rastrear es crucial sin importar la herramienta que elijas. Siempre obtén permiso antes de rastrear un sitio (especialmente si pensás hacer escaneos extensos o intrusivos). Cuidá los recursos del servidor y evitá sobrecargarlos con solicitudes excesivas.

## Scrapy

Vamos a aprovechar **Scrapy** y un _spider_ personalizado diseñado para reconocimiento en `inlanefreight.com`. Si querés más información sobre técnicas de crawling/spidering, fijate en el módulo _Using Web Proxies_ del curso (CWES), que forma parte del material recomendado.

## Instalando Scrapy

Antes de comenzar, asegurate de tener Scrapy instalado. Si no lo tenés, podés instalarlo con `pip` (el instalador de paquetes de Python):

```bash
pip3 install scrapy
```

## ReconSpider

Primero, ejecutá este comando en tu terminal para descargar el spider personalizado ReconSpider y extraerlo en el directorio de trabajo actual:

```bash
wget -O ReconSpider.zip https://academy.hackthebox.com/storage/modules/144/ReconSpider.v1.2.zip
unzip ReconSpider.zip
```

Con los archivos extraídos, podés ejecutar `ReconSpider.py` usando:

```bash
python3 ReconSpider.py http://inlanefreight.com
```

Reemplazá `inlanefreight.com` por el dominio que quieras spiderizar. El spider rastreará el objetivo y recolectará información valiosa.

## results.json

Después de ejecutar `ReconSpider.py`, los datos se guardarán en un archivo JSON llamado `results.json`. Podés abrirlo con cualquier editor de texto. A continuación se muestra la estructura del JSON generado:

```json
{
    "emails": [
        "lily.floid@inlanefreight.com",
        "cvs@inlanefreight.com"
    ],
    "links": [
        "https://www.themeansar.com",
        "https://www.inlanefreight.com/index.php/offices/"
    ],
    "external_files": [
        "https://www.inlanefreight.com/wp-content/uploads/2020/09/goals.pdf"
    ],
    "js_files": [
        "https://www.inlanefreight.com/wp-includes/js/jquery/jquery-migrate.min.js?ver=3.3.2"
    ],
    "form_fields": [],
    "images": [
        "https://www.inlanefreight.com/wp-content/uploads/2021/03/AboutUs_01-1024x810.png"
    ],
    "videos": [],
    "audio": [],
    "comments": [
        "<!-- #masthead -->"
    ]
}
```

## Significado de cada clave en el JSON

- **emails:** Lista de direcciones de correo encontradas en el dominio.
- **links:** URLs de enlaces hallados dentro del dominio.
- **external_files:** URLs de archivos externos (por ejemplo, PDFs).
- **js_files:** URLs de archivos JavaScript usados por el sitio.
- **form_fields:** Campos de formularios detectados (vacío en este ejemplo).
- **images:** URLs de imágenes encontradas.
- **videos:** URLs de videos (vacío en este ejemplo).
- **audio:** URLs de archivos de audio (vacío en este ejemplo).
- **comments:** Comentarios HTML encontrados en el código fuente.

## Conclusión

Explorando la estructura del `results.json` podés obtener información valiosa sobre la arquitectura de la aplicación web, su contenido y puntos de interés para investigación posterior. Recordá siempre actuar de forma ética y, cuando corresponda, con autorización para evitar problemas legales o de servicio.