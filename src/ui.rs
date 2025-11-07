use gtk4::prelude::*;
use gtk4::{Box, Grid, Label, Orientation};
use std::collections::HashMap;

pub struct KeyStatusWidget {
    container: Box,
    key_labels: HashMap<String, Label>,
    pressed_keys: Vec<String>,
}

impl KeyStatusWidget {
    pub fn new() -> Self {
        let vbox = Box::new(Orientation::Vertical, 5);
        vbox.add_css_class("key-grid");

        let grid = Grid::new();
        grid.set_column_spacing(5);
        grid.set_row_spacing(5);

        let keys = vec![
            ("Q", 0, 0), ("W", 1, 0), ("E", 2, 0), ("R", 3, 0),
            ("A", 0, 1), ("S", 1, 1), ("D", 2, 1), ("F", 3, 1),
            ("Z", 0, 2), ("X", 1, 2), ("C", 2, 2), ("V", 3, 2),
        ];

        let mut key_labels = HashMap::new();

        for (key, col, row) in keys {
            let label = Label::new(Some(key));
            label.add_css_class("key-button");
            label.set_size_request(40, 40);
            grid.attach(&label, col, row, 1, 1);
            key_labels.insert(key.to_string(), label);
        }

        let space_label = Label::new(Some("SPACE"));
        space_label.add_css_class("key-button");
        space_label.set_size_request(200, 40);
        grid.attach(&space_label, 0, 3, 4, 1);
        key_labels.insert("SPACE".to_string(), space_label);

        vbox.append(&grid);

        KeyStatusWidget {
            container: vbox,
            key_labels,
            pressed_keys: Vec::new(),
        }
    }

    pub fn widget(&self) -> Box {
        self.container.clone()
    }

    pub fn key_pressed(&mut self, key: &str) {
        if let Some(label) = self.key_labels.get(key) {
            label.add_css_class("active");
            if !self.pressed_keys.contains(&key.to_string()) {
                self.pressed_keys.push(key.to_string());
            }
        }
    }

    pub fn key_released(&mut self, key: &str) {
        if let Some(label) = self.key_labels.get(key) {
            label.remove_css_class("active");
            self.pressed_keys.retain(|k| k != key);
        }
    }

    pub fn get_pressed_keys(&self) -> Vec<String> {
        self.pressed_keys.clone()
    }
}
