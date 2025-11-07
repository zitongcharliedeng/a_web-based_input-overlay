

function Mouse() {

    // Properties
    this.x = 0;
    this.y = 0;
    this.button1 = false;
    this.button1Click = false;
    this.button2 = false;
    this.button2Click = false;
    this.button3 = false;
    this.button3Click = false;
    this.wheelDelta = {x: 0, y: 0};

    // Update loop
    this.update = function(delta) {
        this.wheelDelta.x *= 0.7 * delta;
        this.wheelDelta.y *= 0.7 * delta;
        this.button1Click = false;
        this.button2Click = false;
        this.button3Click = false;
    }

    const self = this;

    if (window.__TAURI__) {
        // Tauri mode: Listen to Rust backend mouse events (works when unfocused!)
        window.__TAURI__.event.listen('input-event', function(event) {
            const data = event.payload;

            if (data.type === 'MouseMoveX') {
                self.x += data.value;  // Accumulate relative movement from evdev
            } else if (data.type === 'MouseMoveY') {
                self.y += data.value;  // Accumulate relative movement from evdev
            } else if (data.type === 'MouseWheel') {
                self.wheelDelta.y = data.value;
            } else if (data.type === 'MouseWheelH') {
                self.wheelDelta.x = data.value;
            } else if (data.type === 'MouseDown') {
                // Map evdev button numbers to DOM numbering
                // evdev: Button0=left, Button1=right, Button2=middle
                // DOM: button1=left, button2=middle, button3=right
                const buttonMap = { 'Button0': 1, 'Button1': 3, 'Button2': 2 };
                const domButton = buttonMap[data.code];
                if (domButton && self['button' + domButton] === false) {
                    self['button' + domButton] = true;
                    self['button' + domButton + 'Click'] = true;
                }
            } else if (data.type === 'MouseUp') {
                const buttonMap = { 'Button0': 1, 'Button1': 3, 'Button2': 2 };
                const domButton = buttonMap[data.code];
                if (domButton && self['button' + domButton] === true) {
                    self['button' + domButton] = false;
                }
            }
        });
        console.log('Mouse: Tauri mode (global capture via evdev)');
    } else {
        // Browser mode: Use canvas event listeners (requires focus)
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
        });
        console.log('Mouse: Browser mode (requires focus)');
    }
}

export { Mouse };
