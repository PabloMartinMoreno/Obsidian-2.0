## Por qué el email rinde tanto

Un correo es un identificador único y persistente. La gente lo cambia mucho menos que un username, lo usa para registrarse en todos lados, y lo deja escrito en lugares públicos (firmas, papers, perfiles, foros). A partir de un solo email podés averiguar en qué filtraciones apareció, en qué servicios está registrado, y muchas veces saltar a su dueño real.

## Estructura y patrones de correo

Antes de las herramientas, un concepto: los correos corporativos siguen patrones predecibles. `nombre.apellido@empresa.com`, `napellido@`, `nombre@`. Si conocés el patrón de una organización y el nombre de una persona, podés inferir su correo laboral — algo totalmente legítimo para contacto profesional o reconocimiento autorizado. **Hunter.io** justamente revela el patrón de correos de un dominio y te deja verificar si una dirección existe (tiene plan gratuito limitado).

## Las herramientas

**Have I Been Pwned** (haveibeenpwned.com) es la primera parada y la más importante para autoprotección. Ponés un email y te dice en qué filtraciones de datos apareció. Te sirve para dos cosas: ver si una cuenta está comprometida (defensa) y confirmar que el correo es real y tiene antigüedad.

**Holehe** (open source, `megadose/holehe`) te dice en qué sitios está registrado un email, y lo hace **sin notificar al dueño**:

```
holehe email@ejemplo.com
```

Revisa más de cien plataformas y te marca dónde existe una cuenta asociada a ese correo. Excelente para verificar identidades.

**Epieos** (epieos.com) es web y muy usado hoy. Le das un email y te muestra, si existe, información de la cuenta de Google asociada (a veces nombre y foto de perfil), servicios conectados, y corre chequeos tipo Holehe. Es de lo más completo sin instalar nada.

**GHunt** (`mxrch/GHunt`) es específico para cuentas de Google: dado un Gmail, extrae los datos públicos de esa cuenta (nombre, foto, reseñas en Maps, actividad pública). Requiere una configuración inicial pero da mucho.

**Gravatar:** este es un truco poco conocido. Gravatar asocia un avatar global al hash MD5 de un email. Si la persona usa Gravatar, podés recuperar su foto y a veces un perfil completo a partir del correo. Muchos sitios lo usan por detrás.

**EmailRep.io** te da una "reputación" del correo: dónde se lo ha visto, si tiene presencia social, si está marcado como malicioso.

## Cómo funcionan por dentro (para que se lo expliques bien)

Holehe y Epieos no hacen magia ni acceden a nada privado: **abusan de los flujos de "registro" y "recuperar contraseña"**. Cuando intentás registrarte o resetear la clave con un email, muchísimos sitios te responden distinto según si ese correo ya está registrado o no ("este email ya existe" vs "te enviamos un link"). La herramienta automatiza ese chequeo en decenas de sitios y deduce dónde hay cuenta, todo en silencio.

Esto te conviene marcarlo como matiz ético: la técnica consulta servicios de terceros sin avisarle al titular. Sigue siendo información que el sistema expone públicamente, pero es una zona más gris que mirar un perfil abierto. Buen tema de discusión para tu clase de ética.

## El pivote (cómo se encadena)

Desde un email saltás a todo lo demás:

- **Buscá el correo entre comillas en Google:** `"email@ejemplo.com"`. Aparece donde lo dejaron escrito públicamente (foros, currículums, repos).
- **La parte antes del @** suele ser un username → la pasás por las herramientas del punto 2.
- **Google/Gravatar** te pueden dar nombre y foto → la foto va a búsqueda inversa de imágenes (punto 4).
- El **nombre real** que obtengas vuelve a Google dorking.

Una sola dirección de correo, bien trabajada, despliega todo el circuito.

## Verificar que un correo existe

A veces solo querés confirmar si una dirección es real sin enviarle nada. Eso se hace consultando los registros MX del dominio y, en algunos casos, validando vía SMTP — que es lo que automatizan herramientas como Hunter.io. Ojo con los dominios "catch-all", que aceptan cualquier dirección y dan falsos positivos.

## La línea roja (importante)

Existen motores de búsqueda de filtraciones (Dehashed, IntelX y similares, varios pagos) que muestran datos de brechas, **incluidas contraseñas**. Para un profesional de seguridad, consultarlos sobre su **propia** exposición o la de un cliente autorizado es legítimo y útil. Pero usar credenciales filtradas de otra persona para entrar a una cuenta es delito liso y llano (acceso ilegítimo, art. 153 bis). La existencia pública del dato no habilita su uso. Esto en tu curso tiene que quedar tan claro como en pentesting: ver no es lo mismo que usar.

## Ejercicio para vos

Sobre tu propio correo:
1. Pasalo por **Have I Been Pwned** y mirá en qué filtraciones estás (probablemente te sorprenda).
2. Corré **Holehe** o **Epieos** y revisá en qué servicios figura registrado.
3. Chequeá si tenés **Gravatar** asociado.
4. Buscá tu email entre comillas en Google a ver dónde quedó escrito.
5. Tomá la parte antes del @ y pasala por las herramientas del punto 2: vas a ver cómo se encadenan correo y usuario.

Cuando lo tengas, seguimos con el punto 4 (búsqueda inversa de imágenes), que es el corazón de la detección de catfishing. Y al cerrar la serie te compilo todo en `.md` para Obsidian.