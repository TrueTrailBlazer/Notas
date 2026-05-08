const SUPABASE_URL = window.ENV?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginOverlay = document.getElementById('login-overlay');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('btn-login');
const authError = document.getElementById('auth-error');

export const checkSession = async (onSuccess) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loginOverlay.classList.add('hidden');
        onSuccess();
    }
};

export const setupAuth = (onSuccess) => {
    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) return;

        loginBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>';
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            authError.textContent = 'Credenciais inválidas.';
            authError.classList.remove('hidden');
            loginBtn.innerHTML = '<span>Entrar</span>';
        } else {
            loginOverlay.classList.add('opacity-0');
            setTimeout(() => {
                loginOverlay.classList.add('hidden');
                onSuccess();
            }, 300);
        }
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.reload();
    });
};