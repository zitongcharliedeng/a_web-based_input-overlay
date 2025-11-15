interface MouseButtons {
    [key: number]: boolean;
    0: boolean;
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
}
interface MouseClicks {
    [key: number]: boolean;
    0: boolean;
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
}
interface WheelDelta {
    x: number;
    y: number;
}
interface WheelEvents {
    up: boolean;
    down: boolean;
}
interface MouseState {
    x: number;
    y: number;
    buttons: MouseButtons;
    clicks: MouseClicks;
    wheelDelta: WheelDelta;
    wheelEvents: WheelEvents;
    update(delta: number): void;
}
declare const mouse: MouseState;
export { mouse };
