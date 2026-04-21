---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit24.html
dificultad: Fácil
autor: 
relacionados:
  - "[[grep]]"
  - "[[nc]]"
  - "[[Bandit 23]]"
  - "[[Bandit 25]]"
  - "[[echo]]"
---
# Datos

> [!TODO] Objetivo
>  Un demonio está escuchando en el puerto 30002 y te dará la contraseña para bandit25 si se le da la contraseña para bandit24 y un código secreto numérico de 4 dígitos. No hay forma de recuperar el código PIN excepto repasando todas las 10000 combinaciones, lo que se denomina forzar de forma bruta. 
>  No es necesario crear nuevas conexiones cada vez.
^objetivo

# Conceptos clave

Ver [[nc]], [[echo|echo]], [[grep]]

# Resolución

Con [[nc|netcat]] aparte de poner contraseñas de forma tradicional, también se podría hacer de la siguiente manera: 
```bash
echo [contraseña] | nc [hostname] [puerto]
```

Cumpliendo con la consigna, creo un diccionario con las posibles combinaciones:
```bash
for pin in {0000..9999}; do echo "[contraseña] $pin"; done > combinations.txt
```

Luego simplemente seria cuestión de agregarlo al `nc` 
```bash
cat combinations.txt | nc localhost 30002 
```

>[!TIP] Extra
[[grep]] tiene un comando para no mostrar lineas que no nos interesa ver: `grep -v`
>
Lo que simplificaría la vista para la contraseña correcta: 
>```bash
cat combinations.txt | nc localhost 30002 | grep -v "Wrong"
>```
>
También se puede concatenar palabras que no queremos ver de la siguiente forma:
>
>```bash
cat combinations.txt | nc localhost 30002 | grep -vE "Wrong|Please enter"
 >```

# Bandera(s)

> [!FLAG] `iCi86ttT4KSNe1armKiwbQNmB3YJP3q4`
^bandera
