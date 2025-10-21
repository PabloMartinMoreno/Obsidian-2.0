---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/web
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# GitLab Enumeration

***

## CheatSheet

| **Acción**                   | **Descripción**                                                                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/help`                      | Se puede confirmar el uso de GitLab visitando su URL; la página de login muestra el logo de GitLab. Para determinar la versión, iniciá sesión y visitá `/help`, donde se muestra el número de versión.                       |
| Intentá registrar una cuenta | Verificá si la registración de cuentas está habilitada. Una cuenta recién creada puede tener acceso a proyectos públicos. Idealmente, el registro *no* requiere un correo corporativo.                                       |
| `/explore`                   | Después de iniciar sesión, primero revisár `/explore` en busca de proyectos públicos que puedan contener información útil. Luego, revisá las secciones vinculadas en la esquina superior izquierda: Groups, Snippets y Help. |

## Descripción general

GitLab es un servicio web para alojar repositorios Git que incluye wikis, seguimiento de issues y funcionalidades CI/CD. Es de código abierto; originalmente escrito en Ruby e incorporando actualmente componentes en Go, Ruby on Rails y Vue.js.

Los repositorios de una empresa pueden contener información sensible (por ejemplo, secretos en texto claro, contraseñas o claves privadas SSH) que se hayan subido accidentalmente en scripts o archivos de configuración. Al igual que GitHub y Bitbucket, GitLab es un objetivo común en pruebas de penetración internas y externas.

El objetivo de la enumeración es obtener huella de la versión y, si es posible iniciar sesión, revisar repositorios públicos o accesibles en busca de información sensible.

- Notable: la autenticación de dos factores suele estar **deshabilitada por defecto** en algunas instalaciones.
- Puertos comunes: `80` (HTTP) y `443` (HTTPS).

---

