from flask import Flask, send_from_directory, jsonify, request
import os
import json
import time
import traceback

app = Flask(__name__)

# CORS 헤더 자동 추가 (Vercel 환경 대응)
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"[ERROR] Unhandled exception: {e}")
    traceback.print_exc()
    return jsonify({"error": str(e)}), 500

# Base directory for the project logic
# api/index.py -> BASE_DIR is project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
ASSETS_DIR = os.path.join(BASE_DIR, 'backend', 'assets')

@app.route('/health')
def health():
    return jsonify({"status": "ok", "time": time.time(), "env": "vercel" if os.environ.get('VERCEL') else "local"})

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

# --- Supabase Logic (Lazily Loaded) ---
def get_supabase_envs():
    url = (os.environ.get('SUPABASE_URL') or os.environ.get('SUPABASE_REST_API_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or "").strip()
    key = (os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY') or os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') or "").strip()
    
    if not url or not key:
        for k, v in os.environ.items():
            if k.endswith('_SUPABASE_URL'): url = v.strip()
            if k.endswith('_SUPABASE_ANON_KEY') or k.endswith('_SUPABASE_SERVICE_ROLE_KEY'): key = v.strip()
    return url, key

def get_db():
    try:
        from supabase import create_client
        url, key = get_supabase_envs()
        if not url or not key: return None
        return create_client(url, key)
    except Exception as e:
        print(f"[WARN] Failed to initialize Supabase client: {e}")
        return None

# Simple In-Memory Cache
_cache = {}
CACHE_TTL = 10 # seconds

def pull_data(filename):
    global _cache
    name = filename.split('.')[0]
    
    # Check cache first
    now = time.time()
    if name in _cache:
        cached_val, expiry = _cache[name]
        if now < expiry:
            return cached_val

    db = get_db()
    data = None
    if db:
        try:
            res = db.table('app_state').select('data').eq('id', name).execute()
            if res.data and len(res.data) > 0:
                data = res.data[0]['data']
        except Exception as db_err:
            print(f"[ERROR] pull_data({filename}) Supabase error: {db_err}")
    
    if data is None:
        path = os.path.join(BASE_DIR, 'backend', 'data', filename)
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                print(f"[ERROR] pull_data({filename}) local read error: {e}")
    
    if data is None:
        if name in ['posts', 'homework', 'categories', 'feedback', 'students']: data = []
        else: data = {}
    
    # Update cache
    _cache[name] = (data, now + CACHE_TTL)
    return data

def push_data(filename, data):
    global _cache
    name = filename.split('.')[0]
    # Invalidate cache
    if name in _cache:
        del _cache[name]
    
    db = get_db()
    if db:
        try:
            db.table('app_state').upsert({"id": name, "data": data}).execute()
        except Exception as db_err:
            print(f"[ERROR] push_data({filename}) Supabase error: {db_err}")
    
    if os.environ.get('VERCEL'): return

    path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"[WARN] push_data({filename}) local write failed: {e}")

# --- API Endpoints ---
@app.route('/api/students', methods=['GET'])
def get_students():
    return pull_data('students.json')

@app.route('/api/students/pin', methods=['POST'])
def update_student_pin():
    data = request.json
    sid = data.get('student_id')
    new_pin = data.get('new_pin')
    try:
        students = pull_data('students.json')
        found = False
        for s in students:
            if str(s.get('id', '')) == str(sid):
                s['pin'] = new_pin
                found = True
                break
        if found:
            push_data('students.json', students)
            return jsonify({"success": True})
        return jsonify({"error": "Student not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/teacher', methods=['GET'])
def get_teacher():
    return jsonify(pull_data('teacher.json'))

@app.route('/api/posts', methods=['GET'])
def get_posts():
    return jsonify(pull_data('posts.json'))

@app.route('/api/rules', methods=['GET', 'POST'])
def handle_rules():
    if request.method == 'POST':
        data = request.json
        if not data or 'rules' not in data: return jsonify({"error": "Invalid data"}), 400
        push_data('rules.json', data)
        return jsonify({"success": True})
    return jsonify(pull_data('rules.json'))

@app.route('/api/categories', methods=['GET', 'POST'])
def handle_categories():
    if request.method == 'POST':
        data = request.json
        if not data or 'name' not in data: return jsonify({"error": "Invalid data"}), 400
        cats = pull_data('categories.json') or []
        cat_id = data['name'].replace(' ', '_').lower() + f"_{int(time.time())}"
        new_row = {"id": cat_id, "name": data['name'], "icon": data.get('icon', 'forum')}
        cats.append(new_row)
        push_data('categories.json', cats)
        return jsonify({"success": True, "category": new_row})
    cats = pull_data('categories.json') or []
    return jsonify([c for c in cats if c.get('name') not in ['ㅅㄷㄴㅅ', 'ㅅㄷㄴㅅ2', 'ㅎㅇ']])

@app.route('/api/categories/<string:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    import urllib.parse
    cat_id = urllib.parse.unquote(cat_id)
    cats = pull_data('categories.json') or []
    new_cats = [c for c in cats if isinstance(c, dict) and c.get('id') != cat_id and c.get('name') != cat_id]
    if len(new_cats) == len(cats): return jsonify({"error": "Category not found"}), 404
    push_data('categories.json', new_cats)
    return jsonify({"success": True})

@app.route('/api/posts', methods=['POST'])
def add_post():
    new_post = request.json
    posts = pull_data('posts.json')
    new_post['id'] = max([p['id'] for p in posts], default=0) + 1
    new_post['date'] = time.strftime('%Y-%m-%d %H:%M')
    new_post['likes'] = []
    new_post['comments'] = []
    posts.append(new_post)
    push_data('posts.json', posts)
    return jsonify({"success": True})

@app.route('/api/homework', methods=['GET', 'POST'])
def handle_homework():
    if request.method == 'POST':
        new_hw = request.json
        hws = pull_data('homework.json') or []
        new_hw['id'] = int(time.time())
        new_hw['date'] = time.strftime('%Y-%m-%d')
        if 'assigned_students' not in new_hw: new_hw['assigned_students'] = [new_hw.get('student_id', 'all')]
        tasks_count = len(new_hw.get('tasks', []))
        new_hw['progress'] = { sid: [False] * tasks_count for sid in new_hw['assigned_students'] }
        hws.append(new_hw)
        push_data('homework.json', hws)
        return jsonify({"success": True})
    return jsonify(pull_data('homework.json'))

@app.route('/api/homework/<int:hw_id>/task', methods=['POST'])
def update_homework_task(hw_id):
    data = request.json
    student_id = data.get('student_id')
    task_idx = data.get('task_index')
    is_completed = data.get('completed')
    hws = pull_data('homework.json') or []
    for hw in hws:
        if hw['id'] == hw_id:
            if 'progress' not in hw: hw['progress'] = {}
            if student_id not in hw['progress']:
                tasks_count = len(hw.get('tasks', []))
                hw['progress'][student_id] = [False] * tasks_count
            if 0 <= task_idx < len(hw['progress'][student_id]):
                hw['progress'][student_id][task_idx] = is_completed
                push_data('homework.json', hws)
                return jsonify({"success": True})
    return jsonify({"error": "Not found"}), 404

@app.route('/api/homework/<hw_id>', methods=['DELETE'])
def delete_homework(hw_id):
    hws = pull_data('homework.json') or []
    new_hws = [h for h in hws if str(h.get('id', '')) != str(hw_id)]
    if len(new_hws) == len(hws): return jsonify({"error": "Homework not found"}), 404
    push_data('homework.json', new_hws)
    return jsonify({"success": True})

@app.route('/api/feedback', methods=['GET', 'POST'])
def handle_feedback():
    if request.method == 'POST':
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
        return jsonify({"success": True})
    return jsonify(pull_data('feedback.json') or [])

@app.route('/api/alert', methods=['GET', 'POST'])
def handle_alert():
    if request.method == 'POST':
        data = request.json
        push_data('alert.json', data)
        return jsonify({"success": True})
    return jsonify(pull_data('alert.json') or {})

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    data = request.json or {}
    user_id = str(data.get('user_id', 'anon'))
    for filename in ['posts.json', 'homework.json']:
        items = pull_data(filename) or []
        for p in items:
            if str(p.get('id', '')) == str(post_id):
                likes = p.get('likes', [])
                if user_id in likes: likes.remove(user_id)
                else: likes.append(user_id)
                p['likes'] = likes
                push_data(filename, items)
                return jsonify({"success": True, "likes": len(likes)})
    return jsonify({"error": "Not found"}), 404

@app.route('/api/posts/<int:post_id>/comments', methods=['POST', 'OPTIONS'])
def add_comment(post_id):
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        for filename in ['posts.json', 'homework.json']:
            items = pull_data(filename) or []
            for p in items:
                if str(p.get('id', '')) == str(post_id):
                    if 'comments' not in p: p['comments'] = []
                    parent_id = data.get('parent_id')
                    new_item = {
                        "id": int(time.time() * 1000),
                        "author": data.get('author', 'Anonymous'),
                        "content": data.get('content', ''),
                        "date": time.strftime('%Y-%m-%d %H:%M'),
                        "likes": []
                    }
                    if parent_id:
                        for c in p['comments']:
                            if str(c.get('id')) == str(parent_id):
                                if 'replies' not in c: c['replies'] = []
                                c['replies'].append(new_item)
                                push_data(filename, items)
                                return jsonify({"success": True, "reply": new_item})
                    else:
                        new_item["replies"] = []
                        p['comments'].append(new_item)
                        push_data(filename, items)
                        return jsonify({"success": True, "comment": new_item})
        return jsonify({"error": "Post not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<int:post_id>/comments/<int:comment_id>/like', methods=['POST'])
def toggle_comment_like(post_id, comment_id):
    data = request.json or {}
    user_id = str(data.get('user_id', 'anon'))
    for filename in ['posts.json', 'homework.json']:
        items = pull_data(filename) or []
        for p in items:
            if str(p.get('id', '')) == str(post_id):
                for c in p.get('comments', []):
                    if str(c.get('id')) == str(comment_id):
                        likes = c.get('likes', [])
                        if user_id in likes: likes.remove(user_id)
                        else: likes.append(user_id)
                        c['likes'] = likes
                        push_data(filename, items)
                        return jsonify({"success": True, "likes": len(likes)})
                    for r in c.get('replies', []):
                        if str(r.get('id')) == str(comment_id):
                            likes = r.get('likes', [])
                            if user_id in likes: likes.remove(user_id)
                            else: likes.append(user_id)
                            r['likes'] = likes
                            push_data(filename, items)
                            return jsonify({"success": True, "likes": len(likes)})
    return jsonify({"error": "Not found"}), 404

@app.route('/api/posts/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(post_id, comment_id):
    try:
        found = False
        for filename in ['posts.json', 'homework.json']:
            items = pull_data(filename) or []
            for p in items:
                if str(p.get('id', '')) == str(post_id):
                    # Filter top-level comments
                    comments = p.get('comments', [])
                    initial_len = len(comments)
                    new_comments = [c for c in comments if str(c.get('id')) != str(comment_id)]
                    
                    if len(new_comments) < initial_len:
                        p['comments'] = new_comments
                        found = True
                    else:
                        # Check replies inside each comment
                        for c in comments:
                            if 'replies' in c:
                                replies = c.get('replies', [])
                                initial_reply_len = len(replies)
                                c['replies'] = [r for r in replies if str(r.get('id')) != str(comment_id)]
                                if len(c['replies']) < initial_reply_len:
                                    found = True
                                    break
                    
                    if found:
                        push_data(filename, items)
                        return jsonify({"success": True})
        return jsonify({"error": "Comment not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    posts = pull_data('posts.json') or []
    new_posts = [p for p in posts if str(p.get('id', '')) != str(post_id)]
    if len(new_posts) == len(posts): return jsonify({"error": "Not found"}), 404
    push_data('posts.json', new_posts)
    return jsonify({"success": True})

@app.route('/api/upload', methods=['POST'])
def upload_image():
    try:
        from flask import request
        if 'image' not in request.files: return jsonify({"success": False, "error": "No image"}), 400
        file = request.files['image']
        db = get_db()
        if not db: return jsonify({"success": False, "error": "Supabase offline"}), 500
        file_bytes = file.read()
        filename = f"post_{int(time.time())}.{file.filename.split('.')[-1]}"
        mimetype = request.files['image'].content_type
        db.storage.from_("images").upload(filename, file_bytes, {"content-type": mimetype})
        url, _ = get_supabase_envs()
        final_url = f"{url}/storage/v1/object/public/images/{filename}?t={int(time.time())}"
        return jsonify({"success": True, "url": final_url})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Vercel entry point
def handler(event, context):
    return app(event, context)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
