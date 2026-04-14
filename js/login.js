document.addEventListener('DOMContentLoaded', async () => {
    // Se o usuário já estiver logado, manda pro admin
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'admin.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const alertBox = document.getElementById('alertMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset Alert
        alertBox.style.display = 'none';
        alertBox.className = 'alert';
        
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error;
            }

            // Sucesso
            window.location.href = 'admin.html';

        } catch (error) {
            // Conta inexistente ou senha incorreta
            let message = "Credenciais inválidas. Verifique seu e-mail e senha.";
            if(error.message.includes("Invalid login")) {
                message = "E-mail não cadastrado ou senha incorreta.";
            }

            alertBox.textContent = message;
            alertBox.classList.add('alert-error');
            alertBox.style.display = 'flex';
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});
