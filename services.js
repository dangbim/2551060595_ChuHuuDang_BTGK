/**
 * SERVICES PAGE - Standalone module JS
 * Tách từ pages/services/services.js, bỏ phụ thuộc App/CAMPUS_DATA.
 * Xử lý: danh mục, tìm kiếm, sắp xếp, bộ lọc, AI Navigator và đặt lịch.
 */

const ServicesPage = {
  CATEGORY_ORDER: [
    'Tư vấn cá nhân',
    'Workshop nhóm',
    'Hỗ trợ học tập',
    'Giấc ngủ & thư giãn',
    'Quan hệ & giao tiếp'
  ],

  CHIP_LABELS: {
    'Tư vấn cá nhân': 'Tư vấn cá nhân',
    'Workshop nhóm': 'Workshop',
    'Hỗ trợ học tập': 'Học tập',
    'Giấc ngủ & thư giãn': 'Giấc ngủ',
    'Quan hệ & giao tiếp': 'Quan hệ'
  },

  currentSearch: '',
  currentCategory: 'all',
  currentSort: 'popular',

  // Trạng thái AI Navigator
  quizStep: 0,
  quizAnswers: {},

  // Trạng thái đặt lịch
  selectedServiceId: null,
  lastFocusedElement: null,

  /* =========================================================
     KHỞI TẠO
     ========================================================= */
  init() {
    this.renderCategories();
    this.renderFilterChips();
    this.renderServices();
    this.setupEventListeners();
    this.refreshIcons();
  },

  /* =========================================================
     DANH MỤC & BỘ LỌC
     ========================================================= */
  getCategories() {
    return this.CATEGORY_ORDER.map(category => ({
      id: category,
      label: category,
      count: CAMPUS_SERVICES.filter(service => service.category === category).length
    }));
  },

  renderCategories() {
    const list = document.getElementById('services-category-list');
    if (!list) return;

    const categories = [
      { id: 'all', label: 'Tất cả dịch vụ', count: CAMPUS_SERVICES.length },
      ...this.getCategories()
    ];

    list.innerHTML = categories.map(category => {
      const isActive = this.currentCategory === category.id;
      return `
        <li>
          <button
            type="button"
            data-category="${this.escapeHtml(category.id)}"
            aria-pressed="${isActive}"
            class="category-filter w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
              isActive ? 'active bg-sage text-white' : 'hover:bg-paper'
            }"
          >
            <span>${this.escapeHtml(category.label)}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${
              isActive ? 'bg-white/20 text-white' : 'bg-paper text-ink/60'
            }">${category.count}</span>
          </button>
        </li>
      `;
    }).join('');
  },

  renderFilterChips() {
    const chips = document.getElementById('services-filter-chips');
    if (!chips) return;

    const filters = [
      { id: 'all', label: 'Tất cả', count: CAMPUS_SERVICES.length },
      ...this.getCategories().map(category => ({
        id: category.id,
        label: this.CHIP_LABELS[category.id] || category.label,
        count: category.count
      }))
    ];

    chips.innerHTML = filters.map(chip => {
      const isActive = this.currentCategory === chip.id;
      return `
        <button
          type="button"
          data-category="${this.escapeHtml(chip.id)}"
          aria-pressed="${isActive}"
          class="filter-chip px-3 py-1.5 rounded-full border transition-all ${
            isActive
              ? 'active bg-sage-deep text-white border-sage-deep font-semibold'
              : 'bg-white border-card-border text-ink/70 hover:bg-paper'
          }"
        >
          ${this.escapeHtml(chip.label)} (${chip.count})
        </button>
      `;
    }).join('');
  },

  filterByCategory(categoryId) {
    this.currentCategory = categoryId || 'all';
    this.renderCategories();
    this.renderFilterChips();
    this.renderServices();
    this.refreshIcons();
  },

  handleSearch(query) {
    this.currentSearch = query;
    this.renderServices();
  },

  resetFilters() {
    this.currentSearch = '';
    this.currentCategory = 'all';

    const searchInput = document.getElementById('services-search-input');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }

    this.renderCategories();
    this.renderFilterChips();
    this.renderServices();
    this.refreshIcons();
  },

  /* =========================================================
     HIỂN THỊ DANH SÁCH DỊCH VỤ
     ========================================================= */
  renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    const query = this.currentSearch.trim().toLowerCase();
    const filtered = CAMPUS_SERVICES.filter(service => {
      const matchCategory = this.currentCategory === 'all' || service.category === this.currentCategory;
      const haystack = `${service.name} ${service.summary} ${service.counselor}`.toLowerCase();
      const matchSearch = !query || haystack.includes(query);
      return matchCategory && matchSearch;
    });
    const services = this.sortServices(filtered);

    this.updateSummary(services.length);

    if (!services.length) {
      grid.innerHTML = `
        <div class="services-empty @md:col-span-2 @lg:col-span-3 bg-white border border-dashed border-card-border rounded-2xl p-10 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-paper text-ink/40 flex items-center justify-center mx-auto">
            <i data-lucide="search-x" class="w-6 h-6" aria-hidden="true"></i>
          </div>
          <h3 class="font-serif font-bold text-base text-ink">Không tìm thấy dịch vụ phù hợp</h3>
          <p class="text-xs text-ink/60">Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ ${CAMPUS_SERVICES.length} dịch vụ.</p>
          <button
            type="button"
            data-action="reset-filters"
            class="px-4 py-2 bg-sage hover:bg-sage-deep text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      `;
      this.refreshIcons();
      return;
    }

    grid.innerHTML = services.map(service => this.serviceCardTemplate(service)).join('');
    this.refreshIcons();
  },

  serviceCardTemplate(service) {
    const action = service.isEnabled
      ? `
        <button
          type="button"
          data-book-service="${this.escapeHtml(service.id)}"
          class="px-3 py-1.5 bg-sage hover:bg-sage-deep text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          Đặt lịch
        </button>
      `
      : `
        <button
          type="button"
          disabled
          title="Dịch vụ đang tạm ngưng nhận lịch"
          class="px-3 py-1.5 bg-paper text-ink/40 border border-card-border font-semibold rounded-lg cursor-not-allowed"
        >
          Tạm ngưng
        </button>
      `;

    return `
      <article class="service-card bg-white rounded-2xl p-5 border border-card-border flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="status-pill ${this.escapeHtml(service.badgeClass)}">
              <span class="status-dot"></span>
              <span>${this.escapeHtml(service.badgeText)}</span>
            </span>
            <span class="text-ink/60 font-medium whitespace-nowrap">${this.escapeHtml(service.duration)}</span>
          </div>

          <h3 class="font-serif font-bold text-lg text-ink leading-snug">${this.highlight(service.name)}</h3>
          <p class="text-xs text-ink/70 leading-relaxed line-clamp-2">${this.highlight(service.summary)}</p>
        </div>

        <div class="pt-4 mt-4 border-t border-card-border flex items-center justify-between gap-2 text-xs">
          <span class="text-ink/60 font-medium truncate" title="${this.escapeHtml(service.counselor)}">${this.escapeHtml(service.counselor)}</span>
          ${action}
        </div>
      </article>
    `;
  },

  sortServices(services) {
    const sorted = [...services];

    if (this.currentSort === 'newest') {
      return sorted.reverse();
    }

    if (this.currentSort === 'shortest') {
      return sorted.sort((a, b) => this.getDurationMinutes(a) - this.getDurationMinutes(b));
    }

    // 'popular': ưu tiên dịch vụ nổi bật, sau đó giữ nguyên thứ tự gốc
    return sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
  },

  getDurationMinutes(service) {
    const match = String(service.duration).match(/(\d+)\s*phút/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  },

  updateSummary(resultCount) {
    const summary = document.getElementById('services-summary');
    if (!summary) return;

    const isFiltering = Boolean(this.currentSearch.trim()) || this.currentCategory !== 'all';
    summary.textContent = isFiltering
      ? `Hiển thị ${resultCount}/${CAMPUS_SERVICES.length} dịch vụ phù hợp · cập nhật 02/06/2025`
      : `${CAMPUS_SERVICES.length} dịch vụ đang hoạt động · cập nhật 02/06/2025`;
  },

  /* =========================================================
     TIỆN ÍCH
     ========================================================= */
  highlight(text) {
    const safeText = this.escapeHtml(text);
    const query = this.currentSearch.trim();
    if (!query) return safeText;

    const pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return safeText.replace(new RegExp(`(${pattern})`, 'gi'), '<mark class="search-highlight">$1</mark>');
    } catch (error) {
      return safeText;
    }
  },

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  },

  refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  /* =========================================================
     AI-1 SUPPORT NAVIGATOR (tách từ js/ai-engine.js)
     ========================================================= */
  AI_NAVIGATOR: {
    questions: [
      {
        id: 'q1',
        title: 'Chủ đề bạn đang cảm thấy bận tâm hoặc quá tải nhất gần đây?',
        options: [
          { label: 'Áp lực thi cử, bài tập & đồ án học tập', value: 'study_stress' },
          { label: 'Cảm giác lo âu bồn chồn, khó gọi tên', value: 'anxiety' },
          { label: 'Mất ngủ, khó ngủ hoặc kiệt sức thể chất', value: 'sleep' },
          { label: 'Bất đồng bạn bè, bạn cùng phòng hoặc gia đình', value: 'relationships' }
        ]
      },
      {
        id: 'q2',
        title: 'Tình trạng này đang ảnh hưởng tới nhịp sinh hoạt của bạn như thế nào?',
        options: [
          { label: 'Chỉ thoáng qua lúc deadline dồn dập', value: 'mild' },
          { label: 'Giảm khả năng tập trung, hay trì hoãn', value: 'moderate' },
          { label: 'Thường xuyên mệt mỏi, khó duy trì lịch học bình thường', value: 'high' }
        ]
      },
      {
        id: 'q3',
        title: 'Bạn thoải mái nhất với hình thức chia sẻ nào?',
        options: [
          { label: 'Trò chuyện 1-1 riêng tư với chuyên viên tâm lý', value: 'individual' },
          { label: 'Tham gia buổi workshop kỹ năng cùng các bạn sinh viên khác', value: 'workshop' },
          { label: 'Tự tìm hiểu bài viết / audio hướng dẫn theo nhịp riêng', value: 'self_help' }
        ]
      },
      {
        id: 'q4',
        title: 'Khoảng thời gian bạn có thể sắp xếp trong tuần?',
        options: [
          { label: '30 – 45 phút cho một buổi hẹn tư vấn trực tiếp', value: '45min' },
          { label: '90 phút vào cuối tuần để học kỹ năng', value: '90min' },
          { label: '5 – 10 phút tự thực hành mỗi ngày', value: 'micro' }
        ]
      }
    ],

    evaluateAnswers(answers) {
      const q1 = answers.q1 || 'study_stress';
      const q3 = answers.q3 || 'individual';

      let recommendedServiceId = 'srv-01';
      let serviceTitle = 'Tư vấn cá nhân 1-1';
      let duration = '45 phút';
      let primaryTopic = 'áp lực học tập';
      let rationale = 'Câu trả lời của bạn cho thấy chủ đề “áp lực học tập” đang chiếm ưu thế. Gợi ý: bắt đầu bằng buổi Tư vấn cá nhân 1-1 (45 phút) trước khi tham gia workshop.';

      if (q1 === 'anxiety' || q3 === 'workshop') {
        recommendedServiceId = 'srv-02';
        serviceTitle = 'Workshop quản trị cảm xúc';
        duration = '90 phút';
        primaryTopic = 'quản trị cảm xúc';
        rationale = 'Bạn đang cần kỹ thuật điều hòa cảm xúc và sẵn sàng học hỏi theo nhóm. Gợi ý: Workshop quản trị cảm xúc (90 phút) giúp thực hành cùng chuyên gia và bạn bè.';
      } else if (q3 === 'self_help' || q1 === 'sleep') {
        recommendedServiceId = 'srv-03';
        serviceTitle = 'Chuỗi bài tập thư giãn & Vệ sinh giấc ngủ';
        duration = '12 bài · 40 phút';
        primaryTopic = 'giấc ngủ & thư giãn';
        rationale = 'Với mong muốn chủ động về thời gian và cải thiện thể chất, chuỗi bài tập tự hướng dẫn sẽ là bước khởi đầu nhẹ nhàng và không gây áp lực.';
      }

      return {
        serviceId: recommendedServiceId,
        serviceTitle: serviceTitle,
        duration: duration,
        primaryTopic: primaryTopic,
        confidence: 'Phù hợp cao',
        rationale: rationale,
        disclaimer: 'Lưu ý: Hệ thống chỉ hỗ trợ điều hướng và phân loại nhu cầu học đường, tuyệt đối không đưa ra chẩn đoán y khoa.'
      };
    }
  },

  /* =========================================================
     LUỒNG AI NAVIGATOR
     ========================================================= */
  openAIQuizModal() {
    this.quizStep = 0;
    this.quizAnswers = {};
    this.renderAIQuizStep();
    this.openModal('ai-quiz-modal');
  },

  renderAIQuizStep() {
    const container = document.getElementById('ai-quiz-content');
    if (!container) return;

    const questions = this.AI_NAVIGATOR.questions;

    if (this.quizStep < questions.length) {
      const question = questions[this.quizStep];
      const percent = Math.round(((this.quizStep + 1) / questions.length) * 100);

      container.innerHTML = `
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-ink/50">
              <span>Câu hỏi ${this.quizStep + 1} / ${questions.length}</span>
              <span class="font-bold text-amber-700">${percent}%</span>
            </div>
            <div class="h-1.5 w-full bg-paper rounded-full overflow-hidden">
              <div class="h-full bg-amber-ai rounded-full transition-all duration-300" style="width: ${percent}%"></div>
            </div>
          </div>

          <h4 class="font-serif font-bold text-base text-ink">${this.escapeHtml(question.title)}</h4>

          <div class="space-y-2">
            ${question.options.map(option => `
              <button
                type="button"
                data-question-id="${question.id}"
                data-quiz-answer="${option.value}"
                class="w-full text-left p-3 rounded-xl border border-card-border hover:border-amber-ai hover:bg-amber-50/50 text-xs font-medium text-ink transition-colors flex items-center justify-between gap-3"
              >
                <span>${this.escapeHtml(option.label)}</span>
                <i data-lucide="chevron-right" class="w-4 h-4 text-ink/30 shrink-0" aria-hidden="true"></i>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      this.refreshIcons();
      return;
    }

    const result = this.AI_NAVIGATOR.evaluateAnswers(this.quizAnswers);

    container.innerHTML = `
      <div class="space-y-4 text-center py-2">
        <div class="w-12 h-12 rounded-full bg-amber-100 text-amber-ai text-xl font-bold flex items-center justify-center mx-auto" aria-hidden="true">✦</div>
        <h4 class="font-serif font-bold text-xl text-ink">Kết quả gợi ý từ AI Navigator</h4>

        <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-left space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-amber-900">${this.escapeHtml(result.serviceTitle)}</span>
            <span class="status-pill status-confirmed text-[10px]">
              <span class="status-dot"></span>
              <span>${this.escapeHtml(result.confidence)}</span>
            </span>
          </div>
          <p class="text-amber-900/80 leading-relaxed">${this.escapeHtml(result.rationale)}</p>
          <div class="flex items-center justify-between gap-2 pt-2 border-t border-amber-200 text-[10px] text-amber-800/70">
            <span>Chủ đề: ${this.escapeHtml(result.primaryTopic)}</span>
            <span>${this.escapeHtml(result.duration)}</span>
          </div>
        </div>

        <p class="text-[10px] text-ink/50 leading-relaxed">${this.escapeHtml(result.disclaimer)}</p>

        <div class="flex flex-wrap justify-center gap-2 pt-1">
          <button
            type="button"
            data-quiz-action="book"
            class="px-4 py-2.5 bg-sage hover:bg-sage-deep text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Đặt lịch theo gợi ý
          </button>
          <button
            type="button"
            data-quiz-action="restart"
            class="px-4 py-2.5 border border-card-border text-ink text-xs font-semibold rounded-xl hover:bg-paper transition-colors"
          >
            Làm lại
          </button>
        </div>
      </div>
    `;

    this.refreshIcons();
  },

  answerAIQuiz(questionId, value) {
    this.quizAnswers[questionId] = value;
    this.quizStep += 1;
    this.renderAIQuizStep();
  },

  bookQuizRecommendation() {
    const result = this.AI_NAVIGATOR.evaluateAnswers(this.quizAnswers);
    this.closeModal('ai-quiz-modal');
    this.openBookingModal(result.serviceId);
  },

  /* =========================================================
     GẮN SỰ KIỆN
     ========================================================= */
  setupEventListeners() {
    const searchInput = document.getElementById('services-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', event => this.handleSearch(event.target.value));
    }

    const sortSelect = document.getElementById('services-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', event => {
        this.currentSort = event.target.value;
        this.renderServices();
      });
    }

    const categoryList = document.getElementById('services-category-list');
    if (categoryList) {
      categoryList.addEventListener('click', event => {
        const button = event.target.closest('[data-category]');
        if (button) this.filterByCategory(button.dataset.category);
      });
    }

    const filterChips = document.getElementById('services-filter-chips');
    if (filterChips) {
      filterChips.addEventListener('click', event => {
        const button = event.target.closest('[data-category]');
        if (button) this.filterByCategory(button.dataset.category);
      });
    }

    const grid = document.getElementById('services-grid');
    if (grid) {
      grid.addEventListener('click', event => {
        const bookButton = event.target.closest('[data-book-service]');
        if (bookButton) {
          this.openBookingModal(bookButton.dataset.bookService);
          return;
        }

        const resetButton = event.target.closest('[data-action="reset-filters"]');
        if (resetButton) this.resetFilters();
      });
    }

    const openQuizButton = document.getElementById('btn-open-ai-quiz');
    if (openQuizButton) {
      openQuizButton.addEventListener('click', () => this.openAIQuizModal());
    }

    const quizContent = document.getElementById('ai-quiz-content');
    if (quizContent) {
      quizContent.addEventListener('click', event => {
        const answerButton = event.target.closest('[data-quiz-answer]');
        if (answerButton) {
          this.answerAIQuiz(answerButton.dataset.questionId, answerButton.dataset.quizAnswer);
          return;
        }

        const actionButton = event.target.closest('[data-quiz-action]');
        if (!actionButton) return;

        if (actionButton.dataset.quizAction === 'book') {
          this.bookQuizRecommendation();
        } else if (actionButton.dataset.quizAction === 'restart') {
          this.quizStep = 0;
          this.quizAnswers = {};
          this.renderAIQuizStep();
        }
      });
    }

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', event => this.confirmBooking(event));
    }

    document.querySelectorAll('[data-close-modal]').forEach(button => {
      button.addEventListener('click', () => this.closeModal(button.dataset.closeModal));
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', event => {
        if (event.target === backdrop) this.closeModal(backdrop.id);
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeAllModals();
    });
  },

  /* =========================================================
     ĐẶT LỊCH
     ========================================================= */
  openBookingModal(serviceId) {
    const service = CAMPUS_SERVICES.find(item => item.id === serviceId);
    if (!service) return;

    if (!service.isEnabled) {
      this.showToast('Dịch vụ này đang tạm ngưng nhận lịch. Vui lòng chọn dịch vụ khác.', 'error');
      return;
    }

    this.selectedServiceId = service.id;

    const nameEl = document.getElementById('booking-service-name');
    const metaEl = document.getElementById('booking-service-meta');
    const counselorEl = document.getElementById('booking-service-counselor');

    if (nameEl) nameEl.textContent = service.name;
    if (metaEl) metaEl.textContent = `${service.duration} · ${service.format}`;
    if (counselorEl) counselorEl.textContent = `Phụ trách: ${service.counselor}`;

    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
      const today = new Date();
      const minDate = this.getLocalISODate(today);
      dateInput.min = minDate;

      if (!dateInput.value || dateInput.value < minDate) {
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        dateInput.value = this.getLocalISODate(tomorrow);
      }
    }

    const noteInput = document.getElementById('booking-note');
    if (noteInput) noteInput.value = '';

    this.hideBookingError();
    this.openModal('booking-modal');
  },

  confirmBooking(event) {
    event.preventDefault();

    const service = CAMPUS_SERVICES.find(item => item.id === this.selectedServiceId);
    if (!service) return;

    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const noteInput = document.getElementById('booking-note');

    if (!dateInput || !timeSelect) return;

    if (!dateInput.value) {
      this.showBookingError('Vui lòng chọn ngày mong muốn trước khi xác nhận.');
      dateInput.focus();
      return;
    }

    if (dateInput.min && dateInput.value < dateInput.min) {
      this.showBookingError('Ngày mong muốn không được nằm trong quá khứ.');
      dateInput.focus();
      return;
    }

    this.hideBookingError();

    const timeLabel = timeSelect.options[timeSelect.selectedIndex]
      ? timeSelect.options[timeSelect.selectedIndex].text
      : timeSelect.value;
    const dateLabel = this.formatDateVN(dateInput.value);
    const note = noteInput ? noteInput.value.trim() : '';

    this.closeModal('booking-modal');

    this.showToast(
      `Đã ghi nhận yêu cầu đặt lịch: ${service.name} · ${dateLabel} (${timeLabel})${note ? ' · Có ghi chú' : ''}. Chuyên viên sẽ xác nhận lại.`,
      'success'
    );
  },

  showBookingError(message) {
    const errorEl = document.getElementById('booking-error');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  },

  hideBookingError() {
    const errorEl = document.getElementById('booking-error');
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  },

  getLocalISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatDateVN(isoDate) {
    const parts = String(isoDate).split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  },

  /* =========================================================
     ĐIỀU KHIỂN MODAL
     ========================================================= */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    this.lastFocusedElement = document.activeElement;
    modal.classList.remove('hidden');
    this.syncScrollLock();

    const focusTarget = modal.querySelector('input, select, textarea, button');
    if (focusTarget) focusTarget.focus({ preventScroll: true });

    this.refreshIcons();
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('hidden');
    this.syncScrollLock();

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus({ preventScroll: true });
      this.lastFocusedElement = null;
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => modal.classList.add('hidden'));
    this.syncScrollLock();
  },

  syncScrollLock() {
    const hasOpenModal = Array.from(document.querySelectorAll('.modal-backdrop'))
      .some(modal => !modal.classList.contains('hidden'));
    document.body.classList.toggle('overflow-hidden', hasOpenModal);
  },

  /* =========================================================
     TOAST
     ========================================================= */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const palette = type === 'success'
      ? 'bg-emerald-900 text-white border-emerald-700'
      : type === 'error'
        ? 'bg-red-900 text-white border-red-700'
        : 'bg-slate-900 text-white border-slate-700';

    const icon = type === 'success'
      ? 'check-circle'
      : type === 'error'
        ? 'alert-triangle'
        : 'info';

    const toast = document.createElement('div');
    toast.className = `toast-item p-3 rounded-xl shadow-lg border text-xs font-medium flex items-start gap-2 pointer-events-auto max-w-xs ${palette}`;

    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true"></i>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    this.refreshIcons();

    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 250);
    }, 3500);
  }
};

/* Khởi động khi DOM sẵn sàng */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ServicesPage.init());
} else {
  ServicesPage.init();
}
