---
aliases: null
tags:
  - type/tool
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[OS Command Injection]]'
---
# Command Injection - Herramientas de Obfuscación Automática

***

## Cheatsheet

### 1. Linux: Bashfuscator

Framework modular para ofuscar scripts de Bash.

- **Repo:** `https://github.com/Bashfuscator/Bashfuscator`

|                   **Acción**                    |                                                                          **Comando / Flag**                                                                          |                                                **Descripción**                                                 |
|:-----------------------------------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------------------:|
| <br><br><br><br><br><br><br><br>**Instalación** | <pre><code>git clone ...<br><br>  <br><br>cd Bashfuscator<br><br>  <br><br>pip3 install setuptools==65<br><br>  <br><br>python3 setup.py install --user</code></pre> | <br><br><br><br><br><br><br>Requiere `setuptools==65` específicamente. Se ejecuta desde `./bashfuscator/bin/`. |
|               <br>**Uso Básico**                |                                                     <pre><code>./bashfuscator -c 'cat /etc/passwd'</code></pre>                                                      |                <br>Genera un payload aleatorio. **Ojo:** Puede generar salidas enormes (+1MB).                 |
|  <br>**Uso Optimizado**<br><br>_(Recomendado)_  |                                        <pre><code>./bashfuscator -c 'comando' -s 1 -t 1 --no-mangling --layers 1</code></pre>                                        |           <br>Genera payloads **cortos y simples**. Ideal para inyecciones con límite de caracteres.           |
|              <br>**Verificación**               |                                                          <pre><code>bash -c 'PAYLOAD_GENERADO'</code></pre>                                                          |                 <br>Prueba localmente que el churro de código generado ejecuta lo que quieres.                 |
^ci-herramienta-linux

---

### 2. Windows: DOSfuscation

Herramienta interactiva para ofuscar comandos de CMD (usando variables de entorno y substrings).

- **Repo:** `https://github.com/danielbohannon/Invoke-DOSfuscation.git`
- **Plataforma:** PowerShell (Funciona en Linux vía `pwsh`).

|         **Paso**          |                             **Comando (Interfaz Interactiva)**                              |                             **Descripción**                             |
|:-------------------------:|:-------------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------:|
|  <br><br>**1. Iniciar**   | <pre><code>Import-Module .\Invoke-DOSfuscation.psd1<br><br>Invoke-DOSfuscation</code></pre> | <br><br>Carga el módulo y lanza la shell interactiva de la herramienta. |
|   <br>**2. Setear Cmd**   |                    <pre><code>SET COMMAND type C:\flag.txt</code></pre>                     |               <br>Define el comando que quieres ocultar.                |
| <br>**3. Elegir Técnica** |                              <pre><code>encoding</code></pre>                               |     Entra al menú de codificación (basado en variables de entorno).     |
|    <br>**4. Generar**     |                                  <pre><code>1</code></pre>                                  |     <br>Selecciona la variante 1 (suele usar `%TEMP:~-3,-2%` etc).      |
|     <br>**Resultado**     |                        <pre><code>typ%TEMP:~-3,-2% ...</code></pre>                         |      <br>Copia el output final para inyectarlo en la CMD víctima.       |
^ci-herramienta-windows

> [!TIP] Ejecutar DOSfuscation en Linux (Kali/Parrot)
> 
> Si no tienes una VM de Windows a mano, puedes usar esta herramienta en tu Kali:
> 
> 1. Instala PowerShell: `sudo apt install powershell`
>     
> 2. Ejecuta `pwsh` en tu terminal.
>     
> 3. Sigue los pasos de instalación/uso igual que en Windows.

***

## Overview


***

