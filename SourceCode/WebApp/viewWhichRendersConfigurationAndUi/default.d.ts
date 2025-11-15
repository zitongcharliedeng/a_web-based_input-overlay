import { mouse } from './inputReaders/mouse';
import { keyboard } from './inputReaders/keyboard';
declare global {
    interface Window {
        gamepads: (Gamepad | null)[] | null;
        keyboard: typeof keyboard;
        mouse: typeof mouse;
        _gamepadDebugLogged?: boolean;
    }
}
