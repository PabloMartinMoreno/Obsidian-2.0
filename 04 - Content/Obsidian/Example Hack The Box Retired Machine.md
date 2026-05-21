---
aliases:
tags:
  - type/concept
primary categories:
  - "[[Training]]"
secondary categories:
  - "[[Hack the Box]]"
kind: Writeup
---
# [[Example Hack The Box Retired Machine]]

***

## Overview

This retired Hack The Box Linux machine simulated a typical web-facing content management system misconfiguration, presenting opportunities to exercise web application exploitation, credential reuse, and Linux privilege escalation techniques.

Initial access was achieved by exploiting a vulnerable WordPress plugin that permitted unauthenticated remote code execution (RCE), allowing the attacker to drop a reverse shell. Lateral movement was facilitated by enumerating local WordPress configuration files, extracting hashed user credentials, and successfully cracking a low-complexity password. Privilege escalation was obtained through a misconfigured `sudo` rule that permitted the compromised user to run `perl` with *root* privileges, enabling immediate shell access as root.

## Environment Overview

* **TEST.HTB (`192.168.X.Y`)**:
	* **Operating System**: Linux (Ubuntu-based distribution)
	* **Primary Service**: Apache web server hosting a WordPress blog
	* **Secondary Service(s)**: N/A
	* **Exposed Port(s)**: `80/tcp`, `22/tcp`
	* **Application Stack**:
		* WordPress CMS (vulnerable plugin enabled)
		* PHP backend
		* MySQL database (internally accessible)
	* **User Accounts**:
		* **WordPress**:
			* *admin* (password unknown)
			* *paul*:*qwerty123*
		* **TEST.HTB**:
			* *paul*:*qwerty123*
			* *root* (password unknown)
	* **Privilege Escalation Vector**:
		* Misconfigured `sudoers` file allowed password-less execution of `perl` as *root*:

			```bash
			perl -e 'exec "/bin/sh";'
			```

## Tooling Breakdown

| **Tool**   | **Usage Tags**              | **Flags/Configs**                                                           | **Notes**                                                                            |
| ---------- | --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Nmap       | #technique/recon/active #service/http                  | `-sCV -Pn`                                                                  | Found port 80 (HTTP) and port 22 (SSH); default scripts revealed HTTP server details |
| WPScan     | #technique/recon/active #service/wordpress #asset/web-app | `--url http://<target> --enumerate ap,u,t --plugins-detection 'aggressive'` | Discovered plugin vulnerable to unauthenticated RCE, CVE-XXXX-YYYY                   |
| `gobuster` | #technique/recon/active #asset/web-app                 | `dir -u http://<target> -w /usr/share/wordlists/dirb/common.txt`            | Confirmed plugin path used later for exploitation                                    |

## Tactics, Techniques, and Procedures (TTP) Breakdown

| **Tactic (Name + ID)**                                                   | **Technique (Name + ID)**                                                                                  | **Usage Tags**                           | **Notes**                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| [Initial Access (TA0001)](https://attack.mitre.org/tactics/TA0001)       | [Exploit Public-Facing Application (T1190)](https://attack.mitre.org/techniques/T1190)                     | #service/wordpress #asset/web-app #technique/execution                                  | RCE on WordPress via plugin vulnerability      |
| [Execution (TA0002)](https://attack.mitre.org/tactics/TA0002)            | [Command and Scripting Interpreter: Unix Shell (T1059.004)](https://attack.mitre.org/techniques/T1059/004) | #technique/post-exploitation #env/linux                                                 | Executing commands after initial foothold      |
| [Discovery (TA0007)](https://attack.mitre.org/tactics/TA0007)            | [System Information Discovery (T1082)](https://attack.mitre.org/techniques/T1082)                          | #technique/post-exploitation #env/linux                                                 | Collecting basic OS and hostname info          |
| [Discovery (TA0007)](https://attack.mitre.org/tactics/TA0007)            | [File and Directory Discovery (T1083)](https://attack.mitre.org/techniques/T1083)                          | #technique/post-exploitation #env/linux                                                 | Finding web root and user data                 |
| [Credential Access (TA0006)](https://attack.mitre.org/tactics/TA0006)    | [OS Credential Dumping (T1003)](https://attack.mitre.org/techniques/T1003)                                 | #service/wordpress #technique/post-exploitation #env/linux                              | Retrieving WordPress hash from config/database |
| [Credential Access (TA0006)](https://attack.mitre.org/tactics/TA0006)    | [Brute Force: Password Cracking (T1110.002)](https://attack.mitre.org/techniques/T1110/002)                | #service/wordpress #cred/password-cracking                                              | Cracked password hash of *paul* WordPress user |
| [Lateral Movement (TA0008)](https://attack.mitre.org/tactics/TA0008)     | [Remote Services: SSH (T1021.004)](https://attack.mitre.org/techniques/T1021/004)                          | #service/ssh                                                                            | Used cracked credentials to switch to *paul*   |
| [Privilege Escalation (TA0004)](https://attack.mitre.org/tactics/TA0004) | [Abuse Elevation Control Mechanism: Sudo (T1548.003)](https://attack.mitre.org/techniques/T1548/003)       | #tool/sudo #technique/privilege-escalation #tool/perl #env/linux                        | Exploited `sudo perl` to get *root*            |

## Follow-up Items

* [x] Review additional `sudo` misconfigurations and GTFOBins related to `perl`
* [x] Explore automation for plugin-specific enumeration post-WPScan
* [x] Add SSH lateral movement checklist to internal Playbook template

***

## Resources

| Hyperlink                                                                       | Info                             |
| ------------------------------------------------------------------------------- | -------------------------------- |
| [MITRE ATT&CK Framework, MITRE](https://attack.mitre.org/)                      | MITRE ATT&CK Framework           |
| [Example Machine, Hack The Box](https://www.hackthebox.com/hacker/hacking-labs) | Hack The Box online lab platform |

***

*Created Date*: October 19th 2025 (01:22 am)  
*Last Modified Date*: April 21st 2026 (05:30 pm)
