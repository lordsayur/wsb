// specs/vscode/spec.md — VS Code webview typings used by the panel entry.
interface VsCodeApi {
  postMessage(message: unknown): void
  getState<T>(): T | undefined
  setState<T>(state: T): void
}

declare function acquireVsCodeApi(): VsCodeApi
