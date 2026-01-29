[[chainsaw]]

El controlador de dominio de Forela está siendo atacado. Se cree que la cuenta del administrador del dominio ha sido comprometida y se sospecha que el autor de la amenaza ha volcado la base de datos NTDS.dit en el controlador de dominio. Acabamos de recibir una alerta de que se está utilizando vssadmin en el DC, ya que esto no forma parte de la programación rutinaria, tenemos buenas razones para creer que el atacante ha abusado de esta utilidad LOLBIN para hacerse con la joya de la corona del entorno del dominio. Realice algunos análisis de los artefactos proporcionados para una clasificación rápida y, si es posible, expulse al atacante lo antes posible.

```ad-info
**NTDS.dit y Golden Ticket**

El archivo **NTDS.dit** es la base de datos del Active Directory. Contiene los objetos del dominio (usuarios, grupos) y sus secretos: **hashes NTLM** y **llaves Kerberos** (AES/RC4), tanto actuales como el historial de anteriores.

**Vector de Ataque:** Si se extrae el hash (NTLM o AES) de la cuenta **krbtgt** desde el NTDS.dit, se puede crear un **Golden Ticket**.

- **Golden Ticket (TGT Falsificado):** Permite generar un TGT válido "offline", firmándolo uno mismo con el hash de `krbtgt`. Da acceso total al dominio (persistencia) como si fuésemos cualquier usuario (ej. Domain Admin), con una validez arbitraria (ej. 10 años).
    

**Remediación:** Para invalidar un Golden Ticket activo, no alcanza con cambiar la contraseña de `krbtgt` una sola vez (porque el AD guarda el historial para validar tickets recientes). Se debe cambiar la contraseña de la cuenta **krbtgt dos veces consecutivas** para purgar el historial y forzar la invalidación inmediata de todos los TGTs en circulación.
```


```bash
chainsaw hunt *.evtx --sigma /usr/share/chainsaw/sigma --mapping /usr/share/chainsaw/mappings/sigma-event-logs-all.yml
```

| Timestamp           | Detections                               | Count | Event System Provider                      | Event ID | Record ID | Computer          | Event Data                                                                                                                                                                                       |
| :------------------ | :--------------------------------------- | :---- | :----------------------------------------- | :------- | :-------- | :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2024-05-14 03:41:56 | ‣ Crash Dump Created By Operating System | 1     | Microsoft-Windows-WER-SystemErrorReporting | 1001     | 2949      | DC01.forela.local | **param1:** 0x00000124 (0x0000000000000010, 0xffff970b136e9028, 0xffff970b0ad5a09c, 0xffff970b0aa5a1a0)<br>**param2:** C:\Windows\MEMORY.DMP<br>**param3:** 32841378-63bd-41a3-b11f-976be78eec78 |
| 2024-05-14 03:42:43 | ‣ Scheduled Task Deletion                | 1     | Microsoft-Windows-Security-Auditing        | 4699     | 5934      | DC01.forela.local | **TaskName:** \CreateExplorerShellUnelevatedTask<br>**SubjectUserName:** Administrator<br>**SubjectDomainName:** FORELA<br>**ClientProcessId:** 6264<br>**SubjectLogonId:** 0xa8b86              |
| 2024-05-14 03:42:43 | ‣ Rare Schtasks Creations                | 1     | -                                          | -        | -         | -                 | -                                                                                                                                                                                                |

```ad-note
	```
	SubjectUserSid: S-1-5-21-3239415629-1862073780-2394361899-500                             
	```
Las cuentas que terminan en 500 son usuario administrador local, por ende la parte de la eliminiación de tareas las hizo con el usuario admin. 
```
Uso el ID del proceso `6264` para obtener más información del proceso:

```bash
chainsaw search 6264 *.evtx
```
```html
---
Event_attributes:
  xmlns: http://schemas.microsoft.com/win/2004/08/events/event
Event:
  System:
    Provider_attributes:
      Name: Microsoft-Windows-Security-Auditing
      Guid: 54849625-5478-4994-A5BA-3E3B0328C30D
    EventID: 4699
    Version: 1
    Level: 0
    Task: 12804
    Opcode: 0
    Keywords: '0x8020000000000000'
    TimeCreated_attributes:
      SystemTime: 2024-05-14T03:42:43.844992Z
    EventRecordID: 5934
    Correlation_attributes:
      ActivityID: 9E03AA9F-A5B0-0005-01AB-039EB0A5DA01
    Execution_attributes:
      ProcessID: 828
      ThreadID: 492
    Channel: Security
    Computer: DC01.forela.local
    Security: null
  EventData:
    SubjectUserSid: S-1-5-21-3239415629-1862073780-2394361899-500
    SubjectUserName: Administrator
    SubjectDomainName: FORELA
    SubjectLogonId: '0xa8b86'
    TaskName: \CreateExplorerShellUnelevatedTask
    TaskContent: ''
    ClientProcessStartKey: 2814749767106679
    ClientProcessId: 6264
    ParentProcessId: 6244
    RpcCallClientLocality: 0
    FQDN: DC01.forela.local

---
Event_attributes:
  xmlns: http://schemas.microsoft.com/win/2004/08/events/event
Event:
  System:
    Provider_attributes:
      Name: Microsoft-Windows-Security-Auditing
      Guid: 54849625-5478-4994-A5BA-3E3B0328C30D
    EventID: 4698
    Version: 1
    Level: 0
    Task: 12804
    Opcode: 0
    Keywords: '0x8020000000000000'
    TimeCreated_attributes:
      SystemTime: 2024-05-14T03:42:43.854198Z
    EventRecordID: 5935
    Correlation_attributes:
      ActivityID: 9E03AA9F-A5B0-0005-01AB-039EB0A5DA01
    Execution_attributes:
      ProcessID: 828
      ThreadID: 968
    Channel: Security
    Computer: DC01.forela.local
    Security: null
  EventData:
    SubjectUserSid: S-1-5-21-3239415629-1862073780-2394361899-500
    SubjectUserName: Administrator
    SubjectDomainName: FORELA
    SubjectLogonId: '0xa8b86'
    TaskName: \CreateExplorerShellUnelevatedTask
    TaskContent: "<?xml version=\"1.0\" encoding=\"UTF-16\"?>\r\n<Task version=\"1.3\" xmlns=\"http://schemas.microsoft.com/windows/2004/02/mit/task\">\r\n  <RegistrationInfo>\r\n    <Author>ExplorerShellUnelevated</Author>\r\n    <URI>\\CreateExplorerShellUnelevatedTask</URI>\r\n  </RegistrationInfo>\r\n  <Triggers>\r\n    <RegistrationTrigger id=\"CreateExplorerShell_Trigger\">\r\n      <Enabled>true</Enabled>\r\n      <Delay>PT0S</Delay>\r\n    </RegistrationTrigger>\r\n  </Triggers>\r\n  <Settings>\r\n    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>\r\n    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>\r\n    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>\r\n    <AllowHardTerminate>true</AllowHardTerminate>\r\n    <StartWhenAvailable>true</StartWhenAvailable>\r\n    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>\r\n    <IdleSettings>\r\n      <Duration>PT10M</Duration>\r\n      <WaitTimeout>PT1H</WaitTimeout>\r\n      <StopOnIdleEnd>true</StopOnIdleEnd>\r\n      <RestartOnIdle>false</RestartOnIdle>\r\n    </IdleSettings>\r\n    <AllowStartOnDemand>true</AllowStartOnDemand>\r\n    <Enabled>true</Enabled>\r\n    <Hidden>false</Hidden>\r\n    <RunOnlyIfIdle>false</RunOnlyIfIdle>\r\n    <DisallowStartOnRemoteAppSession>false</DisallowStartOnRemoteAppSession>\r\n    <UseUnifiedSchedulingEngine>true</UseUnifiedSchedulingEngine>\r\n    <WakeToRun>false</WakeToRun>\r\n    <ExecutionTimeLimit>PT72H</ExecutionTimeLimit>\r\n    <Priority>6</Priority>\r\n  </Settings>\r\n  <Actions Context=\"Author\">\r\n    <Exec>\r\n      <Command>C:\\Windows\\Explorer.EXE</Command>\r\n      <Arguments>/NoUACCheck</Arguments>\r\n    </Exec>\r\n  </Actions>\r\n  <Principals>\r\n    <Principal id=\"Author\">\r\n      <UserId>FORELA\\Administrator</UserId>\r\n      <LogonType>InteractiveToken</LogonType>\r\n      <RunLevel>LeastPrivilege</RunLevel>\r\n    </Principal>\r\n  </Principals>\r\n</Task>"
    ClientProcessStartKey: 2814749767106679
    ClientProcessId: 6264
    ParentProcessId: 6244
    RpcCallClientLocality: 0
    FQDN: DC01.forela.local

---
Event_attributes:
  xmlns: http://schemas.microsoft.com/win/2004/08/events/event
Event:
  System:
    Provider_attributes:
      Name: Microsoft-Windows-Ntfs
      Guid: 3FF37A1C-A68D-4D6E-8C9B-F79E8B16C482
    EventID: 158
    Version: 0
    Level: 4
    Task: 0
    Opcode: 0
    Keywords: '0x4000000000200000'
    TimeCreated_attributes:
      SystemTime: 2023-03-08T08:09:47.859784Z
    EventRecordID: 42
    Correlation: null
    Execution_attributes:
      ProcessID: 4
      ThreadID: 184
    Channel: Microsoft-Windows-Ntfs/Operational
    Computer: WIN-D7MHOC9OLC8
    Security_attributes:
      UserID: S-1-5-18
  EventData:
    VolumeCorrelationId: 17A28535-1E81-4F9F-8B4A-85BB7474B0C9
    VolumeNameLength: 2
    VolumeName: 'C:'
    UserFileReads: 49787
    UserFileReadBytes: 1877563392
    UserDiskReads: 49385
    UserFileWrites: 32141
    UserFileWriteBytes: 1993039872
    UserDiskWrites: 32920
    MetaDataReads: 6312
    MetaDataReadBytes: 117485568
    MetaDataDiskReads: 7204
    MetaDataWrites: 1379
    MetaDataWriteBytes: 13361152
    MetaDataDiskWrites: 1998
    MftReads: 5596
    MftReadBytes: 110747648
    MftWrites: 1104
    MftWriteBytes: 9371648
    Mft2Writes: 2
    Mft2WriteBytes: 8192
    RootIndexReads: 0
    RootIndexReadBytes: 0
    RootIndexWrites: 0
    RootIndexWriteBytes: 0
    BitmapReads: 4
    BitmapReadBytes: 3256320
    BitmapWrites: 160
    BitmapWriteBytes: 1064960
    MftBitmapReads: 1
    MftBitmapReadBytes: 20480
    MftBitmapWrites: 30
    MftBitmapWriteBytes: 131072
    UserIndexReads: 1511
    UserIndexReadBytes: 7434240
    UserIndexWrites: 514
    UserIndexWriteBytes: 3223552
    LogFileReads: 46
    LogFileReadBytes: 188416
    LogFileWrites: 3598
    LogFileWriteBytes: 57954304
    LogFileFull: 0
    LogFileFullReasonBucket1: 0
    LogFileFullReasonBucket2: 0
    LogFileFullReasonBucket3: 0
    LogFileFullReasonBucket4: 0
    LogFileFullReasonBucket5: 0
    LogFileFullReasonBucket6: 0
    LogFileFullReasonBucket7: 0
    LogFileFullReasonBucket8: 0
    LogFileFullReasonBucket9: 0
    LogFileFullReasonBucket10: 0
    LogFileFullReasonBucket11: 0
    LogFileFullReasonBucket12: 0
    LogFileFullReasonBucket13: 0
    LogFileFullReasonBucket14: 0
    LogFileFullReasonBucket15: 0
    DiskResourceFailure: 0
    VolumeTrimCount: 71
    VolumeTrimTime: 11
    VolumeTrimSize: 1154800
    AvgVolumeTrimTime: 0
    AvgVolumeTrimSize: 16264
    VolumeTrimSkippedCount: 0
    VolumeTrimSkippedSize: 0
    FileLevelTrimCount: 0
    FileLevelTrimTime: 0
    FileLevelTrimSize: 0
    AvgFileLevelTrimTime: 0
    AvgFileLevelTrimSize: 0
    NtfsFillStatInfoFromMftRecordCalledCount: 0
    NtfsFillStatInfoFromMftRecordBailedBecauseOfAttributeListCount: 0
    NtfsFillStatInfoFromMftRecordBailedBecauseOfNonResReparsePointCount: 0
```
Al buscar en Google el id de evento 4698 dice que es una eliminación de tarea programada. Al buscar en Google el comando `CreateExplorerShellUnelevatedTask` no parece haber nada raro, podría ser un falso positivo. 

A continuación pruebo con un volcado de memoria: 
```bash
chainsaw dump *.evtx --json > events.json
```
```ad-tip
El resultado aparece en una lista `[]`, eso es un problema porque al querer resaltarlo con `jq -c` aparece todo en una misma linea. Para deshacerme del mismo hago: `jq .[] -c`, de esta forma cada evento tiene una linea diferente.
```

```bash
cat events.json | jq '.[]'
```

Como el archivo es muy grande voy a filtrar por eventos y canal del sistema:
```bash
cat events.json | jq '.[].Event | select(.System.Channel == "System") | .System.EventID'
```

A la lista de todos los eventos la voy a ordenar y filtrar:
```
cat events.json | jq '.[].Event | select(.System.Channel == "System") | .System.EventID' | sort | uniq -c | awk '{print $2":"$1}' | sort -n
```

A continuación le paso eso a la IA, le explico que es cada cosa y le pido que me explique que es cada evento de la lista. De esta manera puede tener una clara información de lo que contiene el registro. 
```python
Los "Smoking Guns" (Lo más importante)

Estos son los eventos que indican el problema real. La máquina tiene el disco rígido o la controladora muriendo.

- **55 (NTFS):** **Corrupción de sistema de archivos.** La estructura del disco está corrupta e inutilizable. Esto es grave.
- **98 (NTFS):** El volumen requiere un `CHKDSK /F` (reparación) y necesita ser desmontado. Confirma el evento 55.
- **129 (Storport):** **Reset to Device.** El driver de almacenamiento (Storport) tuvo que reiniciar el dispositivo porque no respondía. Típico de discos muriendo o latencia extrema.
- **153 (Disk):** **I/O Retry.** Se reintentó una operación de entrada/salida en un bloque lógico. Es un "bad block" o error físico de lectura/escritura.    
- **162 (Volmgr):** **Crash Dump Failed.** Windows intentó guardar la memoria (el volcado) tras un pantallazo azul, pero falló. (Lógico, si el disco está fallando, no puede escribir el error).

---

Ciclo de Crash y Reinicio

Estos eventos son la _consecuencia_ de los errores de arriba.

- **41 (Kernel-Power):** **Reinicio Inesperado.** El sistema se reinició sin apagarse limpiamente. (El famoso "se cortó la luz" o crash).
- **6008 (EventLog):** "El cierre anterior del sistema fue inesperado". Confirma que se colgó o se apagó mal.
- **1001 (WER-SystemErrorReporting):** **BugCheck.** Aquí es donde Windows intenta reportar el código de error del Pantallazo Azul (BSOD).
- **6005 (EventLog):** El servicio de logs se inició (indica que la máquina acaba de arrancar).
- **6009 (EventLog):** Información del sistema (Build, OS Version) al arrancar.
- **6013 (EventLog):** Uptime del sistema (cuánto tiempo lleva prendida).
- **12 (Kernel-General):** El sistema operativo se inició (arranque exitoso).
- **13 (Kernel-General):** El sistema se está apagando (si aparece, es un apagado controlado; si falta antes de un 6005, fue crash).

---

Ruido de Sistema y Servicios

Eventos normales o informativos que dan contexto de la actividad.

- **1 (Kernel-General):** **Cambio de hora del sistema.** El reloj se ajustó.
- **7036 (Service Control Manager):** Un servicio cambió de estado (inició o paró). Es el evento más ruidoso (106 veces en tu lista).
- **7040 (SCM):** Cambio en el tipo de inicio de un servicio (ej. de Manual a Auto).
- **20 (WindowsUpdateClient):** Error o éxito en instalación de actualizaciones (a veces es Kernel-General, pero usualmente Update).
- **1014 (DNS Client):** **Name Resolution Time Out.** La PC perdió conexión a internet o el DNS tardó en responder. Muy común.
- **10016 (DistributedCOM):** Error de permisos DCOM. Ruido clásico de Windows, generalmente ignorable.
- **50036 / 50103 / 51046 (Dhcp-Client):** El servicio DHCP inició, paró o está negociando una IP. Indica actividad de red al arrancar.
    

Resumen

> _"La evidencia (Event IDs 55, 98, 129, 153) indica una falla física o lógica severa en el subsistema de almacenamiento, lo que impide que el sistema escriba volcados de memoria (ID 162) y causa reinicios inesperados (ID 41, 6008)."_
```

