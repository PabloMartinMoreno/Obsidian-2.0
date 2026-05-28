---
aliases:
tags:
primary categories:
secondary categories:
kind: Tertiary Category
---
# C2 Infrastructure

***

## 📡 C2 Design & Architecture
  Diseño de la red de ataque para proteger al operador.

   - [[Setting up C2 Redirectors]] (Uso de `socat`, `iptables` o Apache/Nginx para ocultar la IP real del Teamserver.)
   - [[Domain Fronting & Hiding]] (Técnicas para enmascarar el tráfico C2 como tráfico legítimo a dominios de confianza.)

## ⚙ Traffic Control (Malleable C2)
  Modificación de la apariencia del tráfico de red.

   - [[C2 Profiles & Malleability]] (Configuración de perfiles para que el tráfico parezca navegación web normal, tráfico de Amazon, etc.)
   - [[Managing Jitter & Beacons]] (Configuración de intervalos de conexión aleatorios para evitar patrones de tiempo fijos.)

## 🛠 Frameworks Setup
  Instalación y configuración básica de herramientas de comando y control.

   - [[Setting up Metasploit Listeners]] (Configuración de `multi/handler` para recibir conexiones.)
   - [[Setting up Sliver C2]] (Configuración básica de Sliver: listeners, profiles, implants.)
   - [[Setting up Covenant]] (Configuración de Covenant C2 en .NET.)

***
