### Análisis de la Brecha de Insight Nexus

#### Escenario del Incidente

La víctima en este incidente es **Insight Nexus**, una empresa mediana de investigación de mercado y análisis de datos con sede en Singapur. Proporcionan inteligencia competitiva y conocimientos del consumidor para clientes globales, incluidas empresas de Fortune 500 en TI y finanzas. Su infraestructura incluye muchas aplicaciones, servidores y hosts, pero nos centraremos en los importantes, como una pila de aplicaciones orientada a Internet para clientes, un servidor **ManageEngine** para administración de TI y un portal de informes de clientes basado en PHP. Debido a la naturaleza de su trabajo, se convirtieron en un objetivo atractivo para adversarios interesados en el robo de datos de clientes.

Echemos un vistazo al incidente para comprender algunos desafíos que enfrentan los gestores de incidentes. Este incidente muestra un ejemplo de los patrones observados repetidamente en el mundo real. La empresa se convierte en el objetivo de **dos grupos de amenazas distintos operando simultáneamente** dentro de su entorno.

1. **El primer actor de amenazas** ganó acceso cuando los administradores del sistema olvidaron cambiar la contraseña predeterminada _admin/admin_ en una aplicación orientada a Internet (ManageEngine ADManager Plus) después de una actualización del producto. Aprovechando esto, los atacantes iniciaron sesión con éxito, realizaron reconocimiento, mapearon usuarios y máquinas, y finalmente crearon nuevas cuentas privilegiadas de Active Directory. Usando una de las cuentas recién creadas, los adversarios pivotaron más profundamente en el entorno, identificando un servicio RDP externo expuesto por una mala configuración. Explotando ese punto de entrada, escalaron su control y finalmente usaron Objetos de Política de Grupo (**GPO**) para desplegar spyware usando un paquete MSI en múltiples _endpoints_.

2. **El segundo actor**, mientras tanto, había comprometido una aplicación PHP vulnerable anteriormente.

![[Pasted image 20260107155052.png]]

Durante días, estas actividades pasaron desapercibidas. El incidente fue descubierto por primera vez cuando un analista del equipo SOC investigó una alerta en **TheHive** relacionada con la creación de un archivo sospechoso llamado `checkme.txt` en la raíz de un servidor web. Tras la investigación, descubrieron que fue colocado deliberadamente allí como una firma: _"SilentJackal estuvo aquí"_. Este artefacto inusual desencadenó una investigación más profunda. Lo que hizo la situación más compleja fue que el equipo SOC se dio cuenta de que dos grupos de actores de amenazas diferentes estaban activos en el mismo entorno.

#### Actores de Amenazas

- **Crimson Fox (Actor de amenaza principal):** Un grupo con vínculos conocidos con ataques a la cadena de suministro de la industria de TI, sospechoso de tener respaldo estatal. Se especializan en robo de credenciales y persistencia a largo plazo para la exfiltración de datos. Es un grupo capaz y persistente.

- **Silent Jackal (Actor secundario):** Un grupo criminal poco organizado centrado en desfiguraciones de sitios web (_defacements_) oportunistas e intrusiones de prueba de concepto, no necesariamente motivados financieramente pero sí disruptivos. Los miembros de este grupo son intrusos web de baja habilidad.


#### Entorno y Activos Importantes

**Internet Público**
- **Aplicación Web Externa (`manage.insightnexus.com`):** ManageEngine ADManager Plus (Puerto 443/HTTPS accesible desde Internet).

- **Portal de Reportes de Clientes (`portal.insightnexus.com`):** Portal basado en PHP con carga de archivos habilitada.


**Estructura del Entorno Interno**
- **Controlador de Dominio:** `DC01.insight.local`
- **Servidor de Archivos:** `FS01.insight.local` (recurso compartido: `\fs01\projects`)    
- **Servidor de Base de Datos:** `DB01.insight.local` (contiene bases de datos sensibles).
- **Estaciones de trabajo:** Flota de desarrolladores (DEV-001 a DEV-120). Se descubrió una máquina con exposición RDP externa por mala configuración: `DEV-021`.

**Seguridad**

- Firewall perimetral con registro predeterminado (sin integración con Inteligencia de Amenazas).
- IDS básico con alta tasa de falsos positivos.
- Agentes **Wazuh** en la mayoría de los hosts de Windows (cobertura parcial).
- SIEM centralizado (**Wazuh**) ingiriendo Sysmon, Seguridad de Windows, logs web y de firewall.
- **TheHive** para gestión de casos, con Cortex disponible para enriquecimiento.1

---

### Análisis del Incidente

Un administrador del sistema notó conexiones salientes inusuales desde el servidor ManageEngine a una dirección IP en Europa del Este. Llamó al equipo SOC y colaboró con ellos. Un analista del SOC encontró una alerta mencionando un archivo sospechoso `checkme.txt` en el mismo servidor.
![[Pasted image 20260107155118.png]]
#### Cronología y Hallazgos (Crimson Fox)

El **2025-10-01 03:12:02**, el actor **Crimson Fox** obtuvo acceso inicial vía ManageEngine. Encontraron que las credenciales predeterminadas (`admin`/`admin`) funcionaban. Esto significa que los administradores olvidaron cambiarlas o dejaron la aplicación accesible a todos.

> **Descuido Organizacional:** Las credenciales predeterminadas nunca se cambiaron, no se aplicó MFA y no hubo inspección de WAF.

El actor utilizó una vulnerabilidad web de Java en ManageEngine para ejecución remota de código (RCE) y estableció un **C2 (Comando y Control) saliente** sobre HTTPS hacia `103.112.60.117`, haciéndose pasar por tráfico de actualización.

**Sysmon Event ID 3 (Conexión de Red detectada):**

Plaintext

```
UtcTime: 2025-10-01 03:18:32.557
Image: C:\ManageEngine\jre\bin\java.exe
DestinationIp: 103.112.60.117
DestinationPort: 443
```

El **2025-10-02**, los atacantes enumeraron usuarios del dominio y crearon una nueva cuenta de Administrador de Dominio. Encontraron la máquina `DEV-021` con RDP expuesto públicamente. Usaron la nueva cuenta para conectarse vía RDP directamente a esta máquina.

**Windows Event ID 4624 (Inicio de sesión exitoso):**

Plaintext

```
SubjectUserName: insight\svc_deployer
SourceNetworkAddress: 103.112.60.117
Workstation Name: DEV-021
Logon Type: 10 (RemoteInteractive)
```

Tras el inicio de sesión, realizaron reconocimiento del dominio y encontraron recursos compartidos de archivos con borradores de informes y datos de encuestas.

> **Nota Técnica:** Este tipo de eventos (RDP desde IP pública) se pueden detectar con reglas Sigma específicas que alertan sobre `LogonType: 10` proveniente de rangos IP no privados.

Después de una semana, comenzaron a comprimir y exfiltrar datos en un archivo llamado `diagnostics_data.zip` (para parecer telemetría de rutina) y lo subieron al host del atacante vía HTTPS.

Finalmente, el **2025-10-04**, desde `DEV-021`, usaron credenciales de administrador de dominio para crear una **GPO** que empujaba un paquete MSI (`java-update.msi`) a través del dominio. Este MSI instalaba spyware en las máquinas.

Sysmon Event ID 11 (Creación de archivo): TargetFilename: C:\Windows\Temp\java-update.msi

Sysmon Event ID 1 (Creación de proceso): CommandLine: "msiexec /i C:\Windows\Temp\java-update.msi /quiet"

#### Cronología y Hallazgos (Silent Jackal)

Casi al mismo tiempo, el otro actor, **Silent Jackal**, explotó una vulnerabilidad de carga de archivos sin parchear en el portal de reportes PHP. Subieron el archivo `checkme.txt` como marcador. Su actividad fue limitada y probablemente fue una intrusión de baja habilidad destinada a señalar presencia ("defacement") más que a causar daño inmediato. Sin embargo, **esto generó el "ruido" que dio a los defensores la primera pista**.

---

### Acciones de Respuesta Inmediata al Incidente

La correlación realizada por el analista del SOC unió los puntos:

1. Inicios de sesión de administrador en ManageEngine desde IPs extranjeras.
    
2. Eventos de Sysmon de `msiexec` instalando un MSI en muchos hosts.
    
3. Enumeración LDAP y cambios en GPO.
    
4. Archivos comprimidos en el servidor de archivos y tráfico HTTPS saliente.
    

**Acciones tomadas:**

1. **Creación de Caso y Triaje:** Se creó un caso en TheHive titulado "Insight Nexus — ManageEngine Compromise" con prioridad Crítica. Se asignaron roles (Analista de Triaje, Líder Forense, etc.).
    
2. **Contención (Red):** Se bloqueó el tráfico saliente a la IP del atacante (`103.112.60.117`) en el firewall perimetral y firewalls de host. Se añadió firma IDS.
    
3. **Contención (Credenciales):** Se deshabilitó la cuenta admin de ManageEngine, se rotaron credenciales privilegiadas expuestas y se forzó el cambio de contraseñas. El acceso a la consola web de ManageEngine se restringió solo a nivel interno.
    
4. **Aislamiento de Hosts:** Se aislaron `manage.insightnexus.com`, `DEV-021` y las máquinas con el MSI instalado. Se suspendieron tareas programadas y despliegues por GPO.
    
5. **Recolección Forense:** Se recolectó memoria volátil, listas de procesos, registros y discos de los hosts aislados. Se preservaron el MSI malicioso y el archivo ZIP exfiltrado.
    

### Mapeo a MITRE ATT&CK

- **Reconocimiento:** Escaneo activo (T1595).
    
- **Acceso Inicial:** Cuentas válidas (T1078.004 - Credenciales por defecto), Explotación de aplicación pública (T1190 - PHP upload).
    
- **Persistencia:** Tareas programadas, Servicios, MSI desplegado por GPO (T1547, T1069).
    
- **Comando y Control:** Protocolos Web (T1071.001 - HTTPS).
    
- **Exfiltración:** Comprimir y subir datos (T1560/T1041).
    

### Lecciones Aprendidas

1. **Credenciales por defecto:** Dejarlas en aplicaciones expuestas a Internet sigue siendo uno de los descuidos más simples pero dañinos.
    
2. **Múltiples actores:** Pueden coexistir diferentes actores con diferentes motivaciones (uno ruidoso, uno sigiloso). Centrarse solo en el "ruidoso" (Silent Jackal) podría haber permitido que el ataque sofisticado (Crimson Fox) continuara.
    
3. **Correlación de alertas:** La falta de correlación temprana retrasa la contención.
    
4. **Monitoreo Post-Incidente:** Debe incluir escaneo de mecanismos de persistencia, no solo borrar los archivos del atacante.