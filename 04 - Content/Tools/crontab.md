---
aliases:
  - crontab
tags:
  - tool/crontab
  - env/linux
  - technique/persistence
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
---

# Crontab

## Definición 

> [!INFO] crontab (**cron tab**le)
> Es una herramienta que permite programar tareas automáticas en sistemas basados en Unix, como Linux. Estas tareas se denominan *cron jobs* y se ejecutan en intervalos regulares, que pueden ser tan precisos como cada minuto o tan espaciados como una vez al año.
^definicion

Es tanto el nombre del archivo donde se almacenan las tareas programadas como el comando utilizado para gestionar estos archivos.

- **Función Principal**: Definir y gestionar las tareas programadas que serán ejecutadas por `cron`.
- **Archivos**: Cada usuario en el sistema puede tener su propio archivo `crontab`, donde define sus tareas automáticas. Estos archivos se encuentran generalmente en `/var/spool/cron/crontabs/`.
- **Comando**: El comando `crontab` se utiliza para editar (`crontab -e`), listar (`crontab -l`), o eliminar (`crontab -r`) las tareas programadas de un usuario específico.

### Sintaxis de Crontab

La sintaxis de una entrada en un archivo `crontab` sigue el siguiente formato:
```
# Minuto  Hora  Día-del-Mes  Mes  Día-de-la-Semana  Comando
  *       *     *            *    *                /ruta/del/comando
```

- **Minuto**: Especifica el minuto en que se ejecutará la tarea (0-59).
- **Hora**: Especifica la hora en que se ejecutará la tarea (0-23).
- **Día-del-Mes**: Especifica el día del mes en que se ejecutará la tarea (1-31).
- **Mes**: Especifica el mes en que se ejecutará la tarea (1-12).
- **Día-de-la-Semana**: Especifica el día de la semana en que se ejecutará la tarea (0-7, donde 0 y 7 son domingo).

Cada campo puede tomar un valor específico, un rango de valores, una lista de valores separados por comas o un asterisco (*) para indicar "cualquier valor".

### Ejemplos de Crontab

1. **Ejecutar un script todos los días a las 2:30 AM:**
   ```
   30 2 * * * /ruta/al/script.sh
   ```

2. **Ejecutar un comando todos los lunes a las 5:00 PM:**
   ```
   0 17 * * 1 /ruta/al/comando
   ```

3. **Ejecutar una tarea cada 15 minutos:**
   ```
   */15 * * * * /ruta/al/comando
   ```

4. **Ejecutar un script solo el 1 de enero a la medianoche:**
   ```
   0 0 1 1 * /ruta/al/script.sh
   ```

5. **Ejecutar un comando cada hora durante las horas laborales (9 AM a 6 PM) de lunes a viernes:**
   ```
   0 9-18 * * 1-5 /ruta/al/comando
   ```

### Comandos Relacionados

- **`crontab -e`**: Abre el archivo `crontab` del usuario para editarlo.
- **`crontab -l`**: Lista las tareas programadas en el `crontab` del usuario.
- **`crontab -r`**: Elimina el `crontab` del usuario, quitando todas las tareas programadas.
- **`crontab -u usuario`**: Permite editar el `crontab` de otro usuario (requiere permisos de superusuario).

### Consideraciones Importantes

- **Entorno**: Cuando se ejecutan los cron jobs, no se utiliza el entorno del usuario por defecto. Por lo tanto, es necesario definir variables de entorno como PATH en el `crontab`, o usar rutas absolutas en los comandos.

- **Salida de los comandos**: Si un cron job produce una salida (stdout o stderr), se enviará un correo al usuario que lo programó. Esto puede evitarse redirigiendo la salida a `/dev/null`:
  ```
  0 2 * * * /ruta/al/comando > /dev/null 2>&1
  ```

- **Redirección de salida**: Es posible redirigir la salida de un cron job a un archivo:
  ```
  0 2 * * * /ruta/al/comando >> /ruta/al/archivo_de_log 2>&1
  ```

### Crontab Especial

Existen palabras clave en `crontab` que simplifican la programación de tareas:

- **@reboot**: Ejecuta el comando al iniciar el sistema.
- **@yearly**: Ejecuta el comando una vez al año (equivalente a `0 0 1 1 *`).
- **@monthly**: Ejecuta el comando una vez al mes (equivalente a `0 0 1 * *`).
- **@weekly**: Ejecuta el comando una vez a la semana (equivalente a `0 0 * * 0`).
- **@daily**: Ejecuta el comando una vez al día (equivalente a `0 0 * * *`).
- **@hourly**: Ejecuta el comando una vez cada hora (equivalente a `0 * * * *`).