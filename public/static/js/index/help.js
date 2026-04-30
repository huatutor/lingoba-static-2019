// FAQ 数据
var faqData = [];
        fetch('/index/index/gethelp2')
            .then(response => response.json())
            .then(data => {
                faqData = Array.isArray(data) ? data.map(function(t){
                    var tags = Array.isArray(t.tags) ? t.tags : (typeof t.tags === 'string' ? t.tags.split(',') : []);
                    tags = tags.map(function(x){ return String(x || '').trim(); }).filter(function(x){ return x !== ''; });
                    var category = String((t.category || '')).toLowerCase();
                    if (!category) { category = 'beginner'; }
                    var notHelpful = (typeof t.notHelpful !== 'undefined') ? t.notHelpful : (typeof t.nothelpful !== 'undefined' ? t.nothelpful : 0);
                    return {
                        id: t.id,
                        title: String(t.title || ''),
                        question: String(t.question || t.title || ''),
                        answer: String(t.answer || ''),
                        tags: tags,
                        helpful: Number(t.helpful || 0),
                        notHelpful: Number(notHelpful || 0),
                        category: category
                    };
                }) : [];
                renderFAQ();
            })
            .catch(error => {
                console.error('获取帮助数据失败:', error);
            });

// 搜索建议数据
const __popular = (typeof LANG !== 'undefined' && LANG.help && LANG.help.popular_queries) ? LANG.help.popular_queries : [];
const searchSuggestions = Array.isArray(__popular) ? __popular : Object.values(__popular || {}).map(function(x){ return String(x || ''); });
 
// 当前筛选状态 
let currentFilter = {
    category: 'all',
    tag: null,
    search: ''
};

// DOM元素
const searchInput = document.getElementById('search-input');
const searchSuggestionsEl = document.getElementById('search-suggestions');
const suggestionsList = document.getElementById('suggestions-list');
const faqContainer = document.getElementById('faq-container');
const noResults = document.getElementById('no-results');

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    renderFAQ();
    initializeSearch();
    initializeCategoryNav();
    initializeStatsChart();
    initializeScrollAnimations();
});

// 初始化动画
function initializeAnimations() {
    // 头部动画
    anime.timeline()
        .add({
            targets: '#hero-title',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            easing: 'easeOutQuart'
        })
        .add({
            targets: '#hero-subtitle',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 600,
            easing: 'easeOutQuart'
        }, '-=400')
        .add({
            targets: '#search-container',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 600,
            easing: 'easeOutQuart'
        }, '-=300');
}

// 初始化滚动动画
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anime({
                    targets: entry.target,
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 600,
                    easing: 'easeOutQuart'
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 观察FAQ项目
    document.addEventListener('faqRendered', () => {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach((item, index) => {
            item.style.opacity = '0';
            setTimeout(() => {
                observer.observe(item);
            }, index * 100);
        });
    });
}

// 渲染FAQ列表
function renderFAQ() {
    const filteredData = filterFAQ();
    
    if (filteredData.length === 0) {
        faqContainer.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    const faqHTML = filteredData.map(faq => `
        <div class="faq-item bg-white rounded-xl shadow-sm overflow-hidden card-hover">
            <button class="faq-question w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors" data-id="${faq.id}">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">${faq.question}</h3>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">${getCategoryName(faq.category)}</span>
                        <div class="flex space-x-2">
                            ${(Array.isArray(faq.tags) ? faq.tags : []).map(tag => `<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <svg class="rotate-icon w-5 h-5 text-gray-400 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div class="faq-answer" id="answer-${faq.id}">
                <div class="px-6 pb-6">
                    <div class="prose max-w-none text-gray-700">
                        ${faq.answer}
                    </div>
                    <div class="mt-6 flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-500">${LANG.help.helpful_to_you}</span>
                            <div class="flex space-x-2">
                                <button class="helpful-btn flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors" data-id="${faq.id}" data-type="helpful">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H9.737a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 016.236 10H11v-2a2 2 0 114 0v2z"></path>
                                    </svg>
                                    <span>${LANG.help.helpful} (${faq.helpful})</span>
                                </button>
                                <button class="helpful-btn flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors" data-id="${faq.id}" data-type="notHelpful">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h5.527a2 2 0 011.789 1.106l3.5 7A2 2 0 0117.764 14H13v2a2 2 0 11-4 0v-2z"></path>
                                    </svg>
                                    <span>${LANG.help.not_helpful} (${faq.notHelpful})</span>
                                </button>
                            </div>
                        </div>
                        <div class="text-sm text-gray-400">
                            ${LANG.help.related_questions}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    faqContainer.innerHTML = faqHTML;
    
    // 绑定FAQ交互事件
    bindFAQEvents();
    
    // 触发自定义事件
    document.dispatchEvent(new Event('faqRendered'));
}

// 筛选FAQ数据
function filterFAQ() {
    return faqData.filter(faq => {
        // 分类筛选
        if (currentFilter.category !== 'all' && String(faq.category || '') !== currentFilter.category) {
            return false;
        }
        
        // 标签筛选
        if (currentFilter.tag) {
            var __tags = Array.isArray(faq.tags) ? faq.tags : [];
            if (!__tags.includes(currentFilter.tag)) {
                return false;
            }
        }
        
        // 搜索筛选
        if (currentFilter.search) {
            const searchTerm = currentFilter.search.toLowerCase();
            const baseFields = [faq.title, faq.question, faq.answer];
            const __tags2 = Array.isArray(faq.tags) ? faq.tags : [];
            const searchFields = baseFields.concat(__tags2);
            return searchFields.some(function(field){
                return String(field || '').toLowerCase().includes(searchTerm);
            });
        }
        
        return true;
    });
}

// 获取分类名称
function getCategoryName(category) {
    const categoryNames = {
        'beginner': LANG.help.beginner,
        'technical': LANG.help.support,
        'course': LANG.help.course,
        'account': LANG.help.account,
        'troubleshooting': LANG.help.troubleshooting
    };
    return categoryNames[category] || category;
}

// 绑定FAQ事件
function bindFAQEvents() {
    // FAQ问题点击事件
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', function() {
            const faqId = this.dataset.id;
            const answerEl = document.getElementById(`answer-${faqId}`);
            const iconEl = this.querySelector('.rotate-icon');
            
            const isOpen = answerEl.classList.contains('open');
            if (isOpen) {
                answerEl.classList.remove('open');
                iconEl.classList.remove('open');
                answerEl.style.maxHeight = '0px';
            } else {
                answerEl.classList.add('open');
                iconEl.classList.add('open');
                answerEl.style.maxHeight = answerEl.scrollHeight + 'px';
            }
            
            anime({
                targets: this,
                scale: [1, 0.98, 1],
                duration: 200,
                easing: 'easeOutQuart'
            });
        });
    });
    
    // 有用/无用按钮事件
    document.querySelectorAll('.helpful-btn').forEach(button => {
        button.addEventListener('click', function() {
            const faqId = this.dataset.id;
            const type = this.dataset.type;
            
            // 添加点击动画
            anime({
                targets: this,
                scale: [1, 1.1, 1],
                duration: 200,
                easing: 'easeOutQuart'
            });
            
            // 显示感谢消息
            this.innerHTML = type === 'helpful' ? 
                `<span class="text-green-700">${LANG.help.feedback_thanks}！</span>` : 
                `<span class="text-red-700">${LANG.help.feedback_improve}！</span>`;
            
            // 3秒后恢复原状
            setTimeout(() => {
                const faq = faqData.find(f => f.id == faqId);
                if (faq) {
                    const count = type === 'helpful' ? faq.helpful : faq.notHelpful;
                    const text = type === 'helpful' ? LANG.help.helpful : LANG.help.not_helpful;
                    this.innerHTML = `
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'helpful' ? 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H9.737a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 016.236 10H11v-2a2 2 0 114 0v2z' : 'M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h5.527a2 2 0 011.789 1.106l3.5 7A2 2 0 0117.764 14H13v2a2 2 0 11-4 0v-2z'}"></path>
                        </svg>
                        <span>${text} (${count})</span>
                    `;
                }
            }, 3000);
        });
    });
}

// 初始化搜索功能
function initializeSearch() {
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilter.search = this.value;
            renderFAQ();
            updateSearchSuggestions(this.value);
        }, 300);
    });
    
    searchInput.addEventListener('focus', function() {
        if (this.value) {
            searchSuggestionsEl.classList.remove('hidden');
        }
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            searchSuggestionsEl.classList.add('hidden');
        }, 200);
    });
}

// 更新搜索建议
function updateSearchSuggestions(query) {
    if (!query) {
        searchSuggestionsEl.classList.add('hidden');
        return;
    }
    
    const filteredSuggestions = searchSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filteredSuggestions.length > 0) {
        suggestionsList.innerHTML = filteredSuggestions.map(suggestion => `
            <div class="suggestion-item px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm" data-suggestion="${suggestion}">
                ${suggestion}
            </div>
        `).join('');
        
        // 绑定建议点击事件
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const suggestion = this.dataset.suggestion;
                searchInput.value = suggestion;
                currentFilter.search = suggestion;
                renderFAQ();
                searchSuggestionsEl.classList.add('hidden');
            });
        });
        
        searchSuggestionsEl.classList.remove('hidden');
    } else {
        searchSuggestionsEl.classList.add('hidden');
    }
}

// 初始化分类导航
function initializeCategoryNav() {
    // 分类按钮事件
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', function() {
            // 更新按钮状态
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('bg-blue-50', 'text-blue-600', 'font-medium');
                btn.classList.add('text-gray-700');
            });
            
            this.classList.add('bg-blue-50', 'text-blue-600', 'font-medium');
            this.classList.remove('text-gray-700');
            
            // 更新筛选状态
            currentFilter.category = this.dataset.category;
            currentFilter.tag = null; // 清除标签筛选
            renderFAQ();
            
            // 添加点击动画
            anime({
                targets: this,
                scale: [1, 0.95, 1],
                duration: 200,
                easing: 'easeOutQuart'
            });
        });
    });
    
    // 标签筛选事件
    document.querySelectorAll('.tag-filter').forEach(tag => {
        tag.addEventListener('click', function() {
            // 更新标签状态
            document.querySelectorAll('.tag-filter').forEach(t => {
                t.classList.remove('bg-blue-100', 'text-blue-600');
                t.classList.add('bg-gray-100', 'text-gray-600');
            });
            
            this.classList.add('bg-blue-100', 'text-blue-600');
            this.classList.remove('bg-gray-100', 'text-gray-600');
            
            // 更新筛选状态
            currentFilter.tag = this.dataset.tag;
            currentFilter.category = 'all'; // 清除分类筛选
            
            // 重置分类按钮状态
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('bg-blue-50', 'text-blue-600', 'font-medium');
                btn.classList.add('text-gray-700');
            });
            
            renderFAQ();
        });
    });
}

// 初始化统计图表
function initializeStatsChart() {
    const chartDom = document.getElementById('stats-chart');
    if (!chartDom || typeof echarts === 'undefined') return;

    const categoryStats = {
        '新手入门': 25,
        '技术支持': 18,
        '课程相关': 32,
        '账号问题': 15,
        '故障排除': 10
    };

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}%'
        },
        series: [{
            type: 'pie',
            radius: '70%',
            data: Object.entries(categoryStats).map(function(entry){ return { name: entry[0], value: entry[1] }; }),
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            itemStyle: {
                color: function(params) {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    return colors[params.dataIndex];
                }
            }
        }]
    };

    let myChart;
    function initWhenVisible() {
        const w = chartDom.offsetWidth;
        const h = chartDom.offsetHeight;
        if (w === 0 || h === 0) {
            setTimeout(initWhenVisible, 100);
            return;
        }
        myChart = echarts.init(chartDom);
        myChart.setOption(option);
        window.addEventListener('resize', function() { if (myChart) myChart.resize(); });
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(function(){ if (myChart) myChart.resize(); }).observe(chartDom);
        }
    }
    initWhenVisible();
}

// 工具函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 客服联系功能
document.addEventListener('click', function(e) {
    if (e.target.closest('button') && (e.target.closest('button').textContent.includes('在线客服') || e.target.closest('button').textContent.includes('Online'))) {
        alert('在线客服功能即将上线，请通过邮件联系我们：support@lingoba.com');
    }
    
    if (e.target.closest('button') && (e.target.closest('button').textContent.includes('邮件支持') || e.target.closest('button').textContent.includes('Email'))) {
        window.location.href = 'mailto:support@lingoba.com';
    }
});

// 常用工具链接
document.addEventListener('click', function(e) {
    if (e.target.closest('a') && e.target.textContent.includes('浏览器兼容性测试')) {
        alert('浏览器兼容性测试工具即将上线');
    }
    
    if (e.target.closest('a') && (e.target.textContent.includes('网络速度测试') || e.target.textContent.includes('Speed'))) {
        window.open('https://speedtest.net', '_blank');
    }
    
    if (e.target.closest('a') && e.target.textContent.includes('课程预约指南') || e.target.textContent.includes('Booking')) {
        // 滚动到相关问题
        const faqItem = document.querySelector('[data-id="52"]');
        if (faqItem) {
            faqItem.scrollIntoView({ behavior: 'smooth' });
            faqItem.click();
        }
    }
    
    if (e.target.closest('a') && (e.target.textContent.includes('账户设置教程') || e.target.textContent.includes('Account'))) {
        alert('账户设置教程即将上线');
    }
});
