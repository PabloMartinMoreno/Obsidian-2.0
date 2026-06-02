---
aliases:
tags:
kind: Concept
linked:
---
# Obtener login en os linux sin contraseña

---


1. En el menu donde se elije el OS tocar la `e` y en la linea donde dice `ro quiet` borrarlo y poner:
```bash
rw init=/bin/bash
```
Para cerrarlo y guarda los cambios poner `ctrl+x` o `f10`

2. Luego modificar el `/etc/network/interfaces` y cambiar las interfaces de las dos ultimas lineas por las nuestra. 
	Antes:
	```bash
	allow hotplug enpos3
	iface_enpos3 inet dhcp
	```
	Despues:
	```bash
	allow hotplug ens33
	iface_ens33 inet dhcp
	```
