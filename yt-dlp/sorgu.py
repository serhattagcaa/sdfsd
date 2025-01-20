from flask import Flask, request, jsonify
import subprocess
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/formats', methods=['POST'])
def get_formats():
    video_url = request.json.get('url')
    if not video_url:
        return jsonify({'error': 'URL is required'}), 400

    # Tüm formatları listelemek için yt-dlp komutunu çalıştır
    command = ["yt-dlp", "-F", video_url]
    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        return jsonify({'error': 'Failed to fetch formats', 'details': result.stderr}), 500

    # Log the error details for debugging
    print('Error details:', result.stderr)

    formats = result.stdout
    mp4_formats = []
    mp3_formats = []

    # Format satırlarını analiz et
    for line in formats.splitlines():
        # Format ID, uzantı ve diğer bilgileri ayrıştır
        match = re.match(r'(\d+)\s+(\w+)\s+(.*)', line)
        if match:
            format_id, ext, details = match.groups()
            if ext == "mp4":  # MP4 formatlarını bul
                mp4_formats.append({
                    'format_id': format_id,
                    'details': details
                })
            if "audio only" in details:  # Ses formatlarını bul
                mp3_formats.append({
                    'format_id': format_id,
                    'details': details
                })

    return jsonify({
        'mp4_formats': mp4_formats,
        'mp3_formats': mp3_formats
    })

if __name__ == '__main__':
    app.run(debug=True)
