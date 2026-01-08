// Configuração Supabase
const SUPABASE_URL = 'https://aakygtqakbibblymiros.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sS5thkUnpl_pMGjP1gHo9A_FJx-PtwU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis globais
let currentUser = {
    id: null,
    name: '',
    email: '',
    age: 0,
    photoUrl: 'img/profile-default.png',
    paymentDay: null,
    monthlyCost: 0,
    nameHistory: []
};

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

// Verificar autenticação
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) {
            window.location.href = 'login-aluno.html';
            return;
        }

        await loadUserData();
        await loadWorkouts();
        setupRealtimeListeners();
    } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        window.location.href = 'login-aluno.html';
    }
}

// Carregar dados do usuário
async function loadUserData() {
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) throw new Error('Usuário não autenticado');

        const { data: studentData, error: studentError } = await supabaseClient
            .from('students')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (studentError) throw studentError;

        // Calcular idade
        const birthDate = new Date(studentData.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        currentUser = {
            id: studentData.id,
            user_id: user.id,
            name: studentData.name,
            email: user.email,
            age: age,
            photoUrl: studentData.photo_url || 'img/profile-default.png',
            paymentDay: studentData.payment_day,
            monthlyCost: studentData.monthly_cost,
            nameHistory: studentData.name_history || [],
            last_payment_date: studentData.last_payment_date || null,
            payment_status: studentData.payment_status || 'nao_definido'
        };

        updateProfileUI();
        updatePaymentStatus();
    } catch (err) {
        console.error('Erro ao carregar dados:', err);
        Toast.error('Erro ao carregar dados do usuário');
    }
}

// Atualizar UI do perfil
function updateProfileUI() {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = currentUser.name;

    const profileNameEl = document.getElementById('profileName');
    if (profileNameEl) profileNameEl.textContent = currentUser.name;

    const profileAgeEl = document.getElementById('profileAge');
    if (profileAgeEl) profileAgeEl.textContent = `Idade: ${currentUser.age}`;
    
    const profileImgEl = document.getElementById('profileImg');
    if (profileImgEl) {
        profileImgEl.src = currentUser.photoUrl || 'img/profile-default.png';
        profileImgEl.onerror = function() { this.src = 'img/profile-default.png'; };
    }
}

// Atualizar status de pagamento (agora vem do banco de dados)
function updatePaymentStatus() {
    const paymentDateEl = document.getElementById('paymentDate');
    const statusSpan = document.querySelector('#paymentStatus span');

    // Se dia de pagamento não configurado
    if (!currentUser.paymentDay) {
        if (paymentDateEl) paymentDateEl.textContent = 'Dia de pagamento não configurado';
        if (statusSpan) {
            statusSpan.textContent = 'Não definido';
            statusSpan.className = '';
        }
        return;
    }

    // Exibir próximo pagamento
    const today = new Date();
    const currentDay = today.getDate();
    
    if (currentDay < currentUser.paymentDay) {
        if (paymentDateEl) paymentDateEl.textContent = `${currentUser.paymentDay} do mês atual`;
    } else if (currentDay === currentUser.paymentDay) {
        if (paymentDateEl) paymentDateEl.textContent = `Hoje (${currentUser.paymentDay})`;
    } else {
        if (paymentDateEl) paymentDateEl.textContent = `${currentUser.paymentDay} do próximo mês`;
    }

    // Usar status que vem do banco de dados
    if (statusSpan) {
        const statusMap = {
            'em_dia': { text: 'Em Dia', className: 'status-paid' },
            'pendente': { text: 'Pendente', className: 'status-pending' },
            'atrasado': { text: 'Atrasado', className: 'status-overdue' },
            'nao_definido': { text: 'Não definido', className: '' }
        };
        
        const status = statusMap[currentUser.payment_status] || statusMap['nao_definido'];
        statusSpan.textContent = status.text;
        statusSpan.className = status.className;
    }
}

// Carregar treinos
async function loadWorkouts() {
    try {
        const workoutsList = document.getElementById('workoutsList');
        workoutsList.innerHTML = '<div class="empty-state">Carregando treinos...</div>';

        const today = new Date().toISOString().split('T')[0];

        const { data: workouts, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('student_id', currentUser.id)
            .eq('date', today)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        workoutsList.innerHTML = '';

        if (!workouts || workouts.length === 0) {
            workoutsList.innerHTML = '<div class="empty-state">Nenhum treino disponível para hoje. Aguarde as tarefas do seu professor!</div>';
            return;
        }

        workouts.forEach(workout => {
            const workoutCard = createWorkoutCard(workout);
            workoutsList.appendChild(workoutCard);
        });
    } catch (err) {
        console.error('Erro ao carregar treinos:', err);
        document.getElementById('workoutsList').innerHTML = '<div class="empty-state">Erro ao carregar treinos</div>';
    }
}

// Criar card de treino
function createWorkoutCard(workout) {
    const card = document.createElement('div');
    card.className = 'workout-card';
    
    // Mapear tipo de exercício para imagem
    let imagePath = 'img/workout-default.png';
    if (workout.exercise_type === 'Pedaladas') {
        imagePath = 'img/pedalada.jpg';
    } else if (workout.exercise_type === 'Caminhos/Corridas') {
        // Quando for Caminhos/Corridas, mostrar a imagem específica solicitada
        imagePath = 'img/caminhada.jpg';
    } else if (workout.exercise_type === 'Musculação') {
        imagePath = 'img/musculacao.jpg';
    }

    card.innerHTML = `
        <img src="${imagePath}" alt="${workout.exercise_type}" class="workout-image" onerror="this.src='img/placeholder.png'">
        <div class="workout-details">
            <h3>Exercício de hoje:</h3>
            <span class="workout-type">${workout.exercise_type}</span>
            <h4 style="color: white; margin: 15px 0 10px 0; font-size: 18px;">Detalhes:</h4>
            <p class="workout-description">${workout.details}</p>
        </div>
    `;
    return card;
}

// ===== CONFIGURAÇÕES =====

// Abrir modal de configurações
function openConfig() {
    document.getElementById('configNewName').value = currentUser.name;
    document.getElementById('configProfileImg').src = currentUser.photoUrl;
    document.getElementById('configModal').style.display = 'block';
    updateThemeToggleUI();
}

// Fechar modal de configurações
function closeConfig() {
    document.getElementById('configModal').style.display = 'none';
}

// Atualizar UI do toggle de tema
function updateThemeToggleUI() {
    const toggle = document.getElementById('themeToggle');
    const isLight = getCurrentTheme() === 'light';
    if (isLight) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
}

// Salvar alterações de perfil
async function saveConfigProfile() {
    const newName = document.getElementById('configNewName').value.trim();
    const newPhotoInput = document.getElementById('newPhoto');
    const btn = event.target;

    try {
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        if (!newName) {
            Toast.warning('Por favor, insira um nome válido');
            return;
        }

        const updates = {};

        // Atualizar nome e histórico
        if (newName !== currentUser.name) {
            const newHistory = currentUser.nameHistory || [];
            newHistory.push({
                name: currentUser.name,
                changed_at: new Date().toISOString()
            });
            updates.name = newName;
            updates.name_history = newHistory;
            currentUser.name = newName;
            currentUser.nameHistory = newHistory;
        }

        // Atualizar foto se foi escolhida
        if (newPhotoInput.files && newPhotoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                updates.photo_url = e.target.result;
                currentUser.photoUrl = e.target.result;
                document.getElementById('profileImg').src = currentUser.photoUrl;
                document.getElementById('configProfileImg').src = currentUser.photoUrl;
                
                // Salvar no Supabase
                await saveProfileToSupabase(updates);
            };
            reader.readAsDataURL(newPhotoInput.files[0]);
            return; // Esperar a leitura do arquivo
        }

        // Se não tem foto, salvar direto
        await saveProfileToSupabase(updates);
    } catch (err) {
        console.error('Erro:', err);
        Toast.error('Erro ao salvar perfil');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Alterações';
    }
}

async function saveProfileToSupabase(updates) {
    try {
        const { error } = await supabaseClient
            .from('students')
            .update(updates)
            .eq('id', currentUser.id);

        if (error) throw error;

        updateProfileUI();
        closeConfig();
        Toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
        console.error('Erro ao salvar:', err);
        throw err;
    }
}

// Modal - Editar Perfil
function openEditProfile() {
    document.getElementById('editProfileModal').style.display = 'block';
    document.getElementById('newName').value = currentUser.name;
}

function closeEditProfile() {
    document.getElementById('editProfileModal').style.display = 'none';
}

// Fechar modal ao clicar fora dele
window.addEventListener('click', function(event) {
    const modal = document.getElementById('editProfileModal');
    if (event.target === modal) {
        closeEditProfile();
    }
});

// Realtime: atualizar automaticamente quando houver mudanças feitas pelo professor
function setupRealtimeListeners() {
    try {
        // Ouvir mudanças na tabela 'tasks' para este aluno (INSERT/UPDATE/DELETE)
        const tasksChannel = supabaseClient
            .channel(`public:tasks:student_${currentUser.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `student_id=eq.${currentUser.id}` }, (payload) => {
                console.log('Realtime tasks event:', payload);
                loadWorkouts();
            })
            .subscribe();

        // Ouvir atualizações no registro do aluno (por exemplo last_payment_date, payment_day)
        const studentsChannel = supabaseClient
            .channel(`public:students:${currentUser.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students', filter: `id=eq.${currentUser.id}` }, (payload) => {
                console.log('Realtime students update:', payload);
                // Recarregar dados do aluno (nome, foto, pagamento)
                loadUserData();
                loadWorkouts();
            })
            .subscribe();
    } catch (err) {
        console.error('Erro ao configurar realtime listeners:', err);
    }
}

// Logout
async function logout() {
    // Toast de confirmação com botões
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast';
    toastContainer.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
            <div style="flex: 1;">Tem certeza que deseja sair?</div>
            <button onclick="confirmLogout()" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Sim</button>
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 6px 12px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">Não</button>
        </div>
    `;
    
    toastContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #f39c12;
        color: white;
        padding: 15px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        gap: 10px;
        max-width: 400px;
    `;
    
    document.body.appendChild(toastContainer);
}

async function confirmLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Erro ao fazer logout:', err);
        Toast.error('Erro ao sair');
    }
}
