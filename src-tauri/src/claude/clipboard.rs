#[cfg(target_os = "windows")]
mod win32 {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    const CF_HDROP: u32 = 15;
    const CF_UNICODETEXT: u32 = 13;

    #[link(name = "user32")]
    extern "system" {
        fn OpenClipboard(hwnd: *mut std::ffi::c_void) -> i32;
        fn CloseClipboard() -> i32;
        fn IsClipboardFormatAvailable(format: u32) -> i32;
        fn GetClipboardData(format: u32) -> *mut std::ffi::c_void;
    }

    #[link(name = "shell32")]
    extern "system" {
        fn DragQueryFileW(
            hdrop: *mut std::ffi::c_void,
            ifile: u32,
            lpszfile: *mut u16,
            cch: u32,
        ) -> u32;
    }

    #[link(name = "kernel32")]
    extern "system" {
        fn GlobalLock(hmem: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
        fn GlobalUnlock(hmem: *mut std::ffi::c_void) -> i32;
    }

    /// Read clipboard: returns (files, text).
    /// files = file paths from CF_HDROP, text = unicode text from CF_UNICODETEXT.
    pub fn read_clipboard() -> (Vec<String>, Option<String>) {
        unsafe {
            if OpenClipboard(std::ptr::null_mut()) == 0 {
                return (Vec::new(), None);
            }

            let files = read_files();
            let text = if files.is_empty() { read_text() } else { None };

            CloseClipboard();
            (files, text)
        }
    }

    unsafe fn read_files() -> Vec<String> {
        if IsClipboardFormatAvailable(CF_HDROP) == 0 {
            return Vec::new();
        }

        let hdrop = GetClipboardData(CF_HDROP);
        if hdrop.is_null() {
            return Vec::new();
        }

        let count = DragQueryFileW(hdrop, 0xFFFFFFFF, std::ptr::null_mut(), 0);
        let mut files = Vec::with_capacity(count as usize);

        for i in 0..count {
            let len = DragQueryFileW(hdrop, i, std::ptr::null_mut(), 0);
            let mut buf: Vec<u16> = vec![0u16; (len + 1) as usize];
            DragQueryFileW(hdrop, i, buf.as_mut_ptr(), len + 1);

            let path = OsString::from_wide(&buf[..len as usize]);
            if let Some(s) = path.to_str() {
                files.push(s.to_string());
            }
        }

        files
    }

    unsafe fn read_text() -> Option<String> {
        if IsClipboardFormatAvailable(CF_UNICODETEXT) == 0 {
            return None;
        }

        let hmem = GetClipboardData(CF_UNICODETEXT);
        if hmem.is_null() {
            return None;
        }

        let ptr = GlobalLock(hmem) as *const u16;
        if ptr.is_null() {
            return None;
        }

        // Find null terminator
        let mut len = 0;
        while *ptr.add(len) != 0 {
            len += 1;
        }

        let slice = std::slice::from_raw_parts(ptr, len);
        let text = String::from_utf16_lossy(slice);
        GlobalUnlock(hmem);

        Some(text)
    }
}

/// Unified clipboard read: files first, then text fallback.
/// Returns (files: Vec<String>, text: Option<String>)
pub fn get_clipboard_files() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        let (files, _) = win32::read_clipboard();
        files
    }
    #[cfg(not(target_os = "windows"))]
    {
        Vec::new()
    }
}

/// Read text from clipboard
pub fn get_clipboard_text() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        let (files, text) = win32::read_clipboard();
        if !files.is_empty() {
            return None; // files take priority
        }
        text
    }
    #[cfg(not(target_os = "windows"))]
    {
        None
    }
}
