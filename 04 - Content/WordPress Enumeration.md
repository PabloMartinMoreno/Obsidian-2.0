---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
  - "[[WordPress Exploitation]]"
---
# WordPress Enumeration

***

## Cheatsheet

| **Acción**                                                                                                                                | **Descripción**                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br><br>`sudo wpscan --url <url> --enumerate --api-token=<token>`                                                                         | Realiza un análisis automatizado de WordPress utilizando [WPScan](https://github.com/wpscanteam/wpscan).<br><br>Esto proporcionará la versión de WordPress, los directorios, los usuarios, los plugins, los temas y las vulnerabilidades conocidas.                                                                                            |
| <br><br>`ffuf -c -w /usr/share/wordlists/wordpress-popular-plugins.txt -u http://<wordpress-root>/wp-content/plugins/FUZZ`                | Utiliza ffuf para buscar plugins populares de WordPress. Este método suele revelar más plugins que WPScan.<br><br>Después de identificar un plugin, comprueba su directorio en un navegador. Si la lista de directorios está habilitada, podrás identificar la versión. Si no es así, busca un archivo readme.txt en el directorio del plugin. |
| <br><br>`curl -s <target-page> \| grep plugins`  <br>  <br>`curl -s <target-page> \| grep themes`                                         | <br>Extrae referencias a temas y plugins activos directamente desde el código fuente HTML del sitio web. Ten en cuenta que no todas las páginas mostrarán todos los plugins, por lo que vale la pena inspeccionar varias páginas.                                                                                                              |
| <br>**Nota:** Para desbloquear todas las funciones de WPScan, se requiere un token API, que tiene un límite de 25 solicitudes API al día. |                                                                                                                                                                                                                                                                                                                                                |

## Artículos Relacionados

- [[WordPress Exploitation]]: Después de enumerar los plugins y temas, miar los vectores de ataque.

## Descripción General

[WordPress](https://wordpress.com/) es un popular Sistema de Gestión de Contenidos (CMS) de código abierto ampliamente utilizado para alojar blogs, foros e incluso sitios web corporativos completos.

Sin embargo, su extensibilidad, particularly a través de temas y plugins de terceros, a menudo introduce vulnerabilidades que los atacantes pueden explotar.

El enfoque principal durante la enumeración debe ser la identificación de plugins vulnerables, ya que representan la mayoría de las vulnerabilidades. WordPress almacena los plugins en el directorio `wp-content/plugins` y los temas en el directorio `wp-content/themes`.

WordPress se encuentra más comúnmente en los puertos **80 (HTTP)** y **443 (HTTPS)**.

## Roles de Usuario

Una instalación estándar de WordPress incluye cinco roles de usuario:
- **Administrador:** Tiene privilegios administrativos completos, incluyendo agregar/eliminar usuarios, publicaciones y editar el código fuente del sitio. El acceso a este rol suele ser suficiente para obtener control total del servidor.
- **Editor:** Puede publicar y gestionar publicaciones, incluidas las de otros usuarios.
- **Autor:** Puede publicar y gestionar sus propias publicaciones.
- **Contribuidor:** Puede escribir y gestionar sus propias publicaciones, pero no puede publicarlas.
- **Suscriptor:** Usuarios estándar con la capacidad de navegar por el contenido y editar sus perfiles.