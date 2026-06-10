---
aliases:
tags:
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
---

# Automatizando el reconocimiento

Mientras que el reconocimiento manual puede ser eficaz, también puede ser lento y propenso a errores humanos. Automatizar tareas de reconocimiento web puede mejorar significativamente la eficiencia y la precisión, permitiéndote recopilar información a gran escala e identificar vulnerabilidades potenciales con mayor rapidez.

---

## ¿Por qué automatizar el reconocimiento?

La automatización ofrece varias ventajas clave para el reconocimiento web:

- **Eficiencia:** las herramientas automatizadas realizan tareas repetitivas mucho más rápido que los humanos, liberando tiempo para el análisis y la toma de decisiones.
    
- **Escalabilidad:** permite ampliar los esfuerzos de reconocimiento a muchos objetivos o dominios, descubriendo un rango más amplio de información.
    
- **Consistencia:** las herramientas automatizadas siguen reglas predefinidas, garantizando resultados consistentes y reduciendo el riesgo de error humano.
    
- **Cobertura completa:** puede programarse para realizar tareas como enumeración DNS, descubrimiento de subdominios, rastreo web, escaneo de puertos y más, asegurando una cobertura exhaustiva de posibles vectores de ataque.
    
- **Integración:** muchos frameworks se integran fácilmente con otras herramientas, creando un flujo de trabajo fluido desde el reconocimiento hasta la evaluación de vulnerabilidades y la explotación.
    

---

## Frameworks de reconocimiento

Estos frameworks proporcionan un conjunto completo de herramientas para el reconocimiento web:

- **FinalRecon:** herramienta basada en Python que ofrece módulos para tareas como verificación de certificados SSL, información Whois, análisis de cabeceras y rastreo. Su estructura modular facilita la personalización.
    
- **Recon-ng:** framework potente en Python con múltiples módulos para enumeración DNS, descubrimiento de subdominios, escaneo de puertos, rastreo web y explotación de vulnerabilidades conocidas.
    
- **theHarvester:** enfocado en recopilar correos electrónicos, subdominios, hosts, nombres de empleados, puertos abiertos y banners desde fuentes públicas como motores de búsqueda, servidores PGP y la base de datos SHODAN.
    
- **SpiderFoot:** herramienta OSINT automatizada que recopila datos sobre IPs, dominios, correos y redes sociales, además de realizar búsquedas DNS, rastreo web y escaneos.
    
- **OSINT Framework:** colección de recursos y herramientas para inteligencia de fuentes abiertas, incluyendo redes sociales, buscadores, registros públicos y más.
    

---

## FinalRecon

FinalRecon ofrece información detallada de reconocimiento:

- **Información de cabeceras:** muestra datos del servidor, tecnologías usadas y posibles errores de configuración.
    
- **Búsqueda Whois:** revela datos de registro del dominio y contactos del registrante.
    
- **Información del certificado SSL:** analiza el certificado SSL/TLS, su validez y emisor.
    

### Rastreo (Crawler)

- **HTML, CSS, JavaScript:** extrae enlaces, recursos y posibles vulnerabilidades.
    
- **Enlaces internos/externos:** mapea la estructura del sitio y sus conexiones.
    
- **Imágenes, robots.txt, sitemap.xml:** obtiene información sobre rutas permitidas/prohibidas y estructura del sitio.
    
- **Enlaces en JavaScript, Wayback Machine:** descubre enlaces ocultos y datos históricos del sitio.
    

### Otros módulos

- **Enumeración DNS:** consulta más de 40 tipos de registros DNS, incluyendo DMARC.
    
- **Enumeración de subdominios:** usa múltiples fuentes (crt.sh, AnubisDB, ThreatMiner, CertSpotter, Facebook API, VirusTotal API, Shodan API, BeVigil API).
    
- **Enumeración de directorios:** permite listas de palabras personalizadas y extensiones de archivos.
    
- **Wayback Machine:** recupera URLs de los últimos cinco años para analizar cambios y posibles vulnerabilidades.
    

---

## Comandos de instalación

```bash
git clone https://github.com/thewhiteh4t/FinalRecon.git
cd FinalRecon
pip3 install -r requirements.txt
chmod +x ./finalrecon.py
./finalrecon.py --help
```

---

## Uso básico

```bash
./finalrecon.py [opciones]
```

### Argumentos principales

|Opción|Descripción|
|---|---|
|-h, --help|Muestra el mensaje de ayuda y sale.|
|--url URL|Especifica la URL objetivo.|
|--headers|Muestra información de cabeceras.|
|--sslinfo|Obtiene datos del certificado SSL.|
|--whois|Realiza una búsqueda Whois.|
|--crawl|Rastrea el sitio objetivo.|
|--dns|Realiza enumeración DNS.|
|--sub|Enumera subdominios.|
|--dir|Busca directorios.|
|--wayback|Recupera URLs archivadas en Wayback Machine.|
|--ps|Escaneo rápido de puertos.|
|--full|Escaneo de reconocimiento completo.|

### Opciones adicionales

|Opción|Descripción|
|---|---|
|-nb|Oculta el banner.|
|-dt|Número de hilos para enumerar directorios (por defecto 30).|
|-pt|Número de hilos para escaneo de puertos (por defecto 50).|
|-T|Tiempo de espera de solicitud (por defecto 30 s).|
|-w|Ruta a la lista de palabras (por defecto `wordlists/dirb_common.txt`).|
|-r|Permitir redirecciones.|
|-s|Activar/desactivar verificación SSL.|
|-sp|Puerto SSL (por defecto 443).|
|-d|Servidores DNS personalizados (por defecto 1.1.1.1).|
|-e|Extensiones de archivo (ejemplo: txt, xml, php).|
|-o|Formato de exportación (por defecto txt).|
|-cd|Directorio de exportación (por defecto `~/.local/share/finalrecon`).|
|-k|Añadir clave API (ejemplo: shodan@key).|

---

## Ejemplo de uso

Si queremos que FinalRecon obtenga información de cabeceras y realice una búsqueda Whois para **inlanefreight.com**, usamos:

```bash
./finalrecon.py --headers --whois --url http://inlanefreight.com
```

---
