// @vitest-environment jsdom
import { useSyncExternalStore, type ComponentProps } from 'react'
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AssistantOverlay, AssistantRight, ghostOverflows } from '../src/browser/components'
import { BrowserRuntime, type ConnectionFace } from '../src/browser/runtime'
import { DEFAULT_CONFIG, type AssistantStatus, type GenerationRequest, type TokenSpan } from '../src/core/types'
import type { BrowserInput } from '../src/browser/controller'

// With --no-isolate, the cached library screen can refer to a previous jsdom body.
const screen = within(document.body)
const runtimes: BrowserRuntime[] = []
afterEach(() => { cleanup(); runtimes.splice(0).forEach(runtime => runtime.dispose()); document.body.innerHTML = ''; localStorage.clear() })

function store<T>(value: T) {
  const listeners = new Set<() => void>()
  return { getSnapshot: () => value, subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    set: (next: T) => { value = next; listeners.forEach(listener => listener()) } }
}
function uiFixture(text: string, mode: 'ghost' | 'panel' = 'panel', suggestions = false) {
  const inputStore = store<BrowserInput>({ draft: text, draftRev: 1, phase: 'plain', attachmentIds: [], occurrences: [] })
  const sessionStore = store({ running: false, removed: false })
  let span: TokenSpan = { start: text.length, end: text.length, draftRev: 1 }
  const generated: GenerationRequest[] = []
  const settingsCalls: Partial<typeof settings>[] = []
  const generation = { id: 1 }
  let settings = { ...DEFAULT_CONFIG, nextEnabled: suggestions, completionEnabled: suggestions, displayMode: mode }
  const status: AssistantStatus = { sourceTurnId: 'turn-1', running: false, generation: 'mount-1',
    route: { provider: 'test', model: 'fast' }, settings }
  const connection: ConnectionFace = {
    generation: { getSnapshot: () => generation, subscribe: () => () => {} },
    rpc: { call: vi.fn(async (_channel, _endpoint, envelope) => {
      const request = (envelope as { args: { payload: { method: string; data: unknown } } }).args.payload
      if (request.method === 'status') return { ok: true as const, value: status }
      if (request.method === 'generate') {
        const payload = request.data as GenerationRequest; generated.push(payload)
        return { ok: true as const, value: { ...payload, text: payload.operation === 'optimize' ? '请改善表达，并保留原意' : '请继续解释' } }
      }
      if (request.method === 'settings/set') {
        const patch = request.data as Partial<typeof settings>; settingsCalls.push(patch)
        settings = { ...settings, ...patch }; status.settings = settings
        return { ok: true as const, value: settings }
      }
      return { ok: true as const, value: {} }
    }) },
  }
  const runtime = new BrowserRuntime(connection); runtimes.push(runtime)
  const insertText = vi.fn((value: string, target: TokenSpan) => {
    const current = inputStore.getSnapshot()
    if (target.draftRev !== current.draftRev) return false
    const draft = current.draft.slice(0, target.start) + value + current.draft.slice(target.end)
    span = { start: target.start + value.length, end: target.start + value.length, draftRev: current.draftRev + 1 }
    const editor = document.querySelector<HTMLElement>('[data-composer-input]')!
    editor.textContent = draft
    inputStore.set({ ...current, draft, draftRev: current.draftRev + 1 })
    return true
  })
  const useInput = <T,>(selector: (value: BrowserInput) => T) => selector(useSyncExternalStore(inputStore.subscribe, inputStore.getSnapshot))
  const useSession = <T,>(selector: (value: { running: boolean; removed: boolean }) => T) => selector(useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot))
  const captureInsertion = () => {
    const editor = document.querySelector<HTMLElement>('[data-composer-input]')
    const selection = window.getSelection()
    if (editor && selection?.rangeCount === 1) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.startContainer) && editor.contains(range.endContainer)) {
        const prefix = range.cloneRange(); prefix.selectNodeContents(editor); prefix.setEnd(range.startContainer, range.startOffset)
        const start = prefix.toString().length
        return { start, end: start + range.toString().length, draftRev: inputStore.getSnapshot().draftRev }
      }
    }
    return { ...span }
  }
  const props = { runtime, sessionId: 'session-ui', useInput, useSession,
    inputActions: { captureInsertion, insertText, persistDraft: vi.fn() } } as unknown as ComponentProps<typeof AssistantRight>
  const result = render(<div data-composer-card=""><div data-composer-input="" contentEditable suppressContentEditableWarning tabIndex={0}>{text}</div>
    <AssistantRight {...props} /><AssistantOverlay {...props as unknown as ComponentProps<typeof AssistantOverlay>} /></div>)
  const editor = result.container.querySelector<HTMLElement>('[data-composer-input]')!
  act(() => { editor.focus(); fireEvent.focus(editor) })
  return { ...result, runtime, inputStore, generated, settingsCalls, insertText, editor }
}

describe('composed browser surfaces', () => {
  it('queries the active document when test files share a worker', () => {
    const result = render(<button>当前输入区测试文档</button>)
    expect(screen.getByRole('button', { name: '当前输入区测试文档' }))
      .toBe(result.getByRole('button', { name: '当前输入区测试文档' }))
  })

  it('shows the first-run hint once, without stealing focus, and remembers dismissal', async () => {
    localStorage.clear()
    const f = uiFixture('原稿')
    await waitFor(() => expect(document.querySelector('[data-dsh-ia-first-run]')).not.toBeNull())
    expect(document.activeElement).toBe(f.editor)
    fireEvent.click(screen.getByRole('button', { name: '知道了' }))
    expect(document.querySelector('[data-dsh-ia-first-run]')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '输入助手设置' }))
    uiFixture('原稿')
    expect(document.querySelector('[data-dsh-ia-first-run]')).toBeNull()
  })

  it('closes the first-run hint with Escape and outside click', async () => {
    localStorage.clear()
    uiFixture('原稿')
    await waitFor(() => expect(document.querySelector('[data-dsh-ia-first-run]')).not.toBeNull())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.querySelector('[data-dsh-ia-first-run]')).toBeNull()
    localStorage.clear()
    uiFixture('原稿')
    await waitFor(() => expect(document.querySelector('[data-dsh-ia-first-run]')).not.toBeNull())
    fireEvent.pointerDown(document.body)
    expect(document.querySelector('[data-dsh-ia-first-run]')).toBeNull()
  })

  it('optimizes through the real shared runtime without an old action menu', async () => {
    const f = uiFixture('请优化表达')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '优化' }))
    await waitFor(() => expect(f.inputStore.getSnapshot().draft).toBe('请改善表达，并保留原意'))
    expect(screen.queryByRole('button', { name: '输入助手菜单' })).toBeNull()
    expect(f.generated).toHaveLength(1)
    expect(f.insertText).toHaveBeenCalledTimes(1)
  })

  it('saves the three quick settings as one diff and closes', async () => {
    const f = uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    expect(screen.getByRole('dialog', { name: '输入助手' })).toBeTruthy()
    fireEvent.click(screen.getByLabelText('回复后预测'))
    fireEvent.change(screen.getByLabelText('建议长度'), { target: { value: 'long' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(f.settingsCalls).toEqual([{ nextEnabled: true, suggestionLength: 'long' }])
  })

  it('shows the dirty note and disables save until a field changes', async () => {
    uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    expect((screen.getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByLabelText('回复后预测'))
    expect(screen.getByText('尚未保存')).toBeTruthy()
    expect((screen.getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('warns and blocks save when settings changed elsewhere while open', async () => {
    const f = uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    fireEvent.click(screen.getByLabelText('回复后预测'))
    await f.runtime.saveSettings({ suggestionLength: 'long' })
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('设置已在其他窗口修改'))
    expect((screen.getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('closes quick settings when clicking outside', async () => {
    uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes quick settings with Escape', async () => {
    uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('cancels quick settings without writing', async () => {
    const f = uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    fireEvent.click(screen.getByLabelText('输入续写'))
    const gear = screen.getByRole('button', { name: '输入助手设置' })
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(gear))
    expect(f.settingsCalls).toEqual([])
  })

  it('expands the full-settings note below the popover title', async () => {
    uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    const info = screen.getByRole('button', { name: '说明: 输入助手' })
    fireEvent.click(info)
    expect(document.getElementById('dsh-ia-pop-note')?.textContent).toContain('完整选项在 DSH 设置')
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(info.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(info)
    expect(document.getElementById('dsh-ia-pop-note')).toBeNull()
  })
  it('shows a protect chip for a selection and locks the selected text', async () => {
    const f = uiFixture('请优化表达')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    const node = f.editor.firstChild!
    const range = document.createRange(); range.setStart(node, 0); range.setEnd(node, 4)
    const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range)
    const rect = { left: 20, top: 20, right: 100, bottom: 40, width: 80, height: 20, x: 20, y: 20, toJSON: () => ({}) } as DOMRect
    const originalRects = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')
    const originalBounds = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
    Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [rect] })
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => rect })
    try {
      document.dispatchEvent(new Event('selectionchange'))
      fireEvent.click(await screen.findByRole('button', { name: '保护' }))
      await waitFor(() => expect(f.runtime.controllerFor('session-ui').getSnapshot().locked).toHaveLength(1))
    } finally {
      if (originalRects) Object.defineProperty(Range.prototype, 'getClientRects', originalRects)
      else Reflect.deleteProperty(Range.prototype, 'getClientRects')
      if (originalBounds) Object.defineProperty(Range.prototype, 'getBoundingClientRect', originalBounds)
      else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
    }
  })

  it('shows the optimized result bar, inspects the diff and restores the original', async () => {
    const f = uiFixture('请优化表达')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '优化' }))
    await waitFor(() => expect(f.inputStore.getSnapshot().draft).toBe('请改善表达，并保留原意'))
    expect(screen.getByText(/已优化/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '查看改动' }))
    expect(screen.getByRole('dialog').querySelector('ins')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '撤销' }))
    await waitFor(() => expect(f.inputStore.getSnapshot().draft).toBe('请优化表达'))
    expect(screen.queryByText(/已优化/)).toBeNull()
  })

  it('copies the original target and dismisses a candidate with the close button', async () => {
    const writeText = vi.fn(async () => {})
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    try {
      const f = uiFixture('请优化表达')
      await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
      fireEvent.click(screen.getByRole('button', { name: '优化' }))
      await waitFor(() => expect(f.inputStore.getSnapshot().draft).toBe('请改善表达，并保留原意'))
      fireEvent.click(screen.getByRole('button', { name: '复制原文' }))
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('请优化表达'))
      const g = uiFixture('', 'panel', true)
      await screen.findByRole('button', { name: '采纳' })
      fireEvent.click(screen.getByRole('button', { name: '忽略' }))
      expect(g.runtime.controllerFor('session-ui').getSnapshot().suggestion).toBeNull()
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('dismisses a visible candidate with Escape and ignores Escape without one', async () => {
    const f = uiFixture('', 'panel', true)
    await screen.findByRole('button', { name: '采纳' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(f.runtime.controllerFor('session-ui').getSnapshot().suggestion).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(f.runtime.controllerFor('session-ui').getSnapshot().suggestion).toBeNull()
  })

  it('shares one generation between the toolbar and overlay and respects consumed Tab', async () => {
    const f = uiFixture('', 'panel', true)
    await screen.findByRole('button', { name: '采纳' })
    expect(f.generated).toHaveLength(1)
    const consumed = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }); consumed.preventDefault()
    fireEvent(f.editor, consumed)
    expect(f.insertText).not.toHaveBeenCalled()
    const plain = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    fireEvent(f.editor, plain)
    expect(plain.defaultPrevented).toBe(true)
    await waitFor(() => expect(f.inputStore.getSnapshot().draft).toBe('请继续解释'))
    expect(f.runtime.controllerFor('session-ui').getSnapshot().metrics.exposures).toBe(1)
  })
  it('keeps Tab working after the host replaces the editor node', async () => {
    const f = uiFixture('', 'panel', true)
    await screen.findByRole('button', { name: '采纳' })
    const replacement = document.createElement('div')
    replacement.setAttribute('data-composer-input', '')
    replacement.contentEditable = 'true'
    replacement.tabIndex = 0
    f.editor.removeAttribute('data-composer-input')
    f.editor.after(replacement)
    act(() => { replacement.focus() })
    const key = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    fireEvent(replacement, key)
    expect(key.defaultPrevented).toBe(true)
    await waitFor(() => expect(f.inputStore.getSnapshot().draft).toBe('请继续解释'))
    expect(f.insertText).toHaveBeenCalledTimes(1)
  })
  it('tracks IME composition after the editor node is replaced', async () => {
    const f = uiFixture('', 'panel', true)
    await screen.findByRole('button', { name: '采纳' })
    const controller = f.runtime.controllerFor('session-ui')
    expect(controller.getSnapshot().suggestion).not.toBeNull()
    const replacement = document.createElement('div')
    replacement.setAttribute('data-composer-input', '')
    replacement.contentEditable = 'true'
    replacement.tabIndex = 0
    f.editor.removeAttribute('data-composer-input')
    f.editor.after(replacement)
    act(() => { replacement.focus() })
    fireEvent.compositionStart(replacement)
    expect(controller.getSnapshot().suggestion).toBeNull()
  })
  it('falls back to the card when the caret leaves too little inline width', async () => {
    const box = { left: 100, top: 500, right: 120, bottom: 520, width: 20, height: 20, x: 100, y: 500, toJSON: () => ({}) } as DOMRect
    const rectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(box)
    const viewport = Object.getOwnPropertyDescriptor(window, 'visualViewport')
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: { offsetLeft: 0, offsetTop: 0, width: 1024, height: 768, addEventListener() {}, removeEventListener() {} } })
    try {
      const f = uiFixture('', 'ghost', true)
      await waitFor(() => expect(f.generated).toHaveLength(1))
      await screen.findByRole('button', { name: '采纳' })
      expect(document.querySelector('.dsh-ia-ghost')).toBeNull()
    } finally {
      rectSpy.mockRestore()
      if (viewport) Object.defineProperty(window, 'visualViewport', viewport)
      else Reflect.deleteProperty(window, 'visualViewport')
    }
  })
  it('does not capture Tab for a ghost hidden because layout could not be measured', async () => {
    const f = uiFixture('', 'ghost', true)
    await waitFor(() => expect(f.generated).toHaveLength(1))
    await waitFor(() => expect(f.runtime.controllerFor('session-ui').getSnapshot().suggestion).not.toBeNull())
    expect(document.querySelector('[data-dsh-ia-visible-suggestion]')).toBeNull()
    const key = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    fireEvent(f.editor, key)
    expect(key.defaultPrevented).toBe(false)
    expect(f.insertText).not.toHaveBeenCalled()
    expect(f.runtime.controllerFor('session-ui').getSnapshot().metrics.exposures).toBe(0)
  })

  it('decides the inline/card boundary from unclipped height only', () => {
    expect(ghostOverflows(400, 60)).toBe(true)
    expect(ghostOverflows(60, 60)).toBe(false)
    expect(ghostOverflows(62, 60)).toBe(true)
    expect(ghostOverflows(400, Number.NaN)).toBe(false)
  })
})

describe('usage panel', () => {
  it('opens from the quick settings footer and shows session counters', async () => {
    uiFixture('原稿')
    await waitFor(() => expect((screen.getByRole('button', { name: '优化' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: '输入助手设置' }))
    fireEvent.click(screen.getByRole('button', { name: /次请求/ }))
    expect(screen.queryByRole('dialog', { name: '输入助手' })).toBeNull()
    const dialog = screen.getByRole('dialog', { name: '本次请求统计' })
    expect(dialog.textContent).toContain('请求次数')
    expect(dialog.textContent).toContain('平均请求耗时')
    expect(dialog.textContent).toContain('不是模型调用数或账单')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '本次请求统计' })).toBeNull()
  })
})
