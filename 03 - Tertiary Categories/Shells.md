---
aliases:
tags:
  - type/moc/tertiary
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
kind: Tertiary Category
---
# Shells

***

## 🐚 Access Shell Types
  Diferentes métodos para establecer y mantener un canal de comandos.

   - [[Reverse Shells]] (El sistema comprometido se conecta al atacante; útil para evadir firewalls de entrada.)
   - [[Bind Shells]] (El sistema comprometido abre un puerto a la escucha al cual el atacante se conecta.)
   - [[Web Shells]] (Scripts web persistentes que permiten ejecutar comandos vía navegador.)

## ✨ Stabilization & TTY Upgrade
  Técnicas para convertir una shell básica en una terminal interactiva completa (autocompletado, Ctrl+C, editores).

   - [[Upgrading Simple Shells to Fully Interactive TTY]] (Uso de Python pty, script, stty raw, etc. para estabilizar la shell.)

## 🧬 Payload Generation & One-Liners
  Generación de código para invocar shells en diferentes lenguajes y sistemas.

   - [[Reverse Shell One-Liners]] (Colección rápida de comandos para Bash, Python, PowerShell, PHP, etc.)
   - [[Msfvenom Payload Generation]] (Creación de ejecutables y shellcodes maliciosos con Metasploit.)


***
