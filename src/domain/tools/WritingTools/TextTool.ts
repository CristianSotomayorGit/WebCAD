// src/domain/tools/TextTool.ts

import { AbstractWritingTool } from './AbstractWritingTool';
import { Text } from '../../entities/Text';

export class TextTool extends AbstractWritingTool {
  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const position = this.getWorldPosition(event);
    const textEntity = new Text(
      this.renderer,
      'Hello World',
      position.x,
      position.y,
      32, // Font size
      2,  // Resolution scale
      color // Custom color
    );
    this.entityManager.addEntity(textEntity);
  }

  public onKeyDown(event: KeyboardEvent): void {
    // Not used for now
  }
}
