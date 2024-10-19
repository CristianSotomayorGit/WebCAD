// src/domain/tools/PolygonTool.ts

import { Tool } from './Tool';
import { EntityManager } from '../managers/EntityManager';
import { Renderer } from '../../infrastructure/rendering/Renderer';
import { Polygon } from '../entities/Polygon';
import { Point } from '../entities/Point';

export class PolygonTool implements Tool {
  private isDrawing = false;
  private currentPolygon: Polygon | null = null;
  private renderer: Renderer;
  private entityManager: EntityManager;
  private numSides: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  private inputElement: HTMLInputElement | null = null;

  constructor(entityManager: EntityManager, renderer: Renderer) {
    this.entityManager = entityManager;
    this.renderer = renderer;
  }

  public onMouseDown(event: MouseEvent): void {
    const { x, y } = this.getWorldPosition(event);

    if (!this.isDrawing && event.button === 0) {
      // First click: set the center
      this.centerX = x;
      this.centerY = y;
      this.isDrawing = true;

      let centerPoint = new Point(this.centerX, this.centerY, this.renderer)
      this.entityManager.addEntity(centerPoint)
      
      // Display the input box
      this.showInputBox(event.clientX, event.clientY);

    } else if (this.isDrawing && this.numSides >= 3 && event.button === 0 && this.currentPolygon) {
      // Second click: finalize the polygon
      this.finishDrawing();
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing) {
      const { x, y } = this.getWorldPosition(event);

      if (this.currentPolygon) {
        this.currentPolygon.updateRadiusFromPoint(x, y);
      }
      else {
        this.updateInputBoxLocation(event.clientX, event.clientY);
      }
    }
  }

  public onMouseUp(event: MouseEvent): void {
    // No action needed on mouse up
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (this.isDrawing) {
      if (event.key === 'Escape') {
        this.cancelDrawing();
      } else if (event.key === 'Enter' || event.key === 'Return') {
        if (this.inputElement) {
          // If input box is open, process input
          this.processInput();
        } else if (this.currentPolygon) {
          // Finalize the polygon
          this.finishDrawing();
        }
      }
    }
  }

  private showInputBox(clientX: number, clientY: number): void {
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'number';
    this.inputElement.min = '3';
    this.inputElement.value = '5';
    this.inputElement.style.position = 'absolute';
    this.inputElement.style.left = `${clientX}px`;
    this.inputElement.style.top = `${clientY}px`;
    this.inputElement.style.zIndex = '1000';
    this.inputElement.style.width = '50px';

    document.body.appendChild(this.inputElement);
    this.inputElement.focus();

    // Handle input events
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.processInput();
      } else if (e.key === 'Escape') {
        this.cancelDrawing();
      }
    });
  }

  private updateInputBoxLocation(clientX: number, clientY: number) {
    if (this.inputElement) {
      this.inputElement.style.left = `${clientX + 20}px`;
      this.inputElement.style.top = `${clientY + 20}px`;

    }
  }

  private processInput(): void {
    if (this.inputElement) {
      const value = parseInt(this.inputElement.value, 10);
      if (isNaN(value) || value < 3) {
        alert('Please enter a valid number greater than or equal to 3.');
        return;
      }
      this.numSides = value;
      // Remove the input box
      document.body.removeChild(this.inputElement);
      this.inputElement = null;

      // Create the RegularPolygon entity
      this.currentPolygon = new Polygon(this.renderer, this.centerX, this.centerY, this.numSides);
      this.entityManager.addEntity(this.currentPolygon);
    }
  }

  private getWorldPosition(event: MouseEvent): { x: number; y: number } {
    const canvasRect = this.renderer.getCanvas().getBoundingClientRect();
    const screenX = event.clientX - canvasRect.left;
    const screenY = event.clientY - canvasRect.top;
    return this.renderer.screenToWorld(screenX, screenY);
  }

  private cancelDrawing(): void {
    if (this.inputElement) {
      document.body.removeChild(this.inputElement);
      this.inputElement = null;
    }
    if (this.currentPolygon) {
      this.entityManager.removeEntity(this.currentPolygon);
      this.currentPolygon.dispose();
      this.currentPolygon = null;
    }
    this.isDrawing = false;
    this.numSides = 0;
  }

  private finishDrawing(): void {
    this.currentPolygon = null;
    this.isDrawing = false;
    this.numSides = 0;
  }
}
