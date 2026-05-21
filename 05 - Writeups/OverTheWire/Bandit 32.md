---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit32.html
dificultad: Fácil
autor: 
relacionados:
  - "[[Bandit 31]]"
---
# Datos

> [!todo] Objetivo
> Después de tanto git, es hora de otra escapada. ¡Buena suerte!
^objetivo

> [!tip] Recursos
> sh, man
^recursos

# Resolución

## Uppershell

Al entrar me encuentro con que lo que escribo, lo pone en mayúsculas automáticamente. 
```bash
WELCOME TO THE UPPERCASE SHELL
>> ls
sh: 1: LS: Permission denied
```

Si reviso desde otro bandit que shell tiene bandit 32:
```bash
grep bandit32 /etc/passwd
```
Me dice que la bash es una uppershell
Si le hago un cat, no tengo permisos para verlo. 

## Parámetros especiales

Para entender la solución a este ejercicio… Si yo hago un script con el valor $1.
```bash
echo $1 > script.sh

# Le doy permiso de ejecución
chmod +x script.sh
```

Al ejecutarlo no veo nada exactamente, ya que $1 hace referencia al argumento que yo le pase, por lo que si lo ejecuto junto a algún argumento:
```bash
./script.sh asdads

# me sale
asdads
```

Si le agrego un $2, veo el siguiente argumento:

```bash
./script.sh asdads eeee

# me sale
asdads eeeee
```

Ahora si pongo un `$0`, al pasarle 3 argumentos, resulta que el primero me devuelve el nombre del archivo
```script.sh
$0 $1 $2
```

```bash
# Lo ejecuto 
./script.sh aaaaa asdads eeee

# devuelve
./script.sh asdads eeee
```
El $0 me devuelve el nombre del archivo.

## Solución 

El truco para superar este nivel es entender cómo funcionan los parámetros especiales en Bash. En particular, **`$0`** es una variable especial que contiene el nombre del shell o del script que se está ejecutando. Al ejecutar **`$0`** como un comando, esencialmente estás reiniciando el shell.

Cuando escribes **`$0`** en el shell restringido, estás invocando una nueva instancia del shell actual. Sin embargo, debido a una mala configuración o a la falta de restricciones en este nuevo shell, la nueva instancia no hereda las limitaciones del shell restringido original. Esto te permite acceder a un shell completo sin restricciones.

**Explicación técnica:**

- **`$0` en Bash:** Representa el nombre del shell o del script en ejecución.
- **Reinvocación del shell:** Al ejecutar **`$0`**, estás lanzando una nueva sesión del shell.
- **Escape del shell restringido:** La nueva sesión no está sujeta a las restricciones originales, permitiéndote ejecutar comandos libremente.
- **Razón detrás de la solución:** El shell restringido no previene adecuadamente la reinvocación de sí mismo a través de **`$0`**, lo que constituye una vulnerabilidad que puedes explotar para escapar.

Al escapar del shell restringido, puedes acceder a los archivos necesarios y completar el nivel siguiendo las instrucciones proporcionadas.

Poner en la uppershell:
```
$0
```

Esto me da una bash, hago un `cd /home/bandit32`, encuentro un `README.TXT` que dice lo siguiente:
```
Congratulations on solving the last level of this game!

At this moment, there are no more levels to play in this game. However, we are constantly working
on new levels and will most likely expand this game with more levels soon.
Keep an eye out for an announcement on our usual communication channels!
In the meantime, you could play some of our other wargames.

If you have an idea for an awesome new level, please let us know!

```

Es el ultimo bandit

# Bandera(s)

> [!flag] `fin`
^bandera
