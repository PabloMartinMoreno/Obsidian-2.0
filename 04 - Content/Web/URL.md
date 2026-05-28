---
aliases:
  - Uniform Resource Locator
tags:
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# URL: Uniform Resource Locator

Una **URL** es la dirección específica que se utiliza para localizar un recurso en Internet (una página web, una imagen, un archivo). Es, en esencia, la "dirección postal" de un archivo en la red.

___


## Anatomía completa de una URL

```
https://usuario:contraseña@ejemplo.com:8080/ruta/pagina?q=hola&page=2#seccion
  │         │        │          │       │       │              │          │
scheme   user   password      host    port    path           query      hash
```


### 🔷 Scheme / Protocolo
```
https://
```
Define **cómo** se comunica el navegador con el servidor.
- `http` → sin cifrado
- `https` → con cifrado SSL/TLS
- `ftp`, `file`, `blob`, `javascript` → otros protocolos

> En XSS es relevante porque sinks como `src` o `href` pueden aceptar `javascript:alert(1)` como scheme.



### 🔷 User / Password (raramente usado)
```
usuario:contraseña@
```
Credenciales embebidas en la URL. Hoy en día los navegadores modernos lo bloquean o advierten. Muy raro verlo en la web actual.



### 🔷 Host
```
ejemplo.com
```
El **dominio** al que apunta la URL. Puede ser:
- Un dominio: `ejemplo.com`
- Un subdominio: `api.ejemplo.com`
- Una IP: `192.168.1.1`
- `localhost`

```javascript
location.hostname → "ejemplo.com"  // sin el puerto
location.host     → "ejemplo.com:8080"  // con el puerto
```



### 🔷 Port / Puerto
```
:8080
```
El puerto del servidor. Si no aparece, se usa el **puerto por defecto** del protocolo:
- `http` → 80
- `https` → 443



### 🔷 Path / Ruta
```
/ruta/pagina
```
La **ubicación del recurso** dentro del servidor, como carpetas y archivos.

```javascript
location.pathname → "/ruta/pagina"
```



### 🔷 Query String
```
?q=hola&page=2
```
Parámetros clave=valor separados por `&`. El `?` marca el inicio.

```javascript
location.search → "?q=hola&page=2"

// Para leer valores individuales:
const params = new URLSearchParams(location.search);
params.get('q');    // "hola"
params.get('page'); // "2"
```
> ⚠️ **Source muy común en XSS** porque el atacante lo controla desde la URL.



### 🔷 Hash / Fragment

`#seccion`

Indica una **sección dentro de la página**. El `#` y todo lo que sigue **nunca se envía al servidor**, vive solo en el navegador.

```javascript
location.hash → "#seccion"
```
> ⚠️ **Source muy común en DOM XSS** justamente porque el servidor nunca lo ve, así que no puede sanitizarlo, y queda expuesto al JavaScript del cliente.


---

## Resumen visual

| **Parte** | **Ejemplo**    | `location.*`        | **Relevancia en XSS** |
| --------- | -------------- | ------------------- | --------------------- |
| Scheme    | `https://`     | `location.protocol` | Baja                  |
| Host      | `ejemplo.com`  | `location.hostname` | Baja                  |
| Puerto    | `:8080`        | `location.port`     | Baja                  |
| Path      | `/ruta/pagina` | `location.pathname` | Media                 |
| Query     | `?q=hola`      | `location.search`   | Alta                  |
| Hash      | `#seccion`     | `location.hash`     | Alta                  |

---

## Diferencia entre URL, URI y URN

Es común confundirlos, pero tienen jerarquías distintas:

> [!ABSTRACT] Analogía
> 
> - **URI (Uniform Resource Identifier):** Es el concepto general (como el nombre y dirección de una persona).
>     
> - **URL (Uniform Resource Locator):** Es la ubicación física (la dirección de su casa).
>     
> - **URN (Uniform Resource Name):** Es el nombre único (su número de identificación o DNI).
>     


---

