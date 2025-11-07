use axum::{body::Body, routing::get, Server};
use evdev::{Device, EventStream};
use http::Response;
use rdev::{listen, Event};
use serde_json::json;
use socketio_server::{
    config::SocketIoConfig, layer::SocketIoLayer, ns::Namespace, socket::Socket,
};
use std::{
    env, fs,
    sync::{Arc, Mutex},
    time::Duration,
};

extern crate xkbcommon;
use xkbcommon::xkb;

use clap::Parser;

/// Simple program to greet a person
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// layout identifier following the ISO 639-1
    /// You can verify your layout using `localectl list-x11-keymap-layouts`
    /// By default I assign "es"
    #[arg(short, long, default_value_t = String::from("es"))]
    layout: String,

    /// model - you can verify the options using `localectl list-x11-keymap-models`
    /// by default pc105
    #[arg(short, long, default_value_t = String::from("pc105"))]
    model: String,

    /// variant - by default empty
    #[arg(short, long, default_value_t = String::from(""))]
    variant: String,

    /// number of the event of the keyboard
    #[arg(short, long, default_value_t = 3)]
    event_keyboard_number: u8,

    /// number of the event of the mouse
    #[arg(short = 'c', long, default_value_t = 7)]
    event_mouse_number: u8
}

// evdev constants:
const KEYCODE_OFFSET: u16 = 8;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();    

    println!("Starting application...");

    // Create client list.
    let clients = Arc::new(Mutex::new(Vec::<Arc<Socket>>::new()));
    let clients_clone = clients.clone();
    let context = xkb::Context::new(xkb::CONTEXT_NO_FLAGS);

    let keymap = xkb::Keymap::new_from_names(
        &context,
        "",                                          // rules
        &args.model,                                 // model
        &args.layout,                                // layout
        &args.variant,                               // variant
        None,                                        // options
        xkb::COMPILE_NO_FLAGS,
    )
    .unwrap();

    let state = xkb::State::new(&keymap);
    let keyboard_device = Device::open(format!("/dev/input/event{}", args.event_keyboard_number)).unwrap();
    let mouse_device = evdev::Device::open(format!("/dev/input/event{}", args.event_mouse_number)).unwrap();

    let Ok(mut keyboard_events) = keyboard_device.into_event_stream() else {
        println!("Somethings goes bad");
        return Ok(());
    };

    let Ok(mut mouse_events) = mouse_device.into_event_stream() else {
        println!("Somethings goes bad");
        return Ok(());
    };

    // Create Socket.IO server.
    let config = SocketIoConfig::builder()
        .ping_interval(Duration::from_secs(5))
        .ping_timeout(Duration::from_secs(5))
        .max_payload(1e6 as u64)
        .build();

    let ns_handler = Namespace::builder()
        .add("/", move |socket| {
            let clients = clients_clone.clone();
            async move {
                clients.lock().unwrap().push(socket.clone());
            }
        })
        .build();

    // Create HTTP service.
    let app = axum::Router::new()
        .route(
            "/",
            get(move || async {
                let html = include_str!("../public/index.html");
                Response::new(Body::from(html))
            }),
        )
        .route(
            "/socket-io.js",
            get(move || async {
                let js = include_str!("../public/socket-io.js");
                js
            }),
        )
        .route(
            "/config.json",
            get(move || async {
                // Load configuration.
                let config_file = env::current_dir().unwrap().join("config.json");

                if config_file.exists() {
                    return fs::read_to_string(config_file).unwrap();
                } else {
                    let config = include_str!("../public/default_config.json").to_string();
                    fs::write(config_file, config.clone()).unwrap();
                    return config;
                }
            }),
        )
        .layer(SocketIoLayer::from_config(config, ns_handler));

    tokio::task::spawn(async move {
        let addr = "127.0.0.1:41770";
        println!("Listening widget on http://{}/", addr);

        Server::bind(&addr.parse().unwrap())
            .serve(app.into_make_service())
            .await
            .unwrap();
    });

    loop {
            let clients_lock = clients.lock().unwrap();
            let socket = clients_lock.first();

            tokio::select! {
                Ok(mouse_event) = mouse_events.next_event() => {
                    println!("{mouse_event:?}");
                    if let evdev::InputEventKind::Key(keycode) = mouse_event.kind() {
                        println!("{:?}", mouse_event);
                        println!("{keycode:?}");
                        println!("Mouse keysym: {:?}", keycode);
                        let event_type = if mouse_event.value() >= 1 { "mouse_pressed" } else { "mouse_released"};

                        if let Some(socket) = socket {
                            socket.emit("input", json!({"event_type": event_type, "key": keycode })).unwrap();
                        }
                    }
                },
                Ok(keyboard_event) = keyboard_events.next_event() => {
                    println!("{:?}", keyboard_event);
                    if let evdev::InputEventKind::Key(keycode) = keyboard_event.kind() {
                        let keycode = (keycode.0 + KEYCODE_OFFSET).into();
                        let keysym = state.key_get_one_sym(keycode);
                        let letter = xkb::keysym_get_name(keysym);
                        println!("Keyboard keysym: {}", xkb::keysym_get_name(keysym));
                        let event_type = if keyboard_event.value() >= 1 { "key_pressed" } else { "key_released"};
                        if let Some(socket) = socket {
                            socket.emit("input", json!({"event_type": event_type, "key": letter })).unwrap();
                        }
                    }
                },
                else => {
                    println!("Error or end of event stream");
                }
            }
        }
}
