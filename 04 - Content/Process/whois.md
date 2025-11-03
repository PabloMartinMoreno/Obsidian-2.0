# WHOIS

WHOIS es un protocolo de consulta y respuesta ampliamente utilizado diseñado para acceder a bases de datos que almacenan información sobre recursos de Internet registrados. Principalmente asociado a nombres de dominio, WHOIS también puede proporcionar detalles sobre bloques de direcciones IP y sistemas autónomos. Piénsalo como una guía telefónica gigante de Internet que te permite saber quién posee o es responsable de distintos activos en línea.

## Ejemplo de WHOIS

```
vsoci3tyv@htb[/htb]$ whois inlanefreight.com

[...]
Domain Name: inlanefreight.com
Registry Domain ID: 2420436757_DOMAIN_COM-VRSN
Registrar WHOIS Server: whois.registrar.amazon
Registrar URL: https://registrar.amazon.com
Updated Date: 2023-07-03T01:11:15Z
Creation Date: 2019-08-05T22:43:09Z
[...]
```

## Qué suele contener un registro WHOIS

- **Domain Name:** el propio nombre de dominio (por ejemplo, example.com).
    
- **Registrar:** la empresa donde se registró el dominio (por ejemplo, GoDaddy, Namecheap).
    
- **Registrant Contact:** la persona u organización que registró el dominio.
    
- **Administrative Contact:** la persona responsable de la gestión administrativa del dominio.
    
- **Technical Contact:** la persona encargada de los asuntos técnicos relacionados con el dominio.
    
- **Creation and Expiration Dates:** fechas de creación y expiración del dominio.
    
- **Name Servers:** servidores que traducen el nombre de dominio a una dirección IP.
    

## Historia de WHOIS

La historia de WHOIS está estrechamente ligada a la visión y dedicación de Elizabeth Feinler, una científica computacional que jugó un papel clave en la formación de los primeros días de Internet.

En la década de 1970, Feinler y su equipo en el Network Information Center (NIC) del Stanford Research Institute identificaron la necesidad de un sistema para rastrear y gestionar el creciente número de recursos en la red ARPANET, precursora del Internet moderno. Su solución fue la creación del directorio WHOIS, una base de datos rudimentaria pero pionera que almacenaba información sobre usuarios de la red, nombres de host y nombres de dominio.

_Haz clic para expandir un dato interesante de la historia de Internet si te interesa._

## Por qué WHOIS importa en el reconocimiento web

Los datos WHOIS son una mina de información para los pentesters durante la fase de reconocimiento de una evaluación. Proporcionan información valiosa sobre la huella digital de la organización objetivo y posibles vectores a explotar:

- **Identificación de personal clave:** los registros WHOIS suelen mostrar nombres, direcciones de correo y teléfonos de las personas responsables del dominio. Esta información puede aprovecharse en ataques de ingeniería social o para identificar objetivos potenciales de phishing.
    
- **Descubrimiento de infraestructura de red:** detalles técnicos como servidores de nombres y direcciones IP ofrecen pistas sobre la infraestructura de la organización, lo que ayuda a localizar puntos de entrada o configuraciones erróneas.
    
- **Análisis histórico:** acceder a registros WHOIS históricos mediante servicios especializados permite ver cambios en la propiedad, contactos o detalles técnicos a lo largo del tiempo, útil para rastrear la evolución de la presencia digital del objetivo.
    

¿Querés que lo formatee como una nota de Obsidian con metadatos (tags, alias, fecha) o lo dejamos así?