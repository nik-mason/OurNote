# OurNote Ultra (Angel Ed. v4.3) 🚀

**OurNote**는 학생과 선생님이 함께 만들어가는 스마트 학급 커뮤니티 플랫폼입니다. 
고급스러운 UI/UX와 실시간 동기화 시스템을 통해 최상의 사용자 경험을 제공합니다.

---

## 🌟 주요 기능 (Key Features)

### 1. 보안 및 사용자 관리 (Auth & Security)
*   **다중 인증 시스템**: 학생용 6자리 PIN 보안 및 선생님용 전용 암호 체계.
*   **역할 기반 접근 제어**: 선생님 권한(공지 작성, 과제 관리, 삭제 권한)과 학생 권한의 명확한 분리.

### 2. 프리미엄 UI/UX (High-End Design)
*   **실시간 애니메이션**:
    *   **종이 비행기**: 게시물 등록 시 피드백 애니메이션.
    *   **폭죽(Confetti)**: 숙제 완료 시 축하 효과.
    *   **플로팅 하트**: 좋아요 클릭 시 감성적인 인터랙션.
*   **모던 인터페이스**: Glassmorphism 디자인, 커스텀 커서, 다크모드 완벽 지원.

### 3. 실시간 대시보드 (Real-time Dashboard)
*   **Silent Polling**: 4초 간격의 스마트 동기화로 페이지 새로고침 없이 게시물과 댓글이 실시간 업데이트됩니다.
*   **스마트 필터링**: 카테고리별(공지, 행사, 숙제 등) 게시물 자동 분류 및 검색.

### 4. 숙제 및 학습 관리 (Homework System)
*   **맞춤형 체크리스트**: 학생별 개별 과제 할당 및 본인 진행 상황 관리.
*   **학급 현황판**: 선생님이 전체 학생의 과제 수행도를 실시간으로 모니터링.

### 5. 소통 및 관리 도구 (Communication & Admin)
*   **우리반 규칙 게시판**: 상시 노출되는 고대비(High-contrast) 안내 섹션.
*   **오늘의 알림**: 접속 시 중요한 공지사항을 팝업으로 전달.
*   **관리자 피드백 시스템**: 숨겨진 관리자 모드를 통한 학생 의견 수집 및 관리.

---

## 🛠 기술 스택 (Tech Stack)

*   **Frontend**: Vanilla JavaScript (ES Module), Tailwind CSS, Material Symbols.
*   **Backend**: Python Flask (Serverless context).
*   **Database**: Supabase (PostgreSQL) - Real-time state syncing.
*   **Infrastructure**: 배포 및 호스팅 최적화 (Vercel).

---

## 🚀 시작하기 (Getting Started)

### 사전 준비
*   Python 3.10+
*   Supabase 계정 및 API Key (환경 변수 설정 필요)

### 실행 방법
1.  의존성 설치: `pip install -r requirements.txt`
2.  서버 실행: `python backend/server/app.py`
3.  브라우저 접속: `http://localhost:5000`

---

## 📁 프로젝트 구조 (Folder Structure)

*   `backend/`: Flask 서버 로직 및 데이터 관리.
*   `frontend/`: 
    *   `html/`: 메인 페이지 및 컴포넌트 템플릿.
    *   `javascript/`: 모듈화된 프론트엔드 로직 (Auth, Posts, UI 등).
    *   `css/`: 디자인 시스템 및 모듈별 스타일.
*   `assets/`: 로고 및 미디어 자산.

---
© 2026 OurNote Team. All rights reserved.
