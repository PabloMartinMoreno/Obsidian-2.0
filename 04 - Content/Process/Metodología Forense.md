---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Metodología Forense & Orden de Volatilidad

**Estándar:** RFC 3227

**Regla de Oro:** Recolectar evidencia desde lo más volátil (desaparece rápido) a lo menos volátil (persistente).

## 1. Orden de Volatilidad (Prioridad de Extracción)

_Si la máquina está encendida, seguir este orden estricto antes de cualquier otra acción._

1. **Memoria RAM:** 🔥 **CRÍTICO.** Contiene contraseñas en texto plano, claves de cifrado, conexiones activas, procesos inyectados. (Se pierde al apagar).
2. **Estado de Red / Caché:** Tablas ARP, routing, conexiones activas.
3. **Procesos en ejecución:** Estado actual del sistema.
4. **Disco Duro (HDD/SSD):** Sistema de archivos, logs guardados, documentos.
5. **Medios Externos/Archivos:** Backups, DVDs, Logs remotos.

## 2. Flujo de Trabajo (Procedimiento)

**Caso A: Equipo ENCENDIDO (Live Forensics)**
- **NO APAGAR.** Se pierde la RAM.
- **Acción:** Ejecutar herramientas desde USB externo (preparado con binarios estáticos) para dumperar la RAM (`DumpIt`, `FTK Imager Portable`, `WinPMEM`).
- Minimizar interacción para no alterar la huella de memoria.

**Caso B: Equipo APAGADO (Dead Forensics)**
- **NO ENCENDER.** Bootear altera metadatos (Last Access), logs de inicio, registro y archivos temporales.
- **Acción:** Extraer disco y conectar a estación forense usando **Bloqueador de Escritura (Write Blocker)**.

## 3. Adquisición de Imagen (Disco)

- **Objetivo:** Nunca trabajar sobre la evidencia original.
- **Método:** Clonación **Bit-a-Bit** (incluye espacio no asignado y borrado). No es un "Copy-Paste".
- **Integridad (Hashing):** Calcular Hash (MD5/SHA256) del disco original y de la imagen final.
    - `Hash(Original) == Hash(Imagen)` -> Evidencia válida.
    - Si no coinciden, la evidencia está contaminada/invalidad.

## 4. Checklist de Análisis (Triaje Rápido)

_Orden lógico para investigar artefactos en Windows:_

1. **Ejecución (¿Qué corrió?):**
    - `Prefetch`: Qué apps se ejecutaron, cuántas veces y cuándo.
    - `Shimcache` / `Amcache`: Evidencia de ejecución pasada (incluso si el .exe fue borrado).

2. **Persistencia (¿Cómo se mantiene?):**
    - Registro: `HKCU\...\Run`, `HKLM\...\RunOnce`.
    - Servicios y Tareas Programadas (`schtasks`).
    - Carpeta Inicio (Startup).

3. **Acceso/Movimiento Lateral:**
    - Event Logs: Security (ID 4624 - Login Exitoso, 4625 - Fallido).
    - System (Servicios iniciados/parados).

4. **Actividad de Usuario:**
    - `Shellbags`: Qué carpetas navegó el usuario.
    - `LNK Files` / `Jumplists`: Archivos abiertos recientemente.
    - Navegadores: Historial y descargas.

## 5. Herramientas Clave

- **RAM:** Volatility 3 (Análisis), FTK Imager (Adquisición).
- **Disco:** Autopsy (Suite completa), Eric Zimmerman Tools (Artefactos específicos: Registry, Prefetch, etc.).
- **Imagen:** Guymager (Linux), FTK Imager (Win).


___

# Orden de Comandos (Forensia & Respuesta a Incidentes)

## FASE 1: Adquisición en Vivo (Live Response)

_Objetivo: Extraer RAM y datos volátiles sin alterar el sistema. Ejecutar desde USB externo (Binarios estáticos)._

**1. Dump de Memoria (RAM)**
_Windows (usando WinPMEM):_
```PowerShell
# Sintaxis: winpmem_mini_x64.exe <nombre_salida.raw>
.\winpmem_mini_x64.exe memoria_dump.raw
```

_Linux (usando AVML o LiME):_
```Bash
# AVML (Microsoft Open Source - más seguro que dd)
./avml memoria_dump.lime
```

**2. Triage Rápido (Solo si es crítico, "Smash & Grab")**
_Windows:_
```PowerShell
# Conexiones activas y procesos asociados
netstat -ano > conexiones.txt

# Procesos corriendo
tasklist /v > procesos.txt

# Caché DNS (a dónde navegó)
ipconfig /displaydns > dns_cache.txt

# Rutas
route print > tabla_rutas.txt
```

**3. Clonado de Disco (Si el equipo está apagado/booteado con Linux Live USB)**
_Uso de `dc3dd` (mejor que `dd` estándar porque hashea al vuelo)._
```Bash
# if=input file (disco origen), of=output file (imagen), hash=algoritmo
sudo dc3dd if=/dev/sda of=/media/usb_externo/imagen_disco.img hash=sha256 log=clonado.log
```

## FASE 2: Análisis (Post-Mortem con Volatility 3)

_Objetivo: Investigar el dump de RAM. Seguir este orden para reconstruir la escena._

**1. Identificación del Perfil**
```Bash
# Ver info de la imagen (Build, OS, Arquitectura)
python3 vol.py -f memoria_dump.raw windows.info
```

**2. Procesos (Búsqueda de Malware)**
```Bash
# Lista procesos (árbol genealógico: Padre -> Hijo)
python3 vol.py -f memoria_dump.raw windows.pstree

# Compara lista de procesos vs procesos ocultos (Rootkits/DKOM)
# Si aparece en psscan pero no en pslist = Sospechoso
python3 vol.py -f memoria_dump.raw windows.psscan
```

**3. Red (Conexiones C2)**
```Bash
# Ver conexiones abiertas en el momento del dump
python3 vol.py -f memoria_dump.raw windows.netscan
```

**4. Comandos Ejecutados (Intención del atacante)**
```Bash
# Ver qué comandos se escribieron en la terminal (cmd.exe / powershell)
python3 vol.py -f memoria_dump.raw windows.cmdline
python3 vol.py -f memoria_dump.raw windows.consoles
```

**5. Inyección de Código**
```Bash
# Busca código inyectado (memory hollowing, dll injection)
python3 vol.py -f memoria_dump.raw windows.malfind
```

**6. Extracción de Archivos**
```Bash
# Busca un archivo específico en memoria
python3 vol.py -f memoria_dump.raw windows.filescan | grep "nombre_sospechoso"

# Dumpea el archivo encontrado para analizarlo (hash/virustotal)
python3 vol.py -f memoria_dump.raw windows.dumpfiles --virtaddr <DIRECCION_HEX>
```

## FASE 3: Análisis de Imagen de Disco (Linux CLI)

_Si solo tengo la imagen del disco y uso herramientas de terminal._

**1. Strings (Búsqueda bruta)**
_Útil cuando no sé qué busco. Para extraer texto legible._
```Bash
# Busca URLs, IPs o palabras clave (case insensitive)
strings -a -t d imagen_disco.img | grep -i "password"
strings -a -t d imagen_disco.img | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}"  # Buscar IPs
```

**2. Montaje (Solo Lectura)**
```Bash
# Monta imagen para explorar carpetas
mount -o ro,loop,noexec imagen_disco.img /mnt/analisis
```

**3. Línea de Tiempo (Timeline)**
```Bash
# Crea timeline de todos los archivos (bodyfile) con fls (Sleuth Kit)
fls -r -m / imagen_disco.img > timeline.body

# Convierte a formato legible (CSV)
mactime -b timeline.body -d > timeline.csv
```