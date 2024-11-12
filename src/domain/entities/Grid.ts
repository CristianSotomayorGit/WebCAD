// src/domain/entities/Grid.ts

import { Renderer } from '../../infrastructure/rendering/Renderer';
import { EntityManager } from '../managers/EntityManager';
import { ZoomTool } from '../tools/ViewTools/ZoomTool';
import { Entity } from './Entity';
import { Line } from './Line';
import { Point } from './Point';

export class Grid {
  lines: Line[] = [];
  renderer: Renderer;
  previousZoom: number;
  entityManager: EntityManager

  constructor(renderer: Renderer, entityManager: EntityManager) {
    this.renderer = renderer;
    this.entityManager = entityManager;
    this.previousZoom = renderer.getCamera().getZoom();

    const rangeStart = -2.0;
    const rangeEnd = 2.0;
    const numLines = 41; // 41 lines from -2 to 2

    const step = (rangeEnd - rangeStart) / (numLines - 1); // Calculate step for each line

    // Vertical lines
    for (let i = 0; i < numLines; i++) {
      const x = rangeStart + i * step;
      this.lines.push(new Line(new Point(x, rangeEnd, renderer), new Point(x, rangeStart, renderer), renderer));
    }

    // Horizontal lines
    for (let i = 0; i < numLines; i++) {
      const y = rangeStart + i * step;
      this.lines.push(new Line(new Point(rangeStart, y, renderer), new Point(rangeEnd, y, renderer), renderer));
    }

    for (let line of this.lines) {
      entityManager.addEntity(line);
    }
  }

  hasZoomDoubled(currentZoom: number): Boolean {
    if (currentZoom % 2 == 0) return true;
    return false;
  }

  hasZoomHalved() {

  }

  generateGrid(zoomFactor: number) {
    let regenLines = [];

    const rangeStart = -2.0 / zoomFactor;
    const rangeEnd = 2.0 / zoomFactor;

    const numLines = 41;
    const step = (rangeEnd - rangeStart) / (numLines - 1); // Calculate step for each line

    // Vertical lines
    for (let i = 0; i < numLines; i++) {
      const x = rangeStart + i * step;
      regenLines.push(new Line(new Point(x, rangeEnd, this.renderer), new Point(x, rangeStart, this.renderer), this.renderer));
    }

    // Horizontal lines
    for (let i = 0; i < numLines; i++) {
      const y = rangeStart + i * step;
      regenLines.push(new Line(new Point(rangeStart, y, this.renderer), new Point(rangeEnd, y, this.renderer), this.renderer));
    }

    for (let line of this.lines) {
      this.entityManager.removeEntity(line)
    }

    for (let line of regenLines) {
      this.entityManager.addEntity(line);
    }

    this.lines = regenLines;
  }


  draw(renderPass: GPURenderPassEncoder) {
    let currentZoom = this.renderer.getCamera().getZoom();

    let previousRoundedZoom = Math.floor(this.previousZoom) 
    let currenRoundedZoom = Math.floor(currentZoom)

    if (previousRoundedZoom !== currenRoundedZoom) {
      // console.log('yooooooo')
      if (currenRoundedZoom  %  2 === 0) {

        console.log('yooooooooooooo')

        this.generateGrid(currentZoom);
      //   this.previousZoom == currenRoundedZoom;
       }
      this.previousZoom = currentZoom;
    }


    for (let line of this.lines) {
      line.draw(renderPass)
    }
  }

  private checkZoomDoubled(): Boolean {
    const currentZoom = this.renderer.getCamera().getZoom();

    // Calculate the logarithm of the current zoom to the base 2
    const logZoom = Math.log2(currentZoom);

    // Round the logZoom to avoid floating point precision issues
    const roundedLogZoom = Math.round(logZoom);

    // Check if the zoom has doubled by comparing it to the previous rounded logZoom
    if (roundedLogZoom > Math.round(Math.log2(this.previousZoom))) {
      // this.createGrid();  // Regenerate the grid if zoom has doubled
      this.previousZoom = currentZoom;  // Update the previous zoom to the current zoom
      return true;
    }

    return false;
  }
}
