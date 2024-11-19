
// src/domain/managers/FileManager.ts

import { DXFParser } from '../parsers/DXFParser';
import { EntityManager } from './EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from '../entities/Line';
// import { Circle } from '../entities/Circle';
// import { Arc } from '../entities/Arc';
import { Point } from '../entities/Point';
import { Circle } from '../entities/Circle';
import { Ellipse } from '../entities/Ellipse';
import { Polyline } from '../entities/Polyline';
import { Arc } from '../entities/Arc';
import { Spline } from '../entities/Spline';
// import { Arc } from '../entities/Arc';
// import { Spline } from '../entities/Spline';
// import { Polygon } from '../entities/Polygon';
// import { Polyline } from '../entities/Polyline';
// import { Ellipse } from '../entities/Ellipse';

export interface DXFEntity {
  type: string;
  properties: { [code: string]: any };
}

export class FileManager {
  private entityManager: EntityManager;
  private renderer: Renderer;

  constructor(entityManager: EntityManager, renderer: Renderer) {
    this.entityManager = entityManager;
    this.renderer = renderer;
  }

  public async loadDXF(file: File): Promise<void> {
    const content = await file.text();
    const parser = new DXFParser(content);
    const entities = parser.parse();
    entities.forEach((dxfEntity) => {
      const entity = this.convertToEntity(dxfEntity);
      if (entity) {
        this.entityManager.addEntity(entity);
      }
    });
  }

  private convertToEntity(dxfEntity: DXFEntity): any {
    switch (dxfEntity.type) {
      case 'LINE':
        return this.createLine(dxfEntity);
      case 'CIRCLE':
        return this.createCircle(dxfEntity);
      case 'SPLINE':
        return this.createSpline(dxfEntity);
      // case 'POINT':
      //   return this.createPoint(dxfEntity);
      case 'ARC':
        return this.createArc(dxfEntity);
      case 'ELLIPSE':
        return this.createEllipse(dxfEntity);
      case 'LWPOLYLINE':
        return this.createPolyline(dxfEntity)
      default:
        return null;
    }
  }

  private createLine(dxfEntity: DXFEntity): Line {
    const x1 = parseFloat(dxfEntity.properties['10']) || 0;
    const y1 = parseFloat(dxfEntity.properties['20']) || 0;
    const x2 = parseFloat(dxfEntity.properties['11']) || 0;
    const y2 = parseFloat(dxfEntity.properties['21']) || 0;
    const startPoint = new Point(x1, y1, this.renderer)
    const endPoint = new Point(x2, y2, this.renderer)

    let line = new Line(startPoint, endPoint, this.renderer);
    line.setColor(new Float32Array([0.0, 0.0, 1.0, 1.0]));
    return line;
  }

  private createCircle(dxfEntity: DXFEntity): Circle {
    const x = parseFloat(dxfEntity.properties['10']) || 0;
    const y = parseFloat(dxfEntity.properties['20']) || 0;
    const radius = parseFloat(dxfEntity.properties['40']) || 0;
    let circle = new Circle(this.renderer, x, y, radius);
    circle.setColor(new Float32Array([0.0, 1.0, 0.0, 1.0]));
    return circle
  }

  public createSpline(dxfEntity: any, renderer: Renderer): Spline | null {
    const properties = dxfEntity.properties;
  
    // Extract fit points or control points
    const fitPoints: { x: number; y: number }[] = [];
    const controlPoints: { x: number; y: number }[] = [];
  
    for (let i = 0; i < properties.length; i += 2) {
      const code = properties[i];
      const value = properties[i + 1];
  
      if (code === "11") {
        fitPoints.push({ x: parseFloat(value), y: 0 });
      } else if (code === "21" && fitPoints.length > 0) {
        fitPoints[fitPoints.length - 1].y = parseFloat(value);
      } else if (code === "10") {
        controlPoints.push({ x: parseFloat(value), y: 0 });
      } else if (code === "20" && controlPoints.length > 0) {
        controlPoints[controlPoints.length - 1].y = parseFloat(value);
      }
    }
  
    // Use fit points if available; otherwise, use control points
    const points = fitPoints.length > 0 ? fitPoints : controlPoints;
  
    if (points.length < 2) {
      console.warn("Spline entity does not have enough points.");
      return null;
    }
  
    return new Spline(renderer, points);
  }
  
  


  private createEllipse(dxfEntity: DXFEntity): Ellipse {
    const centerX = parseFloat(dxfEntity.properties['10']) || 0;
    const centerY = parseFloat(dxfEntity.properties['20']) || 0;
    const majorAxisEndX = parseFloat(dxfEntity.properties['11']) || 0;
    const majorAxisEndY = parseFloat(dxfEntity.properties['21']) || 0;
    const ratio = parseFloat(dxfEntity.properties['40']) || 1;
    const rotation = Math.atan2(majorAxisEndY, majorAxisEndX); // Calculate rotation from major axis endpoint

    const majorAxisLength = Math.sqrt(majorAxisEndX ** 2 + majorAxisEndY ** 2);
    const minorAxisLength = majorAxisLength * ratio;

    let ellipse = new Ellipse(this.renderer, centerX, centerY, majorAxisLength, minorAxisLength, rotation);
    ellipse.setColor(new Float32Array([0.5, 0.0, 0.5, 1.0]));
    return ellipse;
  }


  private createPolyline(dxfEntity: DXFEntity): Polyline {
    const vertices: { x: number; y: number; bulge?: number }[] = [];
    let elevation = 0;
    let closed = false;

    for (const [code, value] of Object.entries(dxfEntity.properties)) {
      switch (code) {
        case '10': // X coordinate of vertex
          vertices.push({ x: parseFloat(value), y: 0 });
          break;
        case '20': // Y coordinate of vertex
          vertices[vertices.length - 1].y = parseFloat(value);
          break;
        case '42': // Bulge (optional for each vertex)
          vertices[vertices.length - 1].bulge = parseFloat(value);
          break;
        case '30': // Elevation (applies to all vertices)
          elevation = parseFloat(value);
          break;
        case '70': // Closed polyline flag
          closed = parseInt(value) === 1;
          break;
      }
    }


    let polyline = new Polyline(this.renderer, vertices, elevation, closed);
    polyline.setColor(new Float32Array([0.8, 0.52, 0.25, 1.0]));
    return polyline
  }

  private createArc(dxfEntity: DXFEntity): Arc {
    const centerX = parseFloat(dxfEntity.properties['10']) || 0;
    const centerY = parseFloat(dxfEntity.properties['20']) || 0;
    const radius = parseFloat(dxfEntity.properties['40']) || 0;
    const startAngle = (parseFloat(dxfEntity.properties['50']) || 0) * (Math.PI / 180);
    const endAngle = (parseFloat(dxfEntity.properties['51']) || 0) * (Math.PI / 180);

    // Determine arc direction based on DXF properties (if available)
    const isClockwise = dxfEntity.properties['73'] === '1';

    let arc = new Arc(this.renderer, centerX, centerY, radius, startAngle, endAngle, isClockwise);
    arc.setColor(new Float32Array([1.0, 0.0, 0.0, 1.0]));
    return arc
  }


  //   private createPoint(dxfEntity: DXFEntity): Point {
  //     const x = parseFloat(dxfEntity.properties['10']) || 0;
  //     const y = parseFloat(dxfEntity.properties['20']) || 0;
  //     return new Point(x, y, this.renderer);
  //   }
}
