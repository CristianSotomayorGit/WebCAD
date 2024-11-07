// src/domain/tools/Tool.ts

export interface Tool {
  onLeftClick(event: MouseEvent, color: Float32Array, fontSize?: number, ): void;
  onMouseMove?(event: MouseEvent): void;
  onMouseUp?(event: MouseEvent): void;
  onKeyDown?(event: KeyboardEvent): void;
  cancel(): void;
}
