interface CanvasProperties {
    lineWidth?: number;
    strokeStyle?: string;
    fillStyle?: string;
    lineCap?: CanvasLineCap;
    textAlign?: CanvasTextAlign;
    font?: string;
}
declare function canvas_properties(context: CanvasRenderingContext2D, properties: CanvasProperties): void;
declare function canvas_arrow(context: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, properties?: CanvasProperties): void;
declare function canvas_line(context: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, properties?: CanvasProperties): void;
declare function canvas_arc(context: CanvasRenderingContext2D, x: number, y: number, radius: number, beginPoint: number, endPoint: number, properties?: CanvasProperties): void;
declare function canvas_text(context: CanvasRenderingContext2D, x: number, y: number, text: string, properties?: CanvasProperties): void;
declare function canvas_fill_rec(context: CanvasRenderingContext2D, x: number, y: number, sizex: number, sizey: number, properties?: CanvasProperties): void;
export { canvas_properties, canvas_arrow, canvas_line, canvas_arc, canvas_text, canvas_fill_rec };
export type { CanvasProperties };
