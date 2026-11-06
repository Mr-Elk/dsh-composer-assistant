// @vitest-environment jsdom
import type { ComponentProps } from 'react'
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AssistantSettings } from '../src/browser/settings'
import { BrowserRuntime, type ConnectionFace } from '../src/browser/runtime'
import { DEFAULT_CONFIG, type AssistantConfig, type GenerationRequest, type ModelOption } from '../src/core/types'
import { PLUGIN_VERSION } from '../src/core/version'

// With --no-isolate, the cached library screen can refer to a previous jsdom body.
const screen = within(document.body)
const runtimes: BrowserRuntime[] = []
afterEach(() => { cleanup(); runtimes.splice(0).forEach(runtime => runtime.dispose()); document.body.innerHTML = ''; sessionStorage.clear() })

function settingsFixture(options: { models?: ModelOption[]; modelsError?: boolean; locale?: string; settings?: Partial<AssistantConfig> } = {}) {
  let settings: AssistantConfig = { ...DEFAULT_CONFIG, nextEnabled: false, completionEnabled: false, ...options.settings }
  let failure = false
  let generation = { id: 1 }
  let finishSave: ((value: unknown) => void) | undefined
  let delayed = false
  const setters: Partial<AssistantConfig>[] = []
  const generates: { request: GenerationRequest; signal?: AbortSignal; resolve: (value: { ok: true; value: unknown }) => void }[] = []
  const connection: ConnectionFace = {
    generation: { getSnapshot: () => generation, subscribe: () => () => {} },
    rpc: { call: vi.fn(async (_channel, _endpoint, envelope, signal) => {
      const { method, data } = (envelope as { args: { payload: { method: string; data: any } } }).args.payload
      if (method === 'settings/get') return { ok: true as const, value: settings }
      if (method === 'settings/set') {
        setters.push(data)
        if (failure) return { ok: false as const, error: { message: '连接响应丢失' } }
        if (delayed) await new Promise(resolve => { finishSave = resolve })
        settings = { ...settings, ...data }; return { ok: true as const, value: settings }
      }
      if (method === 'status') return { ok: true as const, value: { settings, sourceTurnId: null, generation: 'mount', running: false, route: { provider: 'mock', model: 'fast' } } }
      if (method === 'generate') return new Promise<{ ok: true; value: unknown }>(resolve => generates.push({ request: data, signal, resolve }))
      if (method === 'cancel') return { ok: true as const, value: {} }
      if (method === 'models/list') {
        if (options.modelsError) return { ok: false as const, error: { message: '模型列表加载失败' } }
        return { ok: true as const, value: { models: options.models ?? [], failures: [] } }
      }
      throw new Error(`Unexpected ${method}`)
    }) },
  }
  const runtime = new BrowserRuntime(connection, undefined, options.locale ? () => options.locale! : undefined); runtimes.push(runtime)
  render(<AssistantSettings {...{ runtime, close() {} } as ComponentProps<typeof AssistantSettings>} />)
  return { runtime, setters, generates, settings: () => settings, fail: () => { failure = true }, delay: () => { delayed = true },
    finish: () => finishSave?.({}), reconnect: () => { generation = { id: generation.id + 1 } } }
}

describe('DSH input assistant settings section', () => {
  it('queries the active document when test files share a worker', () => {
    const result = render(<button>当前设置页测试文档</button>)
    expect(screen.getByRole('button', { name: '当前设置页测试文档' }))
      .toBe(result.getByRole('button', { name: '当前设置页测试文档' }))
  })

  it('restores unsaved settings after the panel unmounts and reopens in the same tab', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.change(screen.getByLabelText('优化强度'), { target: { value: 'deep' } })

    cleanup()
    expect(sessionStorage.length).toBeGreaterThan(0)
    render(<AssistantSettings {...{ runtime: f.runtime, close() {} } as ComponentProps<typeof AssistantSettings>} />)

    await screen.findByText('已恢复上次未保存的修改。')
    expect((screen.getByLabelText('优化强度') as HTMLSelectElement).value).toBe('deep')
    expect(f.setters).toHaveLength(0)
  })

  it('shows the saved confirmation in a centered status layer', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.change(screen.getByLabelText('优化强度'), { target: { value: 'deep' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    const toast = (await screen.findByText('设置已保存')).closest('[role="status"]')
    expect(toast).not.toBeNull()
    expect(toast?.className).toContain('dsh-ia-settings-toast')
    expect(toast?.getAttribute('aria-atomic')).toBe('true')
    expect(toast?.parentElement?.className).toContain('dsh-ia-settings-toast-layer')
    expect(toast?.parentElement?.classList.contains('dsh-ia')).toBe(true)
    expect(toast?.parentElement?.hasAttribute('aria-live')).toBe(false)
  })

  it('accepts a one-per-hour automatic limit', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: /高级设置/ }))
    const input = screen.getByLabelText('每小时调用上限') as HTMLInputElement
    expect(input.step).toBe('1')
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() => expect(f.setters).toHaveLength(1))
    expect(f.setters[0]).toEqual({ hourlyCallLimit: 1 })
  })

  it('normalizes leading zeros in numeric settings', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: /高级设置/ }))
    const cases = [
      ['上下文上限', '0016000', '16000'],
      ['建议超时', '020', '20'],
      ['每小时调用上限', '01', '1'],
      ['温度', '00.7', '0.7'],
      ['每小时调用上限', '000', '0'],
      ['上下文上限', '-01', '-1'],
    ] as const
    for (const [label, input, expected] of cases) {
      const field = screen.getByLabelText(label) as HTMLInputElement
      fireEvent.change(field, { target: { value: input } })
      expect(field.value).toBe(expected)
    }
  })

  it('does not overwrite another switch changed after the settings page was opened', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    await f.runtime.saveSettings({ completionEnabled: true })
    fireEvent.change(screen.getByLabelText('优化强度'), { target: { value: 'deep' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await screen.findByText('设置已保存')
    expect(f.setters[1]).toEqual({ optimizationStrength: 'deep' })
    expect(f.settings().completionEnabled).toBe(true)
    expect((screen.getByLabelText('输入续写') as HTMLInputElement).checked).toBe(true)
  })
  it('serializes settings writes and broadcasts the combined accepted result', async () => {
    const f = settingsFixture(), controller = f.runtime.controllerFor('a')
    await controller.refresh(); f.delay()
    const first = f.runtime.saveSettings({ nextEnabled: true })
    const second = f.runtime.saveSettings({ completionEnabled: true })
    expect(controller.getSnapshot().settingsSaving).toBe(true)
    await waitFor(() => expect(f.setters).toHaveLength(1))
    expect(f.setters[0]).toEqual({ nextEnabled: true })
    f.finish(); await first
    await waitFor(() => expect(f.setters).toHaveLength(2))
    expect(controller.getSnapshot().settingsSaving).toBe(true)
    f.finish(); await second
    expect(controller.getSnapshot().settings.nextEnabled).toBe(true)
    expect(controller.getSnapshot().settings.completionEnabled).toBe(true)
    expect(controller.getSnapshot().settingsSaving).toBe(false)
  })
  it('does not send a queued setting on a newer connection', async () => {
    const f = settingsFixture(); f.delay()
    const first = f.runtime.saveSettings({ nextEnabled: true })
    const second = f.runtime.saveSettings({ completionEnabled: true })
    const firstRejected = expect(first).rejects.toThrow('连接已变化')
    const secondRejected = expect(second).rejects.toThrow('连接已变化')
    await waitFor(() => expect(f.setters).toHaveLength(1))
    f.reconnect(); f.finish()
    await firstRejected; await secondRejected
    expect(f.setters).toHaveLength(1)
  })
  it('saves independent switches, strength and length preset through one reviewed update', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.click(screen.getByLabelText('提示词优化'))
    fireEvent.click(screen.getByRole('button', { name: /高级设置/ }))
    fireEvent.change(screen.getByLabelText('优化强度'), { target: { value: 'deep' } })
    fireEvent.change(screen.getByLabelText('建议长度'), { target: { value: 'long' } })
    fireEvent.change(screen.getByLabelText('建议超时'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('上下文上限'), { target: { value: '24000' } })
    expect(f.setters).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await screen.findByText('设置已保存')
    expect(f.setters).toEqual([{ optimizeEnabled: false, optimizationStrength: 'deep', suggestionLength: 'long', suggestionTimeoutMs: 20000, maxHistoryChars: 24000 }])
    expect(f.settings().optimizationStrength).toBe('deep')
    expect((screen.getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(true)
  })
  it('keeps unconfirmed form values and does not broadcast a failed save as active settings', async () => {
    const f = settingsFixture(), controller = f.runtime.controllerFor('a')
    await controller.refresh()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    f.fail()
    fireEvent.change(screen.getByLabelText('优化强度'), { target: { value: 'light' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('alert').textContent).toContain('保存未确认')
    expect(controller.getSnapshot().settings.optimizationStrength).toBe('standard')
    expect((screen.getByLabelText('优化强度') as HTMLSelectElement).value).toBe('light')
    fireEvent.click(screen.getByRole('button', { name: '恢复默认' }))
    expect((screen.getByLabelText('优化强度') as HTMLSelectElement).value).toBe('standard')
  })
  it('cancels an old optimization before saving and rejects a reconnect response', async () => {
    const f = settingsFixture(), controller = f.runtime.controllerFor('a')
    const editor = document.createElement('div'); editor.contentEditable = 'true'; editor.tabIndex = 0; editor.textContent = '原稿'; document.body.append(editor)
    const insertText = vi.fn(() => true)
    controller.bind({ sessionId: 'a', running: false, editor,
      input: { draft: '原稿', draftRev: 1, phase: 'plain', occurrences: [], attachmentIds: [] },
      actions: { captureInsertion: () => ({ start: 2, end: 2, draftRev: 1 }), insertText } })
    await controller.refresh()
    const old = controller.optimize()
    expect(f.generates).toHaveLength(1)
    f.delay()
    const saving = f.runtime.saveSettings({ optimizeEnabled: false })
    expect(f.generates[0].signal?.aborted).toBe(true)
    await Promise.resolve()
    const newController = f.runtime.controllerFor('b'); await newController.refresh()
    f.reconnect(); f.finish()
    await expect(saving).rejects.toThrow('连接已变化')
    await act(async () => { f.generates[0].resolve({ ok: true, value: { ...f.generates[0].request, text: '迟到结果' } }); await old })
    expect(insertText).not.toHaveBeenCalled()
    expect(controller.getSnapshot().settings.optimizeEnabled).toBe(true)
  })
  it('switches the interface to English and saves the language', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.change(screen.getByLabelText('语言'), { target: { value: 'en' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await screen.findByText('Settings saved')
    expect(f.setters).toEqual([{ language: 'en' }])
    expect((screen.getByLabelText('Language') as HTMLSelectElement).value).toBe('en')
  })

  it('renders English when DSH locale is English', async () => {
    settingsFixture({ locale: 'en' })
    await waitFor(() => expect(screen.queryByText('Loading settings…')).toBeNull())
    expect(screen.getByRole('form', { name: 'Input assistant settings' })).toBeTruthy()
    expect(screen.getByLabelText('Predict next message')).toBeTruthy()
  })

  it('collapses advanced settings by default and toggles them', async () => {
    settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    expect(screen.queryByLabelText('温度')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /高级设置/ }))
    expect(screen.getByLabelText('温度')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /高级设置/ }))
    expect(screen.queryByLabelText('温度')).toBeNull()
  })

  it('opens about with version and a copyable upgrade command', async () => {
    const writeText = vi.fn(async () => {})
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    try {
      settingsFixture()
      await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
      fireEvent.click(screen.getByRole('button', { name: '关于' }))
      const dialog = screen.getByRole('dialog')
      expect(dialog.textContent).toContain('关于输入助手')
      expect(dialog.textContent).toContain(PLUGIN_VERSION)
      expect(dialog.textContent).toContain('dsh plugin --profile desktop add dsh-composer-assistant')
      fireEvent.click(screen.getByRole('button', { name: '复制命令' }))
      await screen.findByText('命令已复制')
      expect(writeText).toHaveBeenCalledWith('dsh plugin --profile desktop add dsh-composer-assistant')
      fireEvent.click(screen.getByRole('button', { name: '关闭' }))
      expect(screen.queryByRole('dialog')).toBeNull()
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('keeps the reload action when resetting defaults during a conflict', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.change(screen.getByLabelText('优化强度'), { target: { value: 'deep' } })
    await f.runtime.saveSettings({ nextEnabled: true })
    window.dispatchEvent(new Event('focus'))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: '恢复默认' }))
    expect(screen.getByRole('alert').textContent).toContain('设置已在其他窗口修改')
    expect(screen.getByRole('button', { name: '重新加载' })).toBeTruthy()
    expect((screen.getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('reports the suggestion timeout range in seconds', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: /高级设置/ }))
    fireEvent.change(screen.getByLabelText('建议超时'), { target: { value: '70' } })
    fireEvent.submit(screen.getByRole('form', { name: '输入助手设置' }))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('5')
    expect(alert.textContent).toContain('60')
    expect(alert.textContent).not.toContain('1000')
    expect(alert.textContent).not.toContain('60000')
  })

  it('warns when more than twenty protected terms are entered', async () => {
    settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    const terms = Array.from({ length: 21 }, (_, index) => `term${index}`).join('\n')
    fireEvent.change(screen.getByLabelText('术语保护'), { target: { value: terms } })
    expect(screen.getByText('已识别 20/20 个词')).toBeTruthy()
    expect(screen.getByText('最多保护 20 个词，超出部分不会生效。')).toBeTruthy()
  })

  it('warns instead of overwriting when settings changed elsewhere and the form is dirty', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.change(screen.getByLabelText('优化强度'), { target: { value: 'deep' } })
    await f.runtime.saveSettings({ nextEnabled: true })
    window.dispatchEvent(new Event('focus'))
    await screen.findByRole('alert')
    expect(screen.getByRole('alert').textContent).toContain('设置已在其他窗口修改')
    expect((screen.getByLabelText('优化强度') as HTMLSelectElement).value).toBe('deep')
    expect((screen.getByRole('button', { name: '保存' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }))
    await waitFor(() => expect((screen.getByLabelText('优化强度') as HTMLSelectElement).value).toBe('standard'))
    expect(screen.queryByRole('alert')).toBeNull()
    expect((screen.getByLabelText('回复后预测') as HTMLInputElement).checked).toBe(true)
  })

  it('localizes config validation errors in English', async () => {
    settingsFixture({ locale: 'en' })
    await waitFor(() => expect(screen.queryByText('Loading settings…')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: /Advanced/ }))
    fireEvent.change(screen.getByLabelText('Temperature'), { target: { value: '' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Input assistant settings' }))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Temperature must be a number from 0 to 2.')
    expect(alert.textContent).not.toContain('温度')
  })

  it('shows a model-list failure without losing the current selection', async () => {
    settingsFixture({ modelsError: true })
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    await screen.findByText(/模型列表暂不可用/)
    expect((screen.getByLabelText('模型') as HTMLSelectElement).value).toBe('')
  })

  it('opens an info tooltip on click and closes it again', async () => {
    settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    const info = screen.getByRole('button', { name: '说明: 建议长度' })
    fireEvent.click(info)
    expect(screen.getByRole('tooltip').textContent).toContain('控制建议的最大长度')
    fireEvent.click(info)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('keeps Tab focus inside the about dialog', async () => {
    settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '关于' }))
    const copy = await screen.findByRole('button', { name: '复制命令' })
    copy.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '关闭' }))
  })

  it('closes the about dialog with Escape and returns focus', async () => {
    settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    const link = screen.getByRole('button', { name: '关于' })
    fireEvent.click(link)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(link))
  })

  it('disables dependent settings when their feature is off', async () => {
    settingsFixture({ settings: { nextEnabled: true, completionEnabled: true } })
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    expect((screen.getByLabelText('建议长度') as HTMLSelectElement).disabled).toBe(false)
    fireEvent.click(screen.getByLabelText('回复后预测'))
    fireEvent.click(screen.getByLabelText('输入续写'))
    expect((screen.getByLabelText('建议长度') as HTMLSelectElement).disabled).toBe(true)
    fireEvent.click(screen.getByLabelText('提示词优化'))
    expect((screen.getByLabelText('优化强度') as HTMLSelectElement).disabled).toBe(true)
  })

  it('selects a model from the DSH catalog and saves the provider/model pair', async () => {
    const f = settingsFixture({ models: [{ provider: 'fixture', providerName: 'Fixture', model: 'model-a', name: 'Model A' }] })
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    await waitFor(() => expect(screen.getByRole('option', { name: 'Fixture / Model A' })).toBeTruthy())
    fireEvent.change(screen.getByLabelText('模型'), { target: { value: JSON.stringify(['fixture', 'model-a']) } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await screen.findByText('设置已保存')
    expect(f.setters).toEqual([{ provider: 'fixture', model: 'model-a' }])
  })

  it('falls back to follow when the saved model is no longer listed', async () => {
    settingsFixture({ models: [], settings: { provider: 'gone', model: 'model-x' } })
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    await screen.findByText(/原辅助模型不可用/)
    expect((screen.getByLabelText('模型') as HTMLSelectElement).value).toBe('')
  })

  it('validates blank and out-of-range advanced values without requesting a save', async () => {
    const f = settingsFixture()
    await waitFor(() => expect(screen.queryByText('正在加载设置…')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: /高级设置/ }))
    fireEvent.change(screen.getByLabelText('温度'), { target: { value: '' } })
    fireEvent.submit(screen.getByRole('form', { name: '输入助手设置' }))
    await screen.findByRole('alert')
    expect(f.setters).toHaveLength(0)
  })
  it('saves glossary terms from the optimization section', async () => {
    const f = settingsFixture({ settings: { nextEnabled: false } })
    const field = await screen.findByRole('textbox', { name: '术语保护' })
    fireEvent.change(field, { target: { value: 'DSH, lint' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() => expect(f.setters).toHaveLength(1))
    expect(f.setters[0]).toMatchObject({ preserveTerms: 'DSH, lint' })
  })

})
