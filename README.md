Memory Pressure Indicator - GNOME Shell extension

What it does
------------
- Reads /proc/pressure/memory (PSI) every second
- Shows a small colored dot in the top panel and a short label S:.. F:.. (some.avg10 / full.avg10)
- Popup shows avg10/60/300 for both "some" and "full"

Install
-------
1. Create directory:
   ~/.local/share/gnome-shell/extensions/memory-pressure-indicator@local
2. Place metadata.json, extension.js and stylesheet.css in that directory.
3. Restart GNOME Shell (Alt+F2, type `r` and Enter), or log out/in.
4. Enable the extension using the Extensions app or `gnome-extensions enable memory-pressure-indicator@local`.

Notes
-----
- Requires access to /proc/pressure/memory (kernel must support PSI). Ubuntu 24 kernels include it.
- You can tweak POLL_INTERVAL_MS at the top of extension.js.
- For packaging, increment the version in metadata.json.
*/
