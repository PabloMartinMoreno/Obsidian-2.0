## El concepto

El nombre técnico es _Google hacking_, acuñado por Johnny Long. La idea: Google indexa una cantidad enorme de cosas que están públicas pero que nadie encuentra con una búsqueda normal, porque no sabe preguntar. Los operadores te dejan filtrar con precisión quirúrgica: por sitio, por tipo de archivo, por dónde aparece la palabra, etc. Combinándolos, encontrás en segundos lo que de otra forma sería imposible.

## Operadores fundamentales

**De lógica y texto:**

- `"frase exacta"` — fuerza la coincidencia literal. `"Juan Carlos Pérez"` no traerá "Juan Pérez Carlos".
- `OR` (o `|`) — alternativas. `arquitecto OR ingeniero`.
- `-` — excluye. `jaguar -auto` (el animal, no el coche).
- `*` — comodín, reemplaza una palabra desconocida. `"el mejor * de Argentina"`.
- `( )` — agrupa. `(arquitecto OR ingeniero) "Juan Pérez"`.
- `AROUND(n)` — proximidad: las palabras a no más de _n_ de distancia. `Pérez AROUND(3) Buenos Aires`.

**De localización (los más potentes):**

- `site:` — restringe a un dominio. `site:linkedin.com` o `site:gob.ar`.
- `filetype:` (o `ext:`) — por extensión. `filetype:pdf`, `filetype:xlsx`, `filetype:docx`.
- `intitle:` — la palabra en el título de la página. `intitle:curriculum`.
- `allintitle:` — todas las palabras en el título.
- `inurl:` — la palabra en la URL. `inurl:perfil`.
- `intext:` — la palabra en el cuerpo del texto.
- `related:` — sitios similares a uno dado. `related:infobae.com`.

**De fecha:**

- `before:` y `after:` — rango temporal. `noticia "Juan Pérez" after:2022-01-01 before:2023-01-01`.

## Operadores que ya NO sirven (importante saberlo)

- `cache:` — Google lo eliminó en 2024. Para ver versiones guardadas o borradas, ahora se usa **Wayback Machine**, no Google.
- `link:` e `info:` — deprecados y poco fiables.
- `+` — ya no existe; para forzar una palabra usá comillas.

Te lo aclaro porque vas a encontrar tutoriales viejos que los mencionan y no funcionan.

## Cómo se combinan (acá está la verdadera potencia)

Un dork real es un apilamiento de operadores. Ejemplos legítimos:

- Huella de una persona en una red: `site:linkedin.com "Juan Pérez" "Buenos Aires"`
- Documentos públicos con su nombre: `"Juan Pérez" filetype:pdf`
- Presencia en redes sin un sitio puntual: `"juanperez" (site:instagram.com OR site:twitter.com OR site:github.com)`
- Menciones en medios en un período: `"Juan Pérez" intitle:noticia after:2023-01-01`

La lógica: cada operador recorta el universo de resultados. Vas agregando filtros hasta quedarte solo con lo relevante.

## El uso en seguridad (con el marco correcto)

Acá conecta directo con tu mundo del pentesting. El dorking también sirve para descubrir _qué deja expuesto una organización sin querer_: directorios abiertos, paneles de login, archivos de configuración, backups. Ejemplos del tipo:

- `site:ejemplo.com filetype:env` (archivos de configuración expuestos)
- `intitle:"index of" site:ejemplo.com` (listados de directorios abiertos)
- `site:ejemplo.com inurl:login` (paneles de acceso)

El límite ético y legal es claro y es el mismo que ya manejás: esto se hace **sobre tu propia infraestructura o sobre un objetivo con autorización por escrito** (el scope del pentest). Buscar a ver qué credenciales ajenas andan sueltas para usarlas ya es otra cosa. La técnica es neutra; el marco lo da la autorización. Para tu alumna, esto va del lado de "evaluá tu propia exposición".

## Recurso de referencia

La **Google Hacking Database (GHDB)**, alojada en Exploit-DB, es un catálogo enorme de dorks clasificados (archivos sensibles, dispositivos, mensajes de error, etc.). Sirve para aprender la sintaxis viendo ejemplos reales y, en un contexto profesional, para auditar la exposición de un sistema autorizado. Es la mejor fuente para ver hasta dónde llega la técnica.

## Detalles prácticos que conviene que sepas

- **Google no muestra todo:** personaliza resultados, limita la cantidad por consulta y, si hacés muchas búsquedas automatizadas, te corta con un captcha. Para volumen serio se usa otra cosa, pero para aprender, el navegador alcanza.
- **Otros buscadores tienen sus propios operadores:** Bing usa `contains:` para tipos de archivo y es bueno para algunas cosas; **Yandex** suele indexar contenido que Google no; **DuckDuckGo** respeta más los operadores literales. Probá la misma consulta en los tres: los resultados cambian bastante.
- **Modo textual:** las comillas evitan que Google "interprete" o corrija tu búsqueda, algo clave cuando buscás algo específico.

## Ejercicio para que practiques vos

Investigate a vos mismo, escalando la dificultad:

1. `"tu nombre completo"` a secas. Mirá qué sale.
2. Agregá `site:` de cada red donde tengas cuenta.
3. Probá `"tu nombre" filetype:pdf` — te puede sorprender qué documentos tuyos están públicos.
4. Buscá tu usuario habitual (no tu nombre) con `inurl:` y `site:`.
5. Anotá qué encontraste y de dónde: ese es tu primer ejercicio de "recolección" del ciclo de inteligencia.

Cuando lo tengas masticado, seguimos con el punto 2 (búsqueda de nombre de usuario) y vas viendo cómo se encadenan. Y cuando terminemos toda la serie te compilo el material completo en `.md` para Obsidian, ¿te parece?