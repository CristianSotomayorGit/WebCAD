// src/domain/managers/EntityManager.ts

export class EntityManager {
  private entities: any[] = [];
  private temporaryEntities: any[] = [];
  private entitiesHistory: any[] = [];

  public addEntity(entity: any): void {
    if (!entity) throw new Error('Entity could not be added')
    if (this.entitiesHistory.length > 0) this.entitiesHistory = [];
    this.entities.push(entity);
  }

  public addEntityBack(entity: any): void {
    if (!entity) throw new Error('Entity could not be added')
    this.entities.push(entity);
  }

  public addEntityToHistory(entity: any): void {
    if (!entity) throw new Error('Entity could not be added')
    this.entitiesHistory.push(entity);
  }

  public removeEntity(entity: any): void {
    const index = this.entities.indexOf(entity);
    if (index >= 0) this.entities.splice(index, 1);
  }

  public removeEntityFromHistory(entity: any): void {
    const index = this.entitiesHistory.indexOf(entity);
    if (index >= 0) this.entitiesHistory.splice(index, 1);
  }

  public getLastEntity() {
    return this.entities[this.entities.length - 1];
  }

  public getLastEntityInHistory() {
    return this.entitiesHistory[this.entitiesHistory.length - 1];
  }

  public removeLastEntity(): void {}

  public recoverLastEntity() {}

  public addTemporaryEntity(entity: any): void {
    this.temporaryEntities.push(entity);
  }

  public removeTemporaryEntity(entity: any): void {
    const index = this.temporaryEntities.indexOf(entity);
    if (index >= 0) this.temporaryEntities.splice(index, 1);
  }

  public getEntities(): any[] {
    return this.entities;
  }

  public getTemporaryEntities(): any[] {
    return this.temporaryEntities;
  }

  public clearTemporaryEntities(): void {
    this.temporaryEntities = [];
  }
}
