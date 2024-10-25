// src/domain/tools/Tool.ts

export interface Tool {
  onLeftClick(event: MouseEvent): void;
  onMouseMove?(event: MouseEvent): void;
  onMouseUp?(event: MouseEvent): void;
  onKeyDown?(event: KeyboardEvent): void;
}
