import { mouse } from './inputReaders/DOM_API/mouse';
import { keyboard } from './inputReaders/DOM_API/keyboard';
import './inputReaders/ElectronAppWrapper_API';
declare global {
    interface Window {
        gamepads: (Gamepad | null)[] | null;
        keyboard: typeof keyboard;
        mouse: typeof mouse;
        _gamepadDebugLogged?: boolean;
    }
}
