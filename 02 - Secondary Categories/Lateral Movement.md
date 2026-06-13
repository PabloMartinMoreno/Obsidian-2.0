---
aliases:
  - Movimiento Lateral
tags:
primary categories:
  - "[[Red Team]]"
kind: Secondary Category
---
# Movimiento Lateral

---

## Mapa Mental

```mermaid
mindmap
  root((Lateral))
    Auth_Abuse
      Pass_the_Hash
      Pass_the_Ticket
      Overpass_the_Hash
      Silver_Ticket
    Management_Protocols
      WMI
      WinRM
      PsExec
      evil-winrm
      RDP
      SSH
    Relay
      NTLM_Relay
      LDAP_Relay
      SMB_Relay
    Pivoting
      SSH_Tunnel
      Chisel
      Ligolo
      Proxychains
      Socks_Proxy
    AD_Specific
      DCSync
      Golden_Ticket
      Constrained_Delegation
      RBCD
```

---

## [[Windows & Active Directory Movimiento Lateral]]


---

## Vectores específicos

- [[WMI and WinRM]] — management-blessed lateral movement (wmiexec, evil-winrm, PS Remoting).
- [[Pass-the-Hash]] — NT hash → SMB/WMI/WinRM sin password.
- [[Pass-the-Ticket]] — Kerberos ticket injection.
- [[evil-winrm]] — cliente Ruby WinRM con Invoke-Binary.

---

## [[Pivoting & Port Forwarding]]


---
