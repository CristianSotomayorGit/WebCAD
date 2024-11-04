// src/domain/tools/Tool.ts

export interface DrawingTool {
  onLeftClick(event: MouseEvent, color: Float32Array): void;
  onMouseMove?(event: MouseEvent): void;
  onMouseUp?(event: MouseEvent): void;
  onKeyDown?(event: KeyboardEvent): void;
}
