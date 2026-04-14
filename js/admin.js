document.addEventListener('DOMContentLoaded', async () => {
    
    // UI Elements
    const loadingDash = document.getElementById('loadingDash');
    const dashContent = document.getElementById('dashContent');
    
    const countTotal = document.getElementById('countTotal');
    const topState = document.getElementById('topState');
    const topIssue = document.getElementById('topIssue');
    
    const filterUF = document.getElementById('filterUF');
    const filterProblema = document.getElementById('filterProblema');
    const tableBody = document.getElementById('tableBody');

    // Charts
    let chartUFInstance = null;
    let chartProblemaInstance = null;

    // Globals
    let todasDemandas = [];

    // Tema Core do Chart.js
    Chart.defaults.color = '#9ba0a8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Fetching Data
    async function loadData() {
        try {
            // Nota: Para usar com Supabase, configuramos a tabela para ser legível (RLS disabled ou SELECT aberto)
            const { data, error } = await supabaseClient
                .from('demandas_cbtt')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erro ao buscar dados:", error);
                throw error;
            }

            todasDemandas = data || [];
            
            // Popula os Selects de Filtro
            populateFilters(todasDemandas);
            
            // Atualiza Dashboard com tudo
            updateDashboard(todasDemandas);

            // Escutadores de Evento de Filtro
            filterUF.addEventListener('change', runFilters);
            filterProblema.addEventListener('change', runFilters);

            // Mostrar Interface
            loadingDash.style.display = 'none';
            dashContent.style.display = 'block';

        } catch (err) {
            loadingDash.innerHTML = `<p style="color: #e57373;">Falha ao carregar as demandas: ${err.message}. Verifique a conexão com o Supabase.</p>`;
        }
    }

    // 2. Extrai valores únicos para os filtros
    function populateFilters(data) {
        const ufs = [...new Set(data.map(d => d.estado))].sort();
        const probs = [...new Set(data.map(d => d.tipo_problema))].sort();

        ufs.forEach(uf => {
            const opt = document.createElement('option');
            opt.value = uf;
            opt.textContent = uf;
            filterUF.appendChild(opt);
        });

        probs.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            filterProblema.appendChild(opt);
        });
    }

    // 3. Aplica os Filtros Locais
    function runFilters() {
        const selUF = filterUF.value;
        const selProb = filterProblema.value;

        let filtered = todasDemandas;

        if (selUF !== 'ALL') {
            filtered = filtered.filter(d => d.estado === selUF);
        }
        
        if (selProb !== 'ALL') {
            filtered = filtered.filter(d => d.tipo_problema === selProb);
        }

        updateDashboard(filtered);
    }

    // 4. Update da UI Baseada nos Dados
    function updateDashboard(data) {
        // Estatisticas
        countTotal.textContent = data.length;

        // Frequencia UF e Problema
        const freqUF = {};
        const freqProb = {};

        data.forEach(d => {
            freqUF[d.estado] = (freqUF[d.estado] || 0) + 1;
            freqProb[d.tipo_problema] = (freqProb[d.tipo_problema] || 0) + 1;
        });

        const arrUF = Object.entries(freqUF).sort((a,b) => b[1] - a[1]);
        const arrProb = Object.entries(freqProb).sort((a,b) => b[1] - a[1]);

        topState.textContent = arrUF.length > 0 ? arrUF[0][0] : '-';
        topIssue.textContent = arrProb.length > 0 ? arrProb[0][0] : '-';

        // Atualizar Tabelas e Gráficos
        renderTable(data);
        renderCharts(arrUF, arrProb);
    }

    // 5. Tabela
    function renderTable(data) {
        tableBody.innerHTML = '';

        if(data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhuma demanda encontrada.</td></tr>`;
            return;
        }

        data.forEach(d => {
            const tr = document.createElement('tr');
            
            // Formatando data
            const date = new Date(d.created_at);
            const dateStr = date.toLocaleDateString('pt-BR');

            // Formatando Tag
            let tagClass = 'tag-default';
            if(d.tipo_problema.toLowerCase().includes('lapso')) tagClass = 'tag-lapso';
            else if(d.tipo_problema.toLowerCase().includes('análise') || d.tipo_problema.toLowerCase().includes('analisado')) tagClass = 'tag-analise';
            else if(d.tipo_problema.toLowerCase().includes('sistema')) tagClass = 'tag-sistema';

            // Anexo
            let anexoHtml = '-';
            if(d.anexo_url) {
                anexoHtml = `<a href="${d.anexo_url}" target="_blank" class="attachment-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg> Ver
                </a>`;
            }

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>
                    <b>${d.nome || 'Anônimo'}</b>
                    <br><span style="font-size:0.8rem; color:var(--text-muted);">${d.cr ? 'CR/CPF: ' + d.cr : ''}</span>
                </td>
                <td>${d.estado}</td>
                <td><span class="tag ${tagClass}">${d.tipo_problema}</span></td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${d.descricao}">
                    ${d.descricao}
                </td>
                <td>${anexoHtml}</td>
            `;

            tableBody.appendChild(tr);
        });
    }

    // 6. Gráficos
    function renderCharts(arrUF, arrProb) {
        
        // Destruir gráficos anteriores se existirem (para o filtro não sobrepor)
        if(chartUFInstance) chartUFInstance.destroy();
        if(chartProblemaInstance) chartProblemaInstance.destroy();

        // Limita a 10 valores pra não ficar muito confuso. Menores viram "Outros"
        const ufLabels = arrUF.slice(0, 10).map(i => i[0]);
        const ufData = arrUF.slice(0, 10).map(i => i[1]);

        chartUFInstance = new Chart(document.getElementById('chartUF'), {
            type: 'bar',
            data: {
                labels: ufLabels,
                datasets: [{
                    label: 'Qtd Demandas',
                    data: ufData,
                    backgroundColor: '#f1b72a',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // Gráfico de Problemas (Doughnut)
        const probLabels = arrProb.map(i => i[0]);
        const probData = arrProb.map(i => i[1]);

        chartProblemaInstance = new Chart(document.getElementById('chartProblema'), {
            type: 'doughnut',
            data: {
                labels: probLabels,
                datasets: [{
                    data: probData,
                    backgroundColor: [
                        '#cf4f4f', // Red/Danger
                        '#f1b72a', // Primary
                        '#375429', // Accent
                        '#42a5f5', 
                        '#9ba0a8'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                },
                cutout: '70%'
            }
        });
    }

    // Iniciar Fluxo de Autenticação
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // Se não tem login válido, bloqueia a tela e redireciona.
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Apenas se tiver sessão, prossegue com loadData
    loadData();

    // 7. Botão de Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }

});
