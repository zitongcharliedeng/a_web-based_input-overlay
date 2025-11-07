mod components;
mod input;

use components::AppState;
use dioxus::prelude::*;

fn main() {
    env_logger::init();
    dioxus_desktop::launch(app);
}

fn app(cx: Scope) -> Element {
    cx.provide_context(AppState::new());
    
    use_effect(cx, (), |_| {
        cx.spawn(async {
            if let Err(e) = input::start_capture().await {
                log::error!("Input error: {}", e);
            }
        });
        async {}
    });

    rsx!(cx,
        style { {CSS} }
        div { class: "app", 
            h1 { "Dioxus + evdev Input Overlay" }
            p { "React-like UI with Wayland-native input capture" }
        }
    )
}

const CSS: &str = r#"
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0e27; color: #00ff88; font-family: system-ui; }
.app { padding: 20px; text-align: center; }
h1 { color: #00ff88; margin-bottom: 10px; }
p { color: #88ff00; }
"#;
