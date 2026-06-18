---
aliases:
  - Carta de Compromiso CWES
  - Engagement Letter CWES
tags:
  - cert/cwes
linked:
  - '[[CWES]]'
---
# CWES - Carta de Compromiso

Trilocor Robotics Ltd. (en adelante, **"Trilocor"**) le invita a una evaluación privada para realizar una prueba de penetración de aplicaciones web dirigida a las aplicaciones web de Trilocor orientadas al exterior, con el fin de:

- Identificar vulnerabilidades de seguridad de alto riesgo.
- Determinar el impacto en Trilocor.
- Documentar todos los hallazgos de manera clara y reproducible.
- Proporcionar recomendaciones para su corrección.

---

## ✅ Dentro del alcance (hallazgos)

- Divulgación de información sensible o de identificación personal.
- Cross-Site Scripting (XSS).
- Ejecución remota de código (RCE).
- Carga arbitraria de archivos.
- Todas las formas de ataques de sesión.
- Todas las formas de ataques del lado del servidor (**excluyendo** ataques DoS).
- Fallos de autenticación o autorización, como referencias directas a objetos inseguras (IDOR) y omisiones de autenticación.
- Todas las formas de vulnerabilidades de inyección.
- Recorrido de directorios (directory traversal).
- Lectura de archivos locales (LFI).
- Errores de configuración de seguridad significativos y fallos en la lógica de negocio.
- Credenciales expuestas que podrían utilizarse para obtener mayor acceso.

---

## ⛔ Fuera del alcance

- Escaneo y evaluación de cualquier otra IP en la red del punto de entrada.
- Ataques físicos contra propiedades de Trilocor.
- Salida del escáner no verificada.
- Ataques de intermediario (MITM).
- Cualquier vulnerabilidad identificada mediante ataques DDoS o de spam.
- XSS autoinfligido (self-XSS).
- CSRF de inicio/cierre de sesión.
- Problemas con certificados SSL, puertos abiertos, versiones de TLS o encabezados de respuesta HTTP faltantes.
- Vulnerabilidades en bibliotecas de terceros, salvo que puedan aprovecharse para impactar significativamente el objetivo.
- Cualquier ataque teórico, o ataque que requiera interacción significativa del usuario, o de bajo riesgo.

---

## Alcance

> [!danger] Restricción
> ¡Está **prohibido** escanear cualquier otra IP en la red del punto de entrada!

- `www.trilocor.local`, cualquier subdominio `*.trilocor.local` identificado, y cualquier puerto de servidor web abierto descubierto en la dirección IP del **"Punto de entrada"**, que se hará visible al presionar **"GENERAR INSTANCIA"** (Paso 2).
- Existen cinco (5) aplicaciones diferentes, además de usuarios simulados (*simulated users*) en ciertas ubicaciones de la aplicación, que podés atacar.

| URL                   | Descripción                      |
| --------------------- | -------------------------------- |
| `www.trilocor.local`  | Sitio web principal de Trilocor  |
| *Descubrir el puerto* | Sitio web de relaciones públicas |
| *Descubrir el puerto* | Portal de empleo                 |
| *Descubrir el puerto* | Sitio web de RRHH                |
| *Descubrir el puerto* | Tienda online                    |

---

## Requisitos de conectividad

> [!info] Pwnbox
> Si usás Pwnbox para las actividades de evaluación del examen, asegurate de que aparezca `eu-academy-exams-X` o `us-academy-exams-X` al abrir una terminal. Solo entonces Pwnbox podrá acceder a las aplicaciones del laboratorio de examen.
> Si ves algo distinto, finalizá cualquier instancia de Pwnbox que esté en un módulo y creá una nueva desde la página del laboratorio de examen (Paso 1).

Si usás tu propia VM de ataque para conectarte a la VPN del laboratorio de examen, podés probar conectividad agregando una entrada para `www.trilocor.local` en el archivo `hosts` de tu VM y navegando a `http://www.trilocor.local`.

---

## Objetivos del examen

Para obtener la certificación **HTB Certified Web Exploitation Specialist (HTB CWES)** debés:

1. Obtener un mínimo de **80 puntos** completando con éxito las tareas requeridas, **Y**
2. Redactar y presentar un informe de calidad profesional que incluya todas las vulnerabilidades identificadas, pruebas de su explotación exitosa (paso a paso) y recomendaciones para su corrección, basándose en la plantilla de informe proporcionada.
