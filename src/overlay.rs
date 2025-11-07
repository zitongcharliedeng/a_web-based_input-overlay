use raylib::prelude::*;

pub fn render(d: &mut RaylibDrawHandle, w_key_pressed: bool, fps: i32) {
    // Clear with transparent background
    d.clear_background(Color::new(0, 0, 0, 0));

    // Define W key visualization position and size
    let key_x = 100;
    let key_y = 900;
    let key_width = 80;
    let key_height = 80;

    // Choose color based on key state
    let key_color = if w_key_pressed {
        Color::new(0, 255, 0, 255) // Green when pressed
    } else {
        Color::new(100, 100, 100, 180) // Gray when idle
    };

    // Draw W key rectangle
    d.draw_rectangle(key_x, key_y, key_width, key_height, key_color);

    // Draw border
    d.draw_rectangle_lines(key_x, key_y, key_width, key_height, Color::WHITE);

    // Draw "W" label
    let label = "W";
    let font_size = 40;
    let text_width = raylib::text::measure_text(label, font_size);
    let text_x = key_x + (key_width - text_width) / 2;
    let text_y = key_y + (key_height - font_size) / 2;
    d.draw_text(label, text_x, text_y, font_size, Color::WHITE);

    // Draw FPS counter (top-left corner)
    let fps_text = format!("FPS: {}", fps);
    d.draw_text(&fps_text, 10, 10, 20, Color::LIME);

    // Draw status text
    let status = if w_key_pressed {
        "W Key: PRESSED"
    } else {
        "W Key: Idle"
    };
    d.draw_text(status, 10, 40, 20, Color::WHITE);

    // Draw instructions
    d.draw_text("Press W to test (works unfocused)", 10, 70, 16, Color::LIGHTGRAY);
    d.draw_text("Press ESC to exit", 10, 95, 16, Color::LIGHTGRAY);
}
