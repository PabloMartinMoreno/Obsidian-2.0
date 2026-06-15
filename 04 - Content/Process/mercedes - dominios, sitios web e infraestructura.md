## WHOIS — quién registró el dominio

`whois ejemplo.com` (o who.is en web) te da registrador, fechas de creación y expiración, y servidores de nombres.

Una aclaración importante para que no frustre a la alumna: desde el GDPR, los datos del titular suelen venir **ocultos** (redacción de privacidad). Ya casi nunca ves nombre y email del dueño directo. Pero la **fecha de creación**, el registrador y los name servers siguen siendo oro — sobre todo para detectar estafas: una "empresa con años de trayectoria" cuyo dominio se registró hace tres semanas y con privacidad activada es una bandera roja enorme.

## DNS — los registros del dominio

Con `dig` desde la terminal sacás los registros:

```
dig ejemplo.com ANY
dig ejemplo.com MX
dig ejemplo.com TXT
```

- **MX** te dice quién maneja el correo (Google, Microsoft, etc.).
- **TXT** suele delatar qué servicios SaaS usan (registros de verificación de Google Workspace, Microsoft 365, etc.) — inteligencia gratis sobre el stack de la organización.
- **NS, A, CNAME** completan el mapa.

En web: **DNSdumpster**, **dnslytics**, **viewdns.info** y **SecurityTrails** (freemium) hacen lo mismo con interfaz.

## Enumeración de subdominios — la superficie de ataque

Acá descubrís todo lo que cuelga del dominio (staging, vpn, dev, mail, paneles internos):

- **crt.sh** es la joya pasiva. Cada certificado TLS emitido queda en logs públicos de transparencia de certificados. Buscás `%.ejemplo.com` y te listan subdominios que de otra forma no verías. Cero contacto con el objetivo.
- Herramientas CLI que agregan muchas fuentes pasivas: **subfinder**, **amass**, **assetfinder**.

El brute force activo de subdominios ya es otra categoría: ahí sí estás generando tráfico contra la infra, y entra en el terreno de "solo con autorización".

## Infraestructura y hosting

- **IP y ASN:** dónde está alojado y de qué proveedor. **bgp.he.net** (Hurricane Electric) es excelente para ver rangos de IP y ASN; **ipinfo.io** para datos rápidos de una IP.
- **Reverse IP:** qué otros dominios comparten ese servidor (viewdns reverse IP). Sirve para encontrar sitios relacionados.
- **Shodan** y **Censys** (con plan gratuito) son buscadores de dispositivos conectados: te muestran puertos, servicios y banners expuestos en una IP. Es lo más cercano a "activo" sin serlo, porque ellos ya escanearon internet; pero usar esa info para _probar_ el sistema requiere autorización.

## Identificación de tecnología

- **Wappalyzer** (extensión de navegador) y **BuiltWith** te dicen el stack de un sitio: CMS, frameworks, analytics, hosting.
- Truco fino: sitios del **mismo dueño** suelen compartir el mismo ID de Google Analytics o AdSense. Con herramientas tipo SpyOnWeb podés buscar otros sitios que usan el mismo ID y así **destapar redes de sitios relacionados** — clave para mapear clústeres de estafa que parecen independientes.

## Historial y análisis sin visitar

- **Wayback Machine** (web.archive.org): versiones históricas de cualquier web. Ves contenido borrado, cómo era antes, qué decían y sacaron. Imprescindible.
- **urlscan.io**: enviás una URL y te devuelve un análisis en entorno aislado — captura de pantalla, qué peticiones hace, qué dominios contacta, qué tecnologías usa — **sin que vos visites el sitio**. Perfecto para inspeccionar un link sospechoso sin exponerte. Además tiene una base buscable de escaneos previos.

## La aplicación legítima: verificar si un sitio es una estafa

Esto conecta con el hilo de detección de fraudes del curso. Para chequear si una tienda, una "plataforma de inversión" o un sitio de citas es real:

- Fecha de creación del dominio en WHOIS (recién creado = sospechoso).
- urlscan del sitio para ver qué hace por detrás sin entrar.
- Reverse IP para ver con qué "vecinos" comparte servidor.
- BuiltWith para detectar si es una plantilla copiada.
- El logo por búsqueda inversa de imágenes (punto 4) para ver si están suplantando a una marca real.

## Cómo se encadena

La captura de urlscan → el logo va a búsqueda inversa → identificás a quién imitan. Los registros TXT → entendés el stack. Los subdominios → más activos para mapear. El analytics compartido → la red de sitios detrás. Todo alimenta el panorama.

## El marco legal (clave acá)

Leer DNS, WHOIS, logs de certificados y archivos es pasivo y lícito: son registros públicos. Pero **escanear puertos, hacer fuerza bruta de directorios o subdominios, o probar vulnerabilidades toca el sistema del objetivo** y solo se hace sobre lo propio o con autorización escrita. En Argentina, sondear sistemas ajenos sin permiso puede caer del lado del acceso ilegítimo según el caso. La regla para la alumna es la misma de siempre: leer lo público sí, tocar el sistema solo con scope.

## Ejercicio para vos

Sobre tu propio dominio (o uno donde tengas autorización), y en modo pasivo sobre cualquiera:

1. `whois` de un dominio y fijate la fecha de creación.
2. `dig` los registros MX y TXT de una empresa y deducí su proveedor de correo y qué SaaS usa.
3. Meté `%.dominio.com` en crt.sh y listá los subdominios.
4. Pasá un sitio por Wappalyzer y por urlscan, y leé el reporte.
5. Buscá una web vieja en Wayback Machine y mirá qué cambió.

Cuando lo tengas, seguimos con el punto 7 (geolocalización). Y al cerrar la serie te compilo todo en `.md` para Obsidian.