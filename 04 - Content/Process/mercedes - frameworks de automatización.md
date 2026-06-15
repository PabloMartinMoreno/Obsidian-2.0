## Las tres herramientas

**SpiderFoot** (`smicallef/spiderfoot`, open source) es un motor de reconocimiento automatizado. Le das una semilla —un dominio, IP, email, nombre o usuario— y corre cientos de módulos contra muchísimas fuentes solo, y después correlaciona todo. Tiene interfaz web que levantás local:

```
python3 sf.py -l 127.0.0.1:5001
```

Los módulos cubren DNS, WHOIS, filtraciones (se integra con Have I Been Pwned), redes sociales, threat intel, etc. Muchos funcionan sin clave; otros se desbloquean cargando API keys gratuitas (Shodan, HIBP). Es ideal para hacer un footprint amplio de una semilla con poco esfuerzo.

**Maltego** (Community Edition gratis, limitada) es la herramienta de **análisis de enlaces visual**. El paradigma: tenés _entidades_ (un dominio, una persona, un email, un teléfono) y _transforms_ (operaciones que toman una entidad y devuelven entidades relacionadas desde una fuente de datos). Arrastrás una entidad al lienzo, corrés un transform —"dominio → registros DNS", "email → filtraciones", "persona → perfiles sociales"— y el grafo se expande con lo conectado. Seguís pivoteando visualmente. Su fuerza es **ver** cómo se relacionan personas, cuentas e infraestructura en un caso complejo. Es el estándar de la industria para mapeo de relaciones. La edición Community limita la cantidad de entidades por transform y pide registro, pero alcanza de sobra para aprender.

**recon-ng** (open source, de Tim Tomes) es un framework de reconocimiento con interfaz estilo Metasploit — módulos, workspaces, seteás opciones y ejecutás. Por línea de comandos, así que va con tu perfil:

```
marketplace install all
modules load recon/domains-hosts/...
options set SOURCE ejemplo.com
run
```

Guarda los resultados en una base y te deja encadenar módulo con módulo. Está más orientado a recon de dominio/host/organización que a personas.

**Bonus:** **theHarvester** es un clásico simple y enfocado — cosecha emails, subdominios, hosts y nombres de fuentes públicas para un dominio. Buen compañero de los anteriores.

## Cuál usar para qué

- **recon-ng / theHarvester** → reconocimiento de dominio, infraestructura y organización (footprinting de pentest).
- **SpiderFoot** → red amplia automatizada sobre una semilla, con correlación y poco esfuerzo.
- **Maltego** → cuando necesitás _ver_ y manejar a mano las relaciones de un caso complejo (personas + cuentas + infra).

## Los caveats que tenés que enseñar sí o sí

1. **Activo vs. pasivo, a escala.** La automatización dispara muchísimas consultas muy rápido. Algunos módulos _tocan_ el objetivo (fuerza bruta de DNS, lookups que pegan contra la infra) o golpean APIs de terceros con fuerza. Correr SpiderFoot en modo completo contra un dominio que no es tuyo puede generar tráfico notable y, según los módulos, tocar sistemas ajenos → solo sobre lo propio o con autorización. Configurá modo **pasivo** cuando corresponda. Es la lección del scope, multiplicada.
2. **Verificación sigue siendo obligatoria.** La correlación automática genera falsos positivos igual que las herramientas de usuario. El analista verifica; no se confía en el grafo a ciegas.
3. **API keys y rate limits.** Muchos módulos rinden de verdad solo con claves gratuitas cargadas, y machacar las fuentes te termina baneando. Medí el ritmo.

## El marco ético

Lo de siempre, y acá más que nunca por el volumen: automatizar recolección pasiva de fuentes públicas está bien; automatizar el sondeo de sistemas requiere autorización; y automatizar el footprint de una _persona_ concreta tiene que respetar la línea de información pública / consentimiento / verificación, no convertirse en vigilancia masiva de un particular. La potencia de estas herramientas es justo lo que hace más importante el límite.

## Ejercicio para vos

1. Levantá **SpiderFoot** local y corré un escaneo **pasivo** sobre tu propio dominio o sobre vos. Explorá el grafo de correlación.
2. Instalá **Maltego CE**, poné tu dominio o email como entidad y corré algunos transforms; mirá cómo crece el grafo.
3. Probá **recon-ng** o **theHarvester** sobre tu propio dominio.
4. Compará lo que encontró la automatización con lo que vos encontraste a mano en los ejercicios anteriores: vas a ver el solapamiento y, sobre todo, los falsos positivos. Esa comparación es la mejor forma de entender que la herramienta no piensa por vos.

---

Con esto cerramos los ocho puntos: tenés el recorrido completo, de dorking a automatización, con el marco legal y ético atravesando todo.

Ahora sí, si querés armo el material compilado en `.md` para Obsidian: las ocho técnicas con sus herramientas, ejemplos de uso, los encadenamientos entre puntos, el marco legal (Ley 26.388 y 25.326) y los ejercicios de práctica, con frontmatter y callouts como venís usando. Decime si lo querés todo en un solo archivo o un archivo por técnica, y lo genero.