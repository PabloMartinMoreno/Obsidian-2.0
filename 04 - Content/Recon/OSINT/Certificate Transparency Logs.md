---
aliases:
tags:
kind: Concept
linked:
---
# Certificate Transparency Logs

---

## Cheatsheet


| **Comando**                                                                                                                             | **Descripción**                                             |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| curl -s "https://crt.sh/?q=facebook.com&output=json" \| jq -r '.[] \| select(.name_value \| contains("dev")) \| .name_value' \| sort -u | Uso de la API de `crt.sh` para ver resultados desde consola |



## Registros de Transparencia de Certificados (Certificate Transparency Logs)

En la vasta extensión de Internet, la confianza es un recurso frágil. Uno de los pilares de esa confianza es el protocolo **SSL/TLS (Secure Sockets Layer / Transport Layer Security)**, que cifra la comunicación entre tu navegador y un sitio web.  
En el núcleo de SSL/TLS se encuentra el **certificado digital**, un pequeño archivo que verifica la identidad de un sitio web y permite una comunicación segura y cifrada.

Sin embargo, el proceso de emisión y gestión de estos certificados **no es infalible**. Los atacantes pueden aprovechar **certificados falsos o emitidos de manera incorrecta** para hacerse pasar por sitios legítimos, interceptar datos sensibles o propagar malware.  
Ahí es donde entran en juego los **registros de Transparencia de Certificados (CT Logs)**.

---

## ¿Qué son los Registros de Transparencia de Certificados?

Los **Certificate Transparency (CT) Logs** son **registros públicos y de solo anexado** que documentan la emisión de certificados SSL/TLS.  
Cada vez que una **Autoridad Certificadora (CA)** emite un nuevo certificado, debe enviarlo a varios CT logs.  
Estos registros son mantenidos por organizaciones independientes y **cualquiera puede inspeccionarlos**.

Podés pensar en los CT logs como un **registro global de certificados**. Proporcionan un registro transparente y verificable de **cada certificado SSL/TLS emitido** para un sitio web.  
Esta transparencia cumple varios propósitos clave:

- **Detección temprana de certificados falsos o no autorizados:**  
    Al monitorear los CT logs, los investigadores de seguridad y los propietarios de sitios web pueden detectar certificados sospechosos o mal emitidos.  
    Un _rogue certificate_ es un certificado digital no autorizado o fraudulento emitido por una CA confiable. Detectarlos temprano permite revocarlos antes de que sean usados con fines maliciosos.
    
- **Responsabilidad de las Autoridades Certificadoras (CAs):**  
    Los CT logs hacen que las CAs sean responsables de sus prácticas de emisión.  
    Si una CA emite un certificado que viola las normas o estándares, esto será visible públicamente en los logs, pudiendo causar sanciones o pérdida de confianza.
    
- **Fortalecimiento de la Infraestructura de Clave Pública (PKI):**  
    La **Web PKI** es el sistema de confianza que sustenta la comunicación segura en línea.  
    Los CT logs ayudan a mejorar su seguridad e integridad al ofrecer **supervisión pública y verificación de certificados**.
    

---

## CT Logs y Reconocimiento Web

Los CT logs ofrecen una **ventaja única para la enumeración de subdominios** comparado con otros métodos.  
A diferencia del **brute-forcing o las wordlists**, que se basan en adivinar o predecir nombres de subdominios, los CT logs proporcionan un **registro real y verificable** de los certificados emitidos para un dominio y sus subdominios.

Esto significa que no dependés del alcance de tu wordlist ni de la efectividad de tus algoritmos de fuerza bruta.  
En cambio, obtenés una **visión histórica y completa** de los subdominios de un dominio, incluso aquellos que **ya no están activos o son difíciles de adivinar**.

Además, los CT logs pueden revelar **subdominios asociados a certificados antiguos o expirados**, que podrían alojar software desactualizado o configuraciones inseguras, convirtiéndose en **puntos potenciales de explotación**.

En resumen, los CT logs ofrecen un método **eficiente y confiable** para descubrir subdominios sin necesidad de fuerza bruta ni wordlists exhaustivas, brindando una **ventana única al historial de un dominio**.

---

## Búsqueda en CT Logs

Existen dos opciones populares para buscar en los registros de transparencia de certificados:

|Herramienta|Características principales|Casos de uso|Ventajas|Desventajas|
|---|---|---|---|---|
|**crt.sh**|Interfaz web simple, búsqueda por dominio, muestra detalles del certificado y campos SAN.|Búsquedas rápidas, identificación de subdominios, historial de emisión de certificados.|Gratuita, fácil de usar, sin registro.|Pocas opciones de filtrado y análisis.|
|**Censys**|Potente motor de búsqueda para dispositivos conectados a Internet, filtrado avanzado por dominio, IP y atributos de certificado.|Análisis profundo de certificados, detección de configuraciones erróneas, búsqueda de certificados y hosts relacionados.|Amplia base de datos, filtros potentes, API disponible.|Requiere registro (plan gratuito disponible).|

---

## Ejemplo: Búsqueda con `crt.sh` desde la terminal

Aunque **crt.sh** ofrece una interfaz web, también se puede usar su **API** para automatizar búsquedas desde la terminal.  
Por ejemplo, para encontrar todos los subdominios que contienen la palabra “dev” en _facebook.com_:

```bash
curl -s "https://crt.sh/?q=facebook.com&output=json" | jq -r '.[] | select(.name_value | contains("dev")) | .name_value' | sort -u
```
- `curl -s "https://crt.sh/?q=facebook.com&output=json"`  
    Descarga la salida en formato JSON con todos los certificados asociados al dominio `facebook.com`.
- `jq -r '.[] | select(.name_value | contains("dev")) | .name_value'`  
    Filtra las entradas cuyo campo `name_value` (que contiene el dominio o subdominio) incluye la cadena “dev”.  
    La opción `-r` muestra las cadenas sin formato JSON.
- `sort -u`  
    Ordena los resultados y elimina duplicados.

**Salida:**
```
*.dev.facebook.com
*.newdev.facebook.com
*.secure.dev.facebook.com
dev.facebook.com
devvm1958.ftw3.facebook.com
facebook-amex-dev.facebook.com
facebook-amex-sign-enc-dev.facebook.com
newdev.facebook.com
secure.dev.facebook.com
```


---
