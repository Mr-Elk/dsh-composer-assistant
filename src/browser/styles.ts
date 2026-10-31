export const STYLE_TEXT = `
.dsh-ia {--dsh-ia-fallback-bg:#fff;--dsh-ia-fallback-fg:#0f1115;--dsh-ia-fallback-muted:#61666b;--dsh-ia-fallback-border:#d7dce2;--dsh-ia-accent:#4c88e4;font-family:var(--dsw-font-family,system-ui,sans-serif);color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg));font-size:13px;line-height:1.5;box-sizing:border-box;color-scheme:light}
body[data-ds-dark-theme] .dsh-ia {--dsh-ia-fallback-bg:#232324;--dsh-ia-fallback-fg:#f3f4f6;--dsh-ia-fallback-muted:#adb2b8;--dsh-ia-fallback-border:#43454a;color-scheme:dark}
.dsh-ia * {box-sizing:border-box}
.dsh-ia button,.dsh-ia input,.dsh-ia select {font:inherit;color:inherit}
.dsh-ia button {display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:26px;padding:0 9px;border:0;border-radius:8px;background:transparent;cursor:pointer;white-space:nowrap}
.dsh-ia button:hover:not(:disabled) {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia button:disabled {opacity:.4;cursor:default}
.dsh-ia button:focus-visible,.dsh-ia input:focus-visible,.dsh-ia select:focus-visible {outline:2px solid var(--dsw-alias-state-business-primary,var(--dsh-ia-accent));outline-offset:2px}
.dsh-ia-primary {background:var(--dsw-alias-state-business-primary,var(--dsh-ia-accent))!important;color:#fff!important}
.dsh-ia-primary:hover:not(:disabled) {filter:brightness(1.08)}
.dsh-ia-quiet {color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}

.dsh-ia-root {display:flex;align-items:center;gap:0;position:relative}
.dsh-ia-trigger {padding:0 5px 0 7px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-menu-toggle {padding:0 4px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-trigger svg,.dsh-ia-menu-toggle svg {flex:0 0 auto;opacity:.85}

.dsh-ia-menu {position:fixed;width:min(400px,calc(100vw - 24px));max-height:min(70dvh,640px);overflow:auto;overscroll-behavior:contain;padding:8px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:14px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 12px 40px #0003;z-index:1000}
.dsh-ia-menu-head {display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 8px 8px}
.dsh-ia-menu-head strong {font-size:13px;font-weight:600}
.dsh-ia-section {border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));margin-top:6px;padding:6px 4px 2px}
.dsh-ia-section:first-of-type {border-top:0;margin-top:0}
.dsh-ia-section>h4,.dsh-ia-section>summary {font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));margin:0 0 6px;padding:4px;cursor:default}
.dsh-ia-section>summary {cursor:pointer}
.dsh-ia-row {display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:4px 0}
.dsh-ia-row label {display:flex;align-items:center;gap:6px;padding:3px 4px;border-radius:7px}
.dsh-ia-field {display:flex;flex-direction:column;gap:5px;margin:6px 4px;font-size:12px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-field input,.dsh-ia-field select,.dsh-ia select {min-height:26px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:0 8px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-field input,.dsh-ia-field textarea {width:100%}
.dsh-ia-field textarea {border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:7px 9px;resize:vertical;min-height:64px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-muted {color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font-size:12px;margin:0;padding:0 4px}

.dsh-ia-notice {position:fixed;max-width:calc(100vw - 24px);overflow:auto;padding:8px 11px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:10px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 6px 24px #0002;z-index:999}
.dsh-ia-menu .dsh-ia-notice {position:static;max-width:100%;margin:6px 4px;box-shadow:none}
.dsh-ia-pre {white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:12px;max-height:190px;overflow:auto;padding:9px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-module-platform,#8881)}
.dsh-ia-diff ins {background:#27a35b26;text-decoration:none;border-radius:3px}
.dsh-ia-diff del {background:#d9454526;border-radius:3px}
.dsh-ia-draft {border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:10px;padding:8px;margin:6px 4px}
.dsh-ia-draft summary {cursor:pointer;overflow-wrap:anywhere}
.dsh-ia-draft time {font-size:11px;opacity:.65}

.dsh-ia-candidate {position:fixed;display:flex;align-items:center;gap:8px;padding:8px 10px;overflow:auto;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 8px 26px #0002;pointer-events:auto;z-index:998}
.dsh-ia-candidate-text {flex:1;white-space:pre-wrap;overflow-wrap:anywhere}
.dsh-ia-ghost {position:fixed;white-space:pre-wrap;overflow-wrap:anywhere;overflow:hidden;pointer-events:none;user-select:none;color:var(--dsw-alias-label-tertiary,#76808d);opacity:.95;z-index:34}
.dsh-ia-ghost-key {display:inline-block;margin-left:6px;padding:0 5px;border:1px solid var(--dsw-alias-border-l2,#c9ced6);border-radius:5px;font-size:10px;line-height:14px;vertical-align:1px;color:var(--dsw-alias-label-secondary,#6b7078)}
[data-composer-card]:has([data-dsh-ia-empty-ghost]) [data-composer-placeholder] {visibility:hidden}

.dsh-ia-settings {display:flex;flex-direction:column;gap:18px;width:100%;max-width:720px;padding:2px 0}
.dsh-ia-settings-intro {margin:0;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font-size:12px}
.dsh-ia-group {display:flex;flex-direction:column;gap:8px}
.dsh-ia-group>h3 {font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));margin:0}
.dsh-ia-rows {border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:12px;overflow:hidden;background:var(--dsw-alias-bg-layer-1,transparent)}
.dsh-ia-item {display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 12px;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-item:first-child {border-top:0}
.dsh-ia-item-main {display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh-ia-item-main b {font-weight:500}
.dsh-ia-item-main small {font-size:12px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-control {display:flex;align-items:center;gap:6px;flex:0 0 auto}
.dsh-ia-control input[type=number] {width:88px;text-align:right}
.dsh-ia-control input[type=text] {width:180px}
.dsh-ia-control select {min-width:132px}
.dsh-ia-switch {appearance:none;-webkit-appearance:none;flex:0 0 auto;width:32px;height:18px;margin:0;border:0;border-radius:999px;background:var(--dsw-alias-border-l2,#c9ced6);position:relative;cursor:pointer;transition:background .15s ease;padding:0}
.dsh-ia-switch::after {content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0003;transition:transform .15s ease}
.dsh-ia-switch:checked {background:var(--dsw-alias-state-business-primary,var(--dsh-ia-accent))}
.dsh-ia-switch:checked::after {transform:translateX(14px)}
.dsh-ia-settings-actions {display:flex;align-items:center;gap:10px;margin-top:4px;padding:12px 0 2px;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-settings-actions .dsh-ia-primary {padding:0 14px;min-height:30px}
`
