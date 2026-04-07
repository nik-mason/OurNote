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
import json
import tempfile
import shutil
import os
from supabase import create_client, Client

# Advanced Auto-detection for various Vercel/Supabase Integration name patterns
SUPABASE_URL = ""
SUPABASE_KEY = ""

for env_key in os.environ:
    if env_key.endswith('_SUPABASE_URL'):
        SUPABASE_URL = os.environ[env_key].strip()
        break
if not SUPABASE_URL:
    SUPABASE_URL = (os.environ.get('SUPABASE_URL') or os.environ.get('SUPABASE_REST_API_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or "").strip()

for env_key in os.environ:
    if env_key.endswith('_SUPABASE_ANON_KEY') or env_key.endswith('_SUPABASE_SERVICE_ROLE_KEY'):
        SUPABASE_KEY = os.environ[env_key].strip()
        # Prioritize Service Role key if it contains the word 'SERVICE'
        if 'SERVICE' in env_key: break
if not SUPABASE_KEY:
    SUPABASE_KEY = (os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY') or os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') or "").strip()

def get_db():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL or SUPABASE_KEY environment variables are missing from Vercel.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/api/status')
def get_status():
    status = {
        "supabase_configured": bool(SUPABASE_URL and SUPABASE_KEY),
        "url_preview": (SUPABASE_URL[:10] + "...") if SUPABASE_URL else "None",
        "url_is_proper": bool(SUPABASE_URL and SUPABASE_URL.startswith('http')),
        "db_connection": False,
        "error_msg": None,
        "tables_found": [],
        "env": os.environ.get('VERCEL_ENV', 'local')
    }
    
    if not status["supabase_configured"]:
        status["error_msg"] = "Supabase env vars missing. Ensure SUPABASE_URL and SUPABASE_KEY are in Vercel settings."
        return status
        
    try:
        db = get_db()
        # Check if we can reach the table
        res = db.table('app_state').select('id').limit(1).execute()
        status["db_connection"] = True
        
        # Get list of keys
        res2 = db.table('app_state').select('id', 'data').execute()
        status["tables_found"] = [r['id'] for r in res2.data]
        
    except Exception as e:
        import traceback
        status["error_msg"] = f"Runtime Error: {str(e)}"
        status["trace"] = traceback.format_exc().split('\n')[-3:]
        
    return status

def pull_data(filename):
    name = filename.split('.')[0]
    db = get_db()
    if db:
        try:
            res = db.table('app_state').select('data').eq('id', name).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]['data']
        except: pass
    
    # Fallback/Seed
    path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # If we have DB but no data, initialize it!
        if db: push_data(filename, data)
        return data

def push_data(filename, data):
    name = filename.split('.')[0]
    db = get_db()
    if db:
        try:
            db.table('app_state').upsert({"id": name, "data": data}).execute()
        except: pass
    
    # Still write to local file for dev safety
    path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except: pass

import json

@app.route('/api/students', methods=['GET'])
def get_students():
    return pull_data('students.json')

@app.route('/api/teacher', methods=['GET'])
def get_teacher():
    return pull_data('teacher.json')

@app.route('/api/posts', methods=['GET'])
def get_posts():
    return pull_data('posts.json')

import time

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        cats = pull_data('categories.json')
        if cats is None: cats = []
        
        # Room cleaning logic - handle with care
        to_filter = ['ㅅㄷㄴㅅ', 'ㅅㄷㄴㅅ2', 'ㅎㅇ']
        filtered = [c for c in cats if isinstance(c, dict) and c.get('name') not in to_filter]
        
        if len(filtered) != len(cats):
            push_data('categories.json', filtered)
        return filtered
    except Exception as e:
        print(f"Fetch Error: {e}")
        return [], 200 # Return empty list Instead of 500 to keep UI alive

@app.route('/api/categories', methods=['POST'])
def add_category():
    try:
        from flask import request
        data = request.json
        if not data or 'name' not in data:
            return {"error": "Invalid data"}, 400
            
        cats = pull_data('categories.json') or []
        cat_id = data['name'].replace(' ', '_').lower()
        
        # Avoid duplicate IDs
        existing_ids = [c.get('id') for c in cats if isinstance(c, dict)]
        final_id = cat_id
        if final_id in existing_ids:
            final_id = f"{cat_id}_{int(time.time())}"
            
        new_row = {
            "id": final_id,
            "name": data['name'],
            "icon": data.get('icon', 'forum')
        }
        cats.append(new_row)
        push_data('categories.json', cats)
        return {"success": True, "category": new_row}
    except Exception as e:
        print(f"Add Error: {e}")
        return {"error": str(e)}, 500

@app.route('/api/categories/<string:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    try:
        cats = pull_data('categories.json') or []
        # Support both 'id' and 'name' for safety
        new_cats = [c for c in cats if isinstance(c, dict) and c.get('id') != cat_id and c.get('name') != cat_id]
        
        if len(new_cats) == len(cats):
            return {"error": "Category not found"}, 404
            
        push_data('categories.json', new_cats)
        return {"success": True}
    except Exception as e:
        print(f"Delete Error: {e}")
        return {"error": str(e)}, 500

@app.route('/api/upload', methods=['POST'])
def upload_image():
    try:
        from flask import request
        if 'image' not in request.files:
            return {"success": False, "error": "No image file provided"}, 400
            
        file = request.files['image']
        if file.filename == '':
            return {"success": False, "error": "Empty filename"}, 400
            
        db = get_db()
        if not db:
            return {"success": False, "error": "Supabase Connection Missing"}, 500
            
        file_bytes = file.read()
        file_ext = file.filename.split('.')[-1]
        filename = f"post_{int(time.time())}.{file_ext}"
        
        # Handle MimeType correctly
        mimetype = getattr(file, 'mimetype', None) or getattr(file, 'content_type', 'image/jpeg')
        
        # [IMPORTANT] Ensure 'images' bucket is created in Supabase Dashboard -> Storage
        # and set to 'Public'
        try:
            storage = db.storage.from_("images")
            storage.upload(filename, file_bytes, {"content-type": mimetype})
            
            # Use direct standardized URL to avoid 404/mapping issues 
            # Format: [SUPABASE_URL]/storage/v1/object/public/[BUCKET]/[FILENAME]
            clean_url = f"{SUPABASE_URL}/storage/v1/object/public/images/{filename}"
            
            # Cache-busting
            final_url = f"{clean_url}?t={int(time.time())}"
            return {"success": True, "url": final_url}
        except Exception as storage_err:
            return {"success": False, "error": f"Storage Error: {str(storage_err)}. Please ensure 'images' bucket exists and is Public."}, 500
            
    except Exception as e:
        return {"success": False, "error": str(e)}, 500

@app.route('/api/posts', methods=['POST'])
def add_post():
    try:
        from flask import request
        new_post = request.json
        posts = pull_data('posts.json')
        new_post['id'] = max([p['id'] for p in posts], default=0) + 1
        new_post['likes'] = []
        new_post['comments'] = []
        posts.insert(0, new_post)
        push_data('posts.json', posts)
        return {"success": True, "post": new_post}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    try:
        from flask import request
        data = request.json
        user_id = str(data.get('user_id', ''))
        posts = pull_data('posts.json')
        for p in posts:
            if p['id'] == post_id:
                likes = p.get('likes', [])
                if user_id in likes:
                    likes.remove(user_id)
                    liked = False
                else:
                    likes.append(user_id)
                    liked = True
                p['likes'] = likes
                push_data('posts.json', posts)
                return {"success": True, "liked": liked, "count": len(likes)}
        return {"error": "Post not found"}, 404
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    try:
        from flask import request
        data = request.json
        posts = pull_data('posts.json')
        for p in posts:
            if p['id'] == post_id:
                comments = p.get('comments', [])
                comment = {
                    "author": data.get('author', '익명'),
                    "text": data.get('text', ''),
                    "date": data.get('date', '')
                }
                comments.append(comment)
                p['comments'] = comments
                push_data('posts.json', posts)
                return {"success": True, "comment": comment, "count": len(comments)}
        return {"error": "Post not found"}, 404
    except Exception as e:
        return {"error": str(e)}, 500


@app.route('/api/teacher/password', methods=['POST'])
def change_teacher_password():
    try:
        from flask import request
        data = request.json
        new_password = data.get('password')
        teacher = pull_data('teacher.json')
        teacher['password'] = new_password
        push_data('teacher.json', teacher)
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/settings', methods=['POST'])
def update_settings():
    try:
        from flask import request
        data = request.json
        role = data.get('role')
        settings = data.get('settings')
        if role == 'teacher':
            user_data = pull_data('teacher.json')
            user_data['settings'] = settings
            push_data('teacher.json', user_data)
        elif role == 'student':
            student_id = data.get('id')
            students = pull_data('students.json')
            for s in students:
                if str(s.get('number', '')) == str(student_id) or str(s.get('id', '')) == str(student_id):
                    s['settings'] = settings
                    break
            push_data('students.json', students)
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/homework', methods=['GET'])
def get_homework():
    return pull_data('homework.json')

@app.route('/api/homework', methods=['POST'])
def add_homework():
    try:
        from flask import request
        data = request.json
        tasks_texts = data.get('tasks', [])
        new_hw = {
            "id": 0,
            "title": data.get('title'),
            "date": data.get('date'),
            "author": data.get('author'),
            "target_id": data.get('target_id', 'all'),
            "tasks": [{"id": i+1, "text": t, "completed_ids": []} for i, t in enumerate(tasks_texts)]
        }
        hws = pull_data('homework.json')
        new_hw['id'] = max([h['id'] for h in hws], default=0) + 1
        hws.insert(0, new_hw)
        push_data('homework.json', hws)
        return {"success": True, "homework": new_hw}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/homework/toggle', methods=['POST'])
def toggle_homework():
    try:
        from flask import request
        data = request.json
        hw_id = data.get('id')
        task_id = data.get('task_id')
        student_id = data.get('student_id')
        hws = pull_data('homework.json')
        for h in hws:
            if h['id'] == hw_id:
                for task in h.get('tasks', []):
                    if task['id'] == int(task_id):
                        task_cids = [str(i) for i in task.get('completed_ids', [])]
                        if str(student_id) in task_cids:
                            task['completed_ids'] = [str(i) for i in task_cids if str(i) != str(student_id)]
                        else:
                            if 'completed_ids' not in task: task['completed_ids'] = []
                            task['completed_ids'].append(str(student_id))
                        is_completed = str(student_id) in [str(i) for i in task.get('completed_ids', [])]
                        break
                break
        push_data('homework.json', hws)
        return {"success": True, "completed": is_completed}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        posts = pull_data('posts.json')
        posts = [p for p in posts if p['id'] != post_id]
        push_data('posts.json', posts)
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/homework/<int:hw_id>', methods=['DELETE'])
def delete_homework(hw_id):
    try:
        hws = pull_data('homework.json')
        hws = [h for h in hws if h['id'] != hw_id]
        push_data('homework.json', hws)
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/categories/<cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    try:
        cats = pull_data('categories.json')
        cats = [c for c in cats if c['id'] != cat_id]
        push_data('categories.json', cats)
        # Optional: Delete posts in this category too
        posts = pull_data('posts.json')
        posts = [p for p in posts if p['category'] != cat_id]
        push_data('posts.json', posts)
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6273)
