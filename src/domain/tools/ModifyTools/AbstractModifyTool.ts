// src/domain/tools/ModifyTools/AbstractModifyTool.ts

import { Tool } from '../Tool';
import { EntityManager } from '../../managers/EntityManager';
import { Renderer } from '../../../infrastructure/rendering/Renderer';

export abstract class AbstractModifyTool implements Tool {
  protected entityManager: EntityManager;
  protected renderer: Renderer;
  protected isActive: boolean = false;

  constructor(entityManager: EntityManager, renderer: Renderer) {
    this.entityManager = entityManager;
    this.renderer = renderer;
  }

  public abstract onLeftClick(event: MouseEvent): void;
  public abstract onMouseMove(event: MouseEvent): void;
  public abstract onMouseUp(event: MouseEvent): void;
  public abstract onKeyDown(event: KeyboardEvent): void;

  public activate(): void {
    this.isActive = true;
  }

  public deactivate(): void {
    this.isActive = false;
  }
}
