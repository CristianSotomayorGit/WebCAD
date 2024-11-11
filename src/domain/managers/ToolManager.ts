// src/domain/managers/ToolManager.ts

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
import { ArcTool } from '../tools/DrawingTools/ArcTool';
import { EllipseTool } from '../tools/DrawingTools/EllipseTool';
import { TextTool } from '../tools/WritingTools/TextTool';
import { Tool } from '../tools/DrawingTools/DrawingTool';

export class ToolManager {
  private activeTool: Tool;
  private panTool: PanTool;
  private zoomTool: ZoomTool;
  private tools: { [key: string]: Tool } = {};
  private activeToolName: string = 'Point';

  constructor(entityManager: EntityManager, renderer: Renderer) {
    
    // Initialize pan and zoom tools
    const camera = renderer.getCamera();
    this.panTool = new PanTool(camera);
    this.zoomTool = new ZoomTool(camera);

    // Initialize tools
    this.tools['Line'] = new LineTool(entityManager, renderer);
    this.tools['Point'] = new PointTool(entityManager, renderer);
    this.tools['Polyline'] = new PolylineTool(entityManager, renderer);
    this.tools['Circle'] = new CircleTool(entityManager, renderer);
    this.tools['Spline'] = new SplineTool(entityManager, renderer);
    this.tools['Rectangle'] = new RectangleTool(entityManager, renderer);
    this.tools['Polygon'] = new PolygonTool(entityManager, renderer);
    this.tools['Arc'] = new ArcTool(entityManager, renderer);
    this.tools['Ellipse'] = new EllipseTool(entityManager, renderer);
    this.tools['Text'] = new TextTool(entityManager,renderer);

    this.tools['Pan'] = this.panTool;
    

    // Set default active tool
    this.activeTool = this.tools['Point'];
    this.activeToolName = 'Point';
  }

  public setActiveTool(toolName: string) {

    this.activeTool.cancel();
    
    if (this.tools[toolName]) {
      this.activeTool = this.tools[toolName];
      this.activeToolName = toolName;
    }
  }

  public getActiveTool(): Tool {
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
