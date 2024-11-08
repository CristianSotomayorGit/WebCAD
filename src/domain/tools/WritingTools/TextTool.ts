// src/domain/tools/TextTool.ts

import { AbstractWritingTool } from './AbstractWritingTool';
import { Text } from '../../entities/Text';
import { Renderer } from '../../../infrastructure/rendering/Renderer';
import { EntityManager } from '../../managers/EntityManager';

export class TextTool extends AbstractWritingTool {
  private currentTextEntity: Text | null = null; // Track the active text entity
  private isEditing: boolean = false; // Track if the user is actively editing

  constructor(entityManager: EntityManager, renderer: Renderer) {
    super(entityManager, renderer);
  }

  /**
   * Handles a left-click on the canvas to place or select text for editing.
   */
  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const position = this.getWorldPosition(event);

    if (!this.isEditing) {
      // Create a new text entity when not editing
      this.currentTextEntity = new Text(this.renderer, '', position.x, position.y, 32, 2, color);
      this.entityManager.addEntity(this.currentTextEntity);
      this.isEditing = true; // Start editing mode
    } else {
      // Commit current editing and allow placing new text
      this.currentTextEntity = null;
      this.isEditing = false;
    }
  }

  /**
   * Captures keyboard input to update the text content dynamically.
   */
  public onKeyDown(event: KeyboardEvent): void {
    if (this.currentTextEntity && this.isEditing) {

      if (event.key === 'Backspace') {
        // Remove the last character
        const currentText = this.currentTextEntity.text;
        this.currentTextEntity.updateText(currentText.slice(0, -1));
      } else if (event.key.length === 1) {

        // Append typed characters
        const currentText = this.currentTextEntity.text;

        this.currentTextEntity.updateText(currentText + event.key);
        console.log(this.currentTextEntity.text )
        this.entityManager.addEntity(this.currentTextEntity);
      } else if (event.key === 'Enter') {
        // Stop editing on Enter
        this.isEditing = false;
        this.currentTextEntity = null;
      }
    }
  }

  /**
   * Cancels the current operation and clears the active text entity.
   */
  public cancel(): void {
    this.isEditing = false;
    this.currentTextEntity = null;
  }
}
