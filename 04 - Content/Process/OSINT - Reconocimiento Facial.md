## Dos cosas distintas que conviene no confundir

- **Coincidencia exacta / casi exacta:** ¿dónde más aparece _esta misma_ foto? Es el caballo de batalla para detectar fotos robadas.
- **Similitud visual:** encontrar imágenes parecidas (mismo objeto, lugar, escena). Sirve para identificar productos, lugares, geolocalizar.

Y hay una tercera, el **reconocimiento facial**, que es buscar a una _persona_ por su cara aunque sea otra foto distinta. Esa es un mundo aparte y problemático — la dejo para el final con una advertencia.

## Los motores y para qué sirve cada uno

No existe "el mejor": indexan distinto, así que **siempre usá varios**.

- **Yandex Imágenes** — el favorito del mundo OSINT. Es notablemente superior al resto encontrando otras fotos de la misma persona o escena. Si solo vas a usar uno para verificar personas, es este.
- **TinEye** (tineye.com) — el especialista en coincidencia exacta. Encuentra dónde aparece una imagen, incluso versiones modificadas, y te deja **ordenar por más antigua**: así llegás a la fuente original de una foto robada.
- **Google Lens / Imágenes** — el mejor para objetos, productos, lugares, logos y texto dentro de la imagen.
- **Bing Visual Search** y **Baidu** — a veces encuentran lo que los otros no (Baidu, sobre todo contenido del ámbito chino).

## Cómo se usa en la práctica

1. Descargá la imagen, o copiá su dirección (clic derecho → copiar dirección de imagen) para pegar la URL.
2. Subila a cada motor. No te quedes con uno solo.
3. En TinEye, ordená por "oldest" para encontrar la aparición más vieja: esa suele ser el origen real.
4. Instalá una extensión como **RevEye** o **Search by Image**: con clic derecho sobre cualquier imagen la consultás en varios motores a la vez. Te ahorra muchísimo tiempo.

## Técnicas que mejoran muchísimo los resultados

- **Recortá la imagen.** Aislá lo que importa: solo la cara, solo un logo, solo un tatuaje o un cartel de fondo. Recortar cambia radicalmente los resultados porque elimina el "ruido" del resto de la foto. Probá la imagen completa y los recortes por separado.
- Si la foto está filtrada o editada, buscá la versión original.
- Para geolocalizar, usá la similitud visual de un edificio o paisaje y contrastá con Maps/Street View.

## El flujo de detección de catfishing (la aplicación estrella)

Es 100% legal porque trabaja sobre imágenes que la persona puso públicas:

1. Tomás las fotos del perfil sospechoso.
2. Las pasás por Yandex + TinEye + Google.
3. Mirás los resultados:
    - Si las mismas fotos aparecen **con otro nombre**, en cuentas más antiguas de otra persona, o en bancos de imágenes → es un perfil falso con fotos robadas.
    - TinEye ordenado por antigüedad te muestra de dónde se las afanaron.
4. **Chequeo de consistencia:** las fotos de una persona real trazan de vuelta a sus propias cuentas coherentes; las de un catfish trazan a individuos sin relación entre sí.

Ese contraste —¿estas imágenes pertenecen a una identidad coherente o a varias personas distintas?— es la conclusión que buscás.

## Otros usos legítimos

- **Verificar desinformación:** confirmar si una foto que circula como "noticia de hoy" en realidad es de otro evento de hace años. Es una técnica básica del periodismo de investigación.
- **Geolocalización** de una imagen por sus elementos visuales.
- Identificar productos, obras, lugares, plantas, lo que sea.

Y se encadena con el punto 5: la imagen además puede traer metadatos (fecha, GPS) embebidos, así que reverse image + EXIF se complementan.

## La advertencia importante: reconocimiento facial

Existen motores que no buscan _la imagen_ sino _la cara de la persona_ en cualquier foto distinta (los conocidos son PimEyes y FaceCheck). Son una cosa fundamentalmente distinta y te recomiendo **dejarlos fuera del curso y de tu práctica**, por tres razones:

- Son una herramienta de identificación y vigilancia: permiten des-anonimizar a un desconocido y rastrear a una persona real por su cara. Es exactamente el salto de "verificar una imagen" a "perseguir a alguien".
- Legalmente son terreno minado: los datos biométricos son datos sensibles bajo la protección de datos (en Argentina, dentro del régimen de la Ley 25.326), y estos servicios ya enfrentaron sanciones en Europa.
- Éticamente, en un curso que nació de la pregunta "cómo descubrir a una pareja", entregar una herramienta de búsqueda facial es directamente poner un instrumento de acoso en la mesa.

La búsqueda inversa clásica cubre de sobra la necesidad legítima (¿esta foto es robada?, ¿este perfil es falso?). El reconocimiento facial no agrega nada que valga el riesgo. Esto, como docente, conviene que lo enseñes explícitamente como límite, no que lo omitas.

## Ejercicio para vos

Con tu propia foto de perfil:

1. Pasala por Yandex, TinEye y Google por separado y compará qué encuentra cada uno.
2. En TinEye ordená por más antigua y mirá cuál figura como origen.
3. Probá un recorte (solo tu cara, o solo el fondo) y mirá cómo cambian los resultados.
4. Fijate si alguna foto tuya aparece en lugares que no recordabas: esa es tu exposición real.

Cuando lo tengas, seguimos con el punto 5 (metadatos y análisis de imágenes), que se conecta directo con esto. Y al cerrar la serie te dejo todo compilado en `.md` para Obsidian.