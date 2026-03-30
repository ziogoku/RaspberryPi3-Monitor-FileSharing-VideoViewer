use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::services::ServeDir;

#[derive(Serialize)]
struct Status {
    status: String,
    server: String,
    version: String,
}

#[tokio::main]
async fn main() {
    let static_files_service = ServeDir::new("public").append_index_html_on_directories(true);

    // Rotta API
    let api_router = Router::new().route("/status", get(get_status));

    // Router principale: gestisce /api e tutto il resto come file statici in /public
    let app = Router::new()
        .nest("/api", api_router)
        .fallback_service(static_files_service);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("✅ Rust Server 1.94 avviato su http://raspberry.local:3000");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_status() -> Json<Status> {
    Json(Status {
        status: "online".to_string(),
        server: "Raspberry Pi 3".to_string(),
        version: "Rust 1.94".to_string(),
    })
}
