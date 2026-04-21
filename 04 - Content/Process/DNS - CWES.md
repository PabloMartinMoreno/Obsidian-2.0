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

# DNS

El Sistema de Nombres de Dominio (DNS) actúa como el GPS de Internet, guiando tu viaje en línea desde puntos reconocibles (nombres de dominio) hasta coordenadas numéricas precisas (direcciones IP). Al igual que un GPS traduce el nombre de un destino en latitud y longitud para navegar, el DNS traduce nombres legibles por humanos (por ejemplo, `www.example.com`) en las direcciones IP numéricas (por ejemplo, `192.0.2.1`) que las computadoras usan para comunicarse.

Imagina navegar una ciudad memorizando la latitud y longitud exactas de cada lugar que quieras visitar. Sería extremadamente engorroso e ineficiente. El DNS elimina esa complejidad permitiéndonos usar nombres de dominio fáciles de recordar. Cuando escribes un dominio en tu navegador, el DNS actúa como tu navegador, encontrando rápidamente la dirección IP correspondiente y dirigiendo tu petición al destino correcto en Internet.

Sin DNS, navegar por el mundo en línea sería como conducir sin mapa ni GPS: una tarea frustrante y propensa a errores.

## Cómo funciona el DNS

Imagina que quieres visitar un sitio web como `www.example.com`. Escribes ese nombre amigable en tu navegador, pero tu computadora no entiende palabras —habla el lenguaje de los números, concretamente direcciones IP. ¿Cómo encuentra entonces la dirección IP del sitio? Entra en juego el DNS, el traductor confiable de Internet.

![Flowchart showing two main sections: User Database and Data Collection. Includes steps like 'Check User', 'Send to Source Database', 'Store Data', and 'Send to UI System'.](https://mermaid.ink/svg/pako:eNptkk1uwjAQha8y8rpcIItWkAAtUNQmlSrksDDxlEQQT-QfJIS4ex2nNG1arzx-n5-ex3NhBUlkEdtr0ZSwSnMFfhm36w425DTEVDfOou60do15XGJxMBCLosQtjEb3MLk8vcCMnJIP156ceA3WFIiYZ6ikgWSdwatDfQZLkKKh4wn1dnBngyZceuQxKYWFNS39jjtTWfyCvdsgb2t9c-wN4-CU_A7dy8mPjFOeYuG0qU4IK6KDa4bgLdjck9ZpZcC_20e7dWmYbRroGU-JLKxFjZCh7h88C_KCv62Sf9RFUJd87GxJurLCtsH-cssuUlfMu8blit2xGnUtKul_-NKKObMl1pizyG-l0Iec5erqOeEsZWdVsMhqh3dMk9uXLPoQR-Mr10hhMamE73L9fYqysqSfuwEKc3T9BOe0sj4)

Diagrama de flujo que muestra dos secciones principales: Base de datos de usuario y Recolección de datos. Incluye pasos como "Comprobar usuario", "Enviar a la base de datos de origen", "Almacenar datos" y "Enviar al sistema UI".

* Tu computadora pregunta por direcciones (consulta DNS): Cuando introduces el nombre de dominio, tu computadora primero revisa su memoria (caché) para ver si recuerda la dirección IP de una visita anterior. Si no la tiene, contacta a un resolutor DNS, normalmente provisto por tu proveedor de Internet (ISP).

* El resolutor DNS revisa su mapa (búsqueda recursiva): El resolutor también tiene una caché; si no encuentra la IP allí, inicia un recorrido por la jerarquía DNS. Comienza preguntando a un servidor raíz de nombres, que es como el bibliotecario de Internet.

* El servidor raíz indica el camino: El servidor raíz no sabe la dirección exacta, pero sabe quién la sabe —el servidor de nombres del Dominio de Nivel Superior (TLD) responsable de la terminación del dominio (p. ej., `.com`, `.org`). Indica al resolutor hacia dónde ir.

* El servidor TLD lo reduce: El servidor TLD es como un mapa regional. Sabe qué servidor de nombres autoritativo es responsable del dominio específico que buscas (p. ej., `example.com`) y envía al resolutor allí.

* El servidor de nombres autoritativo entrega la dirección: El servidor autoritativo es la parada final. Es como la dirección de la calle del sitio web que quieres. Contiene la IP correcta y la devuelve al resolutor.

* El resolutor DNS devuelve la información: El resolutor recibe la dirección IP y se la entrega a tu computadora. También la guarda en caché por un tiempo, por si vuelves a visitar pronto.

* Tu computadora se conecta: Ahora que tu computadora conoce la dirección IP, puede conectarse directamente al servidor web que aloja el sitio y empezar a navegar.

## El archivo Hosts

El archivo `hosts` es un archivo de texto sencillo usado para mapear nombres de host a direcciones IP, proporcionando un método manual de resolución de nombres que evita el proceso DNS. Mientras que DNS automatiza la traducción de nombres a IPs, el archivo `hosts` permite reemplazos directos y locales. Esto es útil para desarrollo, resolución de problemas o para bloquear sitios.

El archivo `hosts` se encuentra en `C:\Windows\System32\drivers\etc\hosts` en Windows y en `/etc/hosts` en Linux y macOS. Cada línea del archivo sigue el formato:

```
<Dirección IP>    <NombreHost> [<Alias> ...]
```

Por ejemplo:

```
127.0.0.1       localhost
192.168.1.10    devserver.local
```

Para editar el archivo `hosts`, ábrelo con un editor de texto usando privilegios de administrador/root. Añade entradas nuevas según necesites y guarda el archivo. Los cambios surten efecto inmediatamente sin necesidad de reiniciar el sistema.

Usos comunes incluyen redirigir un dominio a un servidor local para desarrollo:

```
127.0.0.1       myapp.local
```

probar conectividad especificando una IP:

```
192.168.1.20    testserver.local
```

o bloquear sitios no deseados redirigiendo sus dominios a una IP inexistente:

```
0.0.0.0       unwanted-site.com
```

## Es como una carrera de relevos

Piensa en el proceso DNS como una carrera de relevos. Tu computadora empieza con el nombre de dominio y se lo pasa al resolutor. El resolutor pasa la petición al servidor raíz, luego al servidor TLD y finalmente al servidor autoritativo, cada uno acercándose más al destino. Una vez encontrada la dirección IP, se la relayan de vuelta por la cadena hasta tu computadora, permitiéndote acceder al sitio.

## Conceptos clave de DNS

En el Sistema de Nombres de Dominio (DNS), una **zona** es una parte definida del espacio de nombres de dominios que gestiona una entidad o administrador específico. Piénsalo como un contenedor virtual para un conjunto de nombres de dominio. Por ejemplo, `example.com` y todos sus subdominios (`mail.example.com`, `blog.example.com`) normalmente pertenecen a la misma zona DNS.

El **archivo de zona**, un archivo de texto que reside en un servidor DNS, define los registros de recursos dentro de esa zona, proporcionando información crucial para traducir nombres de dominio a direcciones IP.

Para ilustrar, aquí hay un ejemplo simplificado de cómo podría verse un archivo de zona para `example.com`:

```
$TTL 3600 ; Tiempo de vida por defecto (1 hora)
@       IN SOA   ns1.example.com. admin.example.com. (
                2024060401 ; Número de serie (AAAAMMDDNN)
                3600       ; Intervalo de refresh
                900        ; Intervalo de reintento
                604800     ; Tiempo de expiración
                86400 )    ; TTL mínimo

@       IN NS    ns1.example.com.
@       IN NS    ns2.example.com.
@       IN MX 10 mail.example.com.
www     IN A     192.0.2.1
mail    IN A     198.51.100.1
ftp     IN CNAME www.example.com.
```

Este archivo define los servidores de nombres autoritativos (registros NS), el servidor de correo (registro MX) y las direcciones IP (registros A) para varios hosts dentro del dominio `example.com`.

Los servidores DNS almacenan distintos **registros de recursos**, cada uno con un propósito en el proceso de resolución de nombres. Veamos algunos conceptos comunes:

* **Nombre de Dominio**: Etiqueta legible por humanos para un sitio o recurso de Internet.
  Ejemplo: `www.example.com`

* **Dirección IP**: Identificador numérico único asignado a cada dispositivo conectado a Internet.
  Ejemplo: `192.0.2.1`

* **Resolutor DNS**: Servidor que traduce nombres de dominio en direcciones IP.
  Ejemplo: el servidor DNS de tu ISP o resolutores públicos como Google DNS (`8.8.8.8`)

* **Servidor raíz de nombres**: Servidores de nivel superior en la jerarquía DNS.
  Ejemplo: existen 13 servidores raíz en el mundo, nombrados A-M, como `a.root-servers.net`.

* **Servidor TLD**: Servidores responsables de dominios de nivel superior (por ejemplo, `.com`, `.org`).
  Ejemplo: Verisign para `.com`, PIR para `.org`.

* **Servidor de nombres autoritativo**: Servidor que contiene la IP real de un dominio.
  Ejemplo: a menudo gestionado por proveedores de hosting o registradores de dominios.

* **Tipos de registros DNS**: Diferentes tipos de información almacenada en DNS.
  Ejemplos: `A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, etc.

## Tipos de registros (resumen)

Aquí están los tipos de registros más relevantes, su nombre completo, descripción y ejemplo en archivo de zona:

* **A (Address Record)** — Asocia un nombre de host con su dirección IPv4.
  Ejemplo: `www.example.com. IN A 192.0.2.1`

* **AAAA (IPv6 Address Record)** — Asocia un nombre de host con su dirección IPv6.
  Ejemplo: `www.example.com. IN AAAA 2001:db8:85a3::8a2e:370:7334`

* **CNAME (Canonical Name Record)** — Crea un alias para un nombre de host, apuntando a otro nombre.
  Ejemplo: `blog.example.com. IN CNAME webserver.example.net.`

* **MX (Mail Exchange Record)** — Especifica el/los servidores de correo responsables del dominio.
  Ejemplo: `example.com. IN MX 10 mail.example.com.`

* **NS (Name Server Record)** — Delegar una zona DNS a servidores autoritativos específicos.
  Ejemplo: `example.com. IN NS ns1.example.com.`

* **TXT (Text Record)** — Almacena texto arbitrario, usado para verificación de dominio o políticas de seguridad.
  Ejemplo: `example.com. IN TXT "v=spf1 mx -all"` (registro SPF)

* **SOA (Start of Authority Record)** — Especifica información administrativa sobre una zona DNS (servidor primario, email del responsable, y parámetros).
  Ejemplo: `example.com. IN SOA ns1.example.com. admin.example.com. 2024060301 10800 3600 604800 86400`

* **SRV (Service Record)** — Define el host y puerto para servicios específicos.
  Ejemplo: `_sip._udp.example.com. IN SRV 10 5 5060 sipserver.example.com.`

* **PTR (Pointer Record)** — Usado para búsquedas inversas (reverse DNS), mapea una IP a un nombre de host.
  Ejemplo: `1.2.0.192.in-addr.arpa. IN PTR www.example.com.`

El `"IN"` en los ejemplos significa “Internet”. Es un campo de clase en los registros DNS que especifica la familia de protocolos. En la práctica verás `IN` casi siempre, ya que indica que el registro aplica al conjunto de protocolos de Internet que usamos hoy. Existen otras clases (por ejemplo, `CH` para Chaosnet, `HS` para Hesiod) pero rara vez se usan en configuraciones modernas.

## Por qué DNS importa para reconocimiento web (web recon)

DNS no es sólo un protocolo técnico para traducir dominios: es un componente crítico de la infraestructura de un objetivo que puede aprovecharse para descubrir vulnerabilidades y obtener acceso durante un test de penetración:

* **Descubrir activos**: Los registros DNS pueden revelar mucha información, incluyendo subdominios, servidores de correo y registros de servidores de nombres. Por ejemplo, un registro CNAME que apunte a un servidor obsoleto (`dev.example.com CNAME oldserver.example.net`) podría llevar a un sistema vulnerable.

* **Mapear la infraestructura de red**: Analizando datos DNS puedes crear un mapa comprensivo de la infraestructura del objetivo. Identificar los servidores de nombres (registros NS) de un dominio puede revelar el proveedor de hosting usado; un registro A para `loadbalancer.example.com` puede señalar un balanceador de carga. Esto ayuda a entender cómo están conectados los sistemas, identificar flujos de tráfico y localizar posibles puntos débiles o cuellos de botella explotables en un pentest.

* **Monitorear cambios**: Vigilar continuamente los registros DNS puede mostrar cambios en la infraestructura con el tiempo. Por ejemplo, la aparición repentina de un subdominio nuevo (`vpn.example.com`) podría indicar un nuevo punto de entrada a la red; un registro TXT que contenga un valor tipo `_1password=...` sugiere que la organización usa 1Password, lo cual podría aprovecharse para ingeniería social o campañas de phishing dirigidas.

---

Si querés, te lo dejo formateado en un archivo listo para pegar en documentación (md) o te lo adapto al estilo de tus notas de pentesting en Obsidian. ¿Querés que lo deje en un archivo `.md`?
