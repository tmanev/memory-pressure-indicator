/* memory-pressure-indicator — GNOME 46+ (module/class version)
 * Shows memory PSI (/proc/pressure/memory) in top panel
 */

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const POLL_INTERVAL_MS = 5000; // update interval

function parsePressure(content) {
    const res = { some: {}, full: {} };
    try {
        for (const line of content.trim().split(/\n/)) {
            const [key, ...parts] = line.trim().split(/\s+/);
            for (const p of parts) {
                const [k, v] = p.split('=');
                if (k && v) res[key][k] = parseFloat(v);
            }
        }
    } catch (e) {
        logError(e, 'memory-pressure: parse error');
    }
    return res;
}

const MemoryPressureIndicator = GObject.registerClass(
class MemoryPressureIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Memory Pressure Indicator');

        // Small colored dot
        this._dot = new St.BoxLayout({ style_class: 'memory-pressure-dot' });
        this.add_child(this._dot);

        // Label text
        this._label = new St.Label({
            text: 'S:0.00 F:0.00',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._label);

        // Popup menu
        this._menuItem = new PopupMenu.PopupMenuItem('Loading...');
        this.menu.addMenuItem(this._menuItem);

        this._history = [];

        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, POLL_INTERVAL_MS, () => {
            this._update();
            return GLib.SOURCE_CONTINUE;
        });

        this._update();
    }

    _readPressureFile() {
        try {
            const [ok, contents] = GLib.file_get_contents('/proc/pressure/memory');
            if (!ok) return null;
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(contents);
        } catch (e) {
            logError(e, 'memory-pressure: read error');
            return null;
        }
    }

    _update() {
        const raw = this._readPressureFile();
        if (!raw) return;

        const parsed = parsePressure(raw);
        const some10 = parsed.some.avg10 || 0;
        const full10 = parsed.full.avg10 || 0;

        // Label
        this._label.text = `S:${some10.toFixed(2)} F:${full10.toFixed(2)}`;

        // Dot color
        let color = '#48a14f'; // green
        if (some10 >= 5 || full10 >= 5) color = '#d9534f';       // red
        else if (some10 >= 1 || full10 >= 1) color = '#f0ad4e';  // orange

        this._dot.set_style(
            `background-color:${color};width:12px;height:12px;border-radius:8px;margin-right:6px;`
        );

        // Popup info
        const lines = [
            `some.avg10 = ${(parsed.some.avg10 ?? 0).toFixed(3)}`,
            `some.avg60 = ${(parsed.some.avg60 ?? 0).toFixed(3)}`,
            `some.avg300 = ${(parsed.some.avg300 ?? 0).toFixed(3)}`,
            `full.avg10 = ${(parsed.full.avg10 ?? 0).toFixed(3)}`,
            `full.avg60 = ${(parsed.full.avg60 ?? 0).toFixed(3)}`,
            `full.avg300 = ${(parsed.full.avg300 ?? 0).toFixed(3)}`,
        ];

        this._menuItem.label.text = lines.join('\n');

        // Keep short history
        const ts = new Date().toISOString();
        this._history.push({ t: ts, s: some10, f: full10 });
        if (this._history.length > 60) this._history.shift();
    }

    stop() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
    }
});

export default class MemoryPressureExtension {
    constructor() {
        this._indicator = null;
    }

    enable() {
        this._indicator = new MemoryPressureIndicator();
        Main.panel.addToStatusArea('memory-pressure-indicator', this._indicator, 1, 'right');
    }

    disable() {
        if (this._indicator) {
            this._indicator.stop();
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
