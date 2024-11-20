// src/domain/entities/Grid.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { EntityManager } from '../managers/EntityManager';
import { Line } from './Line';
import { Point } from './Point';

const GridSettings = {
  MAJOR_LINE_COLOR: new Float32Array([0.2, 0.2, 0.2, 1.0]),
  MINOR_LINE_COLOR: new Float32Array([0.35, 0.35, 0.35, 1.0]),
  NUMBER_OF_LINES: 501,
  WORLD_COORDINATE_RANGE_START: -10,
  WORLD_COORDINATE_RANGE_END: 10,
}

export class Grid {
  lines: Line[] = [];
  renderer: Renderer;
  entityManager: EntityManager;

  constructor(renderer: Renderer, entityManager: EntityManager) {
    this.renderer = renderer;
    this.entityManager = entityManager;
    this.generateGrid();
  }

  generateGrid() {
    const step = (GridSettings.WORLD_COORDINATE_RANGE_END - GridSettings.WORLD_COORDINATE_RANGE_START) / (GridSettings.NUMBER_OF_LINES - 1);

    for (let i = 0; i < GridSettings.NUMBER_OF_LINES; i++) {
      const x = GridSettings.WORLD_COORDINATE_RANGE_START + i * step;
      let line = new Line(new Point(x, GridSettings.WORLD_COORDINATE_RANGE_END, this.renderer), new Point(x, GridSettings.WORLD_COORDINATE_RANGE_START, this.renderer), this.renderer);
      if (i % 5 === 0) line.setColor(GridSettings.MINOR_LINE_COLOR);
      else line.setColor(GridSettings.MAJOR_LINE_COLOR);
      this.lines.push(line);
    }

    for (let i = 0; i < GridSettings.NUMBER_OF_LINES; i++) {
      const y = GridSettings.WORLD_COORDINATE_RANGE_START + i * step;
      let line = new Line(new Point(GridSettings.WORLD_COORDINATE_RANGE_START, y, this.renderer), new Point(GridSettings.WORLD_COORDINATE_RANGE_END, y, this.renderer), this.renderer);
      if (i % 5 === 0) line.setColor(GridSettings.MINOR_LINE_COLOR);
      else line.setColor(GridSettings.MAJOR_LINE_COLOR)
      this.lines.push(line);
    }
  }

  isLineInView(line: Line): boolean {
    const camera = this.renderer.getCamera();
    const { x, y } = camera.getOffset();
    const zoom = camera.getZoom();
    const cameraLeft = x - this.renderer.canvas.width / 2 / zoom;
    const cameraRight = x + this.renderer.canvas.width / 2 / zoom;
    const cameraTop = y + this.renderer.canvas.height / 2 / zoom;
    const cameraBottom = y - this.renderer.canvas.height / 2 / zoom;
    const start = line.getStartPoint();
    const end = line.getEndPoint();

    return (
      (start.getX() >= cameraLeft && start.getX() <= cameraRight && start.getY() >= cameraBottom && start.getY() <= cameraTop) ||
      (end.getX() >= cameraLeft && end.getX() <= cameraRight && end.getY() >= cameraBottom && end.getY() <= cameraTop)
    );
  }

  draw(renderPass: GPURenderPassEncoder) {
    this.lines.forEach((line) => {
      if (this.isLineInView(line)) {
        line.draw(renderPass, false);
      }
    });
  }
}
