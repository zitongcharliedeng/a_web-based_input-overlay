
function scene_default(canvas, ctx) {

    // TODO: Implement empty sandbox scene
    // - Blank canvas
    // - Right-click to spawn objects from menu
    // - All objects should use smart defaults
    // - No hardcoded images, user-uploadable assets

    // Object dragging info
    var clickedObject = null;
    var draggingOffset = new Vector(0, 0);
    var gridsize = 10;

    // Property editor
    var propertyEditor = new PropertyEdit(0, 0, 10, 10);
    var editingProperties = false;

    // The objects to be rendered
    this.objects = [
        // Empty - user will spawn objects via right-click menu
    ];


    this.draw = function(canvas, ctx) {

        // Render outline when editing objects
        if (clickedObject !== null) {
    		for (var i = 0; i < this.objects.length; i++) {

    			var object = this.objects[i];

                ctx.setTransform(1, 0, 0, 1, object.x, object.y);
            	ctx.beginPath();
            	canvas_properties(ctx, {strokeStyle:"#FF00FF", lineWidth:1})
            	ctx.rect(0, 0, object.width, object.height);
            	ctx.stroke();
            }
        }
    }

    // Update loop
    this.update = function(delta) {

        // Drag objects around
        if (mouse.button1Click === true || mouse.button3Click === true) {

            clickedObject = null;
            for (var i = 0; i < this.objects.length; i++) {
                var object = this.objects[i];

                if ((mouse.x > object.x && mouse.y > object.y)
                && (mouse.x < object.x + object.width && mouse.y < object.y + object.height)) {

                    draggingOffset.x = object.x - mouse.x;
                    draggingOffset.y = object.y - mouse.y;
                    clickedObject = object;

                    console.log("Clicked on object:", object);

                    break;
                }
            }
        } if ((mouse.button1 === false && mouse.button3 === false) && clickedObject !== null) {

            console.log("Released mouse");
            clickedObject = null;
        }
        if (clickedObject !== null && mouse.button1 === true) {

            console.log("Dragging");
            clickedObject.x = Math.round((mouse.x + draggingOffset.x)/gridsize)*gridsize;
            clickedObject.y = Math.round((mouse.y + draggingOffset.y)/gridsize)*gridsize;
        }



        // Options menu
        // Clicked away from the menu
        if (mouse.button3Click === true || mouse.button1Click === true) {

            if (clickedObject === null && editingProperties === true) {

                console.log("clicked away from editor");

                // Hide property edit window
                propertyEditor.hidePropertyEdit();
                editingProperties = false;
            }
        }
        // Clicked on an object
        if (mouse.button3Click === true && clickedObject !== null && editingProperties === false) {

            console.log("Editing object");

            // Show property edit window
            propertyEditor.showPropertyEdit(clickedObject.defaultProperties, clickedObject);
            editingProperties = true;
        }


    }
}
