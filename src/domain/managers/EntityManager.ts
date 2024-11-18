// src/domain/managers/EntityManager.ts

export class EntityManager {
  private entities: any[] = [];
  private temporaryEntities: any[] = [];
  private entitiesHistory: any[] = [];

  public addEntity(entity: any): void {
    if (!entity) throw new Error('Entity could not be added')


    this.entities.push(entity);

  }

  public addEntity2(entity: any): void {
    if (!entity) throw new Error('Entity could not be added')

    console.log('entities number:', this.entities.length)
    console.log('entitites:')
    for (let entity of this.entities) console.log(entity)

    console.log('adding entity :', entity)

    this.entities.push(entity);

    console.log('entities number:', this.entities.length)
    console.log('entitites:')
    for (let entity of this.entities) console.log(entity)

  }

  public addEntityToHistory(entity: any): void {

    // console.log('entities number:', this.entitiesHistory.length)
    // console.log('entitites:')
    // for (let entity of this.entitiesHistory) console.log(entity)
    // console.log('adding entity to history:', entity)


    if (!entity) throw new Error('Entity could not be added')

    this.entitiesHistory.push(entity);

    // console.log('entities number:', this.entitiesHistory.length)
    // console.log('entitites:')
    // for (let entity of this.entitiesHistory) console.log(entity)
  }

  public removeEntity(entity: any): void {
    // console.log('entities number:', this.entities.length)
    // console.log('entitites:')
    // for (let entity of this.entities) console.log(entity)

    // console.log('removing entity:', entity)
    const index = this.entities.indexOf(entity);
    if (index >= 0) {
      this.entities.splice(index, 1);
    }

    // console.log(this.entities.length)
    // console.log('entitites:')
    // for (let entity of this.entities) console.log(entity)
  }

  public removeEntityFromHistory(entity: any): void {
    console.log('entities number:', this.entitiesHistory.length)
    console.log('entitites:')
    for (let entity of this.entitiesHistory) console.log(entity)

    console.log('removing entity from history:', entity)
    const index = this.entitiesHistory.indexOf(entity);
    if (index >= 0) {
      this.entitiesHistory.splice(index, 1);
    }

    console.log(this.entitiesHistory.length)
    console.log('entitites:')
    for (let entity of this.entitiesHistory) console.log(entity)
  }

  public getLastEntity() {
    return this.entities[this.entities.length - 1];
  }


  public getLastEntityInHistory() {
    return this.entitiesHistory[this.entitiesHistory.length - 1];
  }


  public removeLastEntity(): void {
    // 
  }

  public recoverLastEntity() {

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
}
