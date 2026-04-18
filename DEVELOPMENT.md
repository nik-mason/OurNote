# OurNote Development Guide 🛠

이 문서는 OurNote의 기술적 세부 사항과 기여 가이드라인을 담고 있습니다.

## 1. 데이터 동기화 로직 (Silent Polling)
`frontend/javascript/modules/posts.js`에 구현된 실시간 폴링 시스템은 다음과 같은 방식으로 작동합니다:
- **간격**: 4초 (Vercel 안정성을 위해 조정됨).
- **최적화**: 
    - 사용자가 입력창(`INPUT`, `TEXTAREA`)에 포커스를 두고 있을 때는 UI 갱신을 건너뛰어 입력 방해를 방지합니다.
    - 서버에서 받은 JSON 데이터와 현재 클라이언트의 데이터를 문자열 비교하여 변경 사항이 있을 때만 렌더링 함수를 호출합니다.

## 2. 보안 시스템 (PIN Auth)
- 학생 로그인은 출석 번호와 이름을 기반으로 하며, 설정된 6자리 PIN 번호를 통해 인증을 완료합니다.
- `auth.js`의 `verifyPin` 함수는 암호화(간이) 처리된 PIN을 서버에 대조합니다.

## 3. UI 컴포넌트 구조
- 모든 팝업 모달은 `frontend/html/components/`에 조각(Fragment)으로 관리됩니다.
- 페이지 로드 시 `main.js`의 `loadComponents()` 함수가 이 파일들을 동적으로 불러와 DOM에 주입합니다.

## 4. 애니메이션 가이드라인
- **GSAP/CSS Keyframes**: 복잡한 애니메이션은 `posts.js` 상단의 `injectAnimationCSS`를 통해 동적으로 주입됩니다.
- **이벤트 핸들링**: 애니메이션 도중 중복 클릭을 방지하기 위해 `button.disabled` 상태를 엄격히 관리합니다.

## 5. 배포 및 환경 설정
- **Vercel**: `vercel.json` 설정을 통해 API 경로와 정적 파일을 분리하여 서빙합니다.
- **Supabase**: `app.py`의 `get_supabase_envs` 함수는 Vercel 환경 변수를 자동으로 감지하여 데이터베이스 연결을 설정합니다.

---
최종 업데이트: 2026-04-19
