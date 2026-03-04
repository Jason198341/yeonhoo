# Yeonhoo Terminal — 설치 및 사용 매뉴얼

## 1. 다운로드 및 설치

### 방법 A: 인스톨러로 설치 (가장 쉬움)

1. https://github.com/Jason198341/yeonhoo/releases/tag/v0.1.0 접속
2. 아래 두 파일 중 하나를 다운로드:
   - **`yeonhoo_0.1.0_x64-setup.exe`** (3.1MB) — 더블클릭으로 설치 (추천)
   - **`yeonhoo_0.1.0_x64_en-US.msi`** (4.5MB) — Windows MSI 설치
3. 다운받은 파일 실행
4. Windows SmartScreen 경고가 뜨면 → "추가 정보" → "실행" 클릭
5. 설치 완료 후 시작 메뉴에서 "Yeonhoo" 검색하여 실행

> **요구사항**: Windows 10/11 64bit, WebView2 Runtime (Windows 11은 기본 포함, Windows 10은 자동 설치됨)

### 방법 B: 소스에서 빌드

개발자용. 직접 빌드하고 싶을 때.

```bash
# 1. 사전 요구사항 설치
# - Rust: https://rustup.rs
# - Bun: https://bun.sh
# - Node.js 18+: https://nodejs.org

# 2. 소스 클론
git clone https://github.com/Jason198341/yeonhoo.git
cd yeonhoo

# 3. 의존성 설치
bun install

# 4-A. 개발 모드로 실행 (핫 리로드 지원)
bun run tauri dev

# 4-B. 또는 인스톨러 빌드
bun run tauri build
# 결과물: src-tauri/target/release/bundle/nsis/yeonhoo_*-setup.exe
```

---

## 2. 첫 실행

앱을 실행하면 다음 화면이 나타납니다:

```
┌─────────────────────────────────────────────┐
│ [Terminal]  [+]                    (Tab Bar) │
├─────────────────────────────────────────────┤
│                                             │
│  $ _                        (Terminal Pane) │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ Terminal  │  Yeonhoo Dark  │ 1 tab · 1 pane│
└─────────────────────────────────────────────┘
```

- **상단**: 탭 바 (탭 전환, 새 탭 추가)
- **중앙**: 터미널 영역 (명령어 입력)
- **하단**: 상태 바 (모드, 테마, 탭/페인 수, 메모리)

---

## 3. 기본 사용법

### 3.1 명령어 입력

터미널에 직접 타이핑하면 됩니다. 일반 터미널과 동일합니다.

```bash
# 예시
ls
cd Documents
git status
```

### 3.2 복사 & 붙여넣기

| 동작 | 단축키 |
|---|---|
| 붙여넣기 | `Ctrl+V` |
| 복사 (텍스트 드래그 후) | `Ctrl+C` 또는 `Ctrl+Shift+C` |
| 복사 (대체) | `Ctrl+Insert` |

> **Smart Paste**: Windows 경로(`C:\Users\...`)를 붙여넣으면 자동으로 Unix 경로(`/c/Users/...`)로 변환됩니다. MSYS2/WSL 환경에서 유용합니다.

### 3.3 파일 붙여넣기

탐색기에서 파일을 복사(Ctrl+C)한 후 터미널에서 `Ctrl+V`를 누르면 파일 경로가 자동 입력됩니다.

---

## 4. 탭 관리

여러 터미널을 탭으로 관리할 수 있습니다.

| 동작 | 단축키 | 설명 |
|---|---|---|
| 새 탭 | `Ctrl+Shift+T` | 새로운 터미널 탭 생성 |
| 탭 닫기 | `Ctrl+Shift+W` | 현재 탭 닫기 |
| 다음 탭 | `Ctrl+Tab` | 오른쪽 탭으로 이동 |
| 이전 탭 | `Ctrl+Shift+Tab` | 왼쪽 탭으로 이동 |

탭 바에서 탭을 클릭해도 전환됩니다. `[+]` 버튼으로 새 탭을 추가할 수 있습니다.

---

## 5. 화면 분할 (Split Panes)

하나의 탭 안에서 터미널을 분할할 수 있습니다.

| 동작 | 단축키 | 설명 |
|---|---|---|
| 수평 분할 | `Ctrl+Shift+\` | 좌우로 분할 |
| 수직 분할 | `Ctrl+Shift+-` | 상하로 분할 |
| 페인 닫기 | `Ctrl+Shift+X` | 현재 페인 닫기 |

분할 후 모습:

```
┌──────────────────┬──────────────────┐
│                  │                  │
│  $ git log       │  $ npm test      │
│                  │                  │
│  (Pane 1)        │  (Pane 2)        │
│                  │                  │
└──────────────────┴──────────────────┘
```

- 분할 경계선을 드래그하면 크기를 조절할 수 있습니다.
- 페인을 클릭하면 해당 페인이 활성화됩니다.

---

## 6. 커맨드 팔레트

**`Ctrl+Shift+P`** 를 누르면 커맨드 팔레트가 열립니다.

모든 기능을 검색하고 실행할 수 있습니다:

```
┌──────────────────────────────────┐
│ Type a command...                │
├──────────────────────────────────┤
│ New Tab                Ctrl+Shift+T │
│ Close Tab              Ctrl+Shift+W │
│ Split Horizontal       Ctrl+Shift+\ │
│ Theme: Yeonhoo Dark               │
│ Theme: Midnight Ocean              │
│ Search History         Ctrl+R      │
│ ...                                │
└──────────────────────────────────┘
```

- 타이핑하면 실시간 필터링됩니다
- `↑` `↓` 화살표로 선택, `Enter`로 실행
- `Esc`로 닫기

---

## 7. 명령어 히스토리 검색

**`Ctrl+R`** 을 누르면 이전에 입력한 명령어를 검색할 수 있습니다.

```
┌──────────────────────────────────┐
│ 🔍 Search history...     ESC닫기 │
├──────────────────────────────────┤
│ git push origin main      10분 전 │
│ npm run build              1시간 전 │
│ docker compose up         어제    │
└──────────────────────────────────┘
```

- 검색어를 입력하면 실시간으로 필터링됩니다
- `Enter`로 선택한 명령어를 터미널에 입력합니다
- 모든 명령어는 자동 저장됩니다 (SQLite DB)

---

## 8. 슬래시 명령어 자동완성

터미널에서 `/`를 입력하면 Claude Code 명령어 자동완성이 표시됩니다.

```
$ /
┌──────────────────────────────────┐
│ / Commands                       │
├──────────────────────────────────┤
│ /compact   Compact conversation  │
│ /clear     Clear history         │
│ /help      Show help             │
│ /cost      Show token usage      │
│ /model     Switch AI model       │
│ ...                              │
└──────────────────────────────────┘
```

- `↑` `↓`로 선택, `Tab` 또는 `Enter`로 입력
- Claude Code를 사용하지 않아도 일반 셸에서 작동합니다

---

## 9. 테마 변경

5가지 내장 테마를 제공합니다:

| 테마 | 설명 |
|---|---|
| **Yeonhoo Dark** | 기본 다크 테마 (보라색 액센트) |
| **Midnight Ocean** | GitHub 스타일 다크 (파란색 액센트) |
| **Aurora Green** | 초록색 액센트 다크 테마 |
| **Warm Ember** | 따뜻한 주황색 다크 테마 |
| **Yeonhoo Light** | 라이트 테마 |

### 테마 변경 방법

**방법 1**: 하단 상태 바에서 테마 이름을 클릭 → 다음 테마로 순환

**방법 2**: `Ctrl+Shift+P` → "Theme" 입력 → 원하는 테마 선택

**방법 3**: 설정 파일에서 직접 변경
```toml
# ~/.yeonhoo/config.toml
[appearance]
theme = "midnight-ocean"
```

---

## 10. Claude Code 연동

Yeonhoo는 Claude Code를 위해 최적화된 터미널입니다.

### Claude Code 실행

터미널에서 Claude Code를 실행하면 자동 감지됩니다:

```bash
claude
```

감지되면:
- 하단 상태 바에 **Claude** 뱃지 표시
- 페인 테두리가 보라색으로 강조
- 토큰 사용량과 비용이 실시간 표시됩니다

### Claude Code 슬래시 명령어

Claude Code 세션에서 `/`를 입력하면 사용 가능한 명령어가 자동완성됩니다:

- `/compact` — 대화 압축
- `/clear` — 대화 기록 초기화
- `/cost` — 토큰 사용량 확인
- `/model` — AI 모델 변경
- `/help` — 도움말

---

## 11. 세션 복원

앱을 닫아도 탭과 페인 레이아웃이 자동 저장됩니다.

다시 실행하면 이전 레이아웃(탭 수, 분할 구조)이 복원됩니다.

> **참고**: 터미널 내용(명령어 출력)은 복원되지 않습니다. 레이아웃 구조만 복원됩니다.

세션 파일 위치: `~/.yeonhoo/session.json`

---

## 12. 설정 파일

설정 파일은 `~/.yeonhoo/config.toml`에 있습니다.

파일을 저장하면 **자동으로 반영됩니다** (앱 재시작 불필요).

### 전체 설정 예시

```toml
[appearance]
theme = "yeonhoo-dark"       # 테마 ID
font_family = "JetBrains Mono"  # 터미널 폰트
font_size = 14               # 폰트 크기 (pt)

[terminal]
scrollback = 10000           # 스크롤백 버퍼 줄 수
cursor_style = "block"       # block, underline, bar
cursor_blink = true          # 커서 깜빡임

[claude]
auto_detect = true           # Claude Code 자동 감지
show_metrics = true          # 토큰/비용 표시

[notifications]
permission_alert = true      # Claude 권한 요청 알림
sound = false                # 소리 알림

[keybindings]
# 커스텀 키 바인딩 (향후 지원)
```

### 설정 파일 열기

- 커맨드 팔레트(`Ctrl+Shift+P`) → "Open Config File" 선택
- 또는 직접: `~/.yeonhoo/config.toml` 파일 편집

---

## 13. 플러그인

커스텀 테마나 명령어를 플러그인으로 추가할 수 있습니다.

### 플러그인 설치

1. `~/.yeonhoo/plugins/` 폴더로 이동 (없으면 자동 생성됨)
2. 플러그인 폴더 생성: `~/.yeonhoo/plugins/my-plugin/`
3. `plugin.json` 파일 작성

### 플러그인 예시: 커스텀 테마

```
~/.yeonhoo/plugins/
  └── cyberpunk-theme/
      └── plugin.json
```

`plugin.json`:
```json
{
  "id": "cyberpunk-theme",
  "name": "Cyberpunk Theme Pack",
  "version": "1.0.0",
  "description": "Neon cyberpunk color themes",
  "themes": [
    {
      "id": "neon-city",
      "name": "Neon City",
      "terminal": {
        "background": "#0a0a1a",
        "foreground": "#00ff88",
        "cursor": "#ff00ff",
        "selectionBackground": "#ff00ff44",
        "black": "#1a1a2e",
        "red": "#ff2255",
        "green": "#00ff88",
        "yellow": "#ffaa00",
        "blue": "#0088ff",
        "magenta": "#ff00ff",
        "cyan": "#00ffff",
        "white": "#e0e0e0",
        "brightBlack": "#444466",
        "brightRed": "#ff4477",
        "brightGreen": "#44ffaa",
        "brightYellow": "#ffcc44",
        "brightBlue": "#44aaff",
        "brightMagenta": "#ff44ff",
        "brightCyan": "#44ffff",
        "brightWhite": "#ffffff"
      },
      "ui": {
        "bg": "#0a0a1a",
        "bgSecondary": "#12122a",
        "border": "#2a2a4a",
        "text": "#e0e0e0",
        "textMuted": "#6666aa",
        "accent": "#ff00ff",
        "accentDim": "#ff00ff44"
      }
    }
  ],
  "commands": [],
  "keybindings": []
}
```

4. 앱을 재시작하면 커맨드 팔레트에 "Theme: Neon City"가 추가됩니다.

---

## 14. 전체 단축키 목록

| 단축키 | 기능 |
|---|---|
| `Ctrl+Shift+T` | 새 탭 |
| `Ctrl+Shift+W` | 탭 닫기 |
| `Ctrl+Tab` | 다음 탭 |
| `Ctrl+Shift+Tab` | 이전 탭 |
| `Ctrl+Shift+\` | 수평 분할 (좌우) |
| `Ctrl+Shift+-` | 수직 분할 (상하) |
| `Ctrl+Shift+X` | 페인 닫기 |
| `Ctrl+Shift+P` | 커맨드 팔레트 |
| `Ctrl+R` | 히스토리 검색 |
| `Ctrl+V` | 스마트 붙여넣기 |
| `Ctrl+C` (선택 시) | 복사 |
| `Ctrl+Shift+C` | 복사 |
| `Ctrl+Insert` | 복사 |
| `Esc` | 오버레이 닫기 |

---

## 15. 파일 위치 정리

| 파일/폴더 | 위치 | 설명 |
|---|---|---|
| 설정 파일 | `~/.yeonhoo/config.toml` | 앱 설정 (자동 핫리로드) |
| 세션 파일 | `~/.yeonhoo/session.json` | 탭/페인 레이아웃 자동 저장 |
| 히스토리 DB | `~/.yeonhoo/history.db` | 명령어 기록 (SQLite) |
| 플러그인 | `~/.yeonhoo/plugins/` | 커스텀 플러그인 폴더 |

> `~`는 Windows에서 `C:\Users\사용자이름`입니다.

---

## 16. 문제 해결 (FAQ)

### Q: 설치 시 "Windows에서 PC를 보호했습니다" 경고가 뜹니다
**A**: 코드 서명이 없어서 나오는 정상적인 경고입니다. "추가 정보" → "실행"을 클릭하세요.

### Q: 첫 번째 터미널에 키가 안 먹힙니다
**A**: 터미널 영역을 한 번 클릭해서 포커스를 주세요. 그래도 안 되면 앱을 재시작하세요.

### Q: 테마가 바뀌지 않습니다
**A**: `config.toml`의 테마 ID가 정확한지 확인하세요. 유효한 값: `yeonhoo-dark`, `midnight-ocean`, `aurora-green`, `warm-ember`, `yeonhoo-light`

### Q: Claude Code가 감지되지 않습니다
**A**: `claude` 명령어가 PATH에 있는지 확인하세요. 터미널에서 `claude --version`을 실행해보세요.

### Q: 한글이 깨집니다
**A**: `config.toml`에서 폰트를 한글 지원 폰트로 변경하세요:
```toml
[appearance]
font_family = "D2Coding"
```

### Q: 세션 복원을 비활성화하고 싶습니다
**A**: `~/.yeonhoo/session.json` 파일을 삭제하면 다음 실행 시 빈 상태로 시작합니다.

### Q: 플러그인이 로드되지 않습니다
**A**: `plugin.json`의 JSON 형식이 올바른지 확인하세요. 앱을 재시작해야 플러그인이 로드됩니다.

---

## 17. 빌드 환경 요구사항 (개발자용)

| 도구 | 버전 | 설치 |
|---|---|---|
| Rust | 1.75+ | https://rustup.rs |
| Bun | 1.0+ | https://bun.sh |
| Node.js | 18+ | https://nodejs.org |
| Visual Studio Build Tools | 2022 | C++ 빌드 도구 포함 |

Windows에서 Rust 빌드를 위해 Visual Studio Build Tools가 필요합니다. `rustup` 설치 시 자동으로 안내됩니다.
