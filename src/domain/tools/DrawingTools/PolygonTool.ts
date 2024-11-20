// src/domain/tools/PolygonTool.ts

import { AbstractDrawingTool } from './AbstractDrawingTool';
import { Polygon } from '../../entities/Polygon';
import { Point } from '../../entities/Point';

export class PolygonTool extends AbstractDrawingTool {
  private currentPolygon: Polygon | null = null;
  private numSides: number = 3; // Default value is 3
  private centerPoint: Point | null = null;
  // private centerX: number = 0;
  // private centerY: number = 0;
  private inputElement: HTMLInputElement | null = null;

  public onLeftClick(event: MouseEvent, color: Float32Array): void {
    const { x, y } = this.getWorldPosition(event);

    if (!this.isDrawing) {
      // First click: set the center
      // this.centerPoint.x = x;
      // this.centerPoint.y = y;
      this.isDrawing = true;

      this.centerPoint = this.createAndAddPoint(x, y); // Center point


      // Create the Polygon entity with default sides (3)
      this.currentPolygon = new Polygon(this.renderer, this.centerPoint.getX(), this.centerPoint.getY(), this.numSides);
      // this.currentPolygon.addPoint(this.centerPoint)
      this.currentPolygon.setColor(color);
      this.entityManager.addEntity(this.currentPolygon);

      // Display the input box
      this.showInputBox(event.clientX, event.clientY);
    } else if (this.isDrawing && this.currentPolygon) {
      // Second click: finalize the polygon
      this.finishDrawing();
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (this.isDrawing && this.currentPolygon) {
      const { x, y } = this.getWorldPosition(event);

      // Update the radius of the polygon based on mouse position
      this.currentPolygon.updateRadiusFromPoint(x, y);

      // Optionally, update the position of the input box to follow the mouse
      this.updateInputBoxLocation(event.clientX, event.clientY);
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    super.onKeyDown(event);

    if (this.isDrawing) {
      if (event.key === 'Enter' || event.key === 'Return') {
        this.finishDrawing();
      }
    }
  }

  private showInputBox(clientX: number, clientY: number): void {
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'number';
    this.inputElement.min = '3';
    this.inputElement.value = '3'; // Default value is 3
    this.inputElement.style.position = 'absolute';
    this.inputElement.style.left = `${clientX}px`;
    this.inputElement.style.top = `${clientY}px`;
    this.inputElement.style.zIndex = '1000';
    this.inputElement.style.width = '50px';

    document.body.appendChild(this.inputElement);
    this.inputElement.focus();

    // Handle input events
    this.inputElement.addEventListener('input', () => {
      this.updatePolygonSides();
    });

    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.finishDrawing();
      } else if (e.key === 'Escape') {
        this.cancel();
      }
    });
  }

  private updateInputBoxLocation(clientX: number, clientY: number): void {
    if (this.inputElement) {
      this.inputElement.style.left = `${clientX + 20}px`;
      this.inputElement.style.top = `${clientY + 20}px`;
    }
  }

  private updatePolygonSides(): void {
    if (this.inputElement && this.currentPolygon) {
      const value = parseInt(this.inputElement.value, 10);
      if (!isNaN(value) && value >= 3) {
        this.numSides = value;
        // Update the polygon with the new number of sides
        this.currentPolygon.setNumSides(this.numSides);
      }
    }
  }

  public cancel(): void {
    super.cancel();

    if (this.inputElement) {
      document.body.removeChild(this.inputElement);
      this.inputElement = null;
    }
    if (this.centerPoint) {
      this.entityManager.removeEntity(this.centerPoint)
    }

    if (this.currentPolygon) {
      this.entityManager.removeEntity(this.currentPolygon);
      this.currentPolygon = null;
    }
    this.numSides = 3; // Reset to default value
  }

  private finishDrawing(): void {
    if (this.inputElement) {
      document.body.removeChild(this.inputElement);
      this.inputElement = null;
    }
    this.currentPolygon = null;
    this.isDrawing = false;
    this.numSides = 3; // Reset to default value
    this.points = [];
  }
}
