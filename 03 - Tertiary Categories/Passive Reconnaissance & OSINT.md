---
aliases:
  - Reconocimiento Pasivo
tags:
  - type/moc/tertiary
  - technique/recon/passive
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
type: Tertiary Category
---
# Reconocimiento Pasivo

***

##  🕸 Public Data Mining (Dorking)
  Uso de motores de búsqueda y repositorios públicos para encontrar información expuesta.

- [[Google Dorking]] (Uso de operadores avanzados en Google para hallar archivos, paneles de login y vulnerabilidades.)
- [[GitHub Dorking]] (Búsqueda de secretos, claves API y código fuente sensible en repositorios.)
 - [[Shodan & Censys Recon]] (Búsqueda de activos expuestos e indexados por motores de búsqueda IoT.)
 - [[Pastebin & Code Leaks]] (Búsqueda de credenciales o configs en sitios de pegado de texto.)

## 🌍 Infrastructure & Asset Mapping
  Mapeo de la huella digital externa de la organización sin interactuar directamente con sus sistemas.

- [[Subdomains Passive Enumeration]] (Descubrimiento de subdominios mediante fuentes públicas como CT logs y DNS históricos.)
- [[Passive Infrastructure Identification]] (Identificación de tecnologías, proveedores de hosting y bloques de red.)
- [[Certificate Transparency Logs]] (Uso de crt.sh para encontrar subdominios nuevos y antiguos vía certificados SSL.)
- [[Wayback Machine & Archive Recon]] (Análisis de versiones antiguas de la web para encontrar archivos olvidados.)
- [[Cloud Buckets & Blobs Discovery]] (Búsqueda pasiva de buckets S3/Azure mal configurados usando nombres de empresa.)

## 👥 Human Intelligence (HUMINT)
  Recolección de información sobre empleados para ataques de ingeniería social.

- [[Social Engineering Intelligence]] (Búsqueda de correos, roles y relaciones de empleados en redes sociales y metadatos.)
- [[Email Harvesting]] (Recolección de formatos de correo corporativo (ej: nombre.apellido) usando Hunter.io o similares.)
- [[Breach Data Search]] (Búsqueda de correos y contraseñas filtradas en bases de datos de brechas públicas - ej: HaveIBeenPwned.)

## 🎣 Deception & Tracking
  Herramientas para rastrear accesos o generar trampas.

- [[CanaryTokens]] (Generación de tokens para detectar cuándo y desde dónde se accede a un recurso o enlace.)

***
