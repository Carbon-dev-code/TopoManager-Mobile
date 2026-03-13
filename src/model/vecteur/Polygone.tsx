import { PointC } from "./PointC";

export class Polygone {
  /** Contour extérieur */
  points: PointC[];

  constructor(points: PointC[]) {
    this.points = points;
  }

}