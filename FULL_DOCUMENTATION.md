# OurNote Ultra Full Documentation (v4.3) 📚

본 문서는 OurNote 프로젝트의 프론트엔드, 백엔드, 디자인 시스템 및 인프라 전반에 걸친 모든 기능과 기술적 세부 사항을 총망라한 마스터 문서입니다.

---

## 📂 1. 프로젝트 구조 및 파일 명세

### 1.1 Root Directory
- `README.md`: 프로젝트 개요 및 빠른 시작 가이드.
- `DEVELOPMENT.md`: 기술적 요약 및 기여 가이드.
- `FULL_DOCUMENTATION.md`: (본 문서) 모든 기능 상세 명세.
- `requirements.txt`: Python 의존성 목록.
- `vercel.json`: Vercel 서버리스 배포 설정.

### 1.2 Frontend (`/frontend`)
- **`html/`**:
    - `login.html`: 엔트리 페이지 및 인증 화면.
    - `dashboard.html`: 메인 대시보드 및 서비스 화면.
    - **`components/`**: 동적으로 로드되는 UI 조각들.
        - `write-modal.html`: 글쓰기 작성 팝업.
        - `post-detail-modal.html`: 게시물 상세 및 댓글 팝업.
        - `settings-modal.html`: 환경 설정 및 관리자 메뉴.
        - `system-modals.html`: 로딩 및 안내 시스템 팝업.
        - `confirm-modal.html`: 커스텀 확인 창.
        - `qr-modal.html`: 학급 접속용 QR 안내.
        - `feedback-modal.html`: 사용자 의견 수집 및 관리.
- **`javascript/`**: 
    - `main.js`: 애플리케이션 엔트리 포인트 및 모듈 초기화 담당.
    - **`modules/`**:
        - `common.js`: 전역 상태(`state`), 토스트 알림, 공통 유틸리티.
        - `auth.js`: 로그인 로직, PIN 인증, 선생님 인증 처리.
        - `posts.js`: 게시물 렌더링, 수집(Polling), 댓글, 좋아요 전문 모듈.
        - `navigation.js`: 사이드바, 카테고리 전환, 모바일 메뉴 조작.
        - `ui.js`: 마우스 커서, 파티클, 배경 효과 등 시각적 요소 관리.
- **`css/`**: 
    - `style.css`: 전역 기본 스타일 및 테마 변수.
    - `modules/`: 각 컴포넌트 및 레이아웃별 독립적 CSS 모듈.

### 1.3 Backend (`/backend`)
- **`server/`**:
    - `app.py`: Flask 기반 API 서버 및 Supabase 연동 로직.
- **`data/`**: 로컬 백업용 JSON 데이터베이스.
    - `posts.json`, `homework.json`, `students.json`, `teacher.json`, `rules.json`, `alert.json`, `feedback.json`, `categories.json`.

---

## 🎨 2. 디자인 시스템 및 시각 요소 (Aesthetics)

### 2.1 핵심 디자인 컨셉
- **Glassmorphism**: 반투명 배경(`backdrop-blur`)과 미세한 테두리를 사용하여 깊이감 있는 인터페이스 구현.
- **Vibrant Colors**: Primary Blue(`#2b8cee`)를 메인으로 하며, 성공(Green), 경고(Red), 포인트(Purple) 색상을 조화롭게 사용.
- **Typography**: `Cafe24SsurroundAir` 폰트를 사용하여 학급 서비스에 걸맞은 친근하고 깔끔한 서체 적용.

### 2.2 배경 및 인터랙티브 효과
- **Floating Blobs**: 화면 곳곳에 배치된 네온 컬러 블롭들이 서서히 움직이며 몽환적인 분위기 형성.
- **Interactive Particles**: 마우스 이동에 반응하고 부드럽게 떠다니는 입자 효과 (`ui.js`).
- **Custom Cursor v4**: 단순한 포인터가 아닌, 요소에 반응하여 크기가 변하고 잔상이 남는 고급 커서 효과.

### 2.3 애니메이션 명세
- **Paper Plane (종이 비행기)**: 글을 올릴 때 비행기가 날아가며 게시물이 등록되는 시각적 피드백.
- **Homework Confetti (폭죽)**: 숙제 항목 완료 체크 시 화면에 색종이가 쏟아지는 보상 효과.
- **Floating Hearts (좋아요)**: 좋아요 클릭 시 클릭 위치에서 하트가 솟아오르는 감성 필터.
- **3D Modal Fold**: 모달이 열릴 때 단순 팝업이 아닌 3D로 접혔다 펴지는 듯한 부드러운 전환 효과 (`active` 클래스 기반).

---

## 🛡️ 3. 보안 및 인증 (Authentication)

### 3.1 학생 로그인 프로세스
1. **1단계**: 출석 번호(ID)와 이름 입력.
2. **2단계**: 기존 가입 여부 확인 후 저장된 6자리 PIN 번호 인증 창 오픈.
3. **PIN 키패드**: 모바일 환경을 고려한 커스텀 숫자 키패드 UI 제공 (보안을 위한 텍스트 마스킹 처리).

### 3.2 선생님 로그인 프로세스
1. ID/PW 기반 인증.
2. 인증 성공 시 전역 `state.currentUser.role`이 `teacher`로 설정되어 숨겨진 관리자 기능 활성화.

### 3.3 PIN 관리
- 선생님 계정은 설정 메뉴에서 학생들의 PIN 번호를 초기화하거나 임의로 수정할 수 있는 마스터 관리 기능 보유.

---

## 📝 4. 게시판 및 콘텐츠 엔진 (Post Engine)

### 4.1 게시물 카테고리
- **Normal**: 일반 학급 이야기.
- **Notice**: 중요 공지사항 (상단 강조 처리).
- **Event**: 이벤트 및 행사 안내.
- **Homework**: 숙제 (전용 레이아웃 사용).

### 4.2 실시간 동기화 (Polling System)
- `setInterval`을 이용해 4초마다 최신 데이터를 가져옴.
- **Smart Update**: 사용자가 댓글을 작성 중이거나 모달을 조작 중일 때는 불필요한 새로고침을 방지하여 작성 중인 내용 소실 방지.
- **Delta Rendering**: 기존 데이터와 신규 데이터를 비교하여 물리적으로 변경이 있을 때만 DOM을 갱신.

### 4.3 상호작용 로직
- **좋아요**: 중복 클릭 시 토글(Toggle) 방식. `localStorage`와 서버 데이터를 병용하여 즉각적 피드백 제공.
- **댓글 시스템**: 
    - 이미지 및 비디오 포함 여부 자동 감지.
    - 답글(@사용자) 기능을 통한 스레드형 대화 지원.

---

## 📚 5. 숙제 및 학습 추적 (Homework Tracking)

### 5.1 데이터 구조
- 각 숙제는 여러 개의 `tasks`를 포함.
- `progress` 객체 내에 `student_id: [true, false, true]` 형식으로 전 학생의 개별 수행 여부를 저장.

### 5.2 권한별 뷰
- **학생 관점**: 본인 이름의 체크리스트만 노출. 완료 버튼 클릭 시 즉시 서버 동기화 및 폭죽 효과.
- **선생님 관점**: 
    - 전체 학생 리스트와 진행률(%) 바 노출.
    - 완료한 학생과 미완료 학생을 한눈에 구분하는 대시보드 표(Table) 제공.

---

## ⚙️ 6. 관리자 및 특수 기능

### 6.1 우리반 규칙 (Rules Management)
- 대시보드 우측(PC) 또는 하단(Mobile)에 상시 노출.
- 선생님이 설정 화면에서 텍스트를 수정하면 즉시 전 학생의 화면에 반영.
- 다크모드 대응 고대비 디자인 적용.

### 6.2 오늘의 알림 (Daily Alert)
- 접속 시 중앙에 떠오르는 대형 공지 팝업.
- `localStorage`를 활용한 "오늘 하루 보지 않기" 기능으로 사용자 편의성 도모.

### 6.3 비밀 피드백 포털
- QR 모달의 특정 모서리를 정해진 순서대로 클릭하면 관리자용 피드백 목록이 활성화됨.
- 학생들이 남긴 익명 의견을 실시간으로 확인하고 관리 가능.

---

## 🌐 7. 인프라 및 배포 (Infrastructure)

### 7.1 백엔드 기술 상세
- **Flask**: 가볍고 빠른 API 서빙.
- **Supabase Connectivity**: 
    - 서비스 롤 키 또는 익명 키를 자동 감지하는 견고한 환경 변수 로직.
    - Vercel의 Serverless Function 제약 사항(Timeout 등)을 고려한 최적화된 DB 호출.

### 7.2 이미지 처리
- 게시글 작성 시 선택한 이미지는 Supabase Storage(`/images`)에 업로드됨.
- 업로드된 이미지는 공개 URL로 변환되어 실시간으로 게시글에 포함.

### 7.3 PWA (Progressive Web App)
- `manifest.json` 및 `sw.js`를 통해 앱 설치 지원.
- 오프라인 아이콘 및 시작 화면 설정 완료.

---

## 🚀 8. 향후 로드맵 및 확장성
- **알림 푸시**: Service Worker를 활용한 실시간 푸시 알림 기능 고도화 예정.
- **채팅 기능**: WebSocket 또는 Real-time Supabase 채널을 이용한 실시간 채팅방 도입 가능성.
- **성능 최적화**: 데이터가 1,000건 이상으로 늘어날 경우를 대비한 페이지네이션(Pagination) 도입 준비.

---
**Last Updated**: 2026.04.19
**Author**: OurNote Dev Team
