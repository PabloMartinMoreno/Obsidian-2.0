---
aliases:
  - Enumeración MSSQL (1433, 1434, 2433)
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[T-SQL Command]]"
  - "[[SQLi to RCE]]"
---
# Enumeración MSSQL (1433, 1434, 2433)

***

## Cheatsheet

````tabs
tab: **Linux**

|**Acción**|**Descripción**|
|---|---|
|`nxc mssql <target> -u <username> -p <password> -d >domain>` (NXC, MSSQL)|Especifica una cuenta de Active Directory.|
|`nxc mssql <target> -u <username> -p <password> -d .` (NXC, MSSQL)|Especifica una cuenta local de Windows; usar un punto (.) para la opción de dominio o proveer el nombre de la máquina objetivo.|
|`nxc mssql <target> -u <username> -p <password> --local-auth` (NXC, MSSQL)|Especifica una cuenta SQL; usar el flag `--local-auth`.|
|`nxc mssql ... -q '<query>'` (NXC, MSSQL)|Ejecuta una consulta contra el servicio MSSQL.|
|`impacket-mssqlclient <username>:<password>@<target> -windows-auth` (IMPACKET-MSSQLCLIENT)|Usa el cliente MSSQL de Impacket para autenticarse usando credenciales de Windows.|


tab: **Windows**

| **Acción**                                                                                                                                                                                                             | **Descripción**                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sqlcmd -S <target> -U <user> -P '<password>' -y 30 -Y 30` (SQLCMD)                                                                                                                                                    | Inicia sesión en el servidor MSSQL con [sqlcmd](https://learn.microsoft.com/en-us/sql/tools/sqlcmd/sqlcmd-utility?view=sql-server-ver16), que es una herramienta incorporada. |
| `Import-Module .\PowerUpSQL.ps1`<br><br>`Get-SQLInstanceDomain` <br><br>`Get-SQLQuery -Verbose -Instance "<server-ip>,<server-port>" -username "<domain>\<user>" -password "<password>" -query 'Select @@version'`<br> | <br><br>Usa la herramienta [PowerUpSQL](https://github.com/NetSPI/PowerUpSQL) para consultar el servidor.                                                                                                             |

````
**Nota:** Si NetExec muestra un `Pwn3d!` al autenticar, el usuario es Database Administrator.

---

## Artículos relacionados

- [[T-SQL Command]]s: Transact-SQL (T-SQL) es la extensión de SQL de Microsoft usada con MSSQL.
- [[SQLi to RCE]]: Cómo ejecutar comandos del sistema a través de consultas. (TODO: esto debería ir en la nota de attacking MSSQL)

---

## Overview

*Microsoft SQL Server (MSSQL) es un sistema de gestión de bases de datos relacional propietario desarrollado por Microsoft.*

Se ejecuta en Windows, macOS y Linux, aunque se usa principalmente en Windows. Se integra estrechamente con el framework .NET.

SQL Server Management Studio (SSMS) es el cliente oficial para administrar bases de datos MSSQL, ofreciendo funcionalidades para administración, ejecución de consultas y más. Para fines de hacking, Impacket provee un cliente MSSQL en Python, mientras que módulos de PowerShell como PowerUpSQL permiten gestión en Windows.

*El proceso MSSQL típicamente se ejecuta bajo la cuenta `NT SERVICE\MSSQLSERVER`, con privilegios suficientes para las operaciones de SQL Server.*

Aunque MSSQL soporta comunicación cifrada, debe habilitarse manualmente.

El puerto por defecto para MSSQL es **TCP 1433** y **UDP 1434**. Aunque cuando MSSQL opera en modo “hidden”, usa el puerto **TCP 2433**.

---

## Autenticación

*MSSQL soporta dos modos de autenticación: **Windows Authentication** y **Mixed Authentication**.*

En **Windows Authentication**, el cliente envía credenciales de Windows, que el servidor verifica contra Active Directory (en un dominio) o contra el Security Account Manager (SAM) local (en un entorno no dominio). El acceso se concede si las credenciales son válidas, con permisos ligados a la cuenta de Windows proporcionada.

**Mixed Authentication** combina Windows Authentication con la opción de credenciales de login SQL, permitiendo a usuarios iniciar sesión con un nombre de usuario y contraseña SQL separados.

