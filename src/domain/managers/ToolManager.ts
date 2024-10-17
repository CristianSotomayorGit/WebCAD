// src/domain/managers/ToolManager.ts

import { Tool } from '../tools/Tool';
// import { SelectTool } from '../tools/SelectTool';
import { LineTool } from '../tools/LineTool';
import { PanTool } from '../tools/PanTool';
import { EntityManager } from './EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { ZoomTool } from '../tools/ZoomTool';
import { PointTool } from '../tools/PointTool';
import { PolylineTool } from '../tools/PolylineTool';

export class ToolManager {
  private activeTool: Tool;
  private panTool: PanTool;
  private zoomTool: ZoomTool;
  private tools: { [key: string]: Tool } = {};
  private activeToolName: string = 'Select';

  constructor(entityManager: EntityManager, renderer: Renderer) {
    // this.tools['Select'] = new SelectTool();
    this.tools['Line'] = new LineTool(entityManager, renderer);
    this.tools['Point'] = new PointTool(entityManager, renderer);
    this.tools['Polyline'] = new PolylineTool(entityManager, renderer);


    this.activeTool = this.tools['Select'];

    this.panTool = new PanTool(renderer.getCamera());
    this.zoomTool = new ZoomTool(renderer.getCamera());
  }

  public setActiveTool(toolName: string) {
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
