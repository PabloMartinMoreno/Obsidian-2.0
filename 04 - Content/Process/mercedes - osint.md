## El mapa: por dónde empezar

**OSINT Framework** (osintframework.com). No es una herramienta, es un directorio gigante de herramientas ordenadas por categoría (email, usuario, imágenes, dominios, etc.). Es tu punto de partida y tu mapa: cuando no sepas qué usar para algo, lo buscás acá. Abrilo y navegá las ramas.

## 1. Buscadores y "dorking"

La habilidad más subestimada. Google bien usado es más potente que la mayoría de las herramientas. Operadores básicos:

- `"texto exacto"` — busca la frase literal.
- `site:dominio.com` — limita a un sitio. Ej: `site:linkedin.com "Juan Pérez"`.
- `filetype:pdf` — busca por tipo de archivo. Ej: `"Juan Pérez" filetype:pdf`.
- `intitle:` / `inurl:` — busca en el título o la URL.
- `-palabra` — excluye. `OR` — alternativas.

Combinás todo: `"juan perez" site:instagram.com OR site:facebook.com`. Eso es _dorking_. Probá también **Yandex** y **DuckDuckGo**: dan resultados distintos a Google, y a veces mejores.

## 2. Búsqueda de nombre de usuario

La gente reutiliza el mismo alias en todos lados. Si encontrás un username, podés rastrear su presencia en cientos de plataformas.

- **WhatsMyName** (whatsmyname.app): web, gratis, sin instalar nada. Escribís un usuario y te dice en qué sitios existe esa cuenta.
- **Sherlock** y **Maigret**: lo mismo pero por línea de comandos (open source en GitHub), más completo. Para vos que venís de la terminal: `python3 sherlock usuario`.

Cómo se usa en la práctica: encontrás un alias en una red, lo metés acá, y descubrís que la misma persona lo usa en un foro, en GitHub, en una app de citas, etc. Así se reconstruye una huella.

## 3. Correos electrónicos

- **Have I Been Pwned** (haveibeenpwned.com): ponés un email y te dice en qué filtraciones de datos apareció. Gratis. Sirve para autoprotección (ver si tu mail está comprometido) y para verificar antigüedad de una cuenta.
- **Holehe** (open source): te dice en qué sitios está registrado un email, sin notificar al dueño. Útil para verificar identidades.

## 4. Búsqueda inversa de imágenes (clave para catfishing)

Esta es la estrella para verificar si alguien es quien dice ser. Agarrás una foto de perfil y averiguás de dónde salió.

- **Google Lens / Google Imágenes**, **TinEye** (tineye.com) y **Yandex Imágenes**. Subís la imagen (o pegás la URL) y te muestra dónde más aparece en internet.

Caso típico y 100% legal: alguien recibe fotos de un supuesto match. Las pasás por TinEye y Yandex; si esas mismas fotos aparecen en otra cuenta con otro nombre, es un perfil robado → catfish. Yandex suele ser el mejor de los tres.

Una aclaración importante: existen motores de _reconocimiento facial_ (que buscan la cara de una persona, no la imagen exacta). Son legal y éticamente turbios, se prestan al acoso, y te recomiendo dejarlos afuera, sobre todo en un curso. Con búsqueda inversa de imagen clásica te alcanza y sobra.

## 5. Metadatos de archivos e imágenes

Las fotos y documentos guardan metadatos (fecha, a veces ubicación GPS, dispositivo).

- **ExifTool** (línea de comandos, open source) o visores web como **metadata2go**. Subís una imagen pública y ves qué información trae embebida.
- **FotoForensics**: detecta si una imagen fue editada (análisis de niveles de error).

Ojo: las redes sociales suelen borrar los metadatos al subir, así que esto sirve más con archivos originales compartidos directamente.

## 6. Dominios, sitios web e infraestructura

Más del lado técnico, conecta con tu mundo:

- **whois** (who.is) — quién registró un dominio.
- **crt.sh** — registros de certificados, revela subdominios.
- **Wayback Machine** (web.archive.org) — versiones históricas de cualquier web. Oro puro: ves cómo era una página o un perfil en el pasado, aunque lo hayan borrado.
- **urlscan.io** — analiza un sitio sin visitarlo directamente.
- **Shodan** (tiene plan gratis) — buscador de dispositivos conectados a internet. Más para seguridad que para personas.

## 7. Geolocalización

Ubicar dónde se tomó una foto a partir de pistas visuales (carteles, arquitectura, sombras).

- **Google Maps / Street View / Earth** para contrastar.
- **SunCalc** — calcula posición del sol y sombras para estimar hora/lugar.

Es una habilidad de análisis (la usás en los desafíos de verificación tipo Bellingcat) más que una herramienta de un clic.

## 8. Frameworks de automatización (para más adelante)

Cuando ya domines lo manual:

- **SpiderFoot** (open source) — automatiza recolección de OSINT sobre un objetivo.
- **Maltego Community Edition** (gratis, limitado) — visualiza relaciones entre datos como un grafo.
- **recon-ng** — framework de reconocimiento estilo terminal.

---

**Cómo te recomiendo aprenderlo vos, en orden:**

1. Empezá con **Google dorking** practicando sobre vos mismo.
2. Sumá **búsqueda inversa de imágenes** (TinEye/Yandex) con tus propias fotos.
3. **WhatsMyName** con tus alias.
4. **Have I Been Pwned** con tus correos.
5. **Wayback Machine** sobre cualquier web vieja.

Investigarte a vos mismo es el mejor laboratorio: aplicás todo, no tocás a nadie, y de paso ves tu propia exposición. Para practicar de forma estructurada y ética, mirá **Bellingcat** (tienen guías y ejercicios gratis) y **Trace Labs**, que organiza desafíos de OSINT para ayudar a encontrar personas desaparecidas — práctica real sin cruzar ninguna línea.

Si querés, te compilo todo esto en un `.md` para Obsidian, con las categorías, los links, ejemplos de uso y un plan de práctica paso a paso, así lo tenés como material tuyo de estudio antes de armar las clases. ¿Lo armo?