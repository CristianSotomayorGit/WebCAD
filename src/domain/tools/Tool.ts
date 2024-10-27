
export interface Tool {
    onLeftClick(event: MouseEvent): void;
    onMouseMove?(event: MouseEvent): void;
    onMouseUp?(event: MouseEvent): void;
    onKeyDown(event: KeyboardEvent): void;
    activate?(): void;
    deactivate?(): void;
  }