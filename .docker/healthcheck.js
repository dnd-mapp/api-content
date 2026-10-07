// The HEALTHCHECK of the Docker image. It exits with 0 once GET /health/ready answers with a success status, and with 1
// when the request fails or the server is not ready. It reads PORT from process.env directly, since the server
// namespace would load NestJS and Zod on every check. An empty PORT falls back to 3000, as it does for the server.
const port = process.env.PORT || 3000;

try {
    const response = await fetch(`http://127.0.0.1:${port}/health/ready`);

    process.exit(response.ok ? 0 : 1);
} catch {
    process.exit(1);
}
