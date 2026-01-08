// Configuração Supabase
const SUPABASE_URL = 'https://aakygtqakbibblymiros.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sS5thkUnpl_pMGjP1gHo9A_FJx-PtwU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global
let students = [];
let currentEditingStudent = null;
let selectedExerciseType = null;
let currentProfessor = null;
let pendingPaymentStudentId = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
});

// Verificar autenticação
async function checkAuth() {
    try {
        console.log('🔐 Verificando autenticação...');
        // Verificar se professor está logado
        if (!localStorage.getItem('professorLoggedIn')) {
            console.log('❌ Professor não logado, redirecionando...');
            window.location.href = 'login-professor.html';
            return;
        }

        console.log('✅ Professor logado');

        // Definir ID do professor
        currentProfessor = {
            id: 1,
            name: 'Professor'
        };
        
        console.log('📚 Carregando dados iniciais...');
        // Carregar dados
        await loadStudents();
        await loadPayments();
        setupPaymentDayDropdown();
        setupEditStudentForm();
        console.log('✅ Dados iniciais carregados');
    } catch (err) {
        console.error('❌ Erro ao verificar autenticação:', err);
        window.location.href = 'login-professor.html';
    }
}

// Carregar alunos do Supabase
async function loadStudents() {
    try {
        console.log('📚 Carregando alunos do Supabase...');
        // Carregar dados REAIS do Supabase
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('is_active', { ascending: false })
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Erro Supabase:', error);
            throw error;
        }

        console.log('📊 Dados brutos do Supabase:', data);

        // Se não há dados, mostrar mensagem
        if (!data || data.length === 0) {
            console.log('⚠️ Nenhum aluno encontrado');
            students = [];
            renderStudentsList();
            populateStudentSelect();
            return;
        }

        students = data.map(student => ({
            id: student.id,
            user_id: student.user_id,
            name: student.name,
            age: calculateAge(student.birth_date),
            photo: student.photo_url || 'img/profile-default.png',
            email: student.email || 'email@example.com',
            paymentDay: student.payment_day,
            monthlyCost: student.monthly_cost,
            isActive: student.is_active,
            nameHistory: student.name_history || [],
            last_payment_date: student.last_payment_date,
            payment_status: student.payment_status || 'nao_definido'
        }));
        
        console.log('✅ Alunos carregados:', students.length, students);

        console.log('🎨 Renderizando lista de alunos...');
        renderStudentsList();
        console.log('🔄 Atualizando dropdown de seleção...');
        populateStudentSelect();
        console.log('✅ tudo renderizado');
    } catch (err) {
        console.error('❌ Erro ao carregar alunos:', err);
        document.getElementById('studentsList').innerHTML = '<div class="empty-message">Erro ao carregar alunos. Verifique o console.</div>';
    }
}

// Calcular idade
function calculateAge(birthDate) {
    const today = dayjs();
    const birth = dayjs(birthDate);
    let age = today.year() - birth.year();
    const monthDiff = today.month() - birth.month();

    if (monthDiff < 0 || (monthDiff === 0 && today.date() < birth.date())) {
        age--;
    }

    return age;
}

// Renderizar lista de alunos
function renderStudentsList() {
    const activeList = document.getElementById('studentsList');
    const inactiveList = document.getElementById('inactiveStudentsList');

    activeList.innerHTML = '';
    inactiveList.innerHTML = '';

    const activeStudents = students.filter(s => s.isActive);
    const inactiveStudents = students.filter(s => !s.isActive);

    if (activeStudents.length === 0) {
        activeList.innerHTML = '<div class="empty-message">Nenhum aluno ativo</div>';
    } else {
        activeStudents.forEach(student => {
            activeList.appendChild(createStudentCard(student));
        });
    }

    if (inactiveStudents.length > 0) {
        inactiveStudents.forEach(student => {
            inactiveList.appendChild(createStudentCard(student));
        });
    } else {
        inactiveList.innerHTML = '<div class="empty-message">Nenhum aluno inativo</div>';
    }
}

// Criar card de aluno
function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    
    // Usar status que vem do banco de dados
    let paymentStatus = 'Não definido';
    let statusClass = '';
    let paymentDisplay = 'Dia de pagamento não configurado';
    
    const paymentDay = parseInt(student.paymentDay);
    if (!isNaN(paymentDay) && paymentDay !== null && paymentDay !== undefined) {
        paymentDisplay = `Pagamento dia ${paymentDay} de cada mês`;
        
        // Mapear status do banco para exibição
        const statusMap = {
            'em_dia': { display: 'Em dia', class: '' },
            'pendente': { display: 'Pendente', class: 'pending' },
            'atrasado': { display: 'Atrasado', class: 'overdue' },
            'nao_definido': { display: 'Não definido', class: '' }
        };
        
        const statusInfo = statusMap[student.payment_status] || statusMap['nao_definido'];
        paymentStatus = statusInfo.display;
        statusClass = statusInfo.class;
    }

    let actionButtons = `
            <button class="btn-action btn-task" onclick="assignTask(${student.id})" title="Passar tarefa"><img src="img/tabela-treino.png" alt="Passar tarefa" class="btn-task-icon"></button>
            <button class="btn-action btn-edit" onclick="openEditStudentModal(${student.id})" title="Editar">✎</button>
    `;
    
    // Adicionar botão de controle se está em dia
    if (student.payment_status === 'em_dia') {
        actionButtons += `<button class="btn-action btn-danger" onclick="markAsUnpaid(${student.id})" title="Marcar como não pago"><img src="img/nao-pago.png" alt="Marcar como não pago" class="btn-action-icon"></button>`;
    }
    
    card.innerHTML = `
        <img src="${student.photo}" alt="${student.name}" class="student-photo" onerror="this.src='img/profile-default.png'">
        <div class="student-info">
            <p class="student-name">${student.name}</p>
            <p class="student-details">${student.age} anos</p>
            <p class="student-payment ${statusClass}">${paymentDisplay} | ${paymentStatus}</p>
        </div>
        <div class="student-actions">
            ${actionButtons}
        </div>
    `;

    return card;
}

// Atribuir tarefa (passa para aba de tarefas)
function assignTask(studentId) {
    console.log('📋 assignTask chamado para ID:', studentId);
    const student = students.find(s => s.id === studentId);
    if (!student) {
        console.log('❌ Aluno não encontrado');
        return;
    }
    
    console.log('✅ Passando tarefa para:', student.name);
    document.getElementById('studentSelect').value = studentId;
    switchTab('tarefas');
    document.getElementById('exerciseDetails').focus();
}

// Marcar como não pago (resetar pagamento e ir para aba de pagamentos)
async function markAsUnpaid(studentId) {
    console.log('🔴 markAsUnpaid chamado para ID:', studentId);
    const student = students.find(s => s.id === studentId);
    if (!student) {
        console.log('❌ Aluno não encontrado');
        return;
    }

    // Toast de confirmação com botões (sem bloquear a thread)
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast';
    toastContainer.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
            <div style="flex: 1;">Marcar <strong>${student.name}</strong> como não pago?</div>
            <button onclick="confirmUnpaid(${studentId})" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Sim</button>
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
    console.log('🔔 Toast de confirmação exibido para:', student.name);
}

// Confirmar unmarking de pagamento
async function confirmUnpaid(studentId) {
    console.log('🔄 confirmUnpaid iniciado para ID:', studentId);
    
    try {
        console.log('📤 Enviando atualização para Supabase (last_payment_date = null)...');
        const { error } = await supabaseClient
            .from('students')
            .update({ 
                last_payment_date: null,
                updated_at: new Date().toISOString()  // Força trigger de recalcular status
            })
            .eq('id', studentId);
        
        if (error) {
            console.error('❌ Erro Supabase:', error);
            throw error;
        }
        
        console.log('✅ last_payment_date resetado para null');
        const student = students.find(s => s.id === studentId);
        Toast.warning(`${student?.name} marcado como não pago!`);
        
        // Remover toast de confirmação
        document.querySelectorAll('.toast').forEach(t => {
            if (t.innerText.includes('não pago')) t.remove();
        });
        
        console.log('🔄 Recarregando dados...');
        // Aguardar um pouco para garantir que o trigger foi executado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recarregar dados
        try {
            await loadStudents();
            console.log('✅ loadStudents concluído - alunos na memória:', students.length);
        } catch (err) {
            console.error('❌ Erro em loadStudents:', err);
        }
        
        try {
            console.log('💳 Iniciando loadPayments...');
            await loadPayments();
            console.log('✅ loadPayments concluído');

        } catch (err) {
            console.error('❌ Erro em loadPayments:', err);
        }
        
        console.log('📄 Navegando para aba de pagamentos...');
        switchTab('pagamentos');
        console.log('✅ Navegação concluída');
    } catch (err) {
        console.error('❌ Erro completo ao marcar como não pago:', err);
        Toast.error('Erro ao marcar como não pago!');
    }
}

// Carregar pagamentos pendentes
async function loadPayments() {
    try {
        console.log('💳 Carregando pagamentos...');
        const paymentsList = document.getElementById('pendingPaymentsList');
        paymentsList.innerHTML = '<div class="empty-message">Carregando...</div>';

        const today = dayjs();
        console.log('📅 Data de hoje:', today.format('DD/MM/YYYY'));
        
        const pendingPayments = students.filter(s => {
            // Só mostrar alunos que têm dia de pagamento configurado e status é 'pendente' ou 'atrasado'
            if (!s.paymentDay || s.payment_status === 'nao_definido') {
                console.log(`⚠️ ${s.name} - Nenhum dia de pagamento configurado ou status inválido`);
                return false;
            }
            
            // Filtrar apenas os que estão pendentes ou atrasados
            const isPending = s.payment_status === 'pendente' || s.payment_status === 'atrasado';
            if (isPending) {
                console.log(`💰 ${s.name} - Status: ${s.payment_status}`);
            }
            return isPending;
        });

        console.log('📊 Total de pagamentos pendentes:', pendingPayments.length);
        paymentsList.innerHTML = '';

        if (pendingPayments.length === 0) {
            console.log('✅ Nenhum pagamento pendente');
            paymentsList.innerHTML = '<div class="empty-message">Nenhum pagamento pendente</div>';
            console.log('✅ HTML vazio renderizado');
            return;
        }

        console.log('🎨 Renderizando cards de pagamento...');
        pendingPayments.forEach((student, index) => {
            console.log(`📋 Processando pagamento ${index + 1}/${pendingPayments.length}: ${student.name}`);
            
            // Determinar alerta e status baseado no payment_status do banco
            const alertImage = student.payment_status === 'atrasado' ? 'img/red-alert.png' : 'img/alert-yellow.png';
            const paymentStatus = student.payment_status === 'atrasado' ? 'Atrasado' : 'Pendente';
            
            // Calcular dias de atraso para exibição
            const paymentDay = parseInt(student.paymentDay);
            const daysOverdue = today.date() > paymentDay ? 
                (today.date() - paymentDay) : 0;

            const card = document.createElement('div');
            card.className = 'payment-card';
            card.innerHTML = `
                <img src="${student.photo}" alt="${student.name}" class="student-photo" onerror="this.src='img/profile-default.png'">
                <div class="payment-info">
                    <p class="payment-name"><img src="${alertImage}" alt="Alerta" class="alert-image"> ${student.name}</p>
                    <p class="payment-days">Dias atrasados: ${daysOverdue} | ${paymentStatus}</p>
                    <p class="payment-amount">Valor a pagar: R$ ${student.monthlyCost.toFixed(2)}</p>
                </div>
                <button class="btn-action btn-paid" onclick="markPaymentAsPaid(${student.id}, true)" title="Marcar como pago">✓</button>
            `;
            paymentsList.appendChild(card);
            console.log(`✅ Card renderizado para ${student.name}`);
        });
        console.log('✅ Todos os cards renderizados');
    } catch (err) {
        console.error('❌ Erro ao carregar pagamentos:', err);
        console.error('Stack trace:', err.stack);
    }

}

// Marcar pagamento como pago
async function markPaymentAsPaid(studentId, isPaid) {
    console.log('📋 markPaymentAsPaid chamado:', { studentId, isPaid });
    if (!isPaid) return;

    const student = students.find(s => s.id === studentId);
    console.log('👤 Aluno encontrado:', student?.name || 'NÃO ENCONTRADO');
    if (!student) return;

    // Toast de confirmação com botões
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast';
    toastContainer.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
            <div style="flex: 1;">Confirmar pagamento de <strong>${student.name}</strong>?</div>
            <button onclick="confirmPaymentDirect(${studentId})" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Sim</button>
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 6px 12px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">Não</button>
        </div>
    `;
    
    toastContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3498db;
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
    console.log('🔔 Toast de confirmação exibido');
}

// Confirmar pagamento direto (sem modal)
async function confirmPaymentDirect(studentId) {
    console.log('✅ confirmPaymentDirect iniciado para ID:', studentId);
    
    try {
        console.log('📤 Enviando atualização para Supabase...');
        const { error } = await supabaseClient
            .from('students')
            .update({
                last_payment_date: dayjs().toISOString()
            })
            .eq('id', studentId);

        if (error) {
            console.error('❌ Erro do Supabase:', error);
            throw error;
        }

        console.log('✅ Pagamento atualizado no Supabase para ID:', studentId);
        console.log('📅 last_payment_date setado para:', dayjs().toISOString());
        
        Toast.success(`Pagamento marcado como pago!`);
        
        // Remover toast de confirmação
        document.querySelectorAll('.toast').forEach(t => {
            if (t.innerText.includes('Confirmar pagamento')) t.remove();
        });
        
        // Aguardar um pouco e recarregar dados
        setTimeout(async () => {
            console.log('🔄 Recarregando dados...');
            await loadStudents();
            console.log('✅ Dados recarregados - Total de alunos:', students.length);
            await loadPayments();
            console.log('✅ Pagamentos recarregados');
        }, 500);
    } catch (err) {
        console.error('❌ Erro completo ao marcar pagamento:', err);
        Toast.error('Erro ao marcar pagamento como pago');
    }
}

// Filtrar alunos
function filterStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.student-card');

    cards.forEach(card => {
        const name = card.querySelector('.student-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Abas
function switchTab(tabName, event) {
    console.log('📑 switchTab chamado para:', tabName);
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar aba selecionada
    document.getElementById(tabName + '-tab').classList.add('active');

    // Adicionar classe active ao botão (se houver evento)
    if (event && event.target) {
        event.target.classList.add('active');
        console.log('✅ Botão ativado:', event.target.textContent);
    } else {
        // Se não houver evento, encontrar o botão correspondente
        const button = document.querySelector(`[data-tab="${tabName}"]`) || 
                      Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
                          btn.textContent.toLowerCase().includes(tabName.toLowerCase())
                      );
        if (button) {
            button.classList.add('active');
            console.log('✅ Botão ativado (por name):', button.textContent);
        }
    }

    // Recarregar dados se necessário
    if (tabName === 'pagamentos') {
        console.log('🔄 Recarregando pagamentos...');
        loadPayments();
    }
}

// Tipos de exercício
function selectExerciseType(type) {
    selectedExerciseType = type;
    document.getElementById('exerciseType').value = type;
    document.getElementById('exerciseForm').style.display = 'block';

    // Atualizar botões ativos
    document.querySelectorAll('.exercise-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.exercise-type-btn').classList.add('active');
}

function cancelExercise() {
    document.getElementById('exerciseForm').style.display = 'none';
    document.getElementById('prepareAulaForm').reset();
    document.querySelectorAll('.exercise-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Popular dropdown de alunos
function populateStudentSelect() {
    const select = document.getElementById('studentSelect');
    select.innerHTML = '<option value="">Selecione um aluno...</option>';

    students.filter(s => s.isActive).forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        select.appendChild(option);
    });
}

// Setup do formulário Preparar Aula
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('prepareAulaForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const studentId = parseInt(document.getElementById('studentSelect').value);
            const details = document.getElementById('exerciseDetails').value;
            const btn = form.querySelector('button[type="submit"]');

            if (!studentId) {
                Toast.warning('Selecione um aluno');
                return;
            }

            if (!details) {
                Toast.warning('Digite os detalhes do exercício');
                return;
            }

            try {
                btn.disabled = true;
                btn.textContent = 'Enviando...';

                const student = students.find(s => s.id === studentId);
                const today = dayjs().format('YYYY-MM-DD');

                // Deletar TODAS as tarefas antigas do aluno antes de inserir a nova
                console.log('🗑️ Deletando tarefas antigas do aluno ID:', studentId);
                const { data: existingTasks, error: fetchError } = await supabaseClient
                    .from('tasks')
                    .select('id')
                    .eq('student_id', studentId);

                if (fetchError) {
                    console.error('❌ Erro ao buscar tarefas:', fetchError);
                    throw fetchError;
                }

                console.log('📋 Tarefas encontradas:', existingTasks?.length || 0);

                if (existingTasks && existingTasks.length > 0) {
                    const { error: deleteError } = await supabaseClient
                        .from('tasks')
                        .delete()
                        .eq('student_id', studentId);

                    if (deleteError) {
                        console.error('❌ Erro ao deletar tarefas:', deleteError);
                        throw deleteError;
                    }
                    
                    // Verificar se realmente deletou
                    const { data: afterDelete } = await supabaseClient
                        .from('tasks')
                        .select('id')
                        .eq('student_id', studentId);
                    
                    console.log('✅ Tarefas antigas deletadas com sucesso');
                    console.log('📊 Tarefas após delete:', afterDelete?.length || 0);
                    
                    if (afterDelete && afterDelete.length > 0) {
                        console.error('⚠️ AVISO: Tarefas ainda existem após DELETE!');
                        console.error('RLS pode estar bloqueando o delete!');
                    }
                } else {
                    console.log('✅ Nenhuma tarefa anterior encontrada');
                }

                // Salvar tarefa nova no Supabase
                const { error } = await supabaseClient
                    .from('tasks')
                    .insert({
                        student_id: studentId,
                        professor_id: null,
                        exercise_type: selectedExerciseType,
                        details: details,
                        date: today,
                        created_at: dayjs().toISOString()
                    });

                if (error) throw error;

                Toast.success(`Tarefa enviada para ${student.name}!`);
                cancelExercise();
            } catch (err) {
                console.error('Erro ao enviar tarefa:', err);
                Toast.error('Erro ao enviar tarefa: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Finalizar';
            }
        });
    }
});

// Setup dropdown dias de pagamento
function setupPaymentDayDropdown() {
    const select = document.getElementById('paymentDay');
    
    // Adicionar opção "Não definido"
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Não definido';
    select.appendChild(defaultOption);
    
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Dia ${i} de cada mês`;
        select.appendChild(option);
    }
}

// Modal Editar Aluno
function openEditStudentModal(studentId) {
    currentEditingStudent = students.find(s => s.id === studentId);
    if (!currentEditingStudent) return;

    document.getElementById('studentName').value = currentEditingStudent.name;
    document.getElementById('studentAge').value = currentEditingStudent.age;
    document.getElementById('paymentDay').value = currentEditingStudent.paymentDay;
    document.getElementById('monthlyCost').value = currentEditingStudent.monthlyCost;
    document.getElementById('isInactive').checked = !currentEditingStudent.isActive;

    document.getElementById('editStudentModal').style.display = 'block';
}

function closeEditStudentModal() {
    document.getElementById('editStudentModal').style.display = 'none';
    currentEditingStudent = null;
}

function setupEditStudentForm() {
    const form = document.getElementById('editStudentForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!currentEditingStudent) return;

        try {
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Salvando...';

            const paymentDayValue = document.getElementById('paymentDay').value;
            const paymentDay = paymentDayValue === '' ? null : parseInt(paymentDayValue);
            const monthlyCost = parseFloat(document.getElementById('monthlyCost').value) || 0;
            const isInactive = document.getElementById('isInactive').checked;

            if (paymentDay !== null && (paymentDay < 1 || paymentDay > 31)) {
                Toast.warning('Dia de pagamento deve estar entre 1 e 31');
                btn.disabled = false;
                btn.textContent = 'Salvar edições';
                return;
            }

            // Salvar no Supabase
            const { error } = await supabaseClient
                .from('students')
                .update({
                    payment_day: paymentDay,
                    monthly_cost: monthlyCost,
                    is_active: !isInactive
                })
                .eq('id', currentEditingStudent.id);

            if (error) throw error;

            // Atualizar estado local
            currentEditingStudent.paymentDay = paymentDay;
            currentEditingStudent.monthlyCost = monthlyCost;
            currentEditingStudent.isActive = !isInactive;

            // Atualizar listas
            const studentIndex = students.findIndex(s => s.id === currentEditingStudent.id);
            if (studentIndex !== -1) {
                students[studentIndex] = currentEditingStudent;
            }

            renderStudentsList();
            await loadPayments();
            closeEditStudentModal();

            Toast.success('Informações do aluno atualizadas com sucesso!');

            btn.disabled = false;
            btn.textContent = 'Salvar edições';
        } catch (err) {
            console.error('Erro ao salvar:', err);
            Toast.error('Erro ao salvar alterações: ' + err.message);
        }
    });
}

// Histórico de Nomes
function showNameHistory() {
    if (!currentEditingStudent) return;

    const modal = document.getElementById('nameHistoryModal');
    const historyList = document.getElementById('nameHistoryList');
    historyList.innerHTML = '';

    // Nome atual primeiro
    const currentItem = document.createElement('div');
    currentItem.className = 'history-item current';
    currentItem.innerHTML = `
        <p class="history-item-name">${currentEditingStudent.name}</p>
        <p class="history-item-date">Atual</p>
    `;
    historyList.appendChild(currentItem);

    // Nomes anteriores
    if (currentEditingStudent.nameHistory && currentEditingStudent.nameHistory.length > 0) {
        currentEditingStudent.nameHistory.forEach(item => {
            if (item.name !== currentEditingStudent.name) {
                const element = document.createElement('div');
                element.className = 'history-item';
                element.innerHTML = `
                    <p class="history-item-name">${item.name}</p>
                    <p class="history-item-date">Alterado em ${item.changedAt.toLocaleDateString('pt-BR')} ${item.changedAt.toLocaleTimeString('pt-BR')}</p>
                `;
                historyList.appendChild(element);
            }
        });
    }

    modal.style.display = 'block';
}

function closeNameHistoryModal() {
    document.getElementById('nameHistoryModal').style.display = 'none';
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editStudentModal');
    const nameHistoryModal = document.getElementById('nameHistoryModal');

    if (event.target === editModal) {
        closeEditStudentModal();
    }
    if (event.target === nameHistoryModal) {
        closeNameHistoryModal();
    }
});

// Logout
async function logout() {
    // Toast de confirmação com botões
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast';
    toastContainer.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
            <div style="flex: 1;">Tem certeza que deseja sair?</div>
            <button onclick="confirmLogoutProf()" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Sim</button>
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

async function confirmLogoutProf() {
    try {
        localStorage.removeItem('professorLoggedIn');
        localStorage.removeItem('userType');
        localStorage.removeItem('professorId');
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Erro ao fazer logout:', err);
        Toast.error('Erro ao sair');
    }
}

// ===== CONFIGURAÇÕES PROFESSOR =====

// Abrir modal de configurações
function openConfigProf() {
    document.getElementById('configModalProf').style.display = 'block';
    updateThemeToggleProfUI();
}

// Fechar modal de configurações
function closeConfigProf() {
    document.getElementById('configModalProf').style.display = 'none';
}

// Atualizar UI do toggle de tema (Professor)
function updateThemeToggleProfUI() {
    const toggle = document.getElementById('themeToggleProf');
    const isLight = getCurrentTheme() === 'light';
    if (isLight) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
}
