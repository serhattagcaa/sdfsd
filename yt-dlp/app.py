from flask import Flask, request, jsonify, Response, send_file, abort, send_from_directory
from flask_cors import CORS
import subprocess
import re
import os
import tempfile
import datetime
from functools import wraps

app = Flask(__name__, static_folder='client')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ana sayfa route'u
@app.route('/')
def index():
    return send_from_directory('client', 'index.html')

# Statik dosyalar için route
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('client', path)

def error_handler(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'code': 'INTERNAL_ERROR'
            }), 500
    return decorated_function

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'version': '1.0.0',
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/v1/formats', methods=['POST'])
@error_handler
def get_formats():
    video_url = request.json.get('url')
    if not video_url:
        return jsonify({
            'status': 'error',
            'message': 'URL is required',
            'code': 'MISSING_URL'
        }), 400
    
    command = ["yt-dlp", "-F", video_url]
    result = subprocess.run(command, capture_output=True, text=True)
    
    if result.returncode != 0:
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch formats',
            'details': result.stderr,
            'code': 'FETCH_ERROR'
        }), 500
    
    formats = result.stdout
    mp4_formats = []
    mp3_formats = []
    
    for line in formats.splitlines():
        match = re.match(r'(\d+)\s+(\w+)\s+(.*)', line)
        if match:
            format_id, ext, details = match.groups()
            if ext == "mp4":
                mp4_formats.append({'format_id': format_id, 'details': details})
            if "audio only" in details:
                mp3_formats.append({'format_id': format_id, 'details': details})
    
    return jsonify({
        'status': 'success',
        'mp4_formats': mp4_formats,
        'mp3_formats': mp3_formats
    })

@app.route('/api/v1/download', methods=['POST'])
@error_handler
def download_video():
    try:
        data = request.json
        required_fields = ['url', 'format_id', 'type', 'title']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}',
                    'code': 'MISSING_FIELD'
                }), 400

        video_url = data['url']
        format_id = data['format_id']
        file_type = data['type']
        title = data['title']
        
        # Güvenli dosya adı oluştur
        safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).rstrip()
        if not safe_title:
            safe_title = 'video'
            
        allowed_types = ['mp3', 'mp4']
        if file_type not in allowed_types:
            return jsonify({
                'status': 'error',
                'message': f'Invalid file type. Allowed types: {", ".join(allowed_types)}',
                'code': 'INVALID_TYPE'
            }), 400
        
        # Geçici dizin oluştur
        temp_dir = tempfile.mkdtemp()
        output_file = os.path.join(temp_dir, f'{safe_title}.{file_type}')
        
        try:
            if file_type == 'mp3':
                command = [
                    "yt-dlp",
                    "-f", format_id,
                    "-x",
                    "--audio-format", "mp3",
                    "-o", output_file,
                    video_url
                ]
            else:
                command = [
                    "yt-dlp",
                    "-f", format_id,
                    "--merge-output-format", "mp4",
                    "-o", output_file,
                    video_url
                ]
                
            # Komut çalıştırma
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                raise Exception(f"Download failed: {stderr}")

            # Dosyanın var olduğunu kontrol et
            if not os.path.exists(output_file):
                raise Exception("Downloaded file not found")

            # Dosyayı send_file ile gönder
            return send_file(
                output_file,
                as_attachment=True,
                download_name=f'{safe_title}.{file_type}',
                mimetype='application/octet-stream'
            )

        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'code': 'DOWNLOAD_ERROR'
            }), 500

        finally:
            # Temizlik işlemleri
            try:
                if os.path.exists(output_file):
                    os.remove(output_file)
                if os.path.exists(temp_dir):
                    os.rmdir(temp_dir)
            except Exception as e:
                print(f"Cleanup error: {e}")

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 'INTERNAL_ERROR'
        }), 500
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error',
        'code': 'INTERNAL_ERROR'
    }), 500

if __name__ == '__main__':
    app.run(debug=True)