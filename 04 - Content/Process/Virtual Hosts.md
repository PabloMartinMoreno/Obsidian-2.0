# Virtual Hosts — Hosts Virtuales

Una vez que el DNS dirige el tráfico al servidor correcto, la configuración del servidor web determina cómo se manejan las peticiones entrantes. Servidores web como Apache, Nginx o IIS están diseñados para alojar múltiples sitios o aplicaciones en un solo servidor. Lo logran mediante **virtual hosting**, que les permite diferenciar entre dominios, subdominios o sitios distintos con contenido independiente.

## Cómo funcionan los Virtual Hosts: VHosts y subdominios

El núcleo del virtual hosting es la capacidad del servidor web para distinguir entre múltiples sitios que comparten la misma IP. Esto se consigue aprovechando el **header HTTP Host**, un campo incluido en cada petición HTTP enviada por el navegador.

La diferencia clave entre VHosts y subdominios está en su relación con DNS y con la configuración del servidor web:

- **Subdominios:** Extensiones de un dominio principal (por ejemplo, `blog.example.com` es subdominio de `example.com`). Normalmente tienen sus propios registros DNS, que apuntan a la misma IP que el dominio principal o a otra distinta. Se usan para organizar secciones o servicios del sitio.
    
- **Virtual Hosts (VHosts):** Son configuraciones dentro del servidor web que permiten alojar varios sitios o aplicaciones en un mismo servidor. Pueden asociarse a dominios de primer nivel (`example.com`) o a subdominios (`dev.example.com`). Cada VHost puede tener su propia configuración, lo que permite controlar con precisión cómo se atienden las peticiones.

Si un VHost no tiene un registro DNS público, todavía podés accederlo editando el archivo `hosts` en tu máquina local (mapeando manualmente el nombre a una IP), evitando así la resolución DNS pública.

Suele haber subdominios no públicos que no aparecen en DNS: solo son accesibles internamente o vía configuraciones específicas. El **VHost fuzzing** es una técnica para descubrir subdominios y VHosts (públicos o no) probando varios hostnames contra una IP conocida.

Los virtual hosts también pueden configurarse para usar dominios distintos (no solo subdominios). Ejemplo de configuración basada en nombre (Apache):

```apacheconf
# Ejemplo de configuración name-based en Apache
<VirtualHost *:80>
    ServerName www.example1.com
    DocumentRoot /var/www/example1
</VirtualHost>

<VirtualHost *:80>
    ServerName www.example2.org
    DocumentRoot /var/www/example2
</VirtualHost>

<VirtualHost *:80>
    ServerName www.another-example.net
    DocumentRoot /var/www/another-example
</VirtualHost>
```

En este caso, `example1.com`, `example2.org` y `another-example.net` son dominios distintos alojados en el mismo servidor. El servidor usa el header `Host` para servir el contenido correcto según el dominio solicitado.

## Búsqueda de VHosts por parte del servidor

Proceso simplificado de cómo el servidor determina qué contenido servir según el header `Host`:

1. El navegador solicita un sitio (ej.: `www.inlanefreight.com`) y envía una petición HTTP al servidor de la IP asociada.
    
2. El header `Host` incluye el nombre de dominio, actuando como etiqueta que indica al servidor qué sitio se solicita.
    
3. El servidor consulta su configuración de virtual hosts para encontrar la entrada que coincida con ese dominio.
    
4. Al identificar el VHost correcto, el servidor recupera los archivos desde el `DocumentRoot` correspondiente y envía la respuesta HTTP.
    

En esencia, el header `Host` funciona como un conmutador que permite al servidor decidir dinámicamente qué sitio servir.

## Tipos de Virtual Hosting

- **Name-Based Virtual Hosting:** Depende del header `Host` para distinguir sitios. Es el más común porque no requiere múltiples IPs. Es flexible y económico, aunque presenta limitaciones con ciertos protocolos (p. ej. SSL/TLS sin SNI en implementaciones antiguas).
    
- **IP-Based Virtual Hosting:** Cada sitio tiene una IP única; el servidor decide según la IP destino. No depende del header `Host`, funciona con cualquier protocolo y ofrece mayor aislamiento, pero requiere múltiples IPs.
    
- **Port-Based Virtual Hosting:** Sitios distintos en el mismo IP usan puertos diferentes (p. ej. puerto 80 y 8080). Útil cuando las IP son limitadas, pero menos amigable para usuarios (requiere especificar puerto en la URL).
    

## Herramientas para descubrir Virtual Hosts

El análisis manual de headers HTTP y búsquedas inversas puede funcionar, pero existen herramientas que automatizan y amplían el proceso. Estas usan técnicas variadas para sondear el servidor objetivo y descubrir posibles VHosts.

|Herramienta|Descripción|Características|
|---|---|---|
|`gobuster`|Herramienta multipropósito para brute-force de directorios/archivos y también eficaz para descubrimiento de VHosts.|Rápida, soporta varios métodos HTTP, usa wordlists personalizables.|
|`feroxbuster`|Similar a Gobuster pero en Rust; destaca por velocidad y flexibilidad.|Soporta recursión, detección de comodines y filtros.|
|`ffuf`|Fuzzer web rápido; útil para discovery de VHosts fuzzing del header `Host`.|Entrada de wordlists personalizable y potentes opciones de filtrado.|

### Gobuster para VHosts

`Gobuster` es muy usado para fuerza bruta de directorios y también funciona bien para descubrir virtual hosts. Envía peticiones HTTP con distintos headers `Host` al IP objetivo y analiza las respuestas para identificar VHosts válidos.

Preparativos:

- **Identificar objetivo:** obtener la IP del servidor (por DNS u otras técnicas).
    
- **Preparar wordlist:** usar SecLists u otra lista personalizada basada en la industria o convenciones del objetivo.
    

Comando típico de Gobuster para VHost fuzzing:

```bash
gobuster vhost -u http://<target_IP_address> -w <wordlist_file> --append-domain
```

- `-u` especifica la URL objetivo (reemplazar `<target_IP_address>` por la IP real).
    
- `-w` indica la ruta a la wordlist.
    
- `--append-domain` añade el dominio base a cada palabra de la lista al generar los VHosts.
    

Nota: en versiones recientes de Gobuster `--append-domain` es requerido para concatenar correctamente el dominio base; en versiones antiguas ese comportamiento podía ser diferente.

Parámetros útiles:

- `-t` aumentar threads para escaneo más rápido.
    
- `-k` ignorar errores de certificado SSL/TLS.
    
- `-o` guardar la salida en un archivo.
    

Ejemplo real:

```bash
vsoci3tyv@htb[/htb]$ gobuster vhost -u http://inlanefreight.htb:81 -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt --append-domain
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:             http://inlanefreight.htb:81
[+] Method:          GET
[+] Threads:         10
[+] Wordlist:        /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt
[+] User Agent:      gobuster/3.6
[+] Timeout:         10s
[+] Append Domain:   true
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
Found: forum.inlanefreight.htb:81 Status: 200 [Size: 100]
[...]
Progress: 114441 / 114442 (100.00%)
===============================================================
Finished
===============================================================
```

**Precaución:** la discovery de VHosts puede generar mucho tráfico y ser detectada por IDS/WAF. Pedí autorización antes de escanear objetivos.

---

¿Querés que lo convierta a formato para Obsidian (con enlaces internos y plantillas) o que te arme un mini-playbook para descubrir VHosts paso a paso usando `gobuster`, `ffuf` y `puredns`?