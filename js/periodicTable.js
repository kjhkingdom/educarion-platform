/**
 * 원소 주기율표 탐구관 제어 스크립트 (periodicTable.js)
 * 원소 렌더링, 필터링, 검색, 모달 및 보어 모형 SVG 시각화
 */

document.addEventListener('DOMContentLoaded', () => {
  // 상태 변수 (State Management)
  let currentCategory = 'all';
  let isCore20Only = false;
  let searchQuery = '';
  let currentElementIndex = 0;

  // DOM 요소 참조
  const gridContainer = document.getElementById('periodicGridContainer');
  const lanthanideRow = document.getElementById('lanthanideRow');
  const actinideRow = document.getElementById('actinideRow');
  const searchInput = document.getElementById('searchInput');
  const btnToggleCore = document.getElementById('btnToggleCore');
  const filterBtns = document.querySelectorAll('[data-filter]');

  // 모달 요소 참조
  const modal = document.getElementById('elementModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnPrev = document.getElementById('btnPrevElement');
  const btnNext = document.getElementById('btnNextElement');
  const modalNumber = document.getElementById('modalNumber');
  const modalSymbol = document.getElementById('modalSymbol');
  const modalNameKo = document.getElementById('modalNameKo');
  const modalNameEn = document.getElementById('modalNameEn');
  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalAtomicWeight = document.getElementById('modalAtomicWeight');
  const modalPeriod = document.getElementById('modalPeriod');
  const modalGroup = document.getElementById('modalGroup');
  const modalValence = document.getElementById('modalValence');
  const modalPhase = document.getElementById('modalPhase');
  const modalShellPills = document.getElementById('modalShellPills');
  const modalBohrSvg = document.getElementById('modalBohrSvg');
  const modalSummary = document.getElementById('modalSummary');
  const modalHighSchool = document.getElementById('modalHighSchool');
  const modalRealLife = document.getElementById('modalRealLife');
  const modalDiscovery = document.getElementById('modalDiscovery');

  // 1. 주기율표 카드 렌더링 함수
  function renderPeriodicTable() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    if (lanthanideRow) lanthanideRow.innerHTML = '';
    if (actinideRow) actinideRow.innerHTML = '';

    // 1~7주기 원소 배치 (1~18족)
    periodicElements.forEach((el, index) => {
      // 란타넘족(57~71)과 악티늄족(89~103)은 별도 행으로 분류
      const isLanthanide = el.number >= 57 && el.number <= 71;
      const isActinide = el.number >= 89 && el.number <= 103;

      const card = createElementCard(el, index);

      if (isLanthanide) {
        if (lanthanideRow) lanthanideRow.appendChild(card);
      } else if (isActinide) {
        if (actinideRow) actinideRow.appendChild(card);
      } else {
        // 메인 그리드 상의 위치 (CSS Grid Row & Column)
        card.style.gridRow = el.period;
        card.style.gridColumn = el.group;
        gridContainer.appendChild(card);
      }
    });

    // 란타넘족 / 악티늄족 자리표시자 (메인 그리드 6, 7주기 3족 자리)
    const lPlaceholder = document.createElement('div');
    lPlaceholder.className = 'element-card cat-lanthanide flex items-center justify-center text-center p-1 text-xs text-purple-300 font-bold border border-purple-500/40 rounded-lg';
    lPlaceholder.style.gridRow = 6;
    lPlaceholder.style.gridColumn = 3;
    lPlaceholder.innerHTML = '57-71<br><span class="text-[9px]">란타넘족</span>';
    gridContainer.appendChild(lPlaceholder);

    const aPlaceholder = document.createElement('div');
    aPlaceholder.className = 'element-card cat-actinide flex items-center justify-center text-center p-1 text-xs text-slate-300 font-bold border border-slate-500/40 rounded-lg';
    aPlaceholder.style.gridRow = 7;
    aPlaceholder.style.gridColumn = 3;
    aPlaceholder.innerHTML = '89-103<br><span class="text-[9px]">악티늄족</span>';
    gridContainer.appendChild(aPlaceholder);

    applyFilters();
  }

  // 카드 DOM 노드 생성
  function createElementCard(el, index) {
    const card = document.createElement('div');
    card.className = `element-card cat-${el.category} ${el.isCore20 ? 'is-core' : ''}`;
    card.setAttribute('data-number', el.number);
    card.setAttribute('data-category', el.category);
    card.setAttribute('data-symbol', el.symbol.toLowerCase());
    card.setAttribute('data-name', el.nameKo);

    const valenceDisplay = el.valenceElectrons !== undefined ? `${el.valenceElectrons}e⁻` : '-';

    card.innerHTML = `
      <div class="card-top">
        <span class="card-number">${el.number}</span>
        <span class="card-valence" title="원자가 전자 수: ${valenceDisplay}">${valenceDisplay}</span>
      </div>
      <div class="card-center">
        <div class="card-symbol">${el.symbol}</div>
        <div class="card-name-ko">${el.nameKo}</div>
      </div>
      <div class="card-bottom">${el.atomicWeight || ''}</div>
    `;

    card.addEventListener('click', () => {
      openModal(index);
    });

    return card;
  }

  // 2. 필터 및 검색 적용
  function applyFilters() {
    const allCards = document.querySelectorAll('.element-card[data-number]');

    allCards.forEach(card => {
      const num = parseInt(card.getAttribute('data-number'), 10);
      const cat = card.getAttribute('data-category');
      const name = card.getAttribute('data-name');
      const symbol = card.getAttribute('data-symbol');

      let matchCategory = true;
      if (currentCategory !== 'all') {
        if (currentCategory === 'metals') {
          matchCategory = ['alkali-metal', 'alkaline-earth', 'transition', 'post-transition', 'lanthanide', 'actinide'].includes(cat);
        } else if (currentCategory === 'nonmetals') {
          matchCategory = ['nonmetal', 'halogen', 'noble-gas'].includes(cat);
        } else {
          matchCategory = (cat === currentCategory);
        }
      }

      let matchCore = true;
      if (isCore20Only) {
        matchCore = (num <= 20);
      }

      let matchSearch = true;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        matchSearch = name.toLowerCase().includes(q) || symbol.includes(q) || num.toString() === q;
      }

      if (matchCategory && matchCore && matchSearch) {
        card.classList.remove('is-dimmed');
        if (isCore20Only && num <= 20) {
          card.classList.add('is-core-highlight');
        } else {
          card.classList.remove('is-core-highlight');
        }
      } else {
        card.classList.add('is-dimmed');
        card.classList.remove('is-core-highlight');
      }
    });
  }

  // 3. 모달 제어 및 보어 원자 모형 시각화
  function openModal(index) {
    if (index < 0 || index >= periodicElements.length) return;
    currentElementIndex = index;
    const el = periodicElements[index];

    modalNumber.textContent = `No. ${el.number}`;
    modalSymbol.textContent = el.symbol;
    modalNameKo.textContent = el.nameKo;
    modalNameEn.textContent = el.nameEn;
    modalCategoryBadge.textContent = el.categoryKo || el.category;
    modalAtomicWeight.textContent = el.atomicWeight ? `${el.atomicWeight} u` : '자료 없음';
    modalPeriod.textContent = `${el.period}주기`;
    modalGroup.textContent = `${el.group}족`;
    modalValence.textContent = el.valenceElectrons !== undefined ? `${el.valenceElectrons}개` : '해당 없음';
    modalPhase.textContent = el.phaseKo || el.phase || '고체';
    modalDiscovery.textContent = el.discoveryYear || '고대 (선사시대)';

    // 전자 껍질 알약(Pill) 태그 표시
    modalShellPills.innerHTML = '';
    const shellLetters = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
    if (el.shells && el.shells.length > 0) {
      el.shells.forEach((electrons, i) => {
        const pill = document.createElement('span');
        pill.className = 'px-2 py-0.5 rounded text-xs font-semibold bg-indigo-900/60 text-indigo-200 border border-indigo-700/50';
        pill.textContent = `${shellLetters[i]}껍질: ${electrons}e⁻`;
        modalShellPills.appendChild(pill);
      });
    } else {
      modalShellPills.innerHTML = '<span class="text-xs text-slate-400">데이터 없음</span>';
    }

    // 설명 및 고1 학습 포인트
    modalSummary.textContent = el.summary || `${el.nameKo}에 대한 기본 화학적 특성입니다.`;
    modalHighSchool.textContent = el.highSchoolPoint || `원자 번호 ${el.number}번으로, ${el.period}주기 ${el.group}족에 위치합니다.`;
    modalRealLife.textContent = el.realLifeUsage || '산업 및 연구용으로 다양하게 활용됩니다.';

    // 보어 원자 모형 SVG 렌더링
    renderBohrModel(el);

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  // 보어 원자 모형 SVG 그리기 함수
  function renderBohrModel(el) {
    if (!modalBohrSvg) return;
    modalBohrSvg.innerHTML = '';

    const width = 280;
    const height = 280;
    const cx = width / 2;
    const cy = height / 2;
    const shells = el.shells || [el.number];

    // SVG 네임스페이스
    const svgNS = "http://www.w3.org/2000/svg";

    // 1) 중앙 원자핵 (Nucleus)
    const nucleus = document.createElementNS(svgNS, 'circle');
    nucleus.setAttribute('cx', cx);
    nucleus.setAttribute('cy', cy);
    nucleus.setAttribute('r', '22');
    nucleus.setAttribute('fill', 'url(#nucleusGradient)');
    nucleus.setAttribute('filter', 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))');
    modalBohrSvg.appendChild(nucleus);

    // 원자핵 텍스트 (+ 양성자 수)
    const nucText = document.createElementNS(svgNS, 'text');
    nucText.setAttribute('x', cx);
    nucText.setAttribute('y', cy + 5);
    nucText.setAttribute('text-anchor', 'middle');
    nucText.setAttribute('fill', '#ffffff');
    nucText.setAttribute('font-size', '12');
    nucText.setAttribute('font-weight', 'bold');
    nucText.textContent = `+${el.number}`;
    modalBohrSvg.appendChild(nucText);

    // 2) 전자 껍질 궤도와 전자 배치
    const baseRadius = 38;
    const radiusStep = 18;

    shells.forEach((electronCount, sIndex) => {
      const r = baseRadius + (sIndex * radiusStep);

      // 궤도 동심원
      const orbit = document.createElementNS(svgNS, 'circle');
      orbit.setAttribute('cx', cx);
      orbit.setAttribute('cy', cy);
      orbit.setAttribute('r', r);
      orbit.setAttribute('fill', 'none');
      orbit.setAttribute('stroke', 'rgba(148, 163, 184, 0.35)');
      orbit.setAttribute('stroke-width', '1.2');
      orbit.setAttribute('stroke-dasharray', '3 3');
      modalBohrSvg.appendChild(orbit);

      // 궤도 위의 전자들
      const count = Math.min(electronCount, 32);
      for (let e = 0; e < count; e++) {
        const angle = (2 * Math.PI / count) * e - (Math.PI / 2);
        const ex = cx + r * Math.cos(angle);
        const ey = cy + r * Math.sin(angle);

        const electron = document.createElementNS(svgNS, 'circle');
        electron.setAttribute('cx', ex);
        electron.setAttribute('cy', ey);
        electron.setAttribute('r', '4');
        electron.setAttribute('fill', '#38bdf8');
        electron.setAttribute('class', 'bohr-electron');
        modalBohrSvg.appendChild(electron);
      }
    });
  }

  // 4. 이벤트 바인딩
  if (btnToggleCore) {
    btnToggleCore.addEventListener('click', () => {
      isCore20Only = !isCore20Only;
      if (isCore20Only) {
        btnToggleCore.classList.add('bg-indigo-600', 'text-white', 'shadow-lg');
        btnToggleCore.classList.remove('bg-slate-800', 'text-slate-300');
        btnToggleCore.innerHTML = '✨ 고1 필수 1~20번 집중 중';
      } else {
        btnToggleCore.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg');
        btnToggleCore.classList.add('bg-slate-800', 'text-slate-300');
        btnToggleCore.innerHTML = '🌟 고1 필수 1~20번만 보기';
      }
      applyFilters();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-500');
        b.classList.add('bg-slate-800/80', 'text-slate-300', 'border-slate-700');
      });
      btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-500');
      btn.classList.remove('bg-slate-800/80', 'text-slate-300', 'border-slate-700');
      currentCategory = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentElementIndex > 0) openModal(currentElementIndex - 1);
      else openModal(periodicElements.length - 1);
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentElementIndex < periodicElements.length - 1) openModal(currentElementIndex + 1);
      else openModal(0);
    });
  }

  // 키보드 단축키 지원 (ESC, 좌우 화살표)
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('hidden')) {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') {
        if (currentElementIndex > 0) openModal(currentElementIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentElementIndex < periodicElements.length - 1) openModal(currentElementIndex + 1);
      }
    }
  });

  // 초기 렌더링 시작
  renderPeriodicTable();
});
