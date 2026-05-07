---
aliases:
  - HPP Stack Reference
  - PHP HPP
  - ASP.NET HPP
  - Java HPP
  - Node Express HPP
tags:
  - type/cheatsheet
  - vuln/hpp
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Parameter Pollution]]'
---
# HPP - Per-Stack Behavior

***

## PHP (Last Value Wins)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `$_GET['a']` con `?a=1&a=2` | Returns `'2'` (last) | Standard. |
| `$_POST['a']` con body `a=1&a=2` | Returns `'2'` | Same. |
| `$_REQUEST['a']` | Order: EGPCS — last-source-wins | Per-php.ini. |
| Array access via `[]` | `?a[]=1&a[]=2` returns `['1', '2']` | Explicit array. |
| Mixed `?a=1&a[]=2` | Mixed types — typically array overrides scalar | Edge. |
| `parse_str()` | Same as `$_GET` | Function-level. |
| `array_unique` filter | Some apps dedupe | Per-app. |
| `extract()` con `EXTR_OVERWRITE` | Last value wins | Function-level. |
| Sessions con same name | Per-session storage | Edge. |
| Cookies con same name | Most recently set wins | Cookie behavior. |
| Older PHP < 5.4 quirks | Param count limits | Legacy. |
| `max_input_vars` config | DoS-protection limit | Per-config. |
| Combine con file upload | Multipart form behavior | Edge. |
^hpp-stack-php

___

## ASP.NET (Concatenation con Coma)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Request.QueryString["a"]` con `?a=1&a=2` | Returns `"1,2"` | Comma-separated. |
| `Request.Form["a"]` con duplicate | Same | Same. |
| `Request.Params["a"]` | Same comma-concat | Combined source. |
| Single value vs array | Default single string with commas | Standard. |
| `Request.QueryString.GetValues("a")` | Returns `string[]` `["1", "2"]` | Explicit. |
| Server-side concatenation | `"1,2"` value passed to backend | SQLi WAF bypass vector. |
| ASP.NET MVC / Web API | Per-binder behavior | Per-version. |
| Model binding | Multi-value handling configurable | Custom. |
| `[FromBody]` JSON | Different from query | Multi-source. |
| `[FromForm]` con duplicates | Standard behavior | Same. |
| ASP.NET Core | Mostly compatible | Per-version. |
| Combine con SQLi | `?id=SELECT&id=*&id=FROM&id=users` → `"SELECT,*,FROM,users"` | Standard chain. |
| WAF bypass canonical | This is the typical bypass vector | High-impact. |
^hpp-stack-aspnet

___

## Java (First Wins / Array)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `request.getParameter("a")` con `?a=1&a=2` | Returns `"1"` (first) | Standard. |
| `request.getParameterValues("a")` | Returns `String[]` `["1", "2"]` | Explicit array. |
| Tomcat / Jetty | Same default | Standard. |
| Spring `@RequestParam("a")` | First value | Default. |
| Spring `@RequestParam List<String>` | All values | Explicit. |
| Spring MVC con `String[]` | All values | Explicit. |
| `request.getParameterMap()` | `Map<String, String[]>` | All values. |
| Servlet API | Standard behavior | Same. |
| Combine con XML | If app processes via XML — different behavior | Edge. |
| WebSphere | Mostly compatible | Same. |
| WebLogic | Same | Same. |
| Java EE Filters | May modify | Per-config. |
| Combine con security frameworks | Spring Security may filter | Per-app. |
^hpp-stack-java

___

## Python / Flask / Django (Last Wins típico)

| **Framework** | **Function** | **Behavior** |
|:---:|:---:|:---:|
| Flask `request.args.get('a')` | Returns `"1"` (first) — Werkzeug default | First wins typical. |
| Flask `request.args.getlist('a')` | Returns `["1", "2"]` | Explicit list. |
| Flask `request.values.get('a')` | Combined query + form, first wins | Multi-source. |
| Django `request.GET.get('a')` | Returns last `"2"` | Django last-wins. |
| Django `request.GET.getlist('a')` | Returns `["1", "2"]` | Explicit. |
| FastAPI con Pydantic | Per-binder | Modern Python. |
| FastAPI `Query()` typed | Standard | Typed. |
| Tornado `self.get_argument("a")` | Last value (default) | Tornado-specific. |
| Tornado `self.get_arguments("a")` | List | Explicit. |
| AIOHTTP `request.query.get('a')` | First | First wins. |
| Bottle `request.query.a` | Per-bottle | Per-version. |
| Pyramid | Standard | Same. |
| Combine con Pydantic validation | Type checking may vary | Modern. |
^hpp-stack-python

___

## Node.js / Express (Varies)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `qs` library (Express default) | `?a=1&a=2` → `req.query.a = ['1', '2']` (array) | Default Express. |
| `querystring` (Node legacy) | Same array behavior | Same. |
| Express `extended:true` | Uses qs library | Modern. |
| Express `extended:false` | Uses querystring | Legacy. |
| Custom config | Per-app | Edge. |
| `req.query.a[0]` | First element | Manual access. |
| `req.body.a` con duplicate | Same array behavior | POST body. |
| body-parser config | Per-config | Standard. |
| Koa `ctx.query.a` | Per-version | Koa-specific. |
| Hapi default parser | Per-version | Same. |
| Fastify `request.query.a` | First wins typically | Standard. |
| Combine con prototype pollution | `?__proto__[a]=1` con qs library | PP combo. |
| Multipart `multer` | File upload context | Different. |
| GraphQL variables | JSON params, distinct from query | Adjacent. |
^hpp-stack-node

___

## Ruby on Rails (Last Wins)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `params[:a]` con `?a=1&a=2` | Returns `"2"` (last) | Standard. |
| `params[:a].class` | String | Default. |
| `?a[]=1&a[]=2` | Array `["1", "2"]` | Explicit array notation. |
| `request.parameters[:a]` | Same as params | Alias. |
| Rack middleware | Standard parsing | Layer. |
| Sinatra | Same Rack behavior | Same. |
| Hash params `?a[b]=1&a[b]=2` | Nested — last wins | Same logic. |
| Strong parameters | Filtering applied después de parse | Defense at action level. |
| Combine con CSRF token | Token validated separately | Standard. |
| Combine con permit() | `params.require(:a).permit(...)` | Whitelist. |
| Mass assignment | Combine con HPP for privesc | Standard chain. |
| Action Cable params | Same | Same. |
^hpp-stack-ruby

### Cross-stack reference table

```
| Stack         | First   | Last    | Concat    | Array notation |
|---------------|---------|---------|-----------|----------------|
| PHP           | -       | YES (default) | -    | a[]=1&a[]=2 → array |
| ASP.NET       | -       | -       | YES "1,2" | GetValues() → array |
| Java          | YES     | -       | -         | getParameterValues() |
| Python Flask  | YES     | -       | -         | getlist() → array |
| Python Django | -       | YES     | -         | getlist() → array |
| Node Express  | -       | -       | -         | qs default → array |
| Ruby Rails    | -       | YES     | -         | a[]=1&a[]=2 → array |
| Go            | YES     | -       | -         | Query()["a"] → array |
```

***
