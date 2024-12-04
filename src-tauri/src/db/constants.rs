//constants
pub const OK_RESPONSE: &str = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n";
pub const NOT_FOUND: &str = "HTTP/1.1 404 NOT FOUND\r\n";
pub const INTERNAL_SERVER_ERROR: &str = "HTTP/1.1 500 INTERNAL SERVER ERROR\r\n";

pub const DB_URL: &str = "./db/default.db";

pub const ACCESS_CONTROL_ALLOW_ORIGIN: &str =
    "Access-Control-Allow-Origin: http://localhost:3000\r\n";
pub const ACCESS_CONTROL_ALLOW_METHODS: &str =
    "Access-Control-Allow-Methods: GET, POST, PUT, DELETE\r\n";
pub const ACCESS_CONTROL_ALLOW_HEADERS: &str = "Access-Control-Allow-Headers: Content-Type\r\n";
pub const ACCESS_CONTROL_ALLOW_CREDENTIALS: &str = "Access-Control-Allow-Credentials: true\r\n";
pub const EMPTY_LINE: &str = "\r\n";
