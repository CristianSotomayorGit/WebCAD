// src/domain/parsers/DXFParser.ts

import { DXFEntity } from '../../types/DXFTypes';

export class DXFParser {
  private content: string;
  private lines: string[];
  private index: number = 0;

  constructor(content: string) {
    this.content = content;
    this.lines = this.content.split(/\r\n|\r|\n/);
  }

  public parse(): DXFEntity[] {
    const entities: DXFEntity[] = [];
    console.log('Starting DXF parsing...');
    while (this.index < this.lines.length) {
      const code = this.getCode();
      const value = this.getValue();
      if (code === '0' && value === 'SECTION') {
        this.parseSection(entities);
      } else {
        // Skip any codes outside sections
        continue;
      }
    }
    console.log('Parsing complete. Parsed entities:', entities);
    return entities;
  }

  private parseSection(entities: DXFEntity[]) {
    while (this.index < this.lines.length) {
      const code = this.getCode();
      const value = this.getValue();
      if (code === '2' && value === 'ENTITIES') {
        this.parseEntities(entities);
      } else if (code === '0' && value === 'ENDSEC') {
        break;
      } else {
        // Skip any codes not relevant
        continue;
      }
    }
  }

  private parseEntities(entities: DXFEntity[]) {
    while (this.index < this.lines.length) {
      const code = this.getCode();
      const value = this.getValue();
      if (code === '0' && value === 'ENDSEC') {
        break;
      } else if (code === '0') {
        const entity = this.parseEntity(value);
        if (entity) {
          entities.push(entity);
          console.log('Parsed entity:', entity);
        }
      } else {
        // Skip any codes that are not starting a new entity
        continue;
      }
    }
  }

  private parseEntity(type: string): DXFEntity | null {
    const entity: DXFEntity = { type, properties: {} };
    while (this.index < this.lines.length) {
      const code = this.getCode();
      const value = this.getValue();
      if (code === '0') {
        // Decrement index to re-process this code in the higher-level function
        this.index -= 2;
        break;
      } else {
        entity.properties[code] = value;
      }
    }
    // Avoid adding 'EOF' as an entity
    if (type === 'EOF') {
      return null;
    }
    return entity;
  }

  private getCode(): string {
    if (this.index >= this.lines.length) return '';
    const code = this.lines[this.index].trim();
    this.index++;
    return code;
  }

  private getValue(): string {
    if (this.index >= this.lines.length) return '';
    const value = this.lines[this.index].trim();
    this.index++;
    return value;
  }
}
