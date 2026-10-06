"""A local HTTPS image host that stands in for a provider's CDN in the admin demo.

Serves .cache/admin-demo/www/ at https://localhost:5443/ with the ASP.NET Core development
certificate (exported by start-image-host.ps1), so the API's allow-list and fetcher treat it
like any allow-listed image origin. Local demos only.
"""
import functools
import http.server
import pathlib
import ssl

STATE = pathlib.Path(__file__).resolve().parents[3] / ".cache" / "admin-demo"

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(STATE / "www"))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 5443), handler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(str(STATE / "dev.pem"), str(STATE / "dev.key"))
server.socket = context.wrap_socket(server.socket, server_side=True)
print("serving", STATE / "www", "at https://localhost:5443/", flush=True)
server.serve_forever()
