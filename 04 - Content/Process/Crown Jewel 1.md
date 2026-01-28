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
