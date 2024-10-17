// src/domain/Camera.ts
export class Camera {
    private offsetX: number = 0;
    private offsetY: number = 0;
    private zoom: number = 1;
  
    public setOffset(x: number, y: number) {
      this.offsetX = x;
      this.offsetY = y;
    }
  
    public setZoom(zoom: number) {
      this.zoom = zoom;
    }
  
    public getOffset(): { x: number; y: number } {
      return { x: this.offsetX, y: this.offsetY };
    }
  
    public getZoom(): number {
      return this.zoom;
    }
  
    public screenToWorld(x: number, y: number): { x: number; y: number } {
      return {
        x: (x / this.zoom) + this.offsetX,
        y: (y / this.zoom) + this.offsetY,
      };
    }
  }
  