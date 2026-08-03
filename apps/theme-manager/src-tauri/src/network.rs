use reqwest::{Response, header::CONTENT_TYPE};

pub async fn read_capped_response(
    mut response: Response,
    max_bytes: usize,
    expected_content_type: &str,
    label: &str,
) -> Result<Vec<u8>, String> {
    let content_type = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(';').next())
        .map(str::trim);
    if !content_type.is_some_and(|value| value.eq_ignore_ascii_case(expected_content_type)) {
        return Err(format!("{label} 响应 Content-Type 不受支持"));
    }

    if response
        .content_length()
        .is_some_and(|content_length| content_length > max_bytes as u64)
    {
        return Err(format!("{label} 响应超过安全字节上限"));
    }

    let capacity = response
        .content_length()
        .map(|content_length| content_length.min(max_bytes as u64) as usize)
        .unwrap_or_default();
    let mut bytes = Vec::with_capacity(capacity);
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|error| format!("无法读取{label}响应：{error}"))?
    {
        let next_length = bytes
            .len()
            .checked_add(chunk.len())
            .ok_or_else(|| format!("{label} 响应超过安全字节上限"))?;
        if next_length > max_bytes {
            return Err(format!("{label} 响应超过安全字节上限"));
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}
