use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use crate::pty::PtyManager;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone)]
struct ApiState {
    pty: Arc<PtyManager>,
}

#[derive(Serialize)]
struct PaneInfo {
    id: String,
}

#[derive(Deserialize)]
struct InputBody {
    text: String,
}

#[derive(Serialize)]
struct OutputResponse {
    pane_id: String,
    output: String,
}

async fn list_panes(State(state): State<ApiState>) -> Json<Vec<PaneInfo>> {
    let ids = state.pty.get_pane_ids();
    Json(ids.into_iter().map(|id| PaneInfo { id }).collect())
}

async fn send_input(
    State(state): State<ApiState>,
    Path(pane_id): Path<String>,
    Json(body): Json<InputBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    state
        .pty
        .write_input(&pane_id, body.text.as_bytes())
        .map_err(|e| (StatusCode::BAD_REQUEST, e))?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

async fn get_output(
    State(state): State<ApiState>,
    Path(pane_id): Path<String>,
) -> Json<OutputResponse> {
    let output = state.pty.drain_output(&pane_id);
    Json(OutputResponse { pane_id, output })
}

pub async fn serve(pty: Arc<PtyManager>) {
    let state = ApiState { pty };
    let app = Router::new()
        .route("/panes", get(list_panes))
        .route("/panes/:id/input", post(send_input))
        .route("/panes/:id/output", get(get_output))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:7777")
        .await
        .expect("Yeonhoo API: failed to bind port 7777");
    tracing::info!("Yeonhoo MCP API listening on 127.0.0.1:7777");
    axum::serve(listener, app).await.expect("Yeonhoo API server crashed");
}
