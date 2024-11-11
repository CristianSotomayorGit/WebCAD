// src/domain/tools/TextTool.ts

import { AbstractWritingTool } from './AbstractWritingTool';
import { Text } from '../../entities/Text';
import { Cursor } from '../../entities/Cursor';
import { Renderer } from '../../../infrastructure/rendering/Renderer';
import { EntityManager } from '../../managers/EntityManager';

export class TextTool extends AbstractWritingTool {
  private currentTextEntity: Text | null = null;
  private isEditing: boolean = false;
  private cursor: Cursor | null = null;

  constructor(entityManager: EntityManager, renderer: Renderer) {
    super(entityManager, renderer);
  }

  public onLeftClick(event: MouseEvent, color: Float32Array, font: string, fontSize: number): void {
    const position = this.getWorldPosition(event);

    if (!this.isEditing) {
      // Create a new text entity when not editing
      this.currentTextEntity = new Text(
        this.renderer,
        '',
        position.x,
        position.y,
        font,
        fontSize,
        8,
        color
      );
      this.entityManager.addEntity(this.currentTextEntity);
      this.isEditing = true; // Start editing mode

      // Initialize the cursor at the text start position
      this.cursor = new Cursor({ x: position.x, y: position.y }, { x: position.x, y: position.y + this.getFontHeightInWorldUnits(fontSize) }, this.renderer);
      this.entityManager.addEntity(this.cursor);
    } else {
      // Commit current editing and allow placing new text
      this.disposeCursor();
      this.currentTextEntity = null;
      this.isEditing = false;
    }
  }

// src/domain/tools/TextTool.ts

public onKeyDown(event: KeyboardEvent): void {
  if (this.currentTextEntity && this.isEditing) {
    const textEntity = this.currentTextEntity;

    if (event.key === 'Backspace') {
      if (textEntity.cursorIndex > 0) {
        // Decrease cursorIndex before updating the text
        textEntity.cursorIndex--;
        const newText =
          textEntity.text.substring(0, textEntity.cursorIndex) +
          textEntity.text.substring(textEntity.cursorIndex + 1);
        textEntity.updateText(newText);
        this.updateCursorPosition();
      }
    } else if (event.key === 'Delete') {
      if (textEntity.cursorIndex < textEntity.text.length) {
        const newText =
          textEntity.text.substring(0, textEntity.cursorIndex) +
          textEntity.text.substring(textEntity.cursorIndex + 1);
        textEntity.updateText(newText);
        this.updateCursorPosition();
      }
    } else if (event.key === 'ArrowLeft') {
      if (textEntity.cursorIndex > 0) {
        textEntity.cursorIndex--;
        this.updateCursorPosition();
      }
    } else if (event.key === 'ArrowRight') {
      if (textEntity.cursorIndex < textEntity.text.length) {
        textEntity.cursorIndex++;
        this.updateCursorPosition();
      }
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Insert character at cursor position
      const newText =
        textEntity.text.substring(0, textEntity.cursorIndex) +
        event.key +
        textEntity.text.substring(textEntity.cursorIndex);
      textEntity.updateText(newText);
      textEntity.cursorIndex++;
      this.updateCursorPosition();
    } else if (event.key === 'Enter') {
      // Stop editing on Enter
      this.isEditing = false;
      this.currentTextEntity = null;
      this.disposeCursor();
    }

    // Ensure cursorIndex stays within bounds
    textEntity.cursorIndex = Math.max(0, Math.min(textEntity.cursorIndex, textEntity.text.length));

    // Prevent default behavior
    event.preventDefault();
  }
}


  protected updateCursorPosition(): void {
    if (this.currentTextEntity && this.cursor) {
      const cursorPos = this.currentTextEntity.getCursorWorldPosition();
      const startPoint = { x: cursorPos.x, y: cursorPos.y };
      const endPoint = {
        x: cursorPos.x,
        y: cursorPos.y + this.getFontHeightInWorldUnits(this.currentTextEntity.fontSize)
      }
      this.cursor.updatePosition(startPoint, endPoint);
    }
  }

  private getFontHeightInWorldUnits(fontSize: number): number {
    const resolutionScale = this.currentTextEntity!.resolutionScale;
    const scaledFontSize = fontSize * resolutionScale;
    return (scaledFontSize / resolutionScale) * 0.01;
  }

  private disposeCursor(): void {
    if (this.cursor) {
      this.entityManager.removeEntity(this.cursor); // Remove from entity manager
      this.cursor.dispose();
      this.cursor = null;
    }
  }

  public cancel(): void {
    this.isEditing = false;
    this.disposeCursor();
    this.currentTextEntity = null;
  }
}
