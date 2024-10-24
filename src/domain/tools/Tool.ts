// src/domain/tools/Tool.ts
export interface Tool {
  onLeftclick(event: MouseEvent): void;
  onMouseMove(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  onKeyDown(event: KeyboardEvent): void;
}
