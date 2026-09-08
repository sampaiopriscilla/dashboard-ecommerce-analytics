// Registra o plugin de rótulos de dados globalmente
Chart.register(ChartDataLabels);

let charts = {};

function openTab(evt, tabName) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('theme-icon').setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.getElementById('fullscreen-icon').setAttribute('data-lucide', 'minimize');
    } else {
        document.exitFullscreen();
        document.getElementById('fullscreen-icon').setAttribute('data-lucide', 'maximize');
    }
    lucide.createIcons();
}

function resetDashboard() { window.location.reload(); }

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    document.getElementById('sidebar-icon').setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
    lucide.createIcons();
}

function downloadPDF() {
    const element = document.getElementById('report-container');
    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Relatorio_Executivo_Risco_Credito.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a2', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
}

function selectAllInCard(categoryName) {
    document.querySelectorAll(`input[name="${categoryName}"]`).forEach(cb => cb.checked = true);
    applyFilters();
}

function clearAllInCard(categoryName) {
    document.querySelectorAll(`input[name="${categoryName}"]`).forEach(cb => cb.checked = false);
    applyFilters();
}

function clearAllFilters() {
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => cb.checked = false);
    applyFilters();
}

function applyFilters() {
    const gradesSelected = Array.from(document.querySelectorAll('input[name="grade"]:checked')).map(cb => cb.value);
    const moradiasSelected = Array.from(document.querySelectorAll('input[name="moradia"]:checked')).map(cb => cb.value);
    const motivosSelected = Array.from(document.querySelectorAll('input[name="motivo"]:checked')).map(cb => cb.value);

    const filteredData = DB_CREDITO.filter(item =>
        gradesSelected.includes(item.grade) &&
        moradiasSelected.includes(item.moradia) &&
        motivosSelected.includes(item.motivo)
    );

    let totalOp = 0, totalInad = 0, volumeTotal = 0, volumePerdido = 0, somaJuros = 0;
    filteredData.forEach(item => {
        totalOp += item.total;
        totalInad += item.inadimplentes;
        volumeTotal += item.volume;
        volumePerdido += (item.inadimplentes * item.ticket);
        somaJuros += (item.juros * item.total);
    });

    const txInadimplencia = totalOp > 0 ? ((totalInad / totalOp) * 100).toFixed(1) : '0.0';
    const jurosMedio = totalOp > 0 ? (somaJuros / totalOp).toFixed(2) : '0.00';

    document.getElementById('kpi-volume').innerText = `R$ ${(volumeTotal / 1000000).toFixed(1)}M`;
    document.getElementById('kpi-default').innerText = `${txInadimplencia}%`;
    document.getElementById('kpi-loss').innerText = `R$ ${(volumePerdido / 1000000).toFixed(1)}M`;
    document.getElementById('kpi-juros').innerText = `${jurosMedio}%`;

    updateCharts(filteredData);
}

function updateCharts(data) {
    if (!charts.c1_1) return;

    const rawGrades = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    // Inadimplência por Nota %
    const inadByGrade = rawGrades.map(g => {
        const items = data.filter(d => d.grade === g);
        const tot = items.reduce((a, b) => a + b.total, 0);
        const inad = items.reduce((a, b) => a + b.inadimplentes, 0);
        return tot > 0 ? parseFloat(((inad / tot) * 100).toFixed(1)) : 0;
    });

    // Capital Perdido em R$ M
    const lossByGrade = rawGrades.map(g => {
        const items = data.filter(d => d.grade === g);
        const loss = items.reduce((a, b) => a + (b.inadimplentes * b.ticket), 0);
        return parseFloat((loss / 1000000).toFixed(2));
    });

    // Taxa de Juros por Nota %
    const jurosByGrade = rawGrades.map(g => {
        const items = data.filter(d => d.grade === g);
        const tot = items.reduce((a, b) => a + b.total, 0);
        const somaJ = items.reduce((a, b) => a + (b.juros * b.total), 0);
        return tot > 0 ? parseFloat((somaJ / tot).toFixed(2)) : 0;
    });

    charts.c1_1.data.datasets[0].data = inadByGrade;
    charts.c1_1.update();

    charts.c1_2.data.datasets[0].data = lossByGrade;
    charts.c1_2.update();

    charts.c3_2.data.datasets[0].data = jurosByGrade;
    charts.c3_2.update();
}

window.onload = function () {
    lucide.createIcons();

    // GARANTE O MODO CLARO INICIAL SEMPRE
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');

    // CORES DA PALETA PARA OS GRÁFICOS
    const COLOR_NAVY = '#304878';
    const COLOR_GOLD = '#f0a818';
    const COLOR_SLATE = '#7890a8';
    const COLOR_DARK = '#181848';

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top', labels: { font: { family: 'Inter', size: 11, weight: '600' } } },
            datalabels: {
                display: true,
                color: COLOR_DARK,
                anchor: 'end',
                align: 'end',
                font: { weight: 'bold', size: 10, family: 'Inter' },
                formatter: (value) => value !== null && value !== undefined ? value : ''
            }
        },
        scales: {
            x: { grid: { color: 'rgba(120, 144, 168, 0.15)' }, ticks: { font: { family: 'Inter', size: 10, weight: '500' } } },
            y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11, weight: '600' } } }
        }
    };

    const horizontalOptions = {
        ...baseOptions,
        indexAxis: 'y'
    };

    const gradesLabels = ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Grade E', 'Grade F', 'Grade G'];

    // ABA 1: EXECUTIVE OVERVIEW
    charts.c1_1 = new Chart(document.getElementById('chart1_1'), {
        type: 'bar',
        data: { labels: gradesLabels, datasets: [{ label: 'Taxa de Inadimplência Real (%)', data: [], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    charts.c1_2 = new Chart(document.getElementById('chart1_2'), {
        type: 'bar',
        data: { labels: gradesLabels, datasets: [{ label: 'Capital Perdido em Default (R$ Milhões)', data: [], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => 'R$ ' + v + 'M' } } }
    });

    charts.c1_3 = new Chart(document.getElementById('chart1_3'), {
        type: 'bar',
        data: { labels: ['Até R$ 30k', 'R$ 30k-60k', 'R$ 60k-100k', 'Acima R$ 100k'], datasets: [{ label: 'Default x Faixa de Renda (%)', data: [31.4, 22.1, 14.8, 8.2], backgroundColor: COLOR_NAVY, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    charts.c1_4 = new Chart(document.getElementById('chart1_4'), {
        type: 'bar',
        data: { labels: gradesLabels, datasets: [{ label: 'Ticket Médio Concedido (R$)', data: [8800, 10200, 9600, 11400, 13200, 15100, 18500], backgroundColor: COLOR_NAVY, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => 'R$ ' + v.toLocaleString('pt-BR') } } }
    });

    // ABA 2: PERFIL DO CLIENTE
    new Chart(document.getElementById('chart2_1'), {
        type: 'bar',
        data: { labels: ['Alugada (RENT)', 'Financiada (MORTGAGE)', 'Própria (OWN)', 'Outros'], datasets: [{ label: 'Inadimplência por Moradia (%)', data: [31.2, 11.4, 6.8, 24.5], backgroundColor: [COLOR_GOLD, COLOR_NAVY, COLOR_SLATE, COLOR_DARK], borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    new Chart(document.getElementById('chart2_2'), {
        type: 'bar',
        data: { labels: ['18-23 anos', '24-29 anos', '30-39 anos', '40-49 anos', '50+ anos'], datasets: [{ label: 'Volume Concedido (R$ Milhões)', data: [85.2, 112.4, 68.1, 32.5, 12.6], backgroundColor: COLOR_NAVY, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => 'R$ ' + v + 'M' } } }
    });

    new Chart(document.getElementById('chart2_3'), {
        type: 'bar',
        data: { labels: ['18-23 anos', '24-29 anos', '30-39 anos', '40-49 anos', '50+ anos'], datasets: [{ label: 'Taxa de Inadimplência por Idade (%)', data: [26.4, 21.8, 18.2, 15.1, 12.4], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    new Chart(document.getElementById('chart2_4'), {
        type: 'bar',
        data: { labels: ['< 2 anos', '2 - 5 anos', '5 - 10 anos', '> 10 anos'], datasets: [{ label: 'Default x Estabilidade no Emprego (%)', data: [34.1, 22.8, 13.5, 6.2], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    // ABA 3: PRICING & PROPÓSITO
    new Chart(document.getElementById('chart3_1'), {
        type: 'bar',
        data: { labels: ['Educação', 'Saúde / Médico', 'Pessoal', 'Negócios', 'Consolidação', 'Reforma'], datasets: [{ label: 'Volume Total Emprestado (R$ M)', data: [68.4, 62.1, 58.2, 54.1, 49.8, 18.2], backgroundColor: COLOR_NAVY, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => 'R$ ' + v + 'M' } } }
    });

    charts.c3_2 = new Chart(document.getElementById('chart3_2'), {
        type: 'bar',
        data: { labels: gradesLabels, datasets: [{ label: 'Taxa Média de Juros (Pricing %)', data: [], backgroundColor: COLOR_NAVY, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    new Chart(document.getElementById('chart3_3'), {
        type: 'bar',
        data: { labels: ['Educação', 'Saúde / Médico', 'Pessoal', 'Negócios', 'Consolidação', 'Reforma'], datasets: [{ label: 'Taxa de Inadimplência por Motivo (%)', data: [17.2, 26.8, 21.4, 18.9, 24.1, 19.5], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    new Chart(document.getElementById('chart3_4'), {
        type: 'bar',
        data: { labels: gradesLabels, datasets: [{ label: 'Taxa Média de Reprovação (%)', data: [8.1, 18.4, 34.2, 62.1, 88.5, 94.1, 99.0], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    // ABA 4: MATRIZ DE RISCO & COMPROVAMENTO
    new Chart(document.getElementById('chart4_1'), {
        type: 'bar',
        data: { labels: ['Risco Baixo (<20%)', 'Risco Médio (20%-39%)', 'Risco Alto (>40%)'], datasets: [{ label: 'Inadimplência por Comprometimento (%)', data: [11.2, 23.4, 64.8], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    new Chart(document.getElementById('chart4_2'), {
        type: 'bar',
        data: { labels: ['Até 10%', '11% - 20%', '21% - 30%', '31% - 40%', '> 40%'], datasets: [{ label: 'Volume de Contratos (Qtd Clientes)', data: [8200, 12400, 7800, 2800, 1381], backgroundColor: COLOR_NAVY, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v.toLocaleString('pt-BR') } } }
    });

    new Chart(document.getElementById('chart4_3'), {
        type: 'bar',
        data: { labels: ['0 - 2 anos', '3 - 5 anos', '6 - 10 anos', '> 10 anos'], datasets: [{ label: 'Default x Histórico de Crédito (%)', data: [31.8, 20.4, 12.1, 6.8], backgroundColor: COLOR_GOLD, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => v + '%' } } }
    });

    new Chart(document.getElementById('chart4_4'), {
        type: 'bar',
        data: { labels: ['Até R$ 30k', 'R$ 30k-60k', 'R$ 60k-100k', 'Acima R$ 100k'], datasets: [{ label: 'Renda Anual x Ticket Concedido (R$)', data: [4200, 8500, 12400, 18900], backgroundColor: COLOR_NAVY, borderRadius: 4 }] },
        options: { ...horizontalOptions, plugins: { ...horizontalOptions.plugins, datalabels: { ...horizontalOptions.plugins.datalabels, formatter: v => 'R$ ' + v.toLocaleString('pt-BR') } } }
    });

    applyFilters();
};