// Standalone test for evdev + Tauri integration
// Run with: rustc test-tauri-evdev.rs && ./test-tauri-evdev

use std::fs;
use std::path::Path;

fn main() {
    println!("=== Tauri + evdev Integration Test ===\n");

    // Check input group membership
    println!("1. Checking user permissions...");
    let uid = unsafe { libc::getuid() };
    let user = if uid == 0 {
        "root".to_string()
    } else {
        format!("uid={}", uid)
    };
    println!("   Running as: {}", user);

    // Check /dev/input access
    println!("\n2. Checking /dev/input devices...");
    let devices_path = "/dev/input";
    
    if !Path::new(devices_path).exists() {
        println!("   ERROR: {} not found", devices_path);
        return;
    }

    let mut event_count = 0;
    match fs::read_dir(devices_path) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                    if filename.starts_with("event") {
                        event_count += 1;
                        match fs::metadata(&path) {
                            Ok(meta) => {
                                let perms = format!("{:o}", meta.permissions().mode() & 0o777);
                                println!("   {:?} (mode: {})", path, perms);
                            }
                            Err(e) => {
                                println!("   {:?} (ERROR: {})", path, e);
                            }
                        }
                    }
                }
            }
        }
        Err(e) => {
            println!("   ERROR reading {}: {}", devices_path, e);
        }
    }

    println!("\n   Found {} event devices", event_count);

    if event_count == 0 {
        println!("\n   WARNING: No input devices found!");
        println!("   This usually means:");
        println!("   - No hardware input devices");
        println!("   - Running in container/VM without device passthrough");
    }

    // Test opening an event device
    println!("\n3. Testing device access...");
    if event_count > 0 {
        if let Ok(entries) = fs::read_dir(devices_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                    if filename == "event0" {
                        match std::fs::File::open(&path) {
                            Ok(_) => {
                                println!("   SUCCESS: Can open {} for reading", filename);
                            }
                            Err(e) => {
                                println!("   FAILED: Cannot open {}: {}", filename, e);
                                println!("   Check: sudo usermod -aG input $USER");
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    println!("\n=== Test Complete ===");
    println!("\nNext steps:");
    println!("1. If devices show 'mode: 660' and your group includes 'input': ✓ Ready");
    println!("2. If you see 'Permission denied': Add to input group and log back in");
    println!("3. If you see 'not found': Plug in a USB device or enable device passthrough");
}
