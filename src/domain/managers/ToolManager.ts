// src/domain/managers/ToolManager.ts

import { DrawingTool } from '../tools/DrawingTools/DrawingTool';
import { LineTool } from '../tools/DrawingTools/LineTool';
import { PanTool } from '../tools/ViewTools/PanTool';
import { EntityManager } from './EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { ZoomTool } from '../tools/ViewTools/ZoomTool';
import { PointTool } from '../tools/DrawingTools/PointTool';
import { PolylineTool } from '../tools/DrawingTools/PolylineTool';
import { CircleTool } from '../tools/DrawingTools/CircleTool';
import { SplineTool } from '../tools/DrawingTools/SplineTool';
import { RectangleTool } from '../tools/DrawingTools/RectangleTool';
import { PolygonTool } from '../tools/DrawingTools/PolygonTool';
// import { ConstraintManager } from './ConstraintManager'; // Remove if not used
import { ArcTool } from '../tools/DrawingTools/ArcTool';
import { Camera } from '../Camera';

export class ToolManager {
  private activeTool: DrawingTool;
  private panTool: PanTool;
  private zoomTool: ZoomTool;
  private tools: { [key: string]: DrawingTool } = {};
  private activeToolName: string = 'Point';

  constructor(entityManager: EntityManager, renderer: Renderer) {
    // Initialize tools
    this.tools['Line'] = new LineTool(entityManager, renderer);
    this.tools['Point'] = new PointTool(entityManager, renderer);
    this.tools['Polyline'] = new PolylineTool(entityManager, renderer);
    this.tools['Circle'] = new CircleTool(entityManager, renderer);
    this.tools['Spline'] = new SplineTool(entityManager, renderer);
    this.tools['Rectangle'] = new RectangleTool(entityManager, renderer);
    this.tools['Polygon'] = new PolygonTool(entityManager, renderer);
    this.tools['Arc'] = new ArcTool(entityManager, renderer);

    // Set default active tool
    this.activeTool = this.tools['Point'];
    this.activeToolName = 'Point';

    // Initialize pan and zoom tools
    const camera = renderer.getCamera();
    this.panTool = new PanTool(camera);
    this.zoomTool = new ZoomTool(camera);
  }

  public setActiveTool(toolName: string) {
    if (this.tools[toolName]) {
      this.activeTool = this.tools[toolName];
      this.activeToolName = toolName;
    }
  }

  public getActiveTool(): DrawingTool {
    return this.activeTool;
  }

  public getActiveToolName(): string {
    return this.activeToolName;
  }

  public getPanTool(): PanTool {
    return this.panTool;
  }

  public getZoomTool(): ZoomTool {
    return this.zoomTool;
  }
}
