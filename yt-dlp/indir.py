from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.serving import run_simple
from indir import app as indir_app
from sorgu import app as sorgu_app

# Uygulamaları yol ayrımıyla birleştirin
application = DispatcherMiddleware(
    sorgu_app,  # Ana uygulama, 5000 portunda çalışır.
    {
        '/indir': indir_app  # İndir uygulaması, http://localhost:5000/indir üzerinden erişilir.
    }
)

if __name__ == "__main__":
    run_simple('localhost', 5000, application, use_debugger=True, use_reloader=True)
