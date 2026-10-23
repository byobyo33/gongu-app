# 공구장부

카카오톡 오픈채팅으로 받는 공동구매 주문을 손님 번호(닉네임 뒤 숫자)별로 정리하고, 입금·수령을 사장님과 직원이 함께 관리하는 휴대폰용 웹앱이에요.

- 카톡 **대화 내보내기 → 공유 → 공구장부**로 대화를 보내면 공구 상품과 주문을 자동으로 정리해요.
- 수령 카운터: 손님 번호만 누르면 주문과 받을 돈이 크게 보여요.
- 사장님 목록 대조, 안 온 손님 @멘션 복사, 미입금 목록 복사, 직접 공구·손님 등록.
- 구글 로그인, 장부 주인이 초대한 이메일만 볼 수 있어요.

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 앱 화면 전체 |
| `sw.js` | 오프라인 저장, 카톡 공유 받기 |
| `manifest.webmanifest` | 홈 화면 설치·공유 대상 등록 |
| `firebase-config.js` | Firebase 웹 앱 설정값 |
| `firestore.rules` | 데이터 접근 규칙 (Firebase 콘솔에 붙여넣기) |

## 처음 설정

1. Firebase 프로젝트를 만들고 **Authentication → Google** 로그인을 켜요. 승인된 도메인에 `byobyo33.github.io`를 추가해요.
2. **Firestore Database**를 서울(asia-northeast3) 위치로 만들고, 규칙 탭에 `firestore.rules` 내용을 붙여넣어 게시해요.
3. 프로젝트 설정의 웹 앱 `firebaseConfig` 값을 `firebase-config.js`에 넣어요.
4. GitHub 저장소 **Settings → Pages**에서 `main` 브랜치의 `/ (root)`로 배포해요.
5. 휴대폰 크롬에서 `https://byobyo33.github.io/gongu-app/`을 열고 **앱 설치**(또는 홈 화면에 추가)를 해요.
