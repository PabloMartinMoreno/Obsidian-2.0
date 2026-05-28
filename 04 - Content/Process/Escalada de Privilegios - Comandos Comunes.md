---
aliases:
tags:
kind: Concept
linked:
---
# Comandos más Usados para la Escalada de Privilegios

___

#### Búsqueda de binarios SUID/SGID

Los binarios con el bit SUID/SGID pueden ejecutarse con los permisos de su propietario o grupo. 
```bash
find / -perm -4000 2>/dev/null  # Busca binarios SUID
find / -perm -2000 2>/dev/null  # Busca binarios SGID
find / -perm -6000 2>/dev/null  # Ambos
```

#### Comandos accesibles con `sudo`

Determinar qué comandos pueden ejecutarse sin contraseña.
```bash
sudo -l
```

#### Capacidades asignadas a binarios

Las capacidades de Linux pueden ofrecer privilegios adicionales a ciertos binarios.
```bash
getcap -r / 2>/dev/null
```

#### Ver servicios y tareas en ejecución

Explorar servicios que podrían estar configurados de manera insegura.
```bash
ps aux              # Procesos activos
ps -ef              # Vista detallada de procesos
cat /etc/passwd     # Lista de usuarios en el sistema
cat /etc/shadow     # Contraseñas en hash (si es accesible)
```

#### Archivos con permisos especiales

Explorar archivos que podrían permitir acceso adicional:
```bash
find / -type f -name "*.sh" 2>/dev/null     # Scripts shell
find / -type f \( -name "*.conf" -o -name "*.ini" \) 2>/dev/null  # Archivos de configuración
```

#### Grupos a los que pertenece el usuario

Algunos grupos pueden otorgar permisos especiales (por ejemplo, acceso a Docker, wireshark, o sudo).
```bash
id
groups
```

#### Información del kernel y sistema operativo

Explorar posibles vulnerabilidades en el kernel o el sistema.
```bash
uname -a
cat /etc/os-release
lsb_release -a
```

#### Comandos accesibles con permisos `setuid`

Algunos binarios comunes pueden ser manipulados para elevar privilegios:
```bash
which bash perl python gcc vi vim nano nmap awk
```

#### Ver historial de comandos
Buscar posibles contraseñas o comandos útiles ejecutados por otros usuarios.
```bash
cat ~/.bash_history
```

#### Ver tareas `Cron`
```
cat /etc/crontab
```