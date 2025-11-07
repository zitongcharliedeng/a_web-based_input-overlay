use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub keyboard_state: Arc<RwLock<HashMap<String, bool>>>,
    pub gamepad_axes: Arc<RwLock<HashMap<String, f32>>>,
    pub gamepad_buttons: Arc<RwLock<HashMap<String, bool>>>,
    pub mouse_pos: Arc<RwLock<(i32, i32)>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            keyboard_state: Arc::new(RwLock::new(HashMap::new())),
            gamepad_axes: Arc::new(RwLock::new(HashMap::new())),
            gamepad_buttons: Arc::new(RwLock::new(HashMap::new())),
            mouse_pos: Arc::new(RwLock::new((0, 0))),
        }
    }
}
