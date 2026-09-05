# Clawd personal patches

Clawd on Desk를 조금 더 귀엽게 꾸미는 **비공식 개인 패치 모음**이에요. 모션 원본과 생성 소스, 설치 후 재적용 도구, 테스트를 함께 보관해요.

**AI와 함께 만든 개인용 실험**이에요. 제 Windows 환경에서 발견한 문제를 고치며 사용하고 있고, 원본 프로젝트의 PR이나 공식 기능 제안과는 별도로 공유해요. 일반 배포판 수준의 검증이나 지속적인 업데이트 대응을 약속하지는 않아요.

원본 프로젝트: [rullerzhou-afk/clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk) · 라이선스 및 출처: [NOTICE.md](NOTICE.md)

## 들어 있는 것

| 구성 | 내용 |
|---|---|
| `themes/edited-clawd` | 원본 기반 이미지와 개인 모션을 포함한 55개 SVG 및 테마 설정 |
| `src/generate-motions.js` | 새 모션 13종과 움직이는 HTML 도감 생성 소스 |
| `patches/apply-patch.js` | 머리·집게·배·발 위치별 hover 반응 패치 |
| `patches/idle-patch-transform.js` | 커서를 움직이는 중에도 쉬기 모션을 재생하는 코드 변경 |
| `patches/apply-idle-patch.js` | 설치된 앱에 쉬기 재생 변경을 적용하는 도구 |
| `test` | 원래 문제 재현, 우선순위·재생 조건·설치 도구 검사 |

## 어떤 동작이 나오나요?

| 조건 | 동작 |
|---|---|
| 쉬는 중 | 기존 4종 + 기지개, 에취 별가루, 쿠키 냠냠, 별 잡기, 공 굴리기 |
| 생각 중 | 기존 동작 + 갸웃 물음표, 번뜩 전구 중 선택 |
| 작업 세션 1개 | 손을 키보드에 둔 채 이어지는 타이핑 |
| 완료·기쁨 / 알림 | 기존 동작 + 만세 꽃가루 / 편지 중 선택 |
| 머리에 커서 3초 / 빠르게 좌우 문지르기 | 쓰다듬기 / 신난 반응 |
| 집게에 커서 2.4초 / 배에 3.5초 | 하이파이브 / 배 반응 |
| 발에 커서 2.8초 | 발 동동 탭댄스 |
| 몸 오른쪽을 왼쪽 마우스 버튼으로 더블클릭 | 하트 보내기 |
| 빠르게 네 번 클릭 | 기존 특별 반응 + 부끄러워하기 중 선택 |

쉬기 패치는 **Edited.clawd에만 적용**돼요. 쉬기 상태 진입 약 12초 뒤 첫 모션을 시작하고, 완료 후 18~30초 뒤 다음 모션을 골라요. 바로 직전 동작은 다음 선택에서 제외해요. 커서 이동으로 재생을 취소하지 않고, 모션 사이에는 눈 따라가기로 돌아와요.

펫 위에 커서를 올려두면 자동 모션 시작을 미뤄요. 작업·클릭 반응·미니 모드·수면 등 기존 상태 흐름은 계속 우선해요. hover 반응에는 7초 공통 대기시간이 있어요.

## 설치

Windows에 Clawd on Desk와 Node.js 22.12 이상이 설치되어 있어야 해요. 앱의 내부 JavaScript 묶음인 `resources/app.asar`를 변경하므로, 적용할 때 Clawd가 종료되고 다시 실행돼요.

저장소를 내려받은 폴더에서 실행해요.

```powershell
npm ci
npm test
.\Apply-Patches.cmd -CheckOnly
.\Apply-Patches.cmd
```

`-CheckOnly`는 코드 위치와 문법을 확인하며 앱과 테마를 바꾸지 않아요. 실제 적용 시 원본 앱과 기존 테마를 `backups/bundle-날짜시간/`에 먼저 보관해요. 기존 Edited.clawd 테마가 있으면 이 저장소의 버전으로 덮어써요. 다른 테마를 사용 중이라면 앱 설정에서 **Edited.clawd**를 선택해 주세요.

기본 앱 위치는 `%LOCALAPPDATA%\Programs\Clawd on Desk`, 테마 위치는 `%APPDATA%\clawd-on-desk\themes\edited-clawd`예요. 다른 위치라면 다음처럼 지정할 수 있어요.

```powershell
.\Apply-Patches.cmd -InstallDirectory "D:\Apps\Clawd on Desk"
```

앱 업데이트 후에도 같은 명령으로 재적용할 수 있어요. 예상한 코드 위치가 없거나 여러 개면 변경을 중단해요. 이 검사는 호환성의 최소 확인이며 모든 새 버전에 대한 동작 보장은 아니에요.

## 모션 수정과 미리보기

```powershell
npm run generate
```

`generated/motion-pack/preview.html`을 브라우저로 열면 새 모션들이 움직여요. 생성만으로 설치된 앱은 바뀌지 않아요. 수정 결과를 배포하려면 생성된 SVG와 `theme.json`을 `themes/edited-clawd/`의 해당 위치로 옮겨 검사한 후 적용해요.

## 되돌리기

Clawd를 종료한 뒤 `backups/bundle-날짜시간/app.asar`를 앱 설치 폴더의 `resources/app.asar`로 복사해요. 같은 백업의 `theme` 폴더가 있으면 원래 테마 위치로 복사해요. `restore-info.json`에 당시 경로가 기록돼 있어요. 처음 설치한 테마라 백업이 없었다면 앱 설정에서 이전 테마를 선택하면 돼요. 복구 후 Clawd를 다시 실행해 주세요.

백업과 개인 경로를 기록한 복구 정보, 앱 실행 파일, 캐시, npm 의존성 폴더는 Git에 포함하지 않아요.

## 확인한 범위

- 마우스가 계속 움직이면 기존 코드에서 쉬기 모션이 나오지 않는 문제를 재현했어요.
- 수정 후 재생 시작·완료·반복, 직전 동작 제외, 작업·클릭 우선순위, 미니 모드와 수면 조건을 가상 시계로 검사해요.
- 테마 파일 연결과 타이핑 반복 경계를 검사해요.
- 설치 앱에서 패치한 코드 일치와 테마 이미지 로드를 확인했어요. 이미지의 기본 자세·중간 동작·타이핑 반복 경계는 브라우저에서 확인했어요.
- 실제 앱의 모든 상태를 하나씩 발생시켜 관찰한 검사는 아니에요. macOS와 Linux는 확인하지 않았어요.

설치본 패키지는 `1.0.0`을 표시했지만 정확한 원본 커밋은 확인하지 못했어요. 테스트 기준 소스의 해시는 [docs/compatibility.json](docs/compatibility.json)에 남겼어요.
