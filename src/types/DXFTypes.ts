// src/types/DXFTypes.ts

export interface DXFEntity {
    type: string;
    properties: { [code: string]: any };
  }
  