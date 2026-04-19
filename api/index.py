from flask import Flask, send_from_directory, jsonify, request
import os
import json
import time
import traceback
from werkzeug.security import generate_password_hash, check_password_hash

import threading
import uuid

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
    return jsonify({"status": "ok", "version": "4.3", "time": time.time(), "env": "vercel" if os.environ.get('VERCEL') else "local"})

@app.route('/api/test')
def api_test():
    url, key = get_supabase_envs()
    db = get_db()
    return jsonify({
        "supabase_url": url[:15] + "..." if url else None,
        "supabase_key_present": bool(key),
        "db_connected": bool(db),
        "base_dir": BASE_DIR,
        "env_keys": list(os.environ.keys()),
        "files": os.listdir(os.path.join(BASE_DIR, 'backend', 'data')) if os.path.exists(os.path.join(BASE_DIR, 'backend', 'data')) else "not found"
    })

@app.route('/')
def index():
    resp = send_from_directory(os.path.join(FRONTEND_DIR, 'html'), 'login.html')
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

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

def pull_data(filename):
    name = filename.split('.')[0]
    db = get_db()
    if db:
        try:
            res = db.table('app_state').select('data').eq('id', name).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]['data']
        except Exception as db_err:
            print(f"[ERROR] pull_data({filename}) Supabase error: {db_err}")
    
    path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[ERROR] pull_data({filename}) local read error: {e}")
            
    if name in ['posts', 'homework', 'categories', 'feedback', 'students']: return []
    return {}

# --- Data Concurrency Handling ---
data_lock = threading.Lock()

def update_data(filename, update_fn):
    """
    Atomically updates data by locking, pulling, applying update_fn, and pushing.
    This prevents race conditions within a single server process.
    """
    with data_lock:
        data = pull_data(filename)
        # update_fn should return the modified data if changes were made, or None/False to skip push
        new_data = update_fn(data)
        if new_data is not None:
            push_data(filename, new_data)
            return new_data
        return None

def push_data(filename, data):
    name = filename.split('.')[0]
    db = get_db()
    if db:
        try:
            db.table('app_state').upsert({"id": name, "data": data}).execute()
        except Exception as db_err:
            print(f"[ERROR] push_data({filename}) Supabase error: {db_err}")
    
    if os.environ.get('VERCEL'): return

    path = os.path.join(BASE_DIR, 'backend', 'data', filename)
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"[WARN] push_data({filename}) local write failed: {e}")

# --- API Endpoints ---
@app.route('/api/students', methods=['GET'])
def get_students():
    # 보안: 일반 학생은 전체 명단을 볼 필요가 없음 (선생님만 보거나, 아이디 제외하고 이름만 노출)
    students = pull_data('students.json')
    if isinstance(students, list):
        # 이름만 노출하여 최소한의 정보만 제공
        return jsonify([{"name": s.get('name')} for s in students])
    return jsonify([])

@app.route('/api/auth/identify', methods=['POST'])
@app.route('/api/identify', methods=['POST'])
def identify_student():
    try:
        data = request.json or {}
        s_id = str(data.get('id', ''))
        name = data.get('name', '').replace(' ', '')
        
        students = pull_data('students.json') or []
        for s in students:
            if str(s.get('id')) == s_id and s.get('name', '').replace(' ', '') == name:
                return jsonify({"success": True, "user": {"id": s.get('id'), "name": s.get('name')}})
                
        return jsonify({"success": False, "error": "학생 정보를 찾을 수 없습니다."}), 404
    except Exception as e:
        return jsonify({"error": f"Identify error: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    login_type = data.get('type') # 'student' or 'teacher'
    
    if login_type == 'student':
        sid = data.get('id')
        pin = data.get('pin')
        students = pull_data('students.json')
        user = next((s for s in students if str(s.get('id')) == str(sid)), None)
        
        if user:
            # 기존 평문 PIN과 새로운 해시 PIN 모두 대응 (이주 기간용)
            stored_pin = str(user.get('pin', ''))
            is_valid = (pin == stored_pin) or (stored_pin.startswith('pbkdf2:') and check_password_hash(stored_pin, pin))
            
            if is_valid:
                return jsonify({"success": True, "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "role": "student"
                }})
        return jsonify({"success": False, "error": "아이디 또는 비밀번호가 틀렸습니다."}), 401
        
    elif login_type == 'teacher':
        username = data.get('id')
        password = data.get('password')
        teacher = pull_data('teacher.json')
        
        if teacher.get('username') == username and teacher.get('password') == password:
            return jsonify({"success": True, "user": {
                "name": "선생님",
                "role": "teacher"
            }})
        return jsonify({"success": False, "error": "ID 또는 비밀번호가 틀렸습니다."}), 401
    
    return jsonify({"success": False, "error": "잘못된 로그인 요청입니다."}), 400

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
                # 보안: PIN을 해시(암호화)하여 저장
                s['pin'] = generate_password_hash(new_pin)
                found = True
                break
        if found:
            push_data('students.json', students)
            return jsonify({"success": True})
        return jsonify({"error": "Student not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/posts', methods=['GET'])
def get_posts():
    db = get_db()
    if db:
        try:
            # 1. 게시글 가져오기
            res = db.table('posts').select('*').order('created_at', desc=True).execute()
            posts = res.data or []
            
            # 2. 모든 댓글 가져오기 (성능을 위해 한 번에 가져와서 메모리에서 매칭)
            # 데이터가 아주 많아지면 게시글 ID별로 쿼리하는 방식으로 바꿔야 함.
            c_res = db.table('comments').select('*').execute()
            all_comments = c_res.data or []
            
            # 3. 게시글에 댓글 심어주기
            for post in posts:
                p_comments = [c for c in all_comments if str(c.get('post_id')) == str(post.get('id'))]
                # 대댓글 구조 재구성 (parent_id가 없는 게 최상위 댓글)
                top_level = [c for c in p_comments if c.get('parent_id') is None]
                for tc in top_level:
                    tc['replies'] = [c for c in p_comments if str(c.get('parent_id')) == str(tc.get('id'))]
                post['comments'] = top_level
                # 프론트엔드 날짜 필드 호환 (date)
                post['date'] = post.get('created_at')
                
            return jsonify(posts)
        except Exception as e:
            print(f"[ERROR] get_posts with comments from Supabase: {e}")
            
    return jsonify(pull_data('posts.json'))

@app.route('/api/rules', methods=['GET', 'POST'])
def handle_rules():
    if request.method == 'POST':
        data = request.json
        if not data or 'rules' not in data: return jsonify({"error": "Invalid data"}), 400
        update_data('rules.json', lambda _: data)
        return jsonify({"success": True})
    return jsonify(pull_data('rules.json'))

@app.route('/api/categories', methods=['GET', 'POST'])
def handle_categories():
    db = get_db()
    if request.method == 'POST':
        data = request.json
        if not data or 'name' not in data: return jsonify({"error": "Invalid data"}), 400
        
        cat_id = data['name'].replace(' ', '_').lower() + f"_{int(time.time())}"
        new_row = {"id": cat_id, "name": data['name'], "icon": data.get('icon', 'forum')}

        if db:
            try:
                db.table('categories').insert(new_row).execute()
                return jsonify({"success": True, "category": new_row})
            except Exception as e:
                print(f"[ERROR] add category to Supabase: {e}")

        # DB 실패 시 폴백
        update_data('categories.json', lambda cats: (cats or []) + [new_row])
        return jsonify({"success": True, "category": new_row})

    if db:
        try:
            res = db.table('categories').select('*').execute()
            if res.data is not None: return jsonify(res.data)
        except Exception as e:
            print(f"[ERROR] get categories from Supabase: {e}")

    return jsonify(pull_data('categories.json') or [])

@app.route('/api/categories/<string:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    import urllib.parse
    cat_id = urllib.parse.unquote(cat_id)
    db = get_db()
    
    if db:
        try:
            # ID 또는 이름으로 삭제 시도
            db.table('categories').delete().or_(f"id.eq.{cat_id},name.eq.{cat_id}").execute()
            return jsonify({"success": True})
        except Exception as e:
            print(f"[ERROR] delete category from Supabase: {e}")

    # DB 실패 시 폴백
    def update_fn(cats):
        cats = cats or []
        new_cats = [c for c in cats if isinstance(c, dict) and c.get('id') != cat_id and c.get('name') != cat_id]
        if len(new_cats) == len(cats): return None
        return new_cats

    if update_data('categories.json', update_fn):
        return jsonify({"success": True})
    return jsonify({"error": "Category not found"}), 404

@app.route('/api/posts', methods=['POST'])
def add_post():
    new_post = request.json
    category = new_post.get('category', 'dashboard')
    user_role = new_post.get('user_role', 'student')

    # 보안 검증: 선생님 전용 카테고리는 확실하게 차단
    if category in ['notice', 'event', 'homework'] and user_role != 'teacher':
        return jsonify({"error": "이 카테고리에는 선생님만 작성할 수 있습니다."}), 403

    db = get_db()
    
    if db:
        try:
            # Supabase 전용 필드로 정리
            insert_data = {
                "title": new_post.get('title'),
                "content": new_post.get('content'),
                "author": new_post.get('author'),
                "category": new_post.get('category'),
                "image_url": new_post.get('image_url'),
                "is_anonymous": new_post.get('is_anonymous', False),
                "likes": [],
                "created_at": time.strftime('%Y-%m-%d %H:%M:%S')
            }
            db.table('posts').insert(insert_data).execute()
            return jsonify({"success": True})
        except Exception as e:
            print(f"[ERROR] add_post to Supabase: {e}")

    # DB 실패 시 기존 JSON 방식 폴백
    def update_fn(posts):
        posts = posts or []
        new_post['id'] = uuid.uuid4().hex
        new_post['date'] = time.strftime('%Y-%m-%d %H:%M')
        new_post['likes'] = []
        new_post['comments'] = []
        posts.append(new_post)
        return posts

    update_data('posts.json', update_fn)
    return jsonify({"success": True})

@app.route('/api/homework', methods=['POST', 'OPTIONS'])
def create_homework():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        data = request.json
        user_role = data.get('user_role', 'student')
        
        # 보안 검증: 숙제는 선생님만 생성 가능
        if user_role != 'teacher':
            return jsonify({"error": "선생님만 숙제를 생성할 수 있습니다."}), 403

        db = get_db()
        hw_id = uuid.uuid4().hex
        date = time.strftime('%Y-%m-%d')
        
        assigned_students = data.get('assigned_students', ['all'])
        tasks = data.get('tasks', [])
        progress = { sid: [False] * len(tasks) for sid in assigned_students }
        
        insert_data = {
            "id": hw_id,
            "title": data.get('title'),
            "content": data.get('content'),
            "tasks": tasks,
            "assigned_students": assigned_students,
            "progress": progress,
            "created_at": date
        }

        if db:
            try:
                db.table('homework').insert(insert_data).execute()
                return jsonify({"success": True})
            except Exception as e:
                print(f"[ERROR] add homework to Supabase: {e}")

        # DB 실패 시 폴백
        def update_fn(hws):
            hws = hws or []
            new_hw = insert_data.copy()
            new_hw['date'] = date
            hws.append(new_hw)
            return hws
        update_data('homework.json', update_fn)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/homework', methods=['GET'])
def get_homework():
    db = get_db()
    if db:
        try:
            res = db.table('homework').select('*').order('created_at', desc=True).execute()
            if res.data is not None: return jsonify(res.data)
        except Exception as e:
            print(f"[ERROR] get homework from Supabase: {e}")
            
    return jsonify(pull_data('homework.json'))

@app.route('/api/homework/<string:hw_id>/task', methods=['POST'])
def update_homework_task(hw_id):
    data = request.json
    student_id = data.get('student_id')
    task_idx = data.get('task_index')
    is_completed = data.get('completed')
    db = get_db()
    
    if db:
        try:
            # 1. 현재 진행도 가져오기
            res = db.table('homework').select('progress', 'tasks').eq('id', hw_id).execute()
            if res.data and len(res.data) > 0:
                hw_data = res.data[0]
                progress = hw_data.get('progress', {})
                tasks = hw_data.get('tasks', [])
                
                if student_id not in progress:
                    progress[student_id] = [False] * len(tasks)
                
                if 0 <= task_idx < len(progress[student_id]):
                    progress[student_id][task_idx] = is_completed
                    db.table('homework').update({"progress": progress}).eq('id', hw_id).execute()
                    return jsonify({"success": True})
                return jsonify({"error": "Homework not found in DB"}), 404
        except Exception as e:
            print(f"[ERROR] update homework task in Supabase: {e}")
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Database offline"}), 503

@app.route('/api/posts/<string:post_id>/comments/<string:comment_id>', methods=['DELETE'])
def delete_comment(post_id, comment_id):
    data = request.json
    user_id = str(data.get('user_id', ''))
    user_role = data.get('user_role', '')
    
    db = get_db()
    if db:
        try:
            # 1. 댓글 정보 확인
            res = db.table('comments').select('*').eq('id', comment_id).execute()
            if res.data:
                comment = res.data[0]
                # 권한 체크: 선생님이거나 작성자 본인인 경우
                is_author = f"#{user_id}" in str(comment.get('author', ''))
                if user_role == 'teacher' or is_author:
                    db.table('comments').delete().eq('id', comment_id).execute()
                    return jsonify({"success": True})
                return jsonify({"error": "Unauthorized"}), 403
        except Exception as e:
            print(f"[ERROR] delete comment in Supabase: {e}")

    # Fallback to JSON (if needed)
    return jsonify({"success": True})

@app.route('/api/homework/<string:hw_id>', methods=['DELETE'])
def delete_homework(hw_id):
    db = get_db()
    if db:
        try:
            db.table('homework').delete().eq('id', hw_id).execute()
            return jsonify({"success": True})
        except Exception as e:
            print(f"[ERROR] delete homework from Supabase: {e}")

    # DB 실패 시 폴백
    def update_fn(hws):
        hws = hws or []
        new_hws = [h for h in hws if str(h.get('id', '')) != str(hw_id)]
        if len(new_hws) == len(hws): return None
        return new_hws

    if update_data('homework.json', update_fn):
        return jsonify({"success": True})
    return jsonify({"error": "Homework not found"}), 404

@app.route('/api/feedback', methods=['GET', 'POST'])
def handle_feedback():
    if request.method == 'POST':
        data = request.json
        def update_fn(feedbacks):
            feedbacks = feedbacks or []
            new_fb = {
                "id": int(time.time()),
                "author": data.get('author', '익명'),
                "role": data.get('role', 'student'),
                "content": data.get('content', ''),
                "date": time.strftime('%Y-%m-%d %H:%M')
            }
            feedbacks.append(new_fb)
            return feedbacks

        update_data('feedback.json', update_fn)
        return jsonify({"success": True})
    return jsonify(pull_data('feedback.json') or [])

@app.route('/api/alert', methods=['GET', 'POST'])
def handle_alert():
    if request.method == 'POST':
        data = request.json
        update_data('alert.json', lambda _: data)
        return jsonify({"success": True})
    return jsonify(pull_data('alert.json') or {})

@app.route('/api/posts/<string:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    data = request.json or {}
    user_id = str(data.get('user_id', 'anon'))
    db = get_db()
    
    if db:
        try:
            # 1. 현재 좋아요 상태 가져오기
            res = db.table('posts').select('likes').eq('id', post_id).execute()
            if res.data and len(res.data) > 0:
                likes = res.data[0].get('likes', [])
                # 2. 토글 로직
                if user_id in likes: likes.remove(user_id)
                else: likes.append(user_id)
                # 3. 업데이트
                db.table('posts').update({"likes": likes}).eq('id', post_id).execute()
                return jsonify({"success": True, "likes": len(likes)})
        except Exception as e:
            print(f"[ERROR] toggle_like in Supabase: {e}")

    # DB 실패 시 기존 JSON 방식 폴백
    context = {"likes_count": 0, "found": False}
    def update_fn(items):
        items = items or []
        found = False
        for p in items:
            if str(p.get('id', '')) == str(post_id):
                likes = p.get('likes', [])
                if user_id in likes: likes.remove(user_id)
                else: likes.append(user_id)
                p['likes'] = likes
                context["likes_count"] = len(likes)
                context["found"] = True
                found = True
                break
        return items if found else None

    for filename in ['posts.json', 'homework.json']:
        if update_data(filename, update_fn):
            return jsonify({"success": True, "likes": context["likes_count"]})
            
    return jsonify({"error": "Not found"}), 404

@app.route('/api/posts/<string:post_id>/comments', methods=['POST', 'OPTIONS'])
def add_comment(post_id):
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        db = get_db()
        
        insert_data = {
            "post_id": post_id,
            "parent_id": data.get('parent_id'), # 대댓글인 경우
            "author": data.get('author', 'Anonymous'),
            "content": data.get('content', ''),
            "likes": [],
            "created_at": time.strftime('%Y-%m-%d %H:%M')
        }

        if db:
            try:
                res = db.table('comments').insert(insert_data).execute()
                if res.data:
                    return jsonify({"success": True, "comment" if not insert_data["parent_id"] else "reply": res.data[0]})
            except Exception as e:
                print(f"[ERROR] add comment to Supabase: {e}")

        # DB 실패 시 폴백
        context = {"response": None}
        def update_fn(items):
            items = items or []
            found = False
            for p in items:
                if str(p.get('id', '')) == str(post_id):
                    if 'comments' not in p: p['comments'] = []
                    parent_id = data.get('parent_id')
                    new_item = {
                        "id": uuid.uuid4().hex,
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
                                context["response"] = jsonify({"success": True, "reply": new_item})
                                found = True
                                break
                    else:
                        new_item["replies"] = []
                        p['comments'].append(new_item)
                        context["response"] = jsonify({"success": True, "comment": new_item})
                        found = True
                    if found: break
            return items if found else None

        for filename in ['posts.json', 'homework.json']:
            if update_data(filename, update_fn):
                return context["response"]
                
        return jsonify({"error": "Post not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<string:post_id>/comments/<string:comment_id>/like', methods=['POST'])
def toggle_comment_like(post_id, comment_id):
    data = request.json or {}
    user_id = str(data.get('user_id', 'anon'))
    db = get_db()
    
    if db:
        try:
            # 1. 현재 좋아요 상태 가져오기
            res = db.table('comments').select('likes').eq('id', comment_id).execute()
            if res.data and len(res.data) > 0:
                likes = res.data[0].get('likes', [])
                if user_id in likes: likes.remove(user_id)
                else: likes.append(user_id)
                # 2. 업데이트
                db.table('comments').update({"likes": likes}).eq('id', comment_id).execute()
                return jsonify({"success": True, "likes": len(likes)})
        except Exception as e:
            print(f"[ERROR] toggle_comment_like in Supabase: {e}")

    # DB 실패 시 폴백
    context = {"likes_count": 0}
    def update_fn(items):
        items = items or []
        found = False
        for p in items:
            if str(p.get('id', '')) == str(post_id):
                for c in p.get('comments', []):
                    if str(c.get('id')) == str(comment_id):
                        likes = c.get('likes', [])
                        if user_id in likes: likes.remove(user_id)
                        else: likes.append(user_id)
                        c['likes'] = likes
                        context["likes_count"] = len(likes)
                        found = True
                        break
                    for r in c.get('replies', []):
                        if str(r.get('id')) == str(comment_id):
                            likes = r.get('likes', [])
                            if user_id in likes: likes.remove(user_id)
                            else: likes.append(user_id)
                            r['likes'] = likes
                            context["likes_count"] = len(likes)
                            found = True
                            break
                if found: break
        return items if found else None

    for filename in ['posts.json', 'homework.json']:
        if update_data(filename, update_fn):
            return jsonify({"success": True, "likes": context["likes_count"]})
            
    return jsonify({"error": "Not found"}), 404

@app.route('/api/posts/<string:post_id>', methods=['DELETE'])
def delete_post(post_id):
    # 권한 체크를 위해 요청자 정보 필요
    data = request.json or {}
    requester_id = data.get('user_id')
    requester_role = data.get('user_role')
    db = get_db()

    if db:
        try:
            # 1. 작성자 확인
            res = db.table('posts').select('author').eq('id', post_id).execute()
            if res.data and len(res.data) > 0:
                author_info = res.data[0].get('author', '')
                author_id = author_info.split('(#')[-1].replace(')', '') if '(#' in author_info else author_info
                
                if requester_role == 'teacher' or str(author_id) == str(requester_id):
                    db.table('posts').delete().eq('id', post_id).execute()
                    return jsonify({"success": True})
                else:
                    return jsonify({"error": "삭제 권한이 없습니다."}), 403
        except Exception as e:
            print(f"[ERROR] delete_post in Supabase: {e}")

    # DB 실패 시 기존 JSON 방식 폴백
    def update_fn(posts):
        posts = posts or []
        target_post = next((p for p in posts if str(p.get('id')) == str(post_id)), None)
        if not target_post: return None
        
        author_info = target_post.get('author', '')
        author_id = author_info.split('(#')[-1].replace(')', '') if '(#' in author_info else author_info
        
        if requester_role != 'teacher' and str(author_id) != str(requester_id):
            return "FORBIDDEN"

        new_posts = [p for p in posts if str(p.get('id', '')) != str(post_id)]
        return new_posts

    result = update_data('posts.json', update_fn)
    if result == "FORBIDDEN":
        return jsonify({"error": "삭제 권한이 없습니다."}), 403
    if result:
        return jsonify({"success": True})
    return jsonify({"error": "Not found"}), 404

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
