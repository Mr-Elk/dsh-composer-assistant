import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { canUseTab, findEditor, focusedIn, measureGhostDetail, nativeMenuOpen, type GhostGeometry } from './dom'
import type { BrowserRuntime } from './runtime'
import { placeFloating, type FloatingPlacement } from './floating'
import { effectiveLanguage, resolveUiLocale, t, type MessageKey } from '../core/i18n'
import { diffText } from '../core/diff'
import { isSettingsDraftDirty, settingsPatch } from './settings-draft'
import { errorCopy } from './error-copy'
import type { AssistantConfig } from '../core/types'
import type { UsageMetrics } from './controller'
import { usageCopy, usageFoot, usageRows } from './usage'

type RuntimeProps = { runtime: BrowserRuntime }
type RightProps = PropsRuntime<'conversation.input.right'> & RuntimeProps
type OverlayProps = PropsRuntime<'conversation.input.overlay'> & RuntimeProps
const EMPTY_MODEL = { current: null }
const noopSubscribe = (): (() => void) => () => {}
const FIRST_RUN_KEY = 'dsh.input-assistant.first-run.v1'

function useFloatingPlacement(anchor: RefObject<HTMLElement>, surface: RefObject<HTMLElement>, visible: boolean, card = false, preferredWidth = 440): FloatingPlacement | null {
  const [placement, setPlacement] = useState<FloatingPlacement | null>(null)
  useLayoutEffect(() => {
    if (!visible) { setPlacement(null); return }
    const update = () => {
      const trigger = card ? findEditor(anchor.current)?.closest<HTMLElement>('[data-composer-card]') : anchor.current
      const element = surface.current
      if (!trigger || !element) return
      const viewport = window.visualViewport
      const bounds = { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0,
        width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight }
      const rect = trigger.getBoundingClientRect()
      const next = placeFloating(rect, element.scrollHeight || element.getBoundingClientRect().height || 160, bounds,
        card ? Math.min(640, rect.width || 440) : preferredWidth)
      setPlacement(previous => previous && Object.keys(next).every(key => previous[key as keyof FloatingPlacement] === next[key as keyof FloatingPlacement]) ? previous : next)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    if (surface.current) observer?.observe(surface.current)
    if (anchor.current) observer?.observe(anchor.current)
    return () => {
      window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true)
      window.visualViewport?.removeEventListener('resize', update); window.visualViewport?.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [anchor, surface, visible, card])
  return placement
}

/** Anchor a notice just above the composer card so it never covers the editor. */
function useAboveCard(anchor: RefObject<HTMLElement>, visible: boolean): { bottom: number; right: number } | null {
  const [placement, setPlacement] = useState<{ bottom: number; right: number } | null>(null)
  useLayoutEffect(() => {
    if (!visible) { setPlacement(null); return }
    const card = () => anchor.current?.closest<HTMLElement>('[data-composer-card]') ?? null
    const update = () => {
      const element = card()
      if (!element) { setPlacement(null); return }
      const rect = element.getBoundingClientRect()
      setPlacement({ bottom: Math.max(12, window.innerHeight - rect.top + 8), right: Math.max(12, window.innerWidth - rect.right) })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const element = card()
    const observer = typeof ResizeObserver === 'function' && element ? new ResizeObserver(update) : null
    if (element && observer) observer.observe(element)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); observer?.disconnect() }
  }, [anchor, visible])
  return placement
}

function useController(runtime: BrowserRuntime, sessionId: string) {
  const controller = useMemo(() => runtime.controllerFor(sessionId), [runtime, sessionId])
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  useEffect(() => runtime.retain(sessionId), [runtime, sessionId])
  return { controller, state }
}


function SparkleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2.2 9.2 6l3.8 1.2-3.8 1.2L8 12.2 6.8 8.4 3 7.2 6.8 6Z" />
  </svg>
}

function GearIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
}

/** The right slot owns input observation; the overlay only paints the same controller's state. */
function UsageDialog({ metrics, translate, onClose }: {
  metrics: UsageMetrics; translate: (key: MessageKey, vars?: Record<string, string | number>) => string; onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const close = useRef(onClose)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle')
  close.current = onClose
  useEffect(() => {
    closeRef.current?.focus()
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close.current() } }
    document.addEventListener('keydown', key, true)
    return () => document.removeEventListener('keydown', key, true)
  }, [])
  const copy = async () => {
    try { await navigator.clipboard.writeText(usageCopy(metrics, translate)); setCopied('ok') }
    catch { setCopied('failed') }
  }
  return createPortal(<div className="dsh-ia dsh-ia-about-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="dsh-ia-about dsh-ia-usage" role="dialog" aria-modal="true" aria-label={translate('usage.title')}>
      <div className="dsh-ia-about-head"><b>{translate('usage.title')}</b>
        <button ref={closeRef} type="button" className="dsh-ia-about-close" aria-label={translate('about.close')} onClick={onClose}>×</button>
      </div>
      {usageRows(metrics, translate).map(row => <div key={row.label} className="dsh-ia-about-row"><span>{row.label}</span><span>{row.value}</span></div>)}
      <p className="dsh-ia-about-note">{translate('usage.note')}</p>
      <div className="dsh-ia-usage-actions">
        <span role="status">{copied === 'ok' ? translate('usage.copied') : copied === 'failed' ? translate('usage.copyFailed') : ''}</span>
        <button type="button" className="dsh-ia-primary" onClick={() => { void copy() }}>{translate('usage.copy')}</button>
      </div>
    </div>
  </div>, document.body)
}

export function AssistantRight({ runtime, sessionId, useInput, useSession, inputActions }: RightProps) {
  const { controller, state } = useController(runtime, sessionId)
  const input = useInput(value => value)
  const running = useSession(value => value.running)
  const removed = useSession(value => value.removed)
  const generation = useSyncExternalStore(runtime.connection.generation.subscribe.bind(runtime.connection.generation),
    () => runtime.transport.generation(), () => null)
  const directory = useMemo(() => runtime.models?.directoryFor(sessionId), [runtime, sessionId])
  const model = useSyncExternalStore(directory?.store.subscribe.bind(directory.store) ?? noopSubscribe,
    directory?.store.getSnapshot.bind(directory.store) ?? (() => EMPTY_MODEL), () => EMPTY_MODEL)
  const anchor = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const gearRef = useRef<HTMLButtonElement>(null)
  const firstRunRef = useRef<HTMLDivElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [base, setBase] = useState<AssistantConfig | null>(null)
  const [draft, setDraft] = useState<AssistantConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [showFullSettings, setShowFullSettings] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [showUsage, setShowUsage] = useState(false)
  const [firstRun, setFirstRun] = useState(false)
  const locale = resolveUiLocale(effectiveLanguage(state.settings.language), runtime.locale?.() ?? 'zh')
  const tr = (key: MessageKey, vars?: Record<string, string | number>) => t(locale, key, vars)
  const popPlacement = useFloatingPlacement(anchor, popRef, open, false, 340)
  const showChange = Boolean(state.change && state.change.before !== state.change.after && input.draft === state.change.after)
  const resultPlacement = useAboveCard(anchor, showChange)
  const firstRunPlacement = useAboveCard(anchor, firstRun && !open)
  const noticePlacement = useAboveCard(anchor, !open && !showChange && Boolean(state.notice))
  useEffect(() => { void directory?.load().catch(() => {}) }, [directory])
  useEffect(() => {
    try {
      if (localStorage.getItem(FIRST_RUN_KEY)) return
      setFirstRun(true)
      localStorage.setItem(FIRST_RUN_KEY, '1')
    } catch { /* storage unavailable: keep the hint local to this mount */ }
  }, [])
  useEffect(() => {
    if (!firstRun) return
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setFirstRun(false) } }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !firstRunRef.current?.contains(event.target) && !anchor.current?.contains(event.target)) setFirstRun(false)
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside) }
  }, [firstRun])

  useLayoutEffect(() => {
    if (removed) { controller.dispose(); return }
    controller.bind({ sessionId, input, actions: inputActions, running, editor: findEditor(anchor.current), route: model.current ?? undefined })
  }, [controller, sessionId, input, inputActions, running, model.current, removed, generation])
  useEffect(() => {
    // The host can replace the composer node (reconnect, re-render, session
    // switch). Resolve the editor on every event instead of holding the node
    // that happened to exist at mount, or Tab and IME tracking keep listening
    // to a detached element and fail silently.
    const currentEditor = (): HTMLElement | null => findEditor(anchor.current)
    const insideEditor = (target: EventTarget | null): boolean => {
      const editor = currentEditor()
      return Boolean(editor && target instanceof Node && (target === editor || editor.contains(target)))
    }
    // A composition can end after its node was replaced. Remember the node that
    // started it so the matching end still clears the composing flag.
    let composingNode: Node | null = null
    const selectionChanged = () => controller.notifySelectionChange()
    const focusChanged = (event: FocusEvent) => { if (insideEditor(event.target)) selectionChanged() }
    const compositionStart = (event: CompositionEvent) => {
      if (!insideEditor(event.target)) return
      composingNode = event.target as Node
      controller.setComposing(true)
    }
    const compositionEnd = (event: CompositionEvent) => {
      if (event.target !== composingNode && !insideEditor(event.target)) return
      composingNode = null
      controller.setComposing(false)
    }
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.querySelector('.dsh-ia-pop')) return
        const snapshot = controller.getSnapshot()
        if (snapshot.suggestion) { event.preventDefault(); controller.dismissSuggestion(); return }
        if (snapshot.notice) { controller.clearNotice(); return }
      }
      const editor = currentEditor()
      if (!controller.getSnapshot().suggestion || !canUseTab(event, editor, false)) return
      if (![...document.querySelectorAll('[data-dsh-ia-visible-suggestion]')].some(node => node.getAttribute('data-dsh-ia-session') === sessionId)) return
      if (controller.acceptSuggestion()) event.preventDefault()
    }
    document.addEventListener('selectionchange', selectionChanged)
    document.addEventListener('focus', focusChanged, true)
    document.addEventListener('blur', focusChanged, true)
    document.addEventListener('compositionstart', compositionStart)
    document.addEventListener('compositionend', compositionEnd)
    // Capture phase: the composer's Lexical keymap runs on the editor element and
    // would otherwise consume Tab before this handler sees it.
    window.addEventListener('keydown', keyDown, true)
    return () => {
      document.removeEventListener('selectionchange', selectionChanged)
      document.removeEventListener('focus', focusChanged, true)
      document.removeEventListener('blur', focusChanged, true)
      document.removeEventListener('compositionstart', compositionStart)
      document.removeEventListener('compositionend', compositionEnd)
      window.removeEventListener('keydown', keyDown, true)
    }
  }, [controller, sessionId])
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => { if (event.target instanceof Node && !anchor.current?.contains(event.target) && !popRef.current?.contains(event.target)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) { setOpen(false); event.preventDefault(); gearRef.current?.focus() } }
    document.addEventListener('pointerdown', close)
    window.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('keydown', escape) }
  }, [open])
  useEffect(() => {
    if (!open || !base || saving || state.settingsSaving) return
    setConflict(JSON.stringify(state.settings) !== JSON.stringify(base))
  }, [open, base, state.settings, saving, state.settingsSaving])
  useEffect(() => { if (!showChange) setShowDiff(false) }, [showChange])
  useEffect(() => {
    if (!showDiff) return
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setShowDiff(false) } }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [showDiff])
  const preserveSelection = (event: React.PointerEvent) => { event.preventDefault() }
  const canEdit = input.phase === 'plain' && !state.busy && !state.settingsSaving
  const canOptimize = canEdit && state.settings.optimizeEnabled
  const dirty = Boolean(base && draft && isSettingsDraftDirty({ accepted: base, draft }))
  const openPopover = () => {
    setFirstRun(false); setShowFullSettings(false); setBase({ ...state.settings }); setDraft({ ...state.settings }); setError(''); setConflict(false); setOpen(true)
  }
  const closePopover = (focus = false) => { setOpen(false); setShowFullSettings(false); setBase(null); setDraft(null); setError(''); setConflict(false); if (focus) gearRef.current?.focus() }
  const changeDraft = <K extends keyof AssistantConfig>(key: K, value: AssistantConfig[K]) => {
    setDraft(previous => previous ? { ...previous, [key]: value } : previous); setError('')
  }
  const savePopover = async () => {
    if (!base || !draft || !dirty || saving || conflict) return
    let patch: Partial<AssistantConfig>
    try { patch = settingsPatch({ accepted: base, draft }) }
    catch (reason) { setError(errorCopy(reason, tr) ?? tr('settings.invalidGeneric')); return }
    if (Object.keys(patch).length === 0) { closePopover(); return }
    setSaving(true)
    try {
      await runtime.saveSettings(patch)
      controller.notice(tr('settings.saved'))
      closePopover(true)
    } catch (reason) {
      setError(errorCopy(reason, tr) ?? tr('settings.saveFailedGeneric'))
    } finally { setSaving(false) }
  }
  const copyOriginal = async () => {
    const change = state.change
    if (!change) return
    try { await navigator.clipboard.writeText(change.beforeTarget); controller.notice(tr('context.copied')) }
    catch { controller.notice(tr('context.copyFailed')) }
  }
  return <div className="dsh-ia dsh-ia-root" ref={anchor} data-dsh-input-assistant="">
    <button className="dsh-ia-trigger" type="button" disabled={!canOptimize || !input.draft.trim() || !state.connected}
      onPointerDown={preserveSelection} onClick={() => { void controller.optimize() }} title={tr('toolbar.optimizeTitle')}>
      <SparkleIcon />{state.busy === 'optimize' ? tr('toolbar.optimizing') : tr('toolbar.optimize')}
    </button>
    <span className="dsh-ia-divider" aria-hidden="true" />
    <button ref={gearRef} className="dsh-ia-gear" type="button" aria-label={tr('toolbar.settings')} aria-expanded={open}
      onPointerDown={preserveSelection} onClick={() => { if (open) closePopover(); else openPopover() }}><GearIcon /></button>
    {!open && !showChange && state.notice && createPortal(<div ref={noticeRef} role="status" className="dsh-ia dsh-ia-notice"
      style={noticePlacement ?? { visibility: 'hidden' }} onClick={() => controller.clearNotice()}>{state.notice}</div>, document.body)}
    {showChange && state.change && createPortal(<div className="dsh-ia dsh-ia-result" role="status" style={resultPlacement ?? { visibility: 'hidden' }}>
      <span className="dsh-ia-result-title">✓ {tr('context.optimized')}</span>
      <button type="button" onClick={() => setShowDiff(value => !value)}>{tr('context.viewChanges')}</button>
      <button type="button" disabled={!controller.canRestore()} onClick={() => controller.restoreOriginal()}>{tr('context.undo')}</button>
      <button type="button" onClick={() => { void copyOriginal() }}>{tr('context.copyOriginal')}</button>
    </div>, document.body)}
    {showDiff && state.change && createPortal(<div className="dsh-ia dsh-ia-diff-pop" role="dialog" aria-label={tr('context.changesTitle')}
      style={{ bottom: (resultPlacement?.bottom ?? 80) + 44, right: resultPlacement?.right ?? 12 }}>
      <div className="dsh-ia-diff-head"><b>{tr('context.changesTitle')}</b><button type="button" aria-label={tr('about.close')} onClick={() => setShowDiff(false)}>×</button></div>
      <div className="dsh-ia-pre dsh-ia-diff">{diffText(state.change.beforeTarget, state.change.afterTarget).map((part, index) =>
        part.type === 'insert' ? <ins key={index}>{part.value}</ins> : part.type === 'delete' ? <del key={index}>{part.value}</del> : <span key={index}>{part.value}</span>)}</div>
    </div>, document.body)}
    {firstRun && !open && createPortal(<div ref={firstRunRef} className="dsh-ia dsh-ia-first-run" role="status" data-dsh-ia-first-run
      style={{ bottom: (firstRunPlacement?.bottom ?? 80) + 12, right: firstRunPlacement?.right ?? 12 }}>
      <b>{tr('firstRun.title')}</b>
      <p>{tr('firstRun.text')}</p>
      <p className="dsh-ia-muted">{tr('firstRun.settings')}</p>
      <div className="dsh-ia-first-run-actions"><button type="button" className="dsh-ia-primary" onClick={() => { setFirstRun(false); gearRef.current?.focus() }}>{tr('firstRun.dismiss')}</button></div>
      <span className="dsh-ia-first-run-arrow" aria-hidden="true" />
    </div>, document.body)}
    {open && base && draft && createPortal(<div ref={popRef} className="dsh-ia dsh-ia-pop" role="dialog" aria-label={tr('popover.title')} style={popPlacement ?? { visibility: 'hidden' }}>
      <div className="dsh-ia-pop-head"><span className="dsh-ia-pop-title">{tr('popover.title')}
        <button type="button" className="dsh-ia-info" aria-label={`${tr('common.help')}: ${tr('popover.title')}`} aria-expanded={showFullSettings} aria-controls="dsh-ia-pop-note" onClick={() => setShowFullSettings(value => !value)}>i</button>
      </span></div>
      {showFullSettings && <p id="dsh-ia-pop-note" className="dsh-ia-pop-note">{tr('popover.fullSettings')}</p>}
      <label className="dsh-ia-pop-row"><span>{tr('popover.replyPrediction')}</span>
        <span className="dsh-ia-switch"><input type="checkbox" aria-label={tr('popover.replyPrediction')} checked={draft.nextEnabled} onChange={event => changeDraft('nextEnabled', event.target.checked)} /><svg className="dsh-ia-switch-svg" viewBox="0 0 44 24" aria-hidden="true"><rect className="dsh-ia-switch-track" x="0" y="0" width="44" height="24" rx="12" ry="12" /><circle className="dsh-ia-switch-knob" cx="12" cy="12" r="10" /></svg></span>
      </label>
      <label className="dsh-ia-pop-row"><span>{tr('popover.inlineCompletion')}</span>
        <span className="dsh-ia-switch"><input type="checkbox" aria-label={tr('popover.inlineCompletion')} checked={draft.completionEnabled} onChange={event => changeDraft('completionEnabled', event.target.checked)} /><svg className="dsh-ia-switch-svg" viewBox="0 0 44 24" aria-hidden="true"><rect className="dsh-ia-switch-track" x="0" y="0" width="44" height="24" rx="12" ry="12" /><circle className="dsh-ia-switch-knob" cx="12" cy="12" r="10" /></svg></span>
      </label>
      <div className="dsh-ia-pop-row"><span>{tr('popover.suggestionLength')}</span>
        <select aria-label={tr('popover.suggestionLength')} value={draft.suggestionLength} onChange={event => changeDraft('suggestionLength', event.target.value as AssistantConfig['suggestionLength'])}>
          <option value="short">{tr('settings.select.short')}</option>
          <option value="standard">{tr('settings.select.standard')}</option>
          <option value="long">{tr('settings.select.long')}</option>
        </select>
      </div>
      {(error || conflict) && <p className="dsh-ia-pop-error" role="alert">{conflict ? tr('settings.conflict') : error}</p>}
      <div className="dsh-ia-pop-foot">
        <button type="button" className="dsh-ia-link" onClick={() => { setOpen(false); setShowUsage(true) }}>{usageFoot(state.metrics, tr)}</button>
      </div>
      <div className="dsh-ia-pop-actions">
        {dirty && <span className="dsh-ia-muted">{tr('settings.unsaved')}</span>}
        <button type="button" onClick={() => closePopover(true)}>{tr('popover.cancel')}</button>
        <button type="button" className="dsh-ia-primary" disabled={!dirty || saving || conflict || state.settingsSaving} onClick={() => { void savePopover() }}>{saving || state.settingsSaving ? tr('settings.saving') : tr('popover.save')}</button>
      </div>
    </div>, document.body)}
    {showUsage && <UsageDialog metrics={state.metrics} translate={tr} onClose={() => { setShowUsage(false); gearRef.current?.focus() }} />}
  </div>
}

/** A suggestion taller than the visible composer area moves to the floating card. */
export function ghostOverflows(scrollHeight: number, maxHeight: number): boolean { return scrollHeight > maxHeight + 1 }

export function AssistantOverlay({ runtime, sessionId }: OverlayProps) {
  const { controller, state } = useController(runtime, sessionId)
  const anchor = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const [geometry, setGeometry] = useState<GhostGeometry | null>(null)
  const [overflow, setOverflow] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [protect, setProtect] = useState<{ left: number; top: number } | null>(null)
  const suggestion = state.suggestion
  const streaming = state.streaming?.text ?? ''
  const streamingActive = streaming.length > 0
  const locale = resolveUiLocale(effectiveLanguage(state.settings.language), runtime.locale?.() ?? 'zh')
  const tr = (key: MessageKey) => t(locale, key)
  // A suggestion longer than the composer's visible area cannot render inline;
  // fall back to the floating card instead of clipping the text.
  const panelMode = state.settings.displayMode === 'panel' || overflow || narrow
  useEffect(() => {
    const update = () => {
      const editor = findEditor(anchor.current)
      const selection = document.getSelection()
      if (!editor || !focusedIn(editor) || nativeMenuOpen(editor) || !selection || selection.rangeCount !== 1 || selection.isCollapsed) { setProtect(null); return }
      const range = selection.getRangeAt(0)
      if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer) || !range.toString().trim()) { setProtect(null); return }
      const rects = range.getClientRects()
      const rect = rects[rects.length - 1] ?? range.getBoundingClientRect()
      if (!rect || (!rect.width && !rect.height)) { setProtect(null); return }
      const next = { left: Math.min(window.innerWidth - 76, Math.max(8, rect.right + 6)), top: Math.min(window.innerHeight - 40, Math.max(8, rect.bottom + 6)) }
      setProtect(previous => previous && previous.left === next.left && previous.top === next.top ? previous : next)
    }
    const editor = findEditor(anchor.current)
    document.addEventListener('selectionchange', update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    editor?.addEventListener('focus', update)
    editor?.addEventListener('blur', update)
    update()
    return () => { document.removeEventListener('selectionchange', update); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true)
      editor?.removeEventListener('focus', update); editor?.removeEventListener('blur', update) }
  }, [])
  const panelPlacement = useFloatingPlacement(anchor, panelRef, Boolean(suggestion) && panelMode, true)
  useEffect(() => {
    if (!suggestion) { setOverflow(false); setNarrow(false) }
  }, [suggestion])
  useEffect(() => {
    if (suggestion && ((panelMode && panelPlacement) || (!panelMode && geometry))) controller.markExposed(suggestion.snapshot.requestId)
  }, [controller, suggestion, geometry, panelPlacement, panelMode])
  useLayoutEffect(() => {
    if ((!suggestion && !streamingActive) || state.settings.displayMode !== 'ghost') { setGeometry(null); return }
    const update = () => {
      const empty = suggestion ? suggestion.snapshot.draft === '' : (state.streaming?.empty ?? false)
      const result = measureGhostDetail(findEditor(anchor.current), empty)
      setGeometry(result.kind === 'ok' ? result.geometry : null)
      // A caret near the right edge leaves too little room for inline text; the
      // card is the only surface that can still show the suggestion.
      setNarrow(result.kind === 'narrow')
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    document.addEventListener('selectionchange', update)
    const editor = findEditor(anchor.current)
    editor?.addEventListener('focus', update)
    editor?.addEventListener('blur', update)
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    if (editor) resize?.observe(editor)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true)
      document.removeEventListener('selectionchange', update); editor?.removeEventListener('focus', update); editor?.removeEventListener('blur', update); resize?.disconnect() }
  }, [suggestion, streamingActive, state.settings.displayMode])
  useLayoutEffect(() => {
    if (!suggestion || state.settings.displayMode !== 'ghost' || !geometry || !ghostRef.current) return
    // scrollHeight reflects the unclipped text; anything taller than the visible
    // area switches to the card so the user can read the whole suggestion.
    setOverflow(ghostOverflows(ghostRef.current.scrollHeight, geometry.maxHeight))
  }, [suggestion, geometry, state.settings.displayMode])
  const ghostStyle: CSSProperties | undefined = geometry ? { left: geometry.left, top: geometry.top, width: geometry.width,
    maxHeight: `${geometry.maxHeight}px`, font: geometry.font, lineHeight: geometry.lineHeight, letterSpacing: geometry.letterSpacing } : undefined
  return <span ref={anchor} className="dsh-ia" style={{ display: 'contents' }}>
    {suggestion && panelMode && createPortal(<div ref={panelRef} className="dsh-ia dsh-ia-candidate" role="status"
      style={panelPlacement ?? { visibility: 'hidden' }} data-dsh-ia-visible-suggestion={panelPlacement ? '' : undefined} data-dsh-ia-session={sessionId}>
      <span className="dsh-ia-candidate-text">{suggestion.text}</span><button type="button" onPointerDown={event => event.preventDefault()} onClick={() => { void controller.regenerateSuggestion() }}>{tr('context.regenerate')}</button><button type="button" onPointerDown={event => event.preventDefault()} onClick={() => controller.acceptSuggestion()}>{tr('context.accept')}</button>
      <span className="dsh-ia-candidate-esc" aria-hidden="true">{tr('context.esc')}</span><button type="button" aria-label={tr('context.ignore')} onClick={() => controller.dismissSuggestion()}>×</button></div>, document.body)}
    {!suggestion && streaming && geometry && createPortal(<span className="dsh-ia dsh-ia-ghost dsh-ia-ghost-streaming" style={ghostStyle}
      aria-hidden="true" data-dsh-ia-streaming="" data-dsh-ia-session={sessionId}>{streaming}</span>, document.body)}
    {suggestion && !panelMode && geometry && <>
      {suggestion.snapshot.draft === '' && <span hidden data-dsh-ia-empty-ghost="" />}
      {createPortal(<span ref={ghostRef} className="dsh-ia dsh-ia-ghost"  style={ghostStyle}
        aria-hidden="true" data-dsh-ia-visible-suggestion="" data-dsh-ia-session={sessionId}>{suggestion.text}<span className="dsh-ia-ghost-key" aria-hidden="true">Tab</span></span>, document.body)}
    </>}
    {protect && createPortal(<button type="button" className="dsh-ia dsh-ia-protect" style={{ left: protect.left, top: protect.top }}
      onPointerDown={event => event.preventDefault()} onClick={() => { controller.lockSelection(); setProtect(null) }}>{tr('context.protect')}</button>, document.body)}
  </span>
}
