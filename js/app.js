document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('demandaForm');
    const fileInput = document.getElementById('anexo');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const submitBtn = document.getElementById('submitBtn');
    const alertBox = document.getElementById('alertMessage');

    // Display selected file name
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = `Arquivo selecionado: ${e.target.files[0].name}`;
        } else {
            fileNameDisplay.textContent = '';
        }
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
            // Recoletar valores (usando os mesmos ids)
            const nome = document.getElementById('nome').value;
            const cr = document.getElementById('cr').value;
            const estado = document.getElementById('estado').value;
            const tipo_problema = document.getElementById('tipo_problema').value;
            const descricao = document.getElementById('descricao').value;
            const file = fileInput.files[0];
            
            let anexo_url = null;

            // Se houver arquivo, envia pro Storage do Supabase (bucket: anexos_demandas)
            if (file) {
                // Validação de tamanho máx: 5MB
                if(file.size > 5 * 1024 * 1024) {
                    throw new Error("O arquivo selecionado ultrapassa o limite de 5MB.");
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${estado}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabaseClient.storage
                    .from('anexos_demandas')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error("Erro no Upload:", uploadError);
                    throw new Error("Falha ao subir o anexo de imagem/PDF.");
                }

                // Resgata o link publico
                const { data: publicURLData } = supabaseClient.storage
                    .from('anexos_demandas')
                    .getPublicUrl(filePath);
                
                anexo_url = publicURLData.publicUrl;
            }

            // Insere a demanda na tabela supabase (demandas_cbtt)
            const { error: insertError } = await supabaseClient
                .from('demandas_cbtt')
                .insert([
                    { nome, cr, estado, tipo_problema, descricao, anexo_url }
                ]);

            if (insertError) {
                console.error("DB Error: ", insertError);
                throw new Error("Ocorreu um erro ao registrar sua demanda. Tente mais tarde.");
            }

            // Sucesso!
            alertBox.textContent = "Sua demanda foi registrada com sucesso e enviada diretamente para a nossa base de dados.";
            alertBox.classList.add('alert-success');
            alertBox.style.display = 'flex';
            
            // Reseta form
            form.reset();
            fileNameDisplay.textContent = '';

        } catch (error) {
            // Erro
            alertBox.textContent = error.message || "Ocorreu um erro inesperado.";
            alertBox.classList.add('alert-error');
            alertBox.style.display = 'flex';
        } finally {
            // Stop loading
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});
