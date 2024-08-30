// ui.js
import { elements } from './elements.js';
import { state } from './state.js';
import { filterCards, getCardData } from './data.js';
import { ITEMS_PER_PAGE, ANIMATION_DURATION, CARD_LOAD_DELAY } from './constants.js';
import { animateValue, debounce } from './utils.js';

const cardCache = new Map();

export const renderCards = () => {
    const filteredCards = filterCards();
    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const cardsToRender = filteredCards.slice(startIndex, endIndex);

    const cardContainer = elements.cardContainer;
    cardContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const template = document.getElementById('card-template');

    cardsToRender.forEach((card, index) => {
        const cardElement = renderCard(card, template, index);
        fragment.appendChild(cardElement);
    });

    cardContainer.appendChild(fragment);
    updatePagination(filteredCards.length);
    applyCardAnimations();
};

const renderCard = (card, template, index) => {
    if (cardCache.has(card.id)) {
        return cardCache.get(card.id).cloneNode(true);
    }

    const cardElement = template.content.cloneNode(true);
    const rootElement = cardElement.querySelector('.card-item');

    rootElement.dataset.cardId = card.id;
    cardElement.querySelector('.card-name').textContent = card.name;
    cardElement.querySelector('.card-type').textContent = card.type;
    cardElement.querySelector('.card-rarity').textContent = card.rarity;
    cardElement.querySelector('.card-quantity').textContent = card.quantity;

    // Add color indicators
    const colorIndicator = document.createElement('div');
    colorIndicator.className = 'color-indicator';
    card.colors.forEach(color => {
        const colorDot = document.createElement('span');
        colorDot.className = `color-dot ${color.toLowerCase()}`;
        colorIndicator.appendChild(colorDot);
    });
    rootElement.appendChild(colorIndicator);

    // Add mana cost
    const manaCost = document.createElement('div');
    manaCost.className = 'mana-cost';
    manaCost.textContent = `{${card.cmc}}`;
    rootElement.appendChild(manaCost);

    cardCache.set(card.id, rootElement);
    return rootElement;
};

const applyCardAnimations = () => {
    const cards = elements.cardContainer.children;
    Array.from(cards).forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = `opacity 0.5s ease, transform 0.5s ease`;
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * CARD_LOAD_DELAY);
    });
};

export const updatePagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.currentPage === totalPages;

    // Update page numbers
    const pageNumbers = elements.pageNumbers;
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === state.currentPage);
        pageBtn.addEventListener('click', () => {
            state.currentPage = i;
            renderCards();
        });
        pageNumbers.appendChild(pageBtn);
    }
};

export const setView = (view) => {
    state.currentView = view;
    elements.cardContainer.className = `card-${view}`;
    [elements.gridViewBtn, elements.listViewBtn, elements.compactViewBtn].forEach(btn => {
        btn.classList.toggle('active', btn.id === `${view}-view`);
    });
    renderCards(); // Re-render to apply new view
};

export const updateStats = () => {
    const filteredCards = filterCards();
    const totalCards = filteredCards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = filteredCards.length;
    const avgCmc = filteredCards.reduce((sum, card) => sum + card.cmc, 0) / uniqueCards || 0;

    animateValue(elements.totalCountElement, parseInt(elements.totalCountElement.textContent), totalCards, ANIMATION_DURATION);
    animateValue(elements.uniqueCountElement, parseInt(elements.uniqueCountElement.textContent), uniqueCards, ANIMATION_DURATION);

    // Animate CMC change
    const currentCmc = parseFloat(elements.avgCmcElement.textContent);
    animateCmcChange(currentCmc, avgCmc);
};

const animateCmcChange = (start, end) => {
    const duration = ANIMATION_DURATION;
    const startTime = performance.now();

    const updateCmc = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime > duration) {
            elements.avgCmcElement.textContent = end.toFixed(2);
        } else {
            const progress = elapsedTime / duration;
            const currentValue = start + (end - start) * progress;
            elements.avgCmcElement.textContent = currentValue.toFixed(2);
            requestAnimationFrame(updateCmc);
        }
    };

    requestAnimationFrame(updateCmc);
};

export const toggleTheme = () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    elements.themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    // Animate theme transition
    document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 500);
};

export const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    elements.notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            elements.notificationContainer.removeChild(notification);
        }, 300);
    }, 3000);
};

export const initializeUI = () => {
    renderCards();
    updateStats();
    setView(state.currentView);
    initializeCardHoverEffects();
    initializeInfiniteScroll();
};

const initializeCardHoverEffects = () => {
    elements.cardContainer.addEventListener('mouseover', debounce((e) => {
        const card = e.target.closest('.card-item');
        if (card) {
            const cardId = card.dataset.cardId;
            const cardData = getCardData().find(c => c.id === parseInt(cardId));
            showCardPreview(cardData, e);
        }
    }, 100));

    elements.cardContainer.addEventListener('mouseout', (e) => {
        if (e.target.closest('.card-item')) {
            hideCardPreview();
        }
    });
};

const showCardPreview = (cardData, event) => {
    const preview = elements.cardPreview;
    preview.innerHTML = `
        <h3>${cardData.name}</h3>
        <p>${cardData.type}</p>
        <p>Rarity: ${cardData.rarity}</p>
        <p>CMC: ${cardData.cmc}</p>
    `;
    preview.style.display = 'block';
    positionPreview(preview, event);
};

const positionPreview = (preview, event) => {
    const rect = event.target.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();

    let left = event.clientX + 10;
    let top = event.clientY + 10;

    if (left + previewRect.width > window.innerWidth) {
        left = window.innerWidth - previewRect.width - 10;
    }

    if (top + previewRect.height > window.innerHeight) {
        top = window.innerHeight - previewRect.height - 10;
    }

    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;
};

const hideCardPreview = () => {
    elements.cardPreview.style.display = 'none';
};

const initializeInfiniteScroll = () => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !elements.nextPageBtn.disabled) {
            loadMoreCards();
        }
    }, { threshold: 0.1 });

    observer.observe(elements.loadMoreTrigger);
};

const loadMoreCards = debounce(() => {
    state.currentPage++;
    renderCards();
    showNotification('Loading more cards...', 'info');
}, 300);

export const applyFilter = (filterType, value) => {
    state.filters[filterType] = value;
    state.currentPage = 1;
    renderCards();
    updateStats();
    showNotification(`Filter applied: ${filterType} - ${value}`, 'success');
};

export const clearFilters = () => {
    state.filters = {
        search: '',
        rarity: '',
        colors: []
    };
    state.currentPage = 1;
    elements.cardSearch.value = '';
    elements.rarityFilter.value = '';
    elements.colorButtons.forEach(btn => btn.classList.remove('active'));
    renderCards();
    updateStats();
    showNotification('All filters cleared', 'info');
};