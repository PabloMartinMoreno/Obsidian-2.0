[[chainsaw]]

El controlador de dominio de Forela está siendo atacado. Se cree que la cuenta del administrador del dominio ha sido comprometida y se sospecha que el autor de la amenaza ha volcado la base de datos NTDS.dit en el controlador de dominio. Acabamos de recibir una alerta de que se está utilizando vssadmin en el DC, ya que esto no forma parte de la programación rutinaria, tenemos buenas razones para creer que el atacante ha abusado de esta utilidad LOLBIN para hacerse con la joya de la corona del entorno del dominio. Realice algunos análisis de los artefactos proporcionados para una clasificación rápida y, si es posible, expulse al atacante lo antes posible.

```ad-info
**NTDS.dit y Golden Ticket**

El archivo **NTDS.dit** es la base de datos del Active Directory. Contiene los objetos del dominio (usuarios, grupos) y sus secretos: **hashes NTLM** y **llaves Kerberos** (AES/RC4), tanto actuales como el historial de anteriores.

**Vector de Ataque:** Si se extrae el hash (NTLM o AES) de la cuenta **krbtgt** desde el NTDS.dit, se puede crear un **Golden Ticket**.

- **Golden Ticket (TGT Falsificado):** Permite generar un TGT válido "offline", firmándolo uno mismo con el hash de `krbtgt`. Da acceso total al dominio (persistencia) como si fuésemos cualquier usuario (ej. Domain Admin), con una validez arbitraria (ej. 10 años).
    

**Remediación:** Para invalidar un Golden Ticket activo, no alcanza con cambiar la contraseña de `krbtgt` una sola vez (porque el AD guarda el historial para validar tickets recientes). Se debe cambiar la contraseña de la cuenta **krbtgt dos veces consecutivas** para purgar el historial y forzar la invalidación inmediata de todos los TGTs en circulación.
```


