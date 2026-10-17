"""Local server for 夜雨城 that never lets the browser use an old copy of anything.

  python3 serve.py          then open http://localhost:5179 (or /dev.html for the tuning panel)
  python3 serve.py 8080     another port

Every response is sent with Cache-Control: no-store, and the page loads its scripts from a fresh
/v<time>/ path on each visit (see index.html), which is mapped back to the real files here.
The dev version's panel POSTs its values to /__tuning, saved as tuning.json next to this file;
accepted only from this machine.
"""

import functools
import http.server
import json
import os
import re
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def translate_path(self, path):
        return super().translate_path(re.sub(r'^/v\d+/', '/', path))

    def do_GET(self):
        for h in ('If-Modified-Since', 'If-None-Match'):  # always the whole, current file
            if h in self.headers:
                del self.headers[h]
        super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/__tuning' or self.client_address[0] not in ('127.0.0.1', '::1'):
            self.send_error(403)
            return
        length = int(self.headers.get('Content-Length') or 0)
        if not 0 < length < 200_000:
            self.send_error(400)
            return
        try:
            data = json.loads(self.rfile.read(length))
        except ValueError:
            self.send_error(400)
            return
        with open(os.path.join(self.directory, 'tuning.json'), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
        self.send_response(204)
        self.end_headers()

    def send_header(self, keyword, value):
        if keyword.lower() != 'last-modified':
            super().send_header(keyword, value)


port = int(sys.argv[1]) if len(sys.argv) > 1 else 5179
root = os.path.dirname(os.path.abspath(__file__))
print(f'夜雨城: http://localhost:{port}   (开发版 /dev.html)')
http.server.ThreadingHTTPServer(('', port), functools.partial(NoCache, directory=root)).serve_forever()
