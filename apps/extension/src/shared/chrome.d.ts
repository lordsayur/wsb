// Minimal ambient types for the Chromium extension APIs this shell uses.
// Kept local so the extension needs no extra type dependency.
declare namespace chrome {
  namespace storage {
    interface Change {
      oldValue?: unknown
      newValue?: unknown
    }
    interface StorageArea {
      get(keys?: string | string[] | null): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
      remove(keys: string | string[]): Promise<void>
    }
    const local: StorageArea
    const onChanged: {
      addListener(
        callback: (
          changes: Record<string, Change>,
          areaName: string,
        ) => void,
      ): void
    }
  }

  namespace alarms {
    interface Alarm {
      name: string
      scheduledTime: number
    }
    function create(name: string, info: { when?: number; periodInMinutes?: number }): void
    function clear(name: string): Promise<boolean>
    const onAlarm: {
      addListener(callback: (alarm: Alarm) => void): void
    }
  }

  namespace notifications {
    interface NotificationOptions {
      type: 'basic'
      iconUrl: string
      title: string
      message: string
      priority?: number
      silent?: boolean
    }
    function create(id: string, options: NotificationOptions): Promise<string>
    const onClicked: {
      addListener(callback: (id: string) => void): void
    }
  }

  namespace runtime {
    const onInstalled: { addListener(callback: () => void): void }
    const onStartup: { addListener(callback: () => void): void }
    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: unknown,
          respond: (response: unknown) => void,
        ) => void,
      ): void
    }
    function sendMessage(message: unknown): Promise<unknown>
    function getURL(path: string): string
    function getManifest(): { version: string }
  }

  namespace action {
    function setBadgeText(details: { text: string }): Promise<void>
    function setBadgeBackgroundColor(details: { color: string }): Promise<void>
  }
}
