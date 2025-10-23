---
aliases:
tags:
  - type/cheatsheet
  - service/jenkins
  - asset/web-app
  - protocol/http
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Jenkins Enumeration

***

## CheatSheet

| **Acción**         | **Descripción**                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![[Jenkins 1.png]] | Una instalación de Jenkins es fácilmente reconocible por su característica página de login. Sin embargo, la versión exacta solo puede identificarse desde el panel (dashboard) **después** de autenticarse con credenciales válidas. |
| ![[Jenkins 2.png]] | <br><br>Una vez iniciada la sesión, verificá el método de autenticación que esté en uso.                                                                                                                                             |

**Por hacer:** explicar que no hay mucho que se pueda enumerar sin haberse autenticado.

## Descripción general

Jenkins es un servidor de automatización de código abierto escrito en Java. Facilita la integración y entrega continua (CI/CD) automatizando la construcción, las pruebas y el despliegue de proyectos de software.

Como sistema basado en servidor, Jenkins normalmente se ejecuta dentro de contenedores servlets (por ejemplo, Tomcat). Frecuentemente se despliega con privilegios de root o SYSTEM, lo que aumenta el riesgo si es comprometido.

### Métodos de autenticación que puede soportar Jenkins

- Base de datos de credenciales local
- LDAP (puertos 389, 636, 3268, 3269)
- Base de credenciales UNIX
- Delegar la seguridad al contenedor servlet
- Sin autenticación

Por defecto, Jenkins usa su propia base de datos para almacenar credenciales y los usuarios no pueden registrarse por sí mismos sin intervención administrativa.

Jenkins suele encontrarse en los puertos `8080` (HTTP) y `8443` (HTTPS).

---
