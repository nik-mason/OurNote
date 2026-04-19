## 1. 데이터 동기화 및 실시간 업데이트 (Real-time Polling)
OurNote는 서버 부하와 사용자 경험 사이의 균형을 위해 '지능형 폴링(Intelligent Polling)' 시스템을 사용합니다.

### 1.1 폴링 메커니즘 (`posts.js`)
*   **주기**: 4,000ms (4초).
*   **동작 원리**:
    1.  현재 사용자의 `state.currentUser`가 존재하는지 확인.
    2.  `document.activeElement`를 체크하여 사용자가 입력창(`INPUT`, `TEXTAREA`)에 포커스를 두고 있는지 확인. 입력 중이면 업데이트를 건너뜁니다.
    3.  현재 카테고리(`state.currentCategory`)가 'homework'인지 'posts'인지에 따라 해당 API 호출.
    4.  받아온 JSON 데이터를 `JSON.stringify` 하여 `window.currentPosts` 또는 `window.currentHomework`와 비교.
    5.  **차이가 있을 때만** `renderPosts()` 또는 `renderHomework()`를 호출하여 UI를 갱신합니다.
    6.  만약 상세 모달(`post-detail-modal`)이 열려 있다면(`window.currentOpenPostId`), 모달 내부의 데이터도 `updateDetailContent()`를 통해 새로고침 없이 조용히 업데이트합니다.

## 2. 보안 인증 체계 (Two-Step Auth)
OurNote의 보안은 사용자 편의성과 안전을 동시에 고려합니다.

### 2.1 학생 로그인 로직 (`auth.js`)
*   **1단계 (Primary Auth)**: 출석 번호와 이름을 통해 서버(`students.json`)에서 해당 학생을 찾습니다.
*   **2단계 (PIN Auth)**: 학생이 발견되면 `pin-modal`이 활성화됩니다. 사용자는 커스텀 숫자 패드를 통해 6자리 PIN을 입력합니다.
*   **PIN 데이터**: PIN은 평문이 아닌 마스킹된 상태로 UI에 표시되며, `verifyPin` 프로세스를 거쳐 최종 `state.currentUser`가 앱 메모리에 저장됩니다.

### 2.2 선생님 인증 및 권한
*   선생님은 `teacher.json`에 정의된 마스터 계정으로 로그인합니다.
*   로그인 성공 시 `role: 'teacher'`를 부여받으며, 이 권한은 다음과 같은 UI 변화를 가져옵니다:
    *   모든 게시물과 숙제에 '삭제' 버튼 노출.
    *   학생용 PIN 번호 수정 및 관리자 설정 메뉴 활성화.
    *   숙제 생성 시 대상 학생을 '전체' 또는 '개별 선택'할 수 있는 멀티 칩 시스템 활성화.

## 3. 프론트엔드 상태 객체 (Global State Container)
`common.js`에서 관리되는 `state` 객체의 주요 필드는 다음과 같습니다:
*   `currentUser`: 현재 로그인한 사용자 정보 (id, name, role).
*   `isDashboard`: 현재 페이지가 대시보드인지 여부.
*   `currentCategory`: 현재 필터링된 게시물 카테고리 (all, notice, event, homework 등).
*   `theme`: 'light' 또는 'dark' 모드 상태.

## 4. UI 및 애니메이션 엔진
시각적 완성도를 위해 다음과 같은 라이브러리와 커스텀 로직을 사용합니다.

### 4.1 동적 스타일 주입
`posts.js`가 로드될 때 `injectAnimationCSS()` 익명 함수가 실행되어, 종이 비행기(`planeFlying`), 하트 팝업(`heartFloat`), 숙제 체크(`hwCheckPulse`)와 같은 복잡한 CSS Keyframes를 `document.head`에 즉시 주입합니다.

### 4.2 모달 시스템 (V4)
모든 모달은 `modal-v4` 클래스를 공유하며, `.active` 클래스가 추가될 때 `transform: scale(1)`과 `opacity: 1`이 적용되는 3D 폴딩 전환 효과를 가집니다.

---
최종 업데이트: 2026-04-19
