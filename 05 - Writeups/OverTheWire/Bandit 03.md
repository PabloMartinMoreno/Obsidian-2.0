---
tags:
  - CTF
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit3.html
dificultad: Fácil
autor: 
relacionados:
  - "[[Bandit 02]]"
  - "[[Bandit 04]]"
---
# Datos

> [!TODO] Objetivo
> La contraseña para el siguiente nivel se almacena en un archivo oculto en el directorio `inhere`.
^objetivo
# Resolución

```bash 
cd inhere
```

```
ls -a
```

> [!INFO] Ficheros especiales
> **El *fichero `.`* hace referencia al *directorio actual***
> Por ejemplo, `cd .` te mueve al directorio actual (es decir, no hace nada).
> 
> **El *fichero `..`* hace referencia al *directorio superior***
> Por ejemplo, `cd ..` te mueve al directorio que contiene al directorio actual. 

```
cat ...Hiding-From-You
```

>[!INFO] Archivos ocultos
>Los ficheros y carpetas que empiezan con `.` están ocultos.

# Bandera

> [!FLAG] `MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx`
^bandera
