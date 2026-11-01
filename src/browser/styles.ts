export const STYLE_TEXT = `
.dsh-ia {--dsh-ia-fallback-bg:#fff;--dsh-ia-fallback-fg:#0f1115;--dsh-ia-fallback-muted:#61666b;--dsh-ia-fallback-border:#d7dce2;--dsh-ia-accent:#4c88e4;font-family:var(--dsw-font-family,system-ui,sans-serif);color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg));font-size:13px;line-height:1.5;box-sizing:border-box;color-scheme:light}
body[data-ds-dark-theme] .dsh-ia {--dsh-ia-fallback-bg:#232324;--dsh-ia-fallback-fg:#f3f4f6;--dsh-ia-fallback-muted:#adb2b8;--dsh-ia-fallback-border:#43454a;color-scheme:dark}
.dsh-ia * {box-sizing:border-box}
.dsh-ia button,.dsh-ia input,.dsh-ia select {font:inherit;color:inherit}
.dsh-ia button {display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:28px;padding:0 9px;border:0;border-radius:10px;background:transparent;cursor:pointer;white-space:nowrap}
.dsh-ia-menu .dsh-ia-row button,.dsh-ia-menu .dsh-ia-section>button {min-height:34px;padding:0 8px;border-radius:10px;font-size:13px}
.dsh-ia button:hover:not(:disabled) {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia button:disabled {opacity:.4;cursor:default}
.dsh-ia button:focus-visible,.dsh-ia input:focus-visible,.dsh-ia select:focus-visible {outline:2px solid var(--dsw-alias-state-business-primary,var(--dsh-ia-accent));outline-offset:2px}
.dsh-ia-primary {background:var(--dsw-alias-state-business-primary,var(--dsh-ia-accent))!important;color:#fff!important}
.dsh-ia-primary:hover:not(:disabled) {filter:brightness(1.08)}
.dsh-ia-quiet {color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}

.dsh-ia-root {display:flex;align-items:center;gap:0;position:relative;height:28px}
.dsh-ia-trigger {height:28px;padding:0 4px 0 8px;gap:4px;font-size:13px;font-weight:400;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-menu-toggle {height:28px;padding:0 3px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-trigger svg,.dsh-ia-menu-toggle svg {flex:0 0 auto;opacity:.85}

.dsh-ia-menu {position:fixed;width:min(360px,calc(100vw - 24px));max-height:min(70dvh,640px);overflow:auto;overscroll-behavior:contain;padding:4px;border:0;border-radius:16px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.04),0 0 20px rgba(0,0,0,.05);z-index:1000}

.dsh-ia .dsh-ia-menu-row {display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;min-height:34px;padding:0 8px;border:0;border-radius:10px;background:transparent;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg));text-align:left;cursor:pointer}
.dsh-ia-menu-row:hover:not(:disabled) {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia-menu-row:disabled {opacity:.4;cursor:default}
.dsh-ia-menu-title {padding:8px 8px 2px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-menu-note {margin:0;padding:2px 8px 6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-menu-sep {height:1px;margin:4px 8px;background:var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-menu-section>summary {list-style:none;cursor:pointer}
.dsh-ia-menu-section>summary::-webkit-details-marker {display:none}
.dsh-ia-menu-actions {display:flex;gap:2px;padding:2px 0 4px}
.dsh-ia-menu-actions button {min-height:28px;padding:0 8px;border-radius:8px;font-size:13px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-menu-about {display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 8px 4px}
.dsh-ia-menu-about button {min-height:28px;padding:0 8px;border-radius:8px;font-size:13px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-menu-head {display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:8px 8px 6px}
.dsh-ia-menu-head strong {font-size:13px;font-weight:600}
.dsh-ia-menu-rows {display:flex;flex-direction:column;gap:2px;padding:2px 0}
.dsh-ia-opt {display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 6px;border-radius:8px;font-size:13px}
.dsh-ia-opt:hover {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia-opt>span {min-width:0;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-section {border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));margin:4px 4px 0;padding:6px 0 2px}
.dsh-ia-section:first-of-type {border-top:0;margin-top:0}
.dsh-ia-section>h4,.dsh-ia-section>summary {font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));margin:0 0 6px;padding:4px;cursor:default}
.dsh-ia-section>summary {cursor:pointer}
.dsh-ia-row {display:flex;align-items:center;gap:2px;flex-wrap:wrap;margin:2px 0}
.dsh-ia-row label {display:flex;align-items:center;gap:6px;padding:3px 4px;border-radius:7px}
.dsh-ia-field {display:flex;flex-direction:column;gap:5px;margin:6px 4px;font-size:12px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-group .dsh-ia-field {margin:0;gap:2px}
.dsh-ia-field-title {font-size:14px;line-height:22px;font-weight:400;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-field-hint {font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-field-block textarea {margin-top:6px}
.dsh-ia-field input,.dsh-ia-field select,.dsh-ia select {min-height:26px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:0 8px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-field input,.dsh-ia-field textarea {width:100%}
.dsh-ia-field textarea {border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:7px 9px;resize:vertical;min-height:64px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-muted {color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font-size:13px;line-height:20px;margin:0;padding:0}

.dsh-ia-notice {position:fixed;right:12px;width:max-content;max-width:min(440px,calc(100vw - 24px));overflow:auto;padding:8px 12px;border:0;border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.04),0 0 20px rgba(0,0,0,.05);z-index:999}
.dsh-ia-menu .dsh-ia-notice {position:static;max-width:100%;margin:6px 4px;box-shadow:none}
.dsh-ia-pre {white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:12px;max-height:190px;overflow:auto;padding:9px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-module-platform,#8881)}
.dsh-ia-diff ins {background:#27a35b26;text-decoration:none;border-radius:3px}
.dsh-ia-diff del {background:#d9454526;border-radius:3px}
.dsh-ia-draft {border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:10px;padding:8px;margin:6px 4px}
.dsh-ia-draft summary {cursor:pointer;overflow-wrap:anywhere}
.dsh-ia-draft time {font-size:11px;opacity:.65}

.dsh-ia-candidate {position:fixed;display:flex;align-items:center;gap:6px;padding:6px 6px 6px 12px;overflow:auto;border:0;border-radius:16px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.04),0 0 20px rgba(0,0,0,.05);pointer-events:auto;z-index:998}
.dsh-ia-candidate-text {flex:1;white-space:pre-wrap;overflow-wrap:anywhere}
.dsh-ia-ghost {position:fixed;white-space:pre-wrap;overflow-wrap:anywhere;overflow:hidden;pointer-events:none;user-select:none;color:var(--dsw-alias-label-tertiary,#76808d);opacity:.95;z-index:34}
.dsh-ia-ghost-key {display:inline-block;margin-left:6px;padding:0 5px;border:1px solid var(--dsw-alias-border-l2,#c9ced6);border-radius:5px;font-size:10px;line-height:14px;vertical-align:1px;color:var(--dsw-alias-label-secondary,#6b7078)}
[data-composer-card]:has([data-dsh-ia-empty-ghost]) [data-composer-placeholder] {visibility:hidden}

.dsh-ia-settings {display:flex;flex-direction:column;gap:32px;width:100%;max-width:720px;padding:0}
.dsh-ia-settings-fieldset {display:flex;flex-direction:column;gap:32px;border:0;padding:0;margin:0;min-width:0}
.dsh-ia-settings-intro {margin:0;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font-size:13px;line-height:20px}
.dsh-ia-group {display:flex;flex-direction:column;gap:10px}
.dsh-ia-group>h3 {font-size:14px;line-height:22px;font-weight:500;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg));margin:0}
.dsh-ia-group-note {margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-rows {display:flex;flex-direction:column}
.dsh-ia-item {display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-item:first-child {border-top:0}
.dsh-ia-item-main {display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh-ia-item-main b {font-size:14px;line-height:22px;font-weight:400}
.dsh-ia-item-main small {font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-control {display:flex;align-items:center;gap:6px;flex:0 0 auto}
.dsh-ia-control select,.dsh-ia-control input[type=number],.dsh-ia-control input[type=text] {min-height:28px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:0 8px;font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-control select:hover,.dsh-ia-control input:hover {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia-control input[type=number] {width:88px;text-align:right}
.dsh-ia-control input[type=text] {width:180px}
.dsh-ia-control select {min-width:132px}
.dsh-ia-switch {appearance:none;-webkit-appearance:none;flex:0 0 auto;width:36px;height:20px;margin:0;border:0;border-radius:999px;background:var(--dsw-alias-border-l2,#c9ced6);position:relative;cursor:pointer;transition:background .15s ease;padding:0}
.dsh-ia-switch::after {content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0003;transition:transform .15s ease}
.dsh-ia-switch:checked {background:var(--dsw-alias-state-business-primary,var(--dsh-ia-accent))}
.dsh-ia-switch:checked::after {transform:translateX(16px)}
.dsh-ia-settings-actions {display:flex;align-items:center;gap:10px;margin-top:0;padding:16px 0 0;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-settings-actions .dsh-ia-primary {padding:0 14px;min-height:30px}
`
