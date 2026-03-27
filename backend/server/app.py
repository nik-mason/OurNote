from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# Base directory for the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
ASSETS_DIR = os.path.join(BASE_DIR, 'backend', 'assets')

@app.route('/')
def index():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'html'), 'login.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'html'), 'dashboard.html')

@app.route('/frontend/<path:filename>')
def serve_frontend(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(ASSETS_DIR, filename)

import json
import tempfile
import shutil

def get_data_file(filename):
    original_path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    tmp_path = os.path.join(tempfile.gettempdir(), filename)
    
    # Check if running in Vercel or similar read-only environments
    if os.environ.get('VERCEL_ENV') or os.environ.get('VERCEL') or not os.access(os.path.dirname(original_path), os.W_OK):
        if not os.path.exists(tmp_path):
            try:
                shutil.copy2(original_path, tmp_path)
            except Exception:
                pass
        return tmp_path
    
    return original_path

import json

@app.route('/api/students')
def get_students():
    return send_from_directory(os.path.dirname(get_data_file('students.json')), 'students.json')

@app.route('/api/teacher')
def get_teacher():
    return send_from_directory(os.path.dirname(get_data_file('teacher.json')), 'teacher.json')

@app.route('/api/posts', methods=['GET'])
def get_posts():
    try:
        with open(get_data_file('posts.json'), 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/posts', methods=['POST'])
def add_post():
    try:
        from flask import request
        new_post = request.json
        posts_path = get_data_file('posts.json')
        
        with open(posts_path, 'r', encoding='utf-8') as f:
            posts = json.load(f)
        
        # Assign new ID
        new_post['id'] = max([p['id'] for p in posts], default=0) + 1
        posts.insert(0, new_post)
        
        with open(posts_path, 'w', encoding='utf-8') as f:
            json.dump(posts, f, ensure_ascii=False, indent=4)
            
        return {"success": True, "post": new_post}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/teacher/password', methods=['POST'])
def change_teacher_password():
    try:
        from flask import request
        data = request.json
        new_password = data.get('password')
        
        teacher_path = get_data_file('teacher.json')
        with open(teacher_path, 'r', encoding='utf-8') as f:
            teacher = json.load(f)
            
        teacher['password'] = new_password
        
        with open(teacher_path, 'w', encoding='utf-8') as f:
            json.dump(teacher, f, ensure_ascii=False, indent=4)
            
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        posts_path = get_data_file('posts.json')
        with open(posts_path, 'r', encoding='utf-8') as f:
            posts = json.load(f)
            
        posts = [p for p in posts if p['id'] != post_id]
        
        with open(posts_path, 'w', encoding='utf-8') as f:
            json.dump(posts, f, ensure_ascii=False, indent=4)
            
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6273)
