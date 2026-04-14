document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('demandaForm');
    const fileInput = document.getElementById('anexo');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const submitBtn = document.getElementById('submitBtn');
    const alertBox = document.getElementById('alertMessage');

    const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total

    // Mostra alerta no topo do card e faz scroll até ele
    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
        alertBox.style.display = 'flex';
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Exibe arquivos selecionados e valida tamanho total
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            fileNameDisplay.textContent = '';
            return;
        }

        const totalSize = files.reduce((acc, f) => acc + f.size, 0);

        if (totalSize > MAX_TOTAL_SIZE) {
            showAlert(`O tamanho total dos arquivos (${(totalSize / 1024 / 1024).toFixed(1)}MB) ultrapassa o limite de 10MB.`, 'error');
            fileInput.value = '';
            fileNameDisplay.textContent = '';
            return;
        }

        fileNameDisplay.innerHTML = files.map(f =>
            `<span>📎 ${f.name} <small>(${(f.size / 1024).toFixed(0)}KB)</small></span>`
        ).join('<br>');
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset Alert
        alertBox.style.display = 'none';
        alertBox.className = 'alert';

        // Start Loading
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const nome = document.getElementById('nome').value;
            const cr = document.getElementById('cr').value;
            const estado = document.getElementById('estado').value;
            const tipo_problema = document.getElementById('tipo_problema').value;
            const descricao = document.getElementById('descricao').value;
            const files = Array.from(fileInput.files);

            let anexo_urls = [];

            // Upload de múltiplos arquivos
            if (files.length > 0) {
                const totalSize = files.reduce((acc, f) => acc + f.size, 0);
                if (totalSize > MAX_TOTAL_SIZE) {
                    throw new Error(`O tamanho total dos arquivos ultrapassa o limite de 10MB.`);
                }

                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `${estado}/${fileName}`;

                    const { data: uploadData, error: uploadError } = await supabaseClient.storage
                        .from('anexos_demandas')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error("Erro no Upload:", uploadError);
                        throw new Error(`Falha ao enviar o arquivo: ${file.name}`);
                    }

                    const { data: publicURLData } = supabaseClient.storage
                        .from('anexos_demandas')
                        .getPublicUrl(filePath);

                    anexo_urls.push(publicURLData.publicUrl);
                }
            }

            // Insere a demanda na tabela (anexo_url recebe todas as URLs separadas por vírgula)
            const { error: insertError } = await supabaseClient
                .from('demandas_cbtt')
                .insert([{
                    nome,
                    cr,
                    estado,
                    tipo_problema,
                    descricao,
                    anexo_url: anexo_urls.join(', ')
                }]);

            if (insertError) {
                console.error("DB Error: ", insertError);
                throw new Error("Ocorreu um erro ao registrar sua demanda. Tente mais tarde.");
            }

            // Sucesso — mostra alerta no topo e faz scroll
            showAlert("✅ Sua demanda foi registrada com sucesso e enviada para nossa base de dados!", 'success');

            // Reseta form
            form.reset();
            fileNameDisplay.textContent = '';

        } catch (error) {
            showAlert(error.message || "Ocorreu um erro inesperado.", 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});
