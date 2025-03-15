/**
 * Třída pro správu statistik a grafů
 */
class Statistics {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentPeriod = 'day';
        this.salesChart = null;
        this.categoryChart = null;
        this.data = null;
    }
    
    /**
     * Načtení dat pro statistiky
     */
    loadData() {
        this.data = this.storage.getStatistics();
        this.updatePeriod(this.currentPeriod);
    }
    
    /**
     * Aktualizace zobrazení dle vybraného období
     */
    updatePeriod(period) {
        this.currentPeriod = period;
        
        if (!this.data) {
            this.loadData();
            return;
        }
        
        let periodData;
        switch (period) {
            case 'day':
                periodData = this.data.daily;
                break;
            case 'week':
                periodData = this.data.weekly;
                break;
            case 'month':
                periodData = this.data.monthly;
                break;
            default:
                periodData = this.data.daily;
        }
        
        this.updateSalesChart(periodData);
        this.updateCategoryChart();
        this.updateSummary(periodData);
    }
    
    /**
     * Aktualizace grafu prodejů
     */
    updateSalesChart(periodData) {
        const ctx = document.getElementById('sales-chart').getContext('2d');
        
        // Seřazení dat podle období
        const sortedData = [...periodData].sort((a, b) => a.period.localeCompare(b.period));
        
        // Připrava dat pro graf
        const labels = sortedData.map(item => this.formatPeriodLabel(item.period, this.currentPeriod));
        const salesData = sortedData.map(item => item.totalSales);
        const orderCountData = sortedData.map(item => item.orderCount);
        
        // Pokud již existuje graf, zničíme ho
        if (this.salesChart) {
            this.salesChart.destroy();
        }
        
        // Vytvoření nového grafu
        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Celkové tržby (Kč)',
                        data: salesData,
                        backgroundColor: 'rgba(79, 109, 245, 0.2)',
                        borderColor: 'rgba(79, 109, 245, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Počet objednávek',
                        data: orderCountData,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Tržby (Kč)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: 'Počet objednávek'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }
    
    /**
     * Aktualizace grafu kategorií
     */
    updateCategoryChart() {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        // Příprava dat pro graf
        const categoryData = this.data.categories;
        const labels = Object.keys(categoryData);
        const values = Object.values(categoryData);
        
        // Mapování kategorií na čitelné názvy
        const categoryNames = {
            rooms: 'Pokoje',
            services: 'Služby',
            food: 'Občerstvení',
            drinks: 'Nápoje',
            extras: 'Doplňky'
        };
        
        const readableLabels = labels.map(cat => categoryNames[cat] || cat);
        
        // Barvy pro kategorie
        const backgroundColors = [
            'rgba(79, 109, 245, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
        ];
        
        // Pokud již existuje graf, zničíme ho
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }
        
        // Vytvoření nového grafu
        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: readableLabels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = (value / values.reduce((a, b) => a + b, 0) * 100).toFixed(1);
                                return `${context.label}: ${value.toLocaleString()} Kč (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Aktualizace souhrnných statistik
     */
    updateSummary(periodData) {
        let totalSales = 0;
        let orderCount = 0;
        
        // Součet hodnot z vybraného období
        periodData.forEach(item => {
            totalSales += item.totalSales;
            orderCount += item.orderCount;
        });
        
        // Průměrná hodnota objednávky
        const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;
        
        // Nejpopulárnější položka
        const popularItem = this.data.popular && this.data.popular.length > 0 
            ? this.data.popular[0] 
            : null;
        
        // Aktualizace zobrazení
        document.getElementById('total-sales').textContent = `${totalSales.toLocaleString()} Kč`;
        document.getElementById('order-count').textContent = orderCount;
        document.getElementById('average-order').textContent = `${averageOrder.toFixed(0)} Kč`;
        document.getElementById('most-popular').textContent = popularItem ? popularItem.name : '-';
    }
    
    /**
     * Formátování popisku období pro grafy
     */
    formatPeriodLabel(period, periodType) {
        switch (periodType) {
            case 'day':
                // Z YYYY-MM-DD na DD.MM.
                const dateParts = period.split('-');
                return `${dateParts[2]}.${dateParts[1]}.`;
                
            case 'week':
                // Z YYYY-WXX na týden XX/YYYY
                const weekParts = period.split('-W');
                return `Týden ${
