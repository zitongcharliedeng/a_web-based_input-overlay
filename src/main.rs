mod input;
mod ui;

use anyhow::Result;
use glib::clone;
use gtk4::prelude::*;
use gtk4::{glib, Application, ApplicationWindow, Box, Label, Orientation};
use gtk4_layer_shell::{KeyboardMode, Layer, LayerShell};
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{error, info};

const APP_ID: &str = "org.example.InputOverlay";

fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("info".parse()?),
        )
        .init();

    info!("Starting input overlay GTK4 + layer-shell demo");

    let app = Application::builder()
        .application_id(APP_ID)
        .build();

    app.connect_activate(build_ui);

    let status = app.run();
    std::process::exit(status.value());
}

fn build_ui(app: &Application) {
    info!("Building GTK4 UI with layer-shell");

    let window = ApplicationWindow::builder()
        .application(app)
        .title("Input Overlay")
        .default_width(400)
        .default_height(300)
        .decorated(false)
        .build();

    window.init_layer_shell();
    window.set_layer(Layer::Overlay);
    window.set_namespace("input-overlay");
    window.set_keyboard_mode(KeyboardMode::Exclusive);

    window.set_anchor(gtk4_layer_shell::Edge::Top, true);
    window.set_anchor(gtk4_layer_shell::Edge::Bottom, true);
    window.set_anchor(gtk4_layer_shell::Edge::Left, true);
    window.set_anchor(gtk4_layer_shell::Edge::Right, true);

    window.set_exclusive_zone(-1);

    let vbox = Box::new(Orientation::Vertical, 10);
    vbox.set_margin_top(20);
    vbox.set_margin_start(20);
    vbox.set_margin_end(20);
    vbox.set_margin_bottom(20);

    let title = Label::new(Some("Input Overlay (GTK4 + Layer-Shell)"));
    title.add_css_class("title");
    vbox.append(&title);

    let key_status = Rc::new(RefCell::new(ui::KeyStatusWidget::new()));
    vbox.append(&key_status.borrow().widget());

    let mouse_label = Label::new(Some("Mouse: --"));
    mouse_label.add_css_class("mono");
    vbox.append(&mouse_label);

    let gamepad_label = Label::new(Some("Gamepad: --"));
    gamepad_label.add_css_class("mono");
    vbox.append(&gamepad_label);

    window.set_child(Some(&vbox));

    setup_css();

    let (tx, mut rx) = mpsc::channel(100);
    let tx_arc = Arc::new(tokio::sync::Mutex::new(tx));

    {
        let tx = Arc::clone(&tx_arc);
        std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            rt.block_on(async {
                if let Err(e) = input::capture_input(tx).await {
                    error!("Input capture error: {}", e);
                }
            });
        });
    }

    glib::spawn_future_local(
        clone!(@strong mouse_label, @strong gamepad_label, @strong key_status => async move {
            while let Some(event) = rx.recv().await {
                use input::InputEvent;
                match event {
                    InputEvent::KeyPress(key) => {
                        info!("Key pressed: {}", key);
                        key_status.borrow_mut().key_pressed(&key);
                    }
                    InputEvent::KeyRelease(key) => {
                        info!("Key released: {}", key);
                        key_status.borrow_mut().key_released(&key);
                    }
                    InputEvent::MouseMove { x, y } => {
                        mouse_label.set_text(&format!("Mouse: ({}, {})", x, y));
                    }
                    InputEvent::GamepadAxis { axis, value } => {
                        gamepad_label.set_text(&format!("Gamepad: {} = {:.2}", axis, value));
                    }
                    _ => {}
                }
            }
        }),
    );

    window.present();

    info!("UI initialized and ready");
}

fn setup_css() {
    let provider = gtk4::CssProvider::new();
    provider.load_from_data(
        r#"
        window {
            background-color: rgba(0, 0, 0, 0.7);
            color: #ffffff;
        }

        .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .key-grid {
            background-color: rgba(30, 30, 30, 0.9);
            border-radius: 5px;
            padding: 10px;
        }

        .key-button {
            min-width: 40px;
            min-height: 40px;
            font-weight: bold;
            background-color: rgba(60, 60, 60, 0.8);
            border-radius: 3px;
            color: #ffffff;
        }

        .key-button:active,
        .key-button.active {
            background-color: #00ff00;
            color: #000000;
        }

        .mono {
            font-family: monospace;
            font-size: 11px;
        }
        "#,
    );

    gtk4::style_context_add_provider_for_display(
        &gdk4::Display::default().unwrap(),
        &provider,
        gtk4::STYLE_PROVIDER_PRIORITY_APPLICATION,
    );
}

use gtk4::gdk4;
