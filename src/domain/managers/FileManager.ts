// src/domain/managers/FileManager.ts

import { DXFParser } from '../parsers/DXFParser';
import { EntityManager } from './EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Line } from '../entities/Line';
import { Point } from '../entities/Point';
import { Circle } from '../entities/Circle';
import { Ellipse } from '../entities/Ellipse';
import { Polyline } from '../entities/Polyline';
import { Arc } from '../entities/Arc';
import { Spline } from '../entities/Spline';

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
      case 'ARC':
        return this.createArc(dxfEntity);
      case 'ELLIPSE':
        return this.createEllipse(dxfEntity);
      case 'LWPOLYLINE':
        return this.createPolyline(dxfEntity);
      default:
        return null;
    }
  }

  private createLine(dxfEntity: DXFEntity): Line {
    const x1 = parseFloat(dxfEntity.properties['10']) || 0;
    const y1 = parseFloat(dxfEntity.properties['20']) || 0;
    const x2 = parseFloat(dxfEntity.properties['11']) || 0;
    const y2 = parseFloat(dxfEntity.properties['21']) || 0;
    const startPoint = new Point(x1, y1, this.renderer);
    const endPoint = new Point(x2, y2, this.renderer);

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
    return circle;
  }

  public createSpline(dxfEntity: DXFEntity): Spline | null {
    const properties = dxfEntity.properties;

    // Extract degree of the spline (default to 3 if not specified)
    const degree = parseInt(properties['71']) || 3;

    // Extract knot values
    const knotValues = properties['40'];
    const knots = knotValues
      ? Array.isArray(knotValues)
        ? knotValues.map((k: string) => parseFloat(k))
        : [parseFloat(knotValues)]
      : [];

    // Extract control point coordinates
    const controlPointXs = properties['10'];
    const controlPointYs = properties['20'];
    const controlPointZs = properties['30'];

    if (!controlPointXs || !controlPointYs) {
      console.warn('Spline entity does not have control points.');
      return null;
    }

    const xValues = Array.isArray(controlPointXs) ? controlPointXs : [controlPointXs];
    const yValues = Array.isArray(controlPointYs) ? controlPointYs : [controlPointYs];
    const zValues = controlPointZs
      ? Array.isArray(controlPointZs)
        ? controlPointZs
        : [controlPointZs]
      : [];

    const controlPoints: Point[] = [];
    const numControlPoints = xValues.length;

    for (let i = 0; i < numControlPoints; i++) {
      const x = parseFloat(xValues[i]);
      const y = parseFloat(yValues[i]);
      const z = zValues.length > 0 ? parseFloat(zValues[i]) : 0;
      controlPoints.push(new Point(x, y, this.renderer));
    }

    if (controlPoints.length < 2) {
      console.warn('Spline entity does not have enough control points.');
      return null;
    }

    // Extract weights (optional)
    const weightValues = properties['41'];
    const weights = weightValues
      ? Array.isArray(weightValues)
        ? weightValues.map((w: string) => parseFloat(w))
        : [parseFloat(weightValues)]
      : [];

    // Create and return the Spline entity
    let spline = new Spline(this.renderer, controlPoints, knots, degree, weights);
    spline.setColor(new Float32Array([1.0, 0.5, 0.0, 1.0]));
    return spline;
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
    return polyline;
  }

  private createArc(dxfEntity: DXFEntity): Arc {
    const centerX = parseFloat(dxfEntity.properties['10']) || 0;
    const centerY = parseFloat(dxfEntity.properties['20']) || 0;
    const radius = parseFloat(dxfEntity.properties['40']) || 0;
    const startAngle = ((parseFloat(dxfEntity.properties['50']) || 0) * Math.PI) / 180;
    const endAngle = ((parseFloat(dxfEntity.properties['51']) || 0) * Math.PI) / 180;

    // Determine arc direction based on DXF properties (if available)
    const isClockwise = dxfEntity.properties['73'] === '1';

    let arc = new Arc(this.renderer, centerX, centerY, radius, startAngle, endAngle, isClockwise);
    arc.setColor(new Float32Array([1.0, 0.0, 0.0, 1.0]));
    return arc;
  }
}
