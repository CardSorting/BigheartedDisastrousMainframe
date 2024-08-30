// Constants
const ANIMATION_DURATION = 500;
const DEBOUNCE_DELAY = 300;
const CHART_HOVER_SCALE = 1.05;

// DOM Elements
const elements = {
    sections: document.querySelectorAll('.section'),
    container: document.querySelector('.container'),
    searchInput: document.getElementById('search'),
    gridViewBtn: document.getElementById('grid-view'),
    listViewBtn: document.getElementById('list-view'),
    totalCountElement: document.getElementById('total-count'),
    chartContainer: document.querySelector('.chart-container'),
    chartCanvas: document.getElementById('card-distribution-chart')
};

// State
let currentView = 'grid';
let chart;

// Utility Functions
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// UI Functions
const initializeSectionAnimation = () => {
    elements.sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = `opacity 0.5s ease, transform 0.5s ease ${index * 0.1}s`;
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 50);
    });
};

const toggleCardSelection = (card) => {
    card.classList.toggle('selected');
    card.style.transition = 'all 0.3s ease';
    card.style.transform = card.classList.contains('selected') ? 'scale(0.95)' : 'scale(1)';
    card.style.textDecoration = card.classList.contains('selected') ? 'line-through' : 'none';
    card.style.opacity = card.classList.contains('selected') ? '0.7' : '1';
};

const updateTotalCount = () => {
    const total = Array.from(document.querySelectorAll('.section ul li:not(.selected) .card-quantity'))
        .reduce((sum, item) => sum + parseInt(item.textContent), 0);
    animateValue(elements.totalCountElement, parseInt(elements.totalCountElement.textContent), total, ANIMATION_DURATION);
};

const setView = (view) => {
    currentView = view;
    elements.container.className = `container ${view}-view`;
    elements.gridViewBtn.classList.toggle('active', view === 'grid');
    elements.listViewBtn.classList.toggle('active', view === 'list');
    elements.container.style.transition = 'all 0.5s ease';
};

const performSearch = debounce((searchTerm) => {
    document.querySelectorAll('.section ul li').forEach(item => {
        const matches = item.textContent.toLowerCase().includes(searchTerm.toLowerCase());
        item.style.display = matches ? '' : 'none';
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = matches ? '1' : '0';
        item.style.transform = matches ? 'scale(1)' : 'scale(0.9)';
    });
}, DEBOUNCE_DELAY);

// Chart Functions
const createChart = () => {
    const ctx = elements.chartCanvas.getContext('2d');
    const data = {
        labels: ['Lands', 'Instants and Sorceries', 'Other Spells', 'Sideboard'],
        datasets: [{
            data: [26, 15, 19, 15],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }]
    };

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Card Distribution' }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
};

const initializeChartHoverEffect = () => {
    elements.chartContainer.addEventListener('mouseover', () => {
        elements.chartContainer.style.transform = `scale(${CHART_HOVER_SCALE})`;
        elements.chartContainer.style.transition = 'transform 0.3s ease';
    });

    elements.chartContainer.addEventListener('mouseout', () => {
        elements.chartContainer.style.transform = 'scale(1)';
    });
};

// Event Listeners
const initializeEventListeners = () => {
    elements.container.addEventListener('click', (e) => {
        const card = e.target.closest('li');
        if (card) {
            toggleCardSelection(card);
            updateTotalCount();
        }
    });

    elements.searchInput.addEventListener('input', (e) => performSearch(e.target.value));

    elements.gridViewBtn.addEventListener('click', () => setView('grid'));
    elements.listViewBtn.addEventListener('click', () => setView('list'));

    document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'LI') {
            const items = Array.from(activeElement.parentElement.children);
            const currentIndex = items.indexOf(activeElement);
            let newIndex;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                newIndex = (currentIndex + 1) % items.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                newIndex = (currentIndex - 1 + items.length) % items.length;
            }
            if (newIndex !== undefined) {
                items[newIndex].focus();
                e.preventDefault();
            }
        }
    });
};

// Initialization
const initialize = () => {
    initializeSectionAnimation();
    createChart();
    initializeChartHoverEffect();
    initializeEventListeners();
    updateTotalCount();
    setView(currentView);

    document.querySelectorAll('.section ul li').forEach(item => {
        item.setAttribute('tabindex', '0');
    });

    animateValue(elements.totalCountElement, 0, parseInt(elements.totalCountElement.textContent), ANIMATION_DURATION);
};

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);