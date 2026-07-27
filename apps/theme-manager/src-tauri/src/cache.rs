use std::{
    fs,
    io::Write,
    path::Path,
    sync::atomic::{AtomicU64, Ordering},
};

static TEMP_SEQUENCE: AtomicU64 = AtomicU64::new(0);

pub fn publish_new_file(destination: &Path, bytes: &[u8], label: &str) -> Result<bool, String> {
    let parent = destination
        .parent()
        .ok_or_else(|| format!("{label}路径无效"))?;
    fs::create_dir_all(parent).map_err(|error| format!("无法创建{label}目录：{error}"))?;
    let file_name = destination
        .file_name()
        .ok_or_else(|| format!("{label}路径无效"))?
        .to_string_lossy();
    let temporary = parent.join(format!(
        ".{file_name}.{}.{}.tmp",
        std::process::id(),
        TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed),
    ));
    let write_result = (|| {
        let mut candidate = fs::File::create(&temporary)
            .map_err(|error| format!("无法写入{label}候选文件：{error}"))?;
        candidate
            .write_all(bytes)
            .map_err(|error| format!("无法写入{label}候选文件：{error}"))?;
        candidate
            .sync_all()
            .map_err(|error| format!("无法同步{label}候选文件：{error}"))
    })();
    if let Err(error) = write_result {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }

    // A hard link only succeeds when the destination does not exist. This gives
    // us an atomic, never-overwrite publication on every supported platform,
    // leaving a valid last-known-good cache untouched if a concurrent writer wins.
    match fs::hard_link(&temporary, destination) {
        Ok(()) => {
            let _ = fs::remove_file(&temporary);
            Ok(true)
        }
        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
            let _ = fs::remove_file(&temporary);
            Ok(false)
        }
        Err(error) => {
            let _ = fs::remove_file(&temporary);
            Err(format!("无法原子发布{label}候选文件：{error}"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn publishing_a_candidate_never_replaces_an_existing_file() {
        let directory = std::env::temp_dir().join(format!(
            "awesome-codex-theme-cache-test-{}-{}",
            std::process::id(),
            TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed),
        ));
        let destination = directory.join("catalog-cache.json");

        assert!(
            publish_new_file(&destination, b"last-known-good", "测试缓存")
                .expect("first candidate should publish")
        );
        assert!(
            !publish_new_file(&destination, b"replacement", "测试缓存")
                .expect("existing candidate should be retained")
        );
        assert_eq!(
            fs::read(&destination).expect("existing candidate should remain readable"),
            b"last-known-good",
        );

        fs::remove_dir_all(&directory).expect("test cache directory should be removable");
    }
}
