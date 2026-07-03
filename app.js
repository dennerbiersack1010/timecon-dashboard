// Timecon Soluções Financeiras - SPA Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initial State & Configs
    const state = {
        theme: localStorage.getItem('theme') || 'dark',
        role: 'client', // 'client' or 'admin'
        activeView: 'dashboard-cliente',
        simulation: {
            category: 'imovel',
            credit: 200000,
            months: 120,
            rates: {
                imovel: { tax: 0.15, reserve: 0.02 },
                automovel: { tax: 0.12, reserve: 0.02 },
                moto: { tax: 0.10, reserve: 0.015 },
                servicos: { tax: 0.08, reserve: 0.01 }
            }
        },
        bid: {
            quota: 'imovel',
            type: 'libre',
            percentage: 30,
            embedded: 0,
            value: 200000
        },
        pendingBids: [
            { id: '1', group: '3024', quota: '145', type: 'Imóvel', client: 'Carlos Silva', method: 'Lance Livre (Embutido 10%)', pct: 35, value: 70000 },
            { id: '2', group: '1020', quota: '012', type: 'Automóveis', client: 'Amanda Oliveira', method: 'Lance Fixo', pct: 20, value: 16000 },
            { id: '3', group: '4040', quota: '333', type: 'Serviços', client: 'Marcos Souza', method: 'Lance Livre', pct: 45, value: 13500 }
        ]
    };

    // UI Cache Elements
    const elements = {
        themeBtn: document.querySelector('.theme-toggle-btn'),
        roleClientBtn: document.getElementById('role-client'),
        roleAdminBtn: document.getElementById('role-admin'),
        navItems: document.querySelectorAll('.nav-item'),
        mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
        views: document.querySelectorAll('.dashboard-view'),
        viewTitle: document.getElementById('view-title'),
        
        // Simulator Elements
        simCategories: document.querySelectorAll('.category-option'),
        inputCredit: document.getElementById('input-credit'),
        inputMonths: document.getElementById('input-months'),
        displayCredit: document.getElementById('display-credit'),
        displayMonths: document.getElementById('display-months'),
        resultCredit: document.getElementById('result-credit'),
        resultTaxRate: document.getElementById('result-tax-rate'),
        resultTotalPayable: document.getElementById('result-total-payable'),
        resultMonthly: document.getElementById('result-monthly'),
        btnRequestContact: document.getElementById('btn-request-contact'),
        btnGotoSimulator: document.getElementById('btn-goto-simulator'),
        
        // Bidding Elements
        formBid: document.getElementById('form-submit-bid'),
        bidQuotaSelect: document.getElementById('bid-quota-select'),
        radioBidLibre: document.getElementById('radio-bid-libre'),
        radioBidFixe: document.getElementById('radio-bid-fixe'),
        containerBidValue: document.getElementById('container-bid-value'),
        inputBidPercentage: document.getElementById('bid-percentage'),
        displayBidPercentage: document.getElementById('display-bid-percentage'),
        bidCalculatedValue: document.getElementById('bid-calculated-value'),
        bidEmbeddedSelect: document.getElementById('bid-embedded-select'),
        
        // Financials Elements
        finQuotaSelect: document.getElementById('fin-quota-select'),
        financialTableBody: document.getElementById('financial-table-body'),
        pixModal: document.getElementById('pix-modal'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        btnCopyPix: document.getElementById('btn-copy-pix'),
        pixCodeString: document.getElementById('pix-code-string'),
        modalPaymentValue: document.getElementById('modal-payment-value'),
        
        // Admin Elements
        adminPendingBadge: document.getElementById('admin-pending-badge'),
        adminLanceCount: document.getElementById('admin-lance-count'),
        adminLancesTbody: document.getElementById('admin-lances-tbody'),
        
        toastContainer: document.getElementById('toast-container')
    };

    // Initialize Theme
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    // Theme Toggle Handler
    elements.themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        updateThemeIcon();
        showToast('Tema atualizado com sucesso!', 'info');
    });

    function updateThemeIcon() {
        const icon = elements.themeBtn.querySelector('i');
        if (state.theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
            elements.themeBtn.title = 'Mudar para modo claro';
        } else {
            icon.className = 'fa-solid fa-moon';
            elements.themeBtn.title = 'Mudar para modo escuro';
        }
    }

    // Role Switcher Handler (Cliente vs Consultor)
    elements.roleClientBtn.addEventListener('click', () => setRole('client'));
    elements.roleAdminBtn.addEventListener('click', () => setRole('admin'));

    function setRole(role) {
        state.role = role;

        // Toggle Active Class
        if (role === 'client') {
            elements.roleClientBtn.classList.add('active');
            elements.roleAdminBtn.classList.remove('active');

            // Profile is a Client: only the Cliente badge is shown, no switch to Consultor
            elements.roleClientBtn.style.display = 'flex';
            elements.roleAdminBtn.style.display = 'none';

            // Show/Hide Navigation Links
            document.querySelectorAll('.client-nav').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.admin-nav').forEach(el => el.style.display = 'none');

            document.querySelectorAll('.client-mobile-nav').forEach(el => el.style.display = 'flex');
            document.querySelectorAll('.admin-mobile-nav').forEach(el => el.style.display = 'none');

            // Switch to client dashboard
            navigateToView('dashboard-cliente');
            showToast('Modo Cliente ativado', 'info');
        } else {
            elements.roleClientBtn.classList.remove('active');
            elements.roleAdminBtn.classList.add('active');

            // Profile is a Consultor/Admin: only the Consultor badge is shown, no switch to Cliente
            elements.roleClientBtn.style.display = 'none';
            elements.roleAdminBtn.style.display = 'flex';

            // Show/Hide Navigation Links
            document.querySelectorAll('.client-nav').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.admin-nav').forEach(el => el.style.display = 'block');

            document.querySelectorAll('.client-mobile-nav').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.admin-mobile-nav').forEach(el => el.style.display = 'flex');

            // Switch to admin dashboard
            navigateToView('dashboard-admin');
            showToast('Modo Consultor (Admin) ativado', 'info');

            // Initialize charts if not initialized
            initAdminCharts();
        }
    }

    // Navigation logic
    function navigateToView(viewId) {
        state.activeView = viewId;
        
        // Hide all views and show target
        elements.views.forEach(view => {
            view.classList.remove('active');
            if (view.id === viewId) {
                view.classList.add('active');
            }
        });

        // Set Nav Link States
        elements.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === viewId) {
                item.classList.add('active');
            }
        });

        elements.mobileNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === viewId) {
                item.classList.add('active');
            }
        });

        // Update Title in Header
        const titles = {
            'dashboard-cliente': 'Meu Consórcio',
            'simulador': 'Simulador de Crédito',
            'lances': 'Oferta de Lance',
            'financeiro': 'Financeiro & Pagamentos',
            'ajuda-faq': 'Ajuda & FAQ',
            'dashboard-admin': 'Painel Administrativo',
            'admin-lances': 'Homologação de Lances'
        };
        elements.viewTitle.innerText = titles[viewId] || 'Dashboard';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Attach click events to nav items
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToView(item.getAttribute('data-view'));
        });
    });

    elements.mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToView(item.getAttribute('data-view'));
        });
    });

    // Quick Action button in Dashboard to simulator
    if(elements.btnGotoSimulator) {
        elements.btnGotoSimulator.addEventListener('click', () => navigateToView('simulador'));
    }

    // ================= SIMULATOR LOGIC =================
    elements.simCategories.forEach(opt => {
        opt.addEventListener('click', () => {
            elements.simCategories.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            state.simulation.category = opt.getAttribute('data-category');
            
            // Adjust slider ranges based on category
            if (state.simulation.category === 'servicos') {
                elements.inputCredit.min = 10000;
                elements.inputCredit.max = 100000;
                elements.inputCredit.value = Math.min(Math.max(elements.inputCredit.value, 10000), 100000);
                elements.inputMonths.min = 12;
                elements.inputMonths.max = 48;
                elements.inputMonths.value = Math.min(Math.max(elements.inputMonths.value, 12), 48);
            } else if (state.simulation.category === 'moto') {
                elements.inputCredit.min = 10000;
                elements.inputCredit.max = 50000;
                elements.inputCredit.value = Math.min(Math.max(elements.inputCredit.value, 10000), 50000);
                elements.inputMonths.min = 24;
                elements.inputMonths.max = 84;
                elements.inputMonths.value = Math.min(Math.max(elements.inputMonths.value, 24), 84);
            } else {
                elements.inputCredit.min = 50000;
                elements.inputCredit.max = 1000000;
                elements.inputMonths.min = 36;
                elements.inputMonths.max = 240;
            }
            
            updateSimulation();
        });
    });

    elements.inputCredit.addEventListener('input', (e) => {
        state.simulation.credit = parseInt(e.target.value);
        updateSimulation();
    });

    elements.inputMonths.addEventListener('input', (e) => {
        state.simulation.months = parseInt(e.target.value);
        updateSimulation();
    });

    function updateSimulation() {
        const sim = state.simulation;
        const rates = sim.rates[sim.category];
        
        // Update display text
        elements.displayCredit.innerText = formatCurrency(sim.credit);
        elements.displayMonths.innerText = `${sim.months} meses`;
        
        // Calculations
        const totalTaxRate = rates.tax;
        const reserveRate = rates.reserve;
        const totalPayable = sim.credit * (1 + totalTaxRate + reserveRate);
        const monthlyInstallment = totalPayable / sim.months;
        
        // Render results
        elements.resultCredit.innerText = formatCurrency(sim.credit);
        elements.resultTaxRate.innerText = `${(totalTaxRate * 100).toFixed(1)}%`;
        elements.resultTotalPayable.innerText = formatCurrency(totalPayable);
        elements.resultMonthly.innerText = formatCurrency(monthlyInstallment);
    }

    elements.btnRequestContact.addEventListener('click', () => {
        showToast('Simulação enviada! Um consultor entrará em contato em breve.', 'success');
    });

    // ================= BID/LANCE LOGIC =================
    // Modal selection
    elements.radioBidLibre.addEventListener('click', () => {
        elements.radioBidLibre.classList.add('active');
        elements.radioBidFixe.classList.remove('active');
        elements.radioBidLibre.querySelector('input').checked = true;
        elements.containerBidValue.style.display = 'block';
        state.bid.type = 'libre';
        updateBidCalculations();
    });

    elements.radioBidFixe.addEventListener('click', () => {
        elements.radioBidFixe.classList.add('active');
        elements.radioBidLibre.classList.remove('active');
        elements.radioBidFixe.querySelector('input').checked = true;
        elements.containerBidValue.style.display = 'none';
        state.bid.type = 'fixe';
        state.bid.percentage = 20;
        updateBidCalculations();
    });

    elements.inputBidPercentage.addEventListener('input', (e) => {
        state.bid.percentage = parseInt(e.target.value);
        updateBidCalculations();
    });

    elements.bidEmbeddedSelect.addEventListener('change', (e) => {
        state.bid.embedded = parseInt(e.target.value);
        updateBidCalculations();
    });

    function updateBidCalculations() {
        elements.displayBidPercentage.innerText = `${state.bid.percentage}%`;
        const creditValue = 200000; // Imóvel base value
        const totalBid = creditValue * (state.bid.percentage / 100);
        elements.bidCalculatedValue.innerText = formatCurrency(totalBid);
    }

    // Bid submit
    elements.formBid.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const typeSelect = elements.bidQuotaSelect.value;
        const totalBidPercentage = state.bid.percentage;
        const value = 200000 * (totalBidPercentage / 100);
        
        // Add to state pending bids
        const newBid = {
            id: String(state.pendingBids.length + 1),
            group: '3024',
            quota: '145',
            type: 'Imóvel',
            client: 'Carlos Silva',
            method: state.bid.type === 'libre' ? `Lance Livre (Embutido ${state.bid.embedded}%)` : 'Lance Fixo',
            pct: totalBidPercentage,
            value: value
        };
        
        state.pendingBids.push(newBid);
        renderAdminBids();
        
        showToast('Lance ofertado com sucesso! Aguarde a homologação na próxima assembleia.', 'success');
        
        // Reset form and navigate back to dashboard
        elements.formBid.reset();
        navigateToView('dashboard-cliente');
    });

    // ================= FINANCIALS LOGIC =================
    // Filter selection changes tables
    elements.finQuotaSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        let html = '';
        if (val === 'imovel') {
            html = `
                <tr>
                    <td>13 / 60</td>
                    <td>10/07/2026</td>
                    <td>R$ 3.900,00</td>
                    <td><span class="status-badge pending">Aberto</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm btn-generate-pix" data-installment="13" data-value="3.900,00" style="padding: 6px 12px; font-size: 0.8rem;">
                            <i class="fa-solid fa-qrcode"></i> Pagar via Pix
                        </button>
                    </td>
                </tr>
                <tr>
                    <td>12 / 60</td>
                    <td>10/06/2026</td>
                    <td>R$ 3.900,00</td>
                    <td><span class="status-badge active">Pago</span></td>
                    <td><button class="btn btn-secondary btn-sm" disabled style="padding: 6px 12px; font-size: 0.8rem; opacity: 0.5;"><i class="fa-solid fa-check"></i> Comprovante</button></td>
                </tr>
                <tr>
                    <td>11 / 60</td>
                    <td>10/05/2026</td>
                    <td>R$ 3.900,00</td>
                    <td><span class="status-badge active">Pago</span></td>
                    <td><button class="btn btn-secondary btn-sm" disabled style="padding: 6px 12px; font-size: 0.8rem; opacity: 0.5;"><i class="fa-solid fa-check"></i> Comprovante</button></td>
                </tr>
            `;
        } else {
            html = `
                <tr>
                    <td>13 / 60</td>
                    <td>10/07/2026</td>
                    <td>R$ 780,00</td>
                    <td><span class="status-badge pending">Aberto</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm btn-generate-pix" data-installment="13" data-value="780,00" style="padding: 6px 12px; font-size: 0.8rem;">
                            <i class="fa-solid fa-qrcode"></i> Pagar via Pix
                        </button>
                    </td>
                </tr>
                <tr>
                    <td>12 / 60</td>
                    <td>10/06/2026</td>
                    <td>R$ 780,00</td>
                    <td><span class="status-badge active">Pago</span></td>
                    <td><button class="btn btn-secondary btn-sm" disabled style="padding: 6px 12px; font-size: 0.8rem; opacity: 0.5;"><i class="fa-solid fa-check"></i> Comprovante</button></td>
                </tr>
            `;
        }
        elements.financialTableBody.innerHTML = html;
        attachPixBtnEvents();
    });

    // Pix Modal Trigger
    function attachPixBtnEvents() {
        document.querySelectorAll('.btn-generate-pix').forEach(btn => {
            btn.addEventListener('click', () => {
                const valStr = btn.getAttribute('data-value');
                elements.modalPaymentValue.innerText = `R$ ${valStr}`;
                elements.pixModal.classList.add('active');
            });
        });
    }
    attachPixBtnEvents();

    elements.btnCloseModal.addEventListener('click', () => {
        elements.pixModal.classList.remove('active');
    });

    elements.btnCopyPix.addEventListener('click', () => {
        elements.pixCodeString.select();
        elements.pixCodeString.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(elements.pixCodeString.value);
        showToast('Código Pix copiado para a área de transferência!', 'success');
    });

    // ================= ADMIN LOGIC =================
    // Renders the pending bids table
    function renderAdminBids() {
        const pendingCount = state.pendingBids.length;
        elements.adminPendingBadge.innerText = String(pendingCount).padStart(2, '0');
        elements.adminLanceCount.innerText = `${pendingCount} Pendente${pendingCount !== 1 ? 's' : ''}`;
        
        let html = '';
        state.pendingBids.forEach(bid => {
            html += `
                <tr id="row-bid-${bid.id}">
                    <td><strong>${bid.group} / ${bid.quota}</strong> (${bid.type})</td>
                    <td>${bid.client}</td>
                    <td>${bid.method}</td>
                    <td><strong>${bid.pct}%</strong></td>
                    <td>${formatCurrency(bid.value)}</td>
                    <td>
                        <button class="action-badge badge-approve" onclick="window.approveBid('${bid.id}')"><i class="fa-solid fa-check"></i> Homologar</button>
                        <button class="action-badge badge-reject" onclick="window.rejectBid('${bid.id}')"><i class="fa-solid fa-xmark"></i> Recusar</button>
                    </td>
                </tr>
            `;
        });
        elements.adminLancesTbody.innerHTML = html || '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum lance pendente de homologação.</td></tr>';
    }

    // Global handles for HTML inline onclick
    window.approveBid = function(id) {
        state.pendingBids = state.pendingBids.filter(b => b.id !== id);
        renderAdminBids();
        showToast('Lance homologado com sucesso!', 'success');
    };

    window.rejectBid = function(id) {
        state.pendingBids = state.pendingBids.filter(b => b.id !== id);
        renderAdminBids();
        showToast('Lance recusado.', 'warning');
    };

    // Initial render
    renderAdminBids();

    // ================= CHARTJS CHARTS =================
    let salesChart = null;
    let contemplationChart = null;

    function initAdminCharts() {
        if (salesChart || contemplationChart) return; // avoid double init

        const isDark = state.theme === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        const textStyleColor = isDark ? '#8c93b3' : '#5a6080';
        const tooltipBg = isDark ? '#0c0e25' : '#ffffff';
        const tooltipBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(1,11,82,0.08)';

        const sharedTooltip = {
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            borderWidth: 1,
            padding: 12,
            titleColor: '#f1f3f9',
            bodyColor: '#8c93b3',
            titleFont: { family: 'Outfit', size: 13, weight: '600' },
            bodyFont: { family: 'Inter', size: 12 },
            cornerRadius: 10,
            displayColors: true,
            boxPadding: 4
        };

        // Chart 1: Sales by Category
        const ctxSales = document.getElementById('salesChart').getContext('2d');

        function makeBarGradient(ctx, colorHex) {
            const g = ctx.createLinearGradient(0, 0, 0, 260);
            g.addColorStop(0, colorHex + 'e6');
            g.addColorStop(1, colorHex + '1a');
            return g;
        }

        const barColors = ['#0da0dc', '#e19f0d', '#10b981', '#6a7bd6'];
        salesChart = new Chart(ctxSales, {
            type: 'bar',
            data: {
                labels: ['Imóveis', 'Automóveis', 'Motos', 'Serviços'],
                datasets: [{
                    label: 'Volume (Milhões R$)',
                    data: [24.5, 12.8, 5.4, 2.5],
                    backgroundColor: barColors.map(c => makeBarGradient(ctxSales, c)),
                    hoverBackgroundColor: barColors,
                    borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
                    borderSkipped: false,
                    borderWidth: 0,
                    maxBarThickness: 46,
                    barPercentage: 0.65,
                    categoryPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 8 } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...sharedTooltip,
                        callbacks: {
                            label: (item) => `R$ ${item.parsed.y}M em vendas`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: textStyleColor, font: { family: 'Inter', size: 12 } }
                    },
                    y: {
                        grid: { color: gridColor, drawTicks: false },
                        border: { display: false },
                        ticks: {
                            color: textStyleColor,
                            font: { family: 'Inter', size: 11 },
                            padding: 8,
                            callback: (val) => `R$ ${val}M`
                        }
                    }
                }
            }
        });

        // Chart 2: Contemplation Profile (slim donut with centered total)
        const ctxCont = document.getElementById('contemplationChart').getContext('2d');
        const donutColors = ['#12124B', '#0da0dc', '#e19f0d'];
        const donutBorder = isDark ? '#0c0e25' : '#ffffff';

        const centerTextPlugin = {
            id: 'centerText',
            afterDraw(chart) {
                const { ctx, chartArea } = chart;
                if (!chartArea) return;
                const cx = (chartArea.left + chartArea.right) / 2;
                const cy = (chartArea.top + chartArea.bottom) / 2;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isDark ? '#f1f3f9' : '#0b0e25';
                ctx.font = "700 22px 'Outfit', sans-serif";
                ctx.fillText('100%', cx, cy - 8);
                ctx.fillStyle = textStyleColor;
                ctx.font = "500 11px 'Inter', sans-serif";
                ctx.fillText('Contemplações', cx, cy + 14);
                ctx.restore();
            }
        };

        contemplationChart = new Chart(ctxCont, {
            type: 'doughnut',
            data: {
                labels: ['Sorteio', 'Lance Livre', 'Lance Fixo'],
                datasets: [{
                    data: [35, 45, 20],
                    backgroundColor: donutColors,
                    hoverOffset: 6,
                    borderWidth: 3,
                    borderColor: donutBorder,
                    spacing: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '74%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textStyleColor,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            boxHeight: 8,
                            padding: 18,
                            font: { family: 'Inter', size: 12 }
                        }
                    },
                    tooltip: {
                        ...sharedTooltip,
                        callbacks: {
                            label: (item) => ` ${item.label}: ${item.parsed}%`
                        }
                    }
                }
            },
            plugins: [centerTextPlugin]
        });
    }

    // ================= HELPERS & UTILS =================
    function formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }

    // Toast Messages
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'warning') icon = 'fa-circle-exclamation';
        
        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        // Remove toast after 3.5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }

    // Sidebar Collapse Logic
    const sidebar = document.querySelector('.sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Welcome Landing Screen & Profile Selection Logic (Netflix Style)
    const welcomeLanding = document.getElementById('welcome-landing-screen');
    const btnEnterDashboard = document.getElementById('btn-enter-dashboard');
    const profileSelection = document.getElementById('profile-selection-screen');
    const profileCards = document.querySelectorAll('.profile-card');
    const userDisplayName = document.getElementById('user-display-name');

    // Startup flow
    if (!sessionStorage.getItem('welcome_visited')) {
        if (welcomeLanding) {
            welcomeLanding.style.display = 'flex';
            welcomeLanding.classList.add('active');
        }
    } else if (!sessionStorage.getItem('profile_selected')) {
        if (welcomeLanding) welcomeLanding.style.display = 'none';
        if (profileSelection) {
            profileSelection.style.display = 'flex';
            profileSelection.classList.add('active');
        }
    } else {
        if (welcomeLanding) welcomeLanding.style.display = 'none';
        if (profileSelection) profileSelection.style.display = 'none';
        const savedRole = sessionStorage.getItem('profile_role') || 'client';
        const savedName = sessionStorage.getItem('profile_name') || 'Carlos Silva';
        if (userDisplayName) userDisplayName.innerText = savedName;
        // Delay role switch slightly to ensure UI is ready
        setTimeout(() => setRole(savedRole), 50);
    }

    if (btnEnterDashboard && welcomeLanding) {
        btnEnterDashboard.addEventListener('click', () => {
            welcomeLanding.style.opacity = '0';
            welcomeLanding.style.transition = 'opacity 0.4s ease';
            setTimeout(() => {
                welcomeLanding.classList.remove('active');
                welcomeLanding.style.display = 'none';
                sessionStorage.setItem('welcome_visited', 'true');
                
                // Show profile selector
                if (profileSelection) {
                    profileSelection.style.display = 'flex';
                    profileSelection.style.opacity = '1';
                    setTimeout(() => {
                        profileSelection.classList.add('active');
                    }, 50);
                }
            }, 400);
        });
    }

    // Profile Selection Interactions
    profileCards.forEach(card => {
        card.addEventListener('click', () => {
            const profileType = card.getAttribute('data-profile');
            const profileName = card.getAttribute('data-name');
            
            if (profileSelection) {
                profileSelection.style.opacity = '0';
                profileSelection.style.transition = 'opacity 0.4s ease';
                setTimeout(() => {
                    profileSelection.classList.remove('active');
                    profileSelection.style.display = 'none';
                    sessionStorage.setItem('profile_selected', 'true');
                    sessionStorage.setItem('profile_role', profileType === 'client' ? 'client' : 'admin');
                    sessionStorage.setItem('profile_name', profileName);
                    
                    if (userDisplayName) userDisplayName.innerText = profileName;
                    
                    // Activate role
                    setRole(profileType === 'client' ? 'client' : 'admin');
                    showToast(`Acessando como ${profileName}`, 'success');
                }, 400);
            }
        });
    });

    // Logout Logic
    const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
    const btnLogoutHeader = document.getElementById('btn-logout-header');
    
    function performLogout() {
        sessionStorage.removeItem('profile_selected');
        sessionStorage.removeItem('profile_role');
        sessionStorage.removeItem('profile_name');
        
        // Go directly to profile selection screen
        if (welcomeLanding) {
            welcomeLanding.style.display = 'none';
            welcomeLanding.classList.remove('active');
        }
        if (profileSelection) {
            profileSelection.style.opacity = '1';
            profileSelection.style.display = 'flex';
            profileSelection.classList.add('active');
        }
        showToast('Você saiu da sua conta.', 'info');
    }
    
    if (btnLogoutSidebar) btnLogoutSidebar.addEventListener('click', performLogout);
    if (btnLogoutHeader) btnLogoutHeader.addEventListener('click', performLogout);

    // FAQ Accordion Logic
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const parent = trigger.parentElement;
            const content = parent.querySelector('.faq-content');
            const icon = trigger.querySelector('i');
            
            // Toggle active state
            const isActive = parent.classList.contains('active');
            
            // Close all first
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                const c = item.querySelector('.faq-content');
                if (c) c.style.maxHeight = null;
                const ic = item.querySelector('.faq-trigger i');
                if (ic) ic.style.transform = 'rotate(0deg)';
            });
            
            if (!isActive) {
                parent.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    // Document Download Simulation
    const downloadBtns = document.querySelectorAll('.btn-download-doc');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const docName = btn.getAttribute('data-doc');
            showToast(`Iniciando download: ${docName}...`, 'info');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;
            
            setTimeout(() => {
                showToast(`Download de ${docName} concluído!`, 'success');
                btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-solid fa-download"></i>';
                    btn.disabled = false;
                }, 2000);
            }, 1500);
        });
    });

    // Setup initial simulator values
    updateSimulation();
});
