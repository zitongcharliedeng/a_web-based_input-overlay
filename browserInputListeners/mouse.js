


function Mouse() {

    // Properties
    this.x = 0,
    this.y = 0,
    this.button1 = false,
    this.button1Click = false,
    this.button2 = false,
    this.button2Click = false,
    this.button3 = false,
    this.button3Click = false,
    this.wheelDelta = {x: 0, y: 0},

    // Update loop
    this.update = function(delta) {

		this.wheelDelta.x *= 0.7 * delta;
		this.wheelDelta.y *= 0.7 * delta;
        this.button1Click = false;
        this.button2Click = false;
        this.button3Click = false;
    }


    // Mouse events
    const self = this;

    canvas.addEventListener('mousedown', function(e) {

        // Update position;
        self.x = e.x;
        self.y = e.y;

        // Update button state
        if (self[ 'button'+e.which ] === false) {

            self[ 'button'+e.which ] = true;
            self[ 'button'+e.which+'Click' ] = true;
        }
    });

    canvas.addEventListener('mouseup', function(e) {

        // Update position;
        self.x = e.x;
        self.y = e.y;

        // Update button state
        if (self[ 'button'+e.which ] === true) {

            self[ 'button'+e.which ] = false;
        }
    });

    canvas.addEventListener('mousemove', function(e) {

        // Update position;
        self.x = e.x;
        self.y = e.y;
    });

    canvas.addEventListener('wheel', function(e) {

        // Update wheel delta
        self.wheelDelta.x = e.deltaX;
        self.wheelDelta.y = e.deltaY;
    })
}

export { Mouse };
