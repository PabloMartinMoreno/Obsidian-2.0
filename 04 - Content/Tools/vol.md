---
aliases:
  - volatility
tags:
primary categories:
secondary categories:
tertiary categories:
kind: Command
linked:
---
# Framework - Volatility

### 1. Triage Inicial: "¿Qué está pasando aquí?"

Lo primero es tener una visión general para detectar anomalías obvias (nombres raros, padres extraños).

**Paso A: Ver los procesos en árbol**
Esto es mejor que la lista plana porque ves relaciones. Si `iexplore.exe` (Internet Explorer) lanza `cmd.exe`, es sospechoso.
```Bash
vol -f memoria.raw windows.pstree
```

**Paso B: Ver los comandos ejecutados**
Si el atacante usó PowerShell o CMD, a menudo verás el script malicioso aquí mismo.
```bash
vol -f memoria.raw windows.cmdline
```

_Busca cosas como:_ `powershell.exe -w hidden -enc <BASE64>`

---

### 2. Investigando una Conexión Sospechosa

Supongamos que tu firewall detectó tráfico a una IP rusa. Quieres saber qué proceso lo causó.

**Paso A: Escanear la red**
```Bash
vol -f memoria.raw windows.netscan
```

_Salida:_ Ves una conexión a `192.168.1.50:4444` (puerto típico de Metasploit) y dice que el **PID es 4500**.

**Paso B: Investigar ese PID específico**
Ahora que sabes que el PID 4500 es el culpable, enfócate solo en él.
```Bash
vol -f memoria.raw windows.pslist --pid 4500
```

_Resultado:_ Resulta que el PID 4500 es `svchost.exe`. ¿Es legítimo o falso?

---

### 3. Análisis Profundo de Malware (Inyecciones)

El proceso `svchost.exe` (PID 4500) parece legítimo por nombre, pero la conexión de red dice lo contrario. Vamos a ver si tiene código inyectado.

**Paso A: Buscar inyecciones (Malfind)**
```Bash
vol -f memoria.raw windows.malfind --pid 4500
```

_Qué buscar:_ Si ves una salida con cabeceras `MZ` o `00 00 00` y permisos `PAGE_EXECUTE_READWRITE`, está infectado.

**Paso B: Ver DLLs sospechosas**
A veces no inyectan código, sino que cargan una DLL maliciosa.
```Bash
vol -f memoria.raw windows.dlllist --pid 4500
```

_Busca:_ DLLs que se ejecuten desde carpetas temporales (`C:\Users\Admin\AppData\Local\Temp\evil.dll`).

---

### 4. Extracción de Evidencia (Dumping)

Confirmaste que el PID 4500 es malware. Necesitas sacarlo de la RAM para enviarlo al equipo de Reverse Engineering o subirlo a VirusTotal.

**Opción A: Volcar el ejecutable principal**
Esto reconstruye el `.exe` original del proceso.
```Bash
vol -f memoria.raw windows.pslist --pid 4500 --dump
```

_Esto generará un archivo `pid.4500.exe` (o similar) en tu carpeta actual._

**Opción B: Volcar un archivo específico visto en memoria**
Imagina que viste `secretos.pdf` en la lista de archivos (`filescan`) y quieres recuperarlo. Primero necesitas su dirección de memoria (Offset).

1. Buscas la dirección:
    ```Bash
    vol -f memoria.raw windows.filescan | grep "secretos.pdf"
    # Salida: 0xa800e1234500 ... \Users\Bob\Documents\secretos.pdf
    ```
    
2. Lo extraes usando esa dirección:
    ```Bash
    vol -f memoria.raw windows.dumpfiles --virtaddr 0xa800e1234500
    ```
    

---

### 5. Post-Explotación: ¿Qué se llevaron?

El atacante estuvo en el sistema. ¿Robó contraseñas?

**Paso A: Volcar hashes de usuarios**
```Bash
vol -f memoria.raw windows.hashdump
```

_Salida:_ `Administrator:500:aad3b435...:31d6cfe0d16ae931b73c59d7e0c089c0:::` (Esto es lo que intentarías crackear).

**Paso B: Ver persistencia en el Registro**
¿El malware se configuró para iniciarse al prender la PC?
```Bash
vol -f memoria.raw windows.registry.printkey --key "Software\Microsoft\Windows\CurrentVersion\Run"
```

---

### Resumen: Tu "Combo" habitual

En el 90% de los casos, tu secuencia será esta:
1. `vol -f imagen.mem windows.pstree` (Ver panorama)
2. `vol -f imagen.mem windows.netscan` (Ver conexiones)
3. `vol -f imagen.mem windows.malfind --pid <PID_SOSPECHOSO>` (Confirmar infección)
4. `vol -f imagen.mem windows.pslist --pid <PID_SOSPECHOSO> --dump` (Extraer muestra)


***

## Cheatsheet


***

## Overview


***

## Notas Relacionadas


***

