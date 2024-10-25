import { ZoomTool } from "../tools/ViewTools/ZoomTool";

export class ScaleManager {

    private scales: { [key: string]: number } = {};
    private activeScale!: number;
    private activeScaleName!: string;
    private zoomTool: ZoomTool;


    constructor(zoomTool: ZoomTool) {
        this.scales['1/8"'] = 0.125;
        this.scales['1/4"'] = 0.250;
        this.scales['1/2"'] = 0.500;
        this.scales['1"'] = 1.000;
        this.scales['2"'] = 2.00;
        this.scales['5"'] = 5
        this.activeScale = this.scales['1'];

        this.zoomTool = zoomTool;
    }

    public setActiveScale(scaleName: string) {
        if (this.scales[scaleName]) {
          this.activeScale = this.scales[scaleName];
          this.zoomTool.setZoom(this.getActiveScale())
          this.activeScaleName = scaleName;
        }
      }
    
      public getActiveScale(): number {
        return this.activeScale;
      }
    
      public getActiveScaleName(): string {
        return this.activeScaleName;
      }

}
