---
aliases:
tags:
  - type/concept
  - technique/recon/active
  - asset/web-app
kind: Concept
linked:
  - "[[Subdominio]]"
  - "[[Virtual Host|Virtual Host]]"
  - "[[Subdominio vs Virtual Host]]"
---
# Reconocimiento - Subdominios vs Virtual Hosts

***

## El Subdominio (Nivel DNS)

Me doy cuenta de que es un subdominio porque existe un registro en el servidor de nombres. Es una cuestión de **identidad en la red** y precede a cualquier conexión web.

- **Lo que entiendo:** Es el nombre que le indica a mi sistema operativo a qué dirección IP debe conectarse.
- **Dónde vive:** En el servidor DNS (o en el archivo `/etc/hosts`).
- **Cómo se verifica:** Consulto registros A o CNAME.
- **Comando a utilizar:**
    ```Bash
    host dev.objetivo.htb
    # O también
    dig dev.objetivo.htb @10.10.10.100
    ```
- **Resultado:** Si el comando me devuelve una IP, el subdominio existe en la infraestructura.

## 2. El Virtual Host (Nivel HTTP)

Me doy cuenta de que existe un Virtual Host porque el software del servidor (Nginx/Apache) decide qué carpeta mostrarme basándose únicamente en la cabecera `Host` de mi petición HTTP.

- **Lo que entiendo:** Es una configuración interna del servidor que permite servir múltiples sitios desde una misma IP.
- **Dónde vive:** En los archivos de configuración del servidor web (ej. `/etc/nginx/sites-enabled/`).
- **Cómo se verifica:** Lanzo una petición a la IP forzando el nombre en el encabezado.
- **Comando a utilizar:**
    ```Bash
    curl -H "Host: secreto.objetivo.htb" http://10.10.10.100
    ```
- **Resultado:** Si recibo un contenido diferente al de la página principal, encontré un Virtual Host, **aunque este no exista en el DNS**.

---

## Cuadro de Comparación Técnica

|**Característica**|**Subdominio**|**Virtual Host**|
|---|---|---|
|**Capa OSI**|Capa 7 (DNS)|Capa 7 (HTTP)|
|**Responsabilidad**|Resolver Nombre → IP.|Resolver Nombre → Carpeta/Raíz.|
|**Visibilidad**|Pública (si el DNS es público).|Puede ser interna/oculta.|
|**Herramienta de ataque**|Enumeración de DNS (Passive/Active).|Fuzzing de cabeceras HTTP.|

---

## Mi Metodología de Trabajo

Para realizar una enumeración completa y no confundir los resultados, sigo este flujo:

### Fase 1: Búsqueda de Subdominios

Busco qué nombres están registrados oficialmente para obtener sus direcciones IP.
```Bash
gobuster dns -d objetivo.htb -w /usr/share/wordlists/subdomains.txt
```

### Fase 2: Fuzzing de Virtual Hosts

Busco sitios que el administrador configuró en el servidor pero no registró en el DNS. Utilizo la IP directamente y fuzzeo la cabecera `Host`.
```Bash
ffuf -u http://10.10.10.100 -H "Host: FUZZ.objetivo.htb" -w /usr/share/wordlists/vhosts.txt -fs [tamaño_página_default]
```

> [!TIP]
> 
> Diferencia clave para mis notas:
> 
> - Si el nombre está en el DNS pero no tiene VHost → Llego a la IP, pero veo la página por defecto.
>     
> - Si el nombre no está en el DNS pero tiene VHost → No puedo entrar por el navegador normalmente, pero puedo extraer la info mediante fuzzing de cabeceras (VHost Discovery).
>     

---