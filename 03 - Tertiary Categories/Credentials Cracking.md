---
aliases:
tags:
  - type/moc/tertiary
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
type: Tertiary Category
---
# Credentials Cracking

***

## 🕵 Hash Identification & Analysis
El primer paso es saber qué estamos atacando.

 - [[Identifying Hash Formats]] (Uso de herramientas como `hashid` o `nth` para determinar el tipo de algoritmo, ej: MD5, SHA-256, bcrypt.)

## 🔨 Offline Cracking Tools
Las herramientas principales para romper hashes utilizando la potencia de CPU/GPU local.

 - [[Cracking with Hashcat]] (La herramienta más rápida basada en GPU. Modos de ataque, máscaras y optimización.)
 - [[Cracking with John the Ripper]] (La herramienta clásica y versátil ("The Ripper"). Excelente para formatos exóticos y uso de CPU.)
 - [[Cracking with Ophcrack]] (Uso de Rainbow Tables para romper contraseñas de Windows instantáneamente.)

## 🎯 Specific Target Cracking
Metodologías para romper archivos protegidos y formatos específicos más allá de los hashes de usuario.

 - [[Cracking Archives & Documents]] (Extracción de hashes y craqueo de ZIP, RAR, 7z, PDF y documentos de Office protegidos.)
 - [[Cracking SSH Keys & Keyfiles]] (Romper la "passphrase" de claves privadas SSH id_rsa cifradas.)
 - [[Cracking Wireless Handshakes]] (Ataques offline contra capturas WPA/WPA2 (.cap files).)
 - [[Cracking Wallet Files]] (Ataques contra billeteras de criptomonedas encontradas en el sistema.)

## 🌐 Online Service Cracking
Ataques activos contra servicios en ejecución (Login Brute-Force).
(Nota: Muchas veces esto va en "Enumeración", pero cabe aquí si el enfoque es romper la credencial).

 - [[Online Cracking with Hydra]] (Ataque rápido a servicios como SSH, FTP, RDP, HTTP Form.)
 - [[Online Cracking with Medusa]] (Alternativa modular a Hydra para fuerza bruta paralela.)

## 📚 Wordlists & Mutation Rules
La "munición" necesaria para los ataques.

 - [[Wordlists Management]] (Dónde encontrar y cómo organizar diccionarios: Rockyou, Seclists, Kaonashi.)
 - [[Mutating Wordlists with Rules]] (Uso de reglas (OneRuleToRuleThemAll, Best64) para generar variaciones de contraseñas.)
 - [[Generating Custom Wordlists]] (Uso de `cewl` o `crunch` para crear diccionarios basados en el objetivo.)

***
