use bevy::prelude::*;
use crate::components::{KeyVisualizer, ColorState, InputEvent, OverlayCanvas, OverlayConfig};

pub fn setup_overlay(
    mut commands: Commands,
    config: Res<OverlayConfig>,
) {
    commands.spawn((
        OverlayCanvas,
        Node {
            width: Val::Percent(100.0),
            height: Val::Percent(100.0),
            display: Display::Flex,
            flex_direction: FlexDirection::Row,
            justify_content: JustifyContent::Center,
            align_items: AlignItems::Center,
            ..default()
        },
        BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.0)),
    ));

    let w_key = commands
        .spawn((
            KeyVisualizer {
                key_code: "W".to_string(),
                is_pressed: false,
                label: "W Key".to_string(),
            },
            ColorState::default(),
            Node {
                width: Val::Px(200.0),
                height: Val::Px(200.0),
                display: Display::Flex,
                justify_content: JustifyContent::Center,
                align_items: AlignItems::Center,
                ..default()
            },
            BackgroundColor(Color::srgb(0.2, 0.2, 0.2)),
            BorderColor(Color::srgb(0.5, 0.5, 0.5)),
        ))
        .with_children(|parent| {
            parent.spawn(
                Text::new("W".to_string())
                    .with_style(Style {
                        ..default()
                    })
                    .with_text_layout(TextLayout::new_with_alignment(
                        bevy::text::TextAlignment::Center,
                    )),
            );
        })
        .id();

    commands.insert_resource(KeyEntityRef(w_key));
}

#[derive(Resource)]
pub struct KeyEntityRef(pub Entity);

pub fn handle_input_events(
    mut events: EventReader<InputEvent>,
    mut query: Query<(&mut KeyVisualizer, &mut ColorState)>,
) {
    for event in events.read() {
        if event.key == "W" {
            for (mut vis, mut color) in &mut query {
                if vis.key_code == "W" {
                    vis.is_pressed = event.is_pressed;
                    if event.is_pressed {
                        color.current = color.pressed_color;
                    } else {
                        color.current = color.released_color;
                    }
                }
            }
        }
    }
}

pub fn update_key_visuals(
    mut query: Query<(&KeyVisualizer, &ColorState, &mut BackgroundColor)>,
) {
    for (visualizer, color_state, mut bg) in &mut query {
        bg.0 = color_state.current;
    }
}

pub fn log_input_events(mut events: EventReader<InputEvent>) {
    for event in events.read() {
        let state = if event.is_pressed { "PRESSED" } else { "released" };
        println!("[{:?}] {} {}", event.event_type, event.key, state);
    }
}
