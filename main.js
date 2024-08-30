// main.js
import { initializeUI } from './ui.js';
import { initializeData } from './data.js';
import { initializeEventListeners } from './events.js';
import { initializeChart } from './chart.js';

const initialize = async () => {
    await initializeData();
    initializeUI();
    initializeEventListeners();
    initializeChart();
};

document.addEventListener('DOMContentLoaded', initialize);