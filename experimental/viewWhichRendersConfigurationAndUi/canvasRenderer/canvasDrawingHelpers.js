function canvas_properties(context, properties) {
    if (properties.lineWidth !== undefined) {
        context.lineWidth = properties.lineWidth;
    }
    if (properties.strokeStyle !== undefined) {
        context.strokeStyle = properties.strokeStyle;
    }
    if (properties.fillStyle !== undefined) {
        context.fillStyle = properties.fillStyle;
    }
    if (properties.lineCap !== undefined) {
        context.lineCap = properties.lineCap;
    }
    if (properties.textAlign !== undefined) {
        context.textAlign = properties.textAlign;
    }
    if (properties.font !== undefined) {
        context.font = properties.font;
    }
}
function canvas_arrow(context, fromx, fromy, tox, toy, properties) {
    if (properties !== undefined)
        canvas_properties(context, properties);
    const headlen = 10;
    const angle = Math.atan2(toy - fromy, tox - fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}
function canvas_line(context, fromx, fromy, tox, toy, properties) {
    if (properties !== undefined)
        canvas_properties(context, properties);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
}
function canvas_arc(context, x, y, radius, beginPoint, endPoint, properties) {
    if (properties !== undefined)
        canvas_properties(context, properties);
    context.arc(x, y, radius, beginPoint, endPoint);
}
function canvas_text(context, x, y, text, properties) {
    if (properties !== undefined)
        canvas_properties(context, properties);
    context.fillText(text, x, y);
}
function canvas_fill_rec(context, x, y, sizex, sizey, properties) {
    if (properties !== undefined)
        canvas_properties(context, properties);
    context.fillRect(x, y, sizex, sizey);
}
export { canvas_properties, canvas_arrow, canvas_line, canvas_arc, canvas_text, canvas_fill_rec };
//# sourceMappingURL=canvasDrawingHelpers.js.map