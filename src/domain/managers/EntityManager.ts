// src/domain/managers/EntityManager.ts

import { RenderableEntity } from "../entities/RenderableEntity";

export class EntityManager {
  private entities: any[] = [];
  private temporaryEntities: any[] = [];

  public addEntity(entity: any): void {
    if (!entity) throw new Error('Entity could not be added')
    this.entities.push(entity);
  }

  public removeEntity(entity: any): void {
    const index = this.entities.indexOf(entity);
    if (index >= 0) {
      this.entities.splice(index, 1);
    }
  }

  // Add temporary entity
  public addTemporaryEntity(entity: any): void {
    this.temporaryEntities.push(entity);
  }

  // Remove temporary entity
  public removeTemporaryEntity(entity: any): void {
    const index = this.temporaryEntities.indexOf(entity);
    if (index >= 0) {
      this.temporaryEntities.splice(index, 1);
    }
  }

  // Getters
  public getEntities(): any[] {
    return this.entities;
  }

  public getTemporaryEntities(): any[] {
    return this.temporaryEntities;
  }

  // Clear temporary entities
  public clearTemporaryEntities(): void {
    this.temporaryEntities = [];
  }

  public hitTest(x: number, y: number): RenderableEntity | null {
    // Iterate in reverse to check topmost entities first
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.isPointInside(x, y)) {
        return entity;
      }
    }
    return null;
  }

}
