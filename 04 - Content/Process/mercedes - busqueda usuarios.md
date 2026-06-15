## Por qué funciona

La gente reutiliza el mismo nombre de usuario en todos lados. Es comodidad pura: el mismo "jperez_22" en Instagram, en GitHub, en un foro, en una app de citas. Eso significa que si tenés un solo alias confirmado, podés rastrear dónde más existe esa cuenta y reconstruir una huella digital completa a partir de una sola pieza.

En términos del ciclo de inteligencia: el username es tu _semilla_. Lo enumerás (recolección), confirmás cuáles son realmente de la misma persona (procesamiento/análisis), y desde cada cuenta sacás datos nuevos que alimentan la siguiente búsqueda.

## Las herramientas

**WhatsMyName** (whatsmyname.app) es el estándar y el mejor punto de partida. Es web, gratis, no instalás nada. Escribís un usuario y consulta cientos de sitios para decirte en cuáles existe esa cuenta. Lo mantiene Micah Hoffman y su base de datos alimenta a muchas otras herramientas.

**Sherlock** es la versión por línea de comandos, open source (proyecto `sherlock-project` en GitHub). Para vos que estás cómodo en la terminal:
```
python3 sherlock usuario
```

Recorre unos cientos de plataformas y te devuelve las URLs donde encontró la cuenta. Acepta varios usuarios a la vez y podés exportar el resultado.

**Maigret** es la evolución más completa (`soxoj/maigret`). Cubre muchísimos más sitios (miles), y además de decirte dónde existe la cuenta, intenta extraer datos del perfil y te genera un reporte en HTML o PDF:
```
maigret usuario
```

Para un investigador es el más rico de los tres.

**Namechk / KnowEm / Instant Username Search** son web, pensadas originalmente para ver si un nombre de marca está disponible — pero sirven igual para OSINT: si el nombre está "ocupado" en una plataforma, es porque hay una cuenta ahí.

## Cómo funcionan por dentro (esto te conviene entenderlo como docente)

No tienen magia. Cada plataforma tiene una URL de perfil predecible: `github.com/USUARIO`, `instagram.com/USUARIO`, etc. La herramienta arma esa URL con el usuario que le diste, hace la petición, y analiza la respuesta para decidir si la cuenta existe o no (por el código HTTP o por un texto característico de la página de "no encontrado").

Entender esto importa porque explica el principal problema: los **falsos positivos**. Algunos sitios devuelven una página genérica con código 200 aunque la cuenta no exista, y la herramienta lo marca como hit erróneamente. Nunca confíes en el resultado crudo: hay que verificar a mano.

## La parte crítica: verificación

Acá está el 80% del valor real, y es lo que separa a un investigador serio de alguien que junta links. **Que el alias exista en diez sitios no significa que sean la misma persona.** "jperez" en GitHub puede ser un programador en India y "jperez" en TikTok una adolescente en México.

Para confirmar que las cuentas son del mismo individuo, correlacionás:
- **Foto de perfil** → la pasás por búsqueda inversa de imágenes (el punto 4 que ya vimos). Si la misma cara aparece en varias, es buena señal.
- **Datos de la bio:** ubicación, nombre real, enlaces, otros handles que mencionan.
- **Fecha de creación**, estilo de escritura, intereses, contactos en común.

Solo cuando varias piezas coinciden afirmás que es la misma persona. Esto es directamente el antídoto contra el sesgo de confirmación: hay que descartar activamente, no solo acumular coincidencias.

## El pivote (cómo se encadena con el resto)

Una vez confirmada una cuenta, casi siempre te abre puertas nuevas:
- La bio suele revelar el **nombre real**, un **email**, un sitio web personal u **otros alias**.
- Esos datos nuevos vuelven a entrar al circuito: el nombre real va a Google dorking, el email a Have I Been Pwned, la foto a búsqueda inversa, el nuevo alias a otra ronda de enumeración.

Así es como una sola semilla termina armando un panorama completo, siempre con información pública.

## Truco que mejora mucho los resultados

La gente varía sus alias de forma predecible. Probá permutaciones: con números (`jperez22`, `jperez_91`), con guiones bajos o puntos (`j.perez`, `j_perez`), con sufijos (`jperezreal`, `jperez.oficial`), con el año. Generá esas variantes y pasalas todas. Muchas veces la cuenta "escondida" es solo una variación de la obvia.

## Aplicación legítima concreta

Para detección de catfishing: agarrás el handle de un perfil sospechoso, lo enumerás, y mirás si la identidad es **consistente** entre plataformas o si se contradice. Un perfil real tiene una huella coherente y con historia; uno falso suele existir en un solo lado, ser reciente, y usar fotos que aparecen en otras cuentas con otro nombre.

## Ejercicio para vos

Buscá tu propio usuario habitual:

1. Pasalo por WhatsMyName.
2. Después por Sherlock o Maigret desde la terminal.
3. Revisá los resultados uno por uno y descartá los falsos positivos a mano (entrá y fijate si la cuenta es tuya de verdad).
4. Tomá una cuenta tuya y mirá qué datos nuevos da su bio que servirían para pivotar.
5. Probá variaciones de tu alias y mirá cuáles encuentran cuentas que la búsqueda directa no.

Vas a ver tu propia huella y, de paso, entendés en carne propia por qué reutilizar usuarios expone tanto.

