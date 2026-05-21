---
aliases:
tags:
  - type/moc/tertiary
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Lateral Movement]]"
  - "[[Windows]]"
kind: Tertiary Category
---
# Movimiento Lateral de Windows y AD

***

## ♻ Credential Replay & Reuse
  Técnicas que utilizan credenciales (hashes o tickets) robadas para autenticarse en otros sistemas.

   - [[NTLM Pass-the-Hash]] (Reutilización de hashes NTLM para autenticarse en otros sistemas sin conocer la contraseña en claro.)
   - [[Kerberos Pass-the-Ticket]] (Reutilización de tickets Kerberos robados para obtener acceso a servicios o recursos.)

## 🐍 Protocol Poisoning & Relay Attacks
  Ataques que manipulan protocolos de red para interceptar credenciales o retransmitir autenticaciones.

   - [[LLMNR & NBT-NS Poisoning]] (Suplantación de servicios de resolución de nombres para interceptar credenciales.)
   - [[SMB Net-NTLM Relay]] (Intercepción y retransmisión de autenticaciones NTLM a otros sistemas para ejecutar código.)

## ⚙ Built-in Windows Features Abuse
  Uso de herramientas y funcionalidades legítimas de Windows para la ejecución remota y movimiento lateral.

   - [[PsExec]] (Ejecución remota de comandos o programas utilizando recursos compartidos administrativos.)
   - [[WMI and WinRM for Lateral Movement]] (Uso de Windows Management Instrumentation y Windows Remote Management para ejecución remota.)

***