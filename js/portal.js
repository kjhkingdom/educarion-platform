/**
 * 플랫폼 메인 로비 포털 스크립트 (portal.js)
 * 구글 스프레드시트 연동, 실시간 동기화, 수업 카드 렌더링, 학년/단원별 필터링 기능
 */

document.addEventListener('DOMContentLoaded', () => {
  // 구글 스프레드시트 설정
  const GOOGLE_SHEET_ID = '16l_F7CCNMT9UCLkxoXZc-_G25wO74ydiG273uVBOwtE';
  const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;

  // 기본 내장 수업 목록 (스프레드시트 연동 실패/오프라인 환경 대비용 안전 데이터)
  const defaultLessons = [
    {
      id: 1,
      code: 'LESSON #01',
      title: '원소 탐구실 (주기율표 탐구관)',
      desc: '118개 원소의 주기성과 족·주기 규칙, 보어 원자 모형(K, L, M, N 전자 껍질)과 원자가 전자를 직접 시각화하며 탐구합니다.',
      url: 'periodic-table.html', // 독립 수업 페이지로 직접 연결
      externalUrl: 'https://imuzikr.github.io/test01/',
      icon: '⚛️',
      category: 'high1',
      categoryName: '고1 통합과학',
      unit: '물질의 규칙성과 화학 결합',
      tags: ['#원소주기성', '#보어원자모형', '#원자가전자', '#1족알칼리금속', '#17족할로젠'],
      isReady: true,
      badgeText: '인기 수업'
    },
    {
      id: 2,
      code: 'LESSON #02',
      title: '산염기 중화반응 실험실',
      desc: '산과 염기가 만나 물과 염을 생성하는 중화 반응의 원리를 관찰하고, pH 지시약 색 변화와 온도 변화 그래프를 가상으로 실험합니다.',
      url: 'acid-base.html', // 독립 수업 페이지
      externalUrl: 'https://imuzikr.github.io/test02/',
      icon: '🧪',
      category: 'high1',
      categoryName: '고1 통합과학',
      unit: '화학 변화와 중화반응',
      tags: ['#산과염기', '#중화반응', '#pH지시약', '#수소이온농도', '#중화열'],
      isReady: true,
      badgeText: '신규 오픈'
    }
  ];

  // 준비 중인 미래 과학 수업 슬롯 목록 (카드 2 및 추가 자리)
  const upcomingLessons = [
    {
      id: 3,
      code: 'LESSON #03',
      title: '역학적 에너지 보존 시뮬레이션',
      desc: '자유낙하 운동과 롤러코스터 궤도에서 위치 에너지와 운동 에너지가 상호 전환되는 역학적 에너지 보존 법칙을 탐구합니다.',
      url: '#',
      icon: '🎢',
      category: 'high1',
      categoryName: '고1 통합과학',
      unit: '역학적 시스템',
      tags: ['#역학적에너지', '#운동에너지', '#위치에너지', '#중력가속도'],
      isReady: false,
      badgeText: '준비중'
    },
    {
      id: 4,
      code: 'LESSON #04',
      title: '생체 촉소와 효소 작용 탐구',
      desc: '생명체 내 화학 반응 속도를 조절하는 효소의 기질 특이성과 온도·pH에 따른 활성 변화를 인터랙티브하게 실험합니다.',
      url: '#',
      icon: '🧬',
      category: 'bio',
      categoryName: '생명과학 I',
      unit: '생명 시스템의 기본 단위',
      tags: ['#효소', '#기질특이성', '#최적온도', '#활성화에너지'],
      isReady: false,
      badgeText: '준비중'
    }
  ];

  // 상태 관리
  let allLessons = [...defaultLessons, ...upcomingLessons];
  let currentCategory = 'all';
  let searchQuery = '';

  // DOM 요소 참조
  const lessonsGrid = document.getElementById('lessonsGrid');
  const syncStatusEl = document.getElementById('syncStatus');
  const syncBtn = document.getElementById('syncBtn');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('portalSearchInput');
  const totalCountEl = document.getElementById('totalLessonCount');
  const activeCountEl = document.getElementById('activeLessonCount');

  // 1. 구글 스프레드시트 CSV 파싱 및 동기화
  async function fetchGoogleSheetData() {
    if (!syncStatusEl) return;
    setSyncStatus('syncing', '구글 시트 동기화 중...');

    try {
      const response = await fetch(SHEET_CSV_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error('네트워크 응답 오류');

      const csvText = await response.text();
      const rows = parseCSV(csvText);

      if (rows.length > 0) {
        // 스프레드시트 데이터 기반으로 수업 목록 갱신
        const sheetLessons = rows.map((row, idx) => {
          const title = row['제목'] || row['title'] || `수업 ${idx + 1}`;
          const sheetUrl = row['url'] || row['URL'] || '#';
          
          // 제목 기반으로 로컬 매핑 확인
          let localUrl = sheetUrl;
          let icon = '🔬';
          let tags = ['#과학탐구', '#가상실험'];
          let unit = '통합과학 탐구';
          let desc = '스프레드시트에 등록된 인터랙티브 과학 탐구 수업입니다.';

          if (title.includes('원소')) {
            localUrl = 'periodic-table.html';
            icon = '⚛️';
            tags = ['#원소주기성', '#보어원자모형', '#원자가전자', '#고1통합과학'];
            unit = '물질의 규칙성과 화학 결합';
            desc = '118개 원소의 주기성과 족·주기 규칙, 보어 원자 모형과 전자 배치를 시각적으로 탐구합니다.';
          } else if (title.includes('산염기') || title.includes('중화')) {
            localUrl = 'acid-base.html';
            icon = '🧪';
            tags = ['#산과염기', '#중화반응', '#pH지시약', '#이온반응'];
            unit = '화학 변화와 중화반응';
            desc = '산과 염기가 반응하여 물과 염을 형성하는 중화 반응의 원리와 지시약 색 변화를 관찰합니다.';
          }

          return {
            id: idx + 1,
            code: `LESSON #0${idx + 1}`,
            title: title,
            desc: desc,
            url: localUrl,
            externalUrl: sheetUrl,
            icon: icon,
            category: 'high1',
            categoryName: '고1 통합과학',
            unit: unit,
            tags: tags,
            isReady: true,
            badgeText: idx === 0 ? '추천 수업' : '인기 수업'
          };
        });

        // 스프레드시트 데이터 + 미래 준비중 카드 합체
        allLessons = [...sheetLessons, ...upcomingLessons];
        setSyncStatus('success', '🟢 구글 시트 실시간 연결됨');
        renderLessons();
        return;
      }
    } catch (error) {
      console.warn('구글 시트 연동 실패 (오프라인 모드 유지):', error);
      setSyncStatus('offline', '⚪ 기본 수업 모드 (오프라인)');
      allLessons = [...defaultLessons, ...upcomingLessons];
      renderLessons();
    }
  }

  // 간단하고 견고한 CSV 파서 (줄바꿈 및 쉼표 처리)
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (currentLine.length >= headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = currentLine[index];
        });
        result.push(obj);
      }
    }
    return result;
  }

  // 동기화 상태 배지 UI 업데이트
  function setSyncStatus(state, message) {
    if (!syncStatusEl) return;
    syncStatusEl.textContent = message;
    syncStatusEl.className = 'text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all';

    if (state === 'success') {
      syncStatusEl.classList.add('bg-emerald-950/40', 'text-emerald-400', 'border-emerald-800/60');
    } else if (state === 'syncing') {
      syncStatusEl.classList.add('bg-amber-950/40', 'text-amber-400', 'border-amber-800/60');
    } else {
      syncStatusEl.classList.add('bg-slate-800/60', 'text-slate-400', 'border-slate-700/60');
    }
  }

  // 2. 수업 카드 렌더링
  function renderLessons() {
    if (!lessonsGrid) return;
    lessonsGrid.innerHTML = '';

    // 필터링 및 검색 적용
    const filtered = allLessons.filter(lesson => {
      // 카테고리 필터
      const matchCat = (currentCategory === 'all') || (lesson.category === currentCategory);
      // 검색어 필터
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = (q === '') ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.desc.toLowerCase().includes(q) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });

    // 개수 표시 갱신
    if (totalCountEl) totalCountEl.textContent = allLessons.length;
    if (activeCountEl) activeCountEl.textContent = allLessons.filter(l => l.isReady).length;

    if (filtered.length === 0) {
      lessonsGrid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div class="text-4xl mb-3">🔍</div>
          <p class="text-lg font-medium text-slate-300">검색 조건에 맞는 과학 수업이 없습니다.</p>
          <p class="text-sm mt-1 text-slate-500">다른 검색어를 입력하시거나 필터를 '전체'로 변경해 보세요.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(lesson => {
      const card = createLessonCard(lesson);
      lessonsGrid.appendChild(card);
    });
  }

  // 개별 수업 카드 DOM 생성
  function createLessonCard(lesson) {
    const card = document.createElement('div');
    card.className = `group relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
      lesson.isReady 
        ? 'bg-slate-900/70 border border-slate-800 hover:border-indigo-500/70 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1' 
        : 'bg-slate-900/40 border border-dashed border-slate-800/80 opacity-75'
    }`;

    // 태그 HTML
    const tagsHtml = lesson.tags.map(tag => 
      `<span class="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700/60 font-medium">${tag}</span>`
    ).join(' ');

    // 버튼 영역
    let actionBtnHtml = '';
    if (lesson.isReady) {
      actionBtnHtml = `
        <div class="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <a href="${lesson.url}" class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all">
            <span>탐구 시작하기</span>
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </a>
          ${lesson.externalUrl ? `
            <a href="${lesson.externalUrl}" target="_blank" rel="noopener noreferrer" title="외부 스프레드시트 실습 링크로 열기" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          ` : ''}
        </div>
      `;
    } else {
      actionBtnHtml = `
        <div class="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between text-slate-500 text-xs">
          <span class="inline-flex items-center gap-1.5 font-medium">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            콘텐츠 개발 진행 중
          </span>
          <span class="text-slate-600">준비중</span>
        </div>
      `;
    }

    // 카드 상단 헤더 (배지 및 수업 번호)
    const badgeColor = lesson.isReady ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50' : 'bg-slate-800 text-slate-400 border-slate-700';

    card.innerHTML = `
      <div>
        <!-- 카드 상단 메타 정보 -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-mono font-bold tracking-wider text-indigo-400">${lesson.code}</span>
          <span class="text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${badgeColor}">
            ${lesson.badgeText}
          </span>
        </div>

        <!-- 아이콘 및 수업 제목 -->
        <div class="flex items-start gap-3.5 mb-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-900/60 to-slate-800 flex items-center justify-center text-2xl shadow-inner border border-indigo-500/20 shrink-0">
            ${lesson.icon}
          </div>
          <div>
            <div class="text-xs text-slate-400 font-medium mb-0.5">${lesson.unit}</div>
            <h3 class="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
              ${lesson.title}
            </h3>
          </div>
        </div>

        <!-- 수업 설명 문구 -->
        <p class="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">
          ${lesson.desc}
        </p>

        <!-- 과학 개념 태그 목록 -->
        <div class="flex flex-wrap gap-1.5">
          ${tagsHtml}
        </div>
      </div>

      <!-- 카드 하단 버튼 영역 -->
      ${actionBtnHtml}
    `;

    return card;
  }

  // 3. 필터 탭 클릭 이벤트
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
        t.classList.add('bg-slate-800/80', 'text-slate-300');
      });
      tab.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
      tab.classList.remove('bg-slate-800/80', 'text-slate-300');

      currentCategory = tab.getAttribute('data-category');
      renderLessons();
    });
  });

  // 4. 검색창 이벤트
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderLessons();
    });
  }

  // 5. 수동 동기화 버튼 클릭
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      fetchGoogleSheetData();
    });
  }

  // 초기 로드: 구글 시트 데이터 가져오기 시도
  fetchGoogleSheetData();
});
