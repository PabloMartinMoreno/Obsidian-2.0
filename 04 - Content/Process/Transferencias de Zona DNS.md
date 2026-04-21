---
aliases:
tags:
  - type/cheatsheet
  - service/dns
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---


Aunque la fuerza bruta puede ser un enfoque útil, existe un método menos invasivo y potencialmente más eficiente para descubrir subdominios dentro de una zona DNS. Este mecanismo, diseñado para replicar registros DNS entre servidores de nombres, puede convertirse inadvertidamente en una mina de oro de información si está mal configurado.

## Qué es una transferencia de zona

Una **transferencia de zona DNS** es, esencialmente, una copia completa de todos los registros DNS dentro de una zona (un dominio y sus subdominios) desde un servidor de nombres primario hacia uno secundario.  
Este proceso es esencial para mantener la **consistencia y redundancia** entre servidores DNS.  
Sin embargo, si no está bien asegurado, una parte no autorizada puede descargar todo el archivo de zona, revelando una lista completa de **subdominios, direcciones IP** y otros datos sensibles.

![[Pasted image 20251110153037.png]]

### Etapas del proceso

1. **Solicitud de transferencia de zona (AXFR):**  
    El servidor DNS secundario inicia el proceso enviando una solicitud de transferencia (tipo **AXFR**, _Full Zone Transfer_) al servidor primario.
    
2. **Transferencia del registro SOA:**  
    El servidor primario responde con su **registro de Inicio de Autoridad (SOA)**, que incluye el número de serie de la zona, usado para determinar si los datos están actualizados.
    
3. **Transmisión de registros DNS:**  
    El servidor primario transfiere todos los registros de la zona: **A, AAAA, MX, CNAME, NS**, entre otros, que definen subdominios, servidores de correo y configuraciones relacionadas.
    
4. **Finalización de la transferencia:**  
    Una vez enviados todos los registros, el servidor primario indica el final del proceso.
    
5. **Confirmación (ACK):**  
    El servidor secundario envía una confirmación al primario, validando que recibió los datos correctamente.
    

---

## Vulnerabilidad de la transferencia de zona

Aunque las transferencias de zona son legítimas y necesarias, una **mala configuración** puede convertirlas en una **vulnerabilidad grave**.  
El problema radica en **quién tiene permiso** para solicitar la transferencia.

En los primeros días de Internet, permitir que **cualquier cliente** hiciera una transferencia era común.  
Esto facilitaba la administración, pero abría un agujero de seguridad: **cualquiera podía descargar el contenido completo de la zona DNS**.

### Información que puede obtener un atacante

Una transferencia de zona no autorizada puede revelar:
- **Subdominios:** una lista completa, incluyendo entornos ocultos (dev, staging, admin, etc.).
- **Direcciones IP:** asociadas a cada subdominio, útiles para posteriores fases de reconocimiento.
- **Registros NS:** información sobre los servidores de nombres y el proveedor de hosting.


---

## Remediación

La mayoría de los administradores modernos ya **restringen las transferencias de zona** solo a servidores secundarios autorizados.  
Aun así, errores humanos o configuraciones antiguas pueden dejar esta función expuesta.

Por eso, **intentar un AXFR (con permiso)** sigue siendo una técnica de reconocimiento valiosa.  
Incluso si falla, la respuesta puede revelar la postura de seguridad o la configuración DNS del objetivo.


---

## Ejemplo práctico

Podés usar el comando `dig` para intentar una transferencia de zona:

```bash
dig axfr @nsztm1.digi.ninja zonetransfer.me
```

Este comando solicita una **transferencia completa (AXFR)** al servidor DNS responsable del dominio `zonetransfer.me`.

Si el servidor está mal configurado y la permite, devolverá todos los registros DNS del dominio, como se ve en este ejemplo abreviado:

```bash
zonetransfer.me.   7200  IN  SOA   nsztm1.digi.ninja. robin.digi.ninja. 2019100801 172800 900 1209600 3600
zonetransfer.me.   300   IN  HINFO "Casio fx-700G" "Windows XP"
zonetransfer.me.   301   IN  TXT   "google-site-verification=tyP28J7JAUHA9fw2sHXMgcCC0I6XBmmoVi04VlMewxA"
zonetransfer.me.   7200  IN  MX    0 ASPMX.L.GOOGLE.COM.
...
zonetransfer.me.   7200  IN  A     5.196.105.14
zonetransfer.me.   7200  IN  NS    nsztm1.digi.ninja.
zonetransfer.me.   7200  IN  NS    nsztm2.digi.ninja.
...
;; XFR size: 50 records (messages 1, bytes 2085)
```

El dominio `zonetransfer.me` es un **sitio de demostración** creado por _DigiNinja_ para mostrar los riesgos de las transferencias de zona abiertas.
