from flask import Flask, send_from_directory
import os
import json
import time

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
    # Try frontend assets first, then backend assets
    for d in [FRONTEND_DIR, os.path.join(BASE_DIR, 'backend')]:
        path = os.path.join(d, 'assets')
        if os.path.exists(os.path.join(path, filename)):
            return send_from_directory(path, filename)
    return send_from_directory(ASSETS_DIR, filename)

@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory(FRONTEND_DIR, 'manifest.json')

@app.route('/favicon.ico')
def serve_favicon():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'assets'), 'logo.png')

from supabase import create_client, Client

# Robust Supabase Configuration Detection
def get_supabase_envs():
    url = (os.environ.get('SUPABASE_URL') or os.environ.get('SUPABASE_REST_API_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or "").strip()
    key = (os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY') or os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') or "").strip()
    
    # Fallback to scanning all env keys if not found (Vercel Integration sometimes uses suffixes)
    if not url or not key:
        for k, v in os.environ.items():
            if k.endswith('_SUPABASE_URL'): url = v.strip()
            if k.endswith('_SUPABASE_ANON_KEY') or k.endswith('_SUPABASE_SERVICE_ROLE_KEY'): key = v.strip()
    
    return url, key

# Initialize global holders but use get_db for live checks
SUPABASE_URL, SUPABASE_KEY = get_supabase_envs()

def get_db():
    from supabase import create_client, Client
    url, key = get_supabase_envs() # Re-verify inside function for safety
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except: return None

def pull_data(filename):
    name = filename.split('.')[0]
    db = get_db()
    if db:
        try:
            res = db.table('app_state').select('data').eq('id', name).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]['data']
        except: pass
    
    path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        if db: push_data(filename, data)
        return data

def push_data(filename, data):
    name = filename.split('.')[0]
    db = get_db()
    if db:
        try:
            db.table('app_state').upsert({"id": name, "data": data}).execute()
        except: pass
    
    path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except: pass

@app.route('/api/students', methods=['GET'])
def get_students():
    # 학생 데이터는 항상 로컬 JSON 파일에서 직접 읽어서 반환
    path = os.path.join(BASE_DIR, 'backend', 'data', 'students.json')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/teacher', methods=['GET'])
def get_teacher():
    return pull_data('teacher.json')

@app.route('/api/posts', methods=['GET'])
def get_posts():
    return pull_data('posts.json')

@app.route('/api/rules', methods=['GET'])
def get_rules():
    return pull_data('rules.json')

@app.route('/api/rules', methods=['POST'])
def update_rules():
    from flask import request
    data = request.json
    if not data or 'rules' not in data:
        return {"error": "Invalid data"}, 400
    push_data('rules.json', data)
    return {"success": True}

@app.route('/api/categories', methods=['GET'])
def get_categories():
    cats = pull_data('categories.json') or []
    # Simple naming filter (no risky auto-push)
    return [c for c in cats if c.get('name') not in ['ㅅㄷㄴㅅ', 'ㅅㄷㄴㅅ2', 'ㅎㅇ']]

@app.route('/api/categories', methods=['POST'])
def add_category():
    try:
        from flask import request
        data = request.json
        if not data or 'name' not in data:
            return {"error": "Invalid data"}, 400
            
        cats = pull_data('categories.json') or []
        # Create unique ID
        cat_id = data['name'].replace(' ', '_').lower() + f"_{int(time.time())}"
        
        new_row = {
            "id": cat_id,
            "name": data['name'],
            "icon": data.get('icon', 'forum')
        }
        cats.append(new_row)
        push_data('categories.json', cats)
        return {"success": True, "category": new_row}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/categories/<string:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    try:
        import urllib.parse
        cat_id = urllib.parse.unquote(cat_id)
        
        cats = pull_data('categories.json') or []
        # Filter out the category
        new_cats = [c for c in cats if isinstance(c, dict) and c.get('id') != cat_id and c.get('name') != cat_id]
        
        if len(new_cats) == len(cats):
            return {"error": "Category not found"}, 404
            
        push_data('categories.json', new_cats)
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/posts', methods=['POST'])
def add_post():
    from flask import request
    new_post = request.json
    posts = pull_data('posts.json')
    new_post['id'] = max([p['id'] for p in posts], default=0) + 1
    new_post['date'] = time.strftime('%Y-%m-%d %H:%M')
    new_post['likes'] = []
    new_post['comments'] = []
    posts.append(new_post)
    push_data('posts.json', posts)
    return {"success": True}

@app.route('/api/homework', methods=['GET'])
def get_homework():
    return pull_data('homework.json')

@app.route('/api/homework', methods=['POST'])
def add_homework():
    from flask import request
    new_hw = request.json
    hws = pull_data('homework.json') or []
    new_hw['id'] = int(time.time())
    new_hw['date'] = time.strftime('%Y-%m-%d')
    # assigned_students should be a list of student IDs
    if 'assigned_students' not in new_hw:
        new_hw['assigned_students'] = [new_hw.get('student_id', 'all')]
    
    # Initialize completions per student: { student_id: [completion_bool, ...] }
    tasks_count = len(new_hw.get('tasks', []))
    new_hw['progress'] = { sid: [False] * tasks_count for sid in new_hw['assigned_students'] }
    
    hws.append(new_hw)
    push_data('homework.json', hws)
    return {"success": True}

@app.route('/api/homework/<int:hw_id>/task', methods=['POST'])
def update_homework_task(hw_id):
    from flask import request
    data = request.json
    student_id = data.get('student_id')
    task_idx = data.get('task_index')
    is_completed = data.get('completed')
    
    hws = pull_data('homework.json') or []
    for hw in hws:
        if hw['id'] == hw_id:
            if 'progress' not in hw: hw['progress'] = {}
            if student_id not in hw['progress']:
                # Fallback or initialize if student was added later
                tasks_count = len(hw.get('tasks', []))
                hw['progress'][student_id] = [False] * tasks_count
            
            if 0 <= task_idx < len(hw['progress'][student_id]):
                hw['progress'][student_id][task_idx] = is_completed
                push_data('homework.json', hws)
                return {"success": True}
    return {"error": "Not found"}, 404

@app.route('/api/homework/<int:hw_id>', methods=['DELETE'])
def delete_homework(hw_id):
    hws = pull_data('homework.json') or []
    new_hws = [h for h in hws if h['id'] != hw_id]
    if len(new_hws) == len(hws):
        return {"error": "Homework not found"}, 404
    push_data('homework.json', new_hws)
    return {"success": True}

@app.route('/api/students/pin', methods=['POST'])
def update_student_pin():
    from flask import request
    data = request.json
    sid = data.get('student_id')
    new_pin = data.get('new_pin')
    
    # 학생 데이터는 항상 로컬 JSON 파일에서 직접 읽음
    path = os.path.join(BASE_DIR, 'backend', 'data', 'students.json')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            students = json.load(f)
    except:
        students = []

    found = False
    for s in students:
        if str(s.get('id', '')) == str(sid):
            s['pin'] = new_pin
            found = True
            break
    
    if found:
        push_data('students.json', students)
        return {"success": True}
    return {"error": "Student not found"}, 404

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    return pull_data('feedback.json') or []

@app.route('/api/feedback', methods=['POST'])
def add_feedback():
    from flask import request
    data = request.json
    feedbacks = pull_data('feedback.json') or []
    
    new_fb = {
        "id": int(time.time()),
        "author": data.get('author', '익명'),
        "role": data.get('role', 'student'),
        "content": data.get('content', ''),
        "date": time.strftime('%Y-%m-%d %H:%M')
    }
    feedbacks.append(new_fb)
    push_data('feedback.json', feedbacks)
    return {"success": True}

@app.route('/api/alert', methods=['GET'])
def get_alert():
    return pull_data('alert.json') or {}

@app.route('/api/alert', methods=['POST'])
def set_alert():
    from flask import request
    data = request.json
    push_data('alert.json', data)
    return {"success": True}

# ... (Additional routes for likes/comments/etc removed for stability during rollback if they were new)
# Wait, let's keep the baseline that was working before the 500 error starts.

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    from flask import request
    data = request.json or {}
    user_id = str(data.get('user_id', 'anon'))
    posts = pull_data('posts.json')
    for p in posts:
        if p['id'] == post_id:
            if not isinstance(p.get('likes'), list):
                p['likes'] = []
            likes = p['likes']
            if user_id in likes:
                likes.remove(user_id)
            else:
                likes.append(user_id)
            p['likes'] = likes
            push_data('posts.json', posts)
            return {"success": True, "likes": len(likes)}
    return {"error": "Not found"}, 404

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    from flask import request
    data = request.json
    posts = pull_data('posts.json')
    for p in posts:
        if p['id'] == post_id:
            if 'comments' not in p: p['comments'] = []
            parent_id = data.get('parent_id')
            if parent_id:
                for c in p['comments']:
                    if str(c.get('id')) == str(parent_id):
                        if 'replies' not in c: c['replies'] = []
                        new_reply = {
                            "id": int(time.time() * 1000),
                            "author": data.get('author', 'Anonymous'),
                            "content": data.get('content', ''),
                            "date": time.strftime('%Y-%m-%d %H:%M'),
                            "likes": []
                        }
                        c['replies'].append(new_reply)
                        push_data('posts.json', posts)
                        return {"success": True, "reply": new_reply}
                return {"error": "Parent not found"}, 404
            else:
                new_comment = {
                    "id": int(time.time() * 1000),
                    "author": data.get('author', 'Anonymous'),
                    "content": data.get('content', ''),
                    "date": time.strftime('%Y-%m-%d %H:%M'),
                    "replies": [],
                    "likes": []
                }
                p['comments'].append(new_comment)
                push_data('posts.json', posts)
                return {"success": True, "comment": new_comment}
    return {"error": "Not found"}, 404

@app.route('/api/posts/<int:post_id>/comments/<int:comment_id>/like', methods=['POST'])
def toggle_comment_like(post_id, comment_id):
    from flask import request
    data = request.json or {}
    user_id = str(data.get('user_id', 'anon'))
    
    posts = pull_data('posts.json')
    for p in posts:
        if p['id'] == post_id:
            for c in p.get('comments', []):
                if str(c.get('id')) == str(comment_id):
                    likes = c.get('likes', [])
                    if user_id in likes: likes.remove(user_id)
                    else: likes.append(user_id)
                    c['likes'] = likes
                    push_data('posts.json', posts)
                    return {"success": True, "likes": len(likes)}
                for r in c.get('replies', []):
                    if str(r.get('id')) == str(comment_id):
                        likes = r.get('likes', [])
                        if user_id in likes: likes.remove(user_id)
                        else: likes.append(user_id)
                        r['likes'] = likes
                        push_data('posts.json', posts)
                        return {"success": True, "likes": len(likes)}
            return {"error": "Comment not found"}, 404
    return {"error": "Post not found"}, 404

@app.route('/api/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        posts = pull_data('posts.json') or []
        # Convert everything to string for safe comparison
        pid_str = str(post_id)
        new_posts = [p for p in posts if str(p.get('id', '')) != pid_str]
        
        if len(new_posts) == len(posts):
            return {"error": "Post not found"}, 404
            
        push_data('posts.json', new_posts)
        return {"success": True}
    except Exception as e:
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
        
        mimetype = getattr(file, 'mimetype', None) or getattr(file, 'content_type', 'image/jpeg')
        
        try:
            storage = db.storage.from_("images")
            storage.upload(filename, file_bytes, {"content-type": mimetype})
            
            clean_url = f"{SUPABASE_URL}/storage/v1/object/public/images/{filename}"
            final_url = f"{clean_url}?t={int(time.time())}"
            return {"success": True, "url": final_url}
        except Exception as storage_err:
            return {"success": False, "error": f"Storage Error: {str(storage_err)}"}, 500
            
    except Exception as e:
        return {"success": False, "error": str(e)}, 500

if __name__ == '__main__':
    # 환경 변수 FLASK_DEBUG가 'true'나 '1'일 때만 디버그 모드 작동 (운영 환경에서는 기본 False)
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(debug=debug_mode, port=5000)
