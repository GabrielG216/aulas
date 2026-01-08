// Utilidades para integração com Supabase

const SUPABASE_URL = 'https://aakygtqakbibblymiros.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sS5thkUnpl_pMGjP1gHo9A_FJx-PtwU';

// Inicializar cliente Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * AUTENTICAÇÃO
 */

// Registrar novo aluno
export async function registerStudent(email, password, name, birthDate) {
    try {
        // Criar usuário
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    user_type: 'student'
                }
            }
        });

        if (authError) throw authError;

        // Criar perfil do aluno
        const { error: profileError } = await supabaseClient
            .from('students')
            .insert({
                user_id: authData.user.id,
                name,
                email,
                birth_date: birthDate,
                payment_day: 7, // Padrão
                monthly_cost: 0,
                is_active: true,
                created_at: new Date()
            });

        if (profileError) throw profileError;

        return { success: true, user: authData.user };
    } catch (error) {
        console.error('Erro no registro:', error);
        throw error;
    }
}

// Login aluno
export async function loginStudent(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Buscar dados do aluno
        const { data: studentData, error: fetchError } = await supabaseClient
            .from('students')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (fetchError) throw fetchError;

        return { success: true, user: data.user, student: studentData };
    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
}

// Login professor
export async function loginProfessor(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Verificar se é professor
        const { data: professorData, error: fetchError } = await supabaseClient
            .from('professors')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (fetchError || !professorData) {
            throw new Error('Usuário não é um professor');
        }

        return { success: true, user: data.user, professor: professorData };
    } catch (error) {
        console.error('Erro no login do professor:', error);
        throw error;
    }
}

// Logout
export async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro no logout:', error);
        throw error;
    }
}

// Obter usuário atual
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        return null;
    }
}

/**
 * ALUNOS
 */

// Obter todos os alunos (para professor)
export async function getAllStudents() {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('is_active', { ascending: false })
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        throw error;
    }
}

// Obter aluno por ID
export async function getStudentById(studentId) {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar aluno:', error);
        throw error;
    }
}

// Obter dados do aluno logado
export async function getCurrentStudentData() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados do aluno:', error);
        throw error;
    }
}

// Atualizar aluno
export async function updateStudent(studentId, updates) {
    try {
        // Se está alterando o nome, registrar histórico
        if (updates.name) {
            const student = await getStudentById(studentId);
            
            // Adicionar ao histórico
            const nameHistory = student.name_history || [];
            nameHistory.push({
                name: student.name,
                changed_at: new Date().toISOString()
            });
            updates.name_history = nameHistory;
        }

        const { data, error } = await supabaseClient
            .from('students')
            .update(updates)
            .eq('id', studentId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        throw error;
    }
}

// Atualizar perfil do aluno logado
export async function updateCurrentStudentProfile(updates) {
    try {
        const student = await getCurrentStudentData();
        return await updateStudent(student.id, updates);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
    }
}

/**
 * TAREFAS/EXERCÍCIOS
 */

// Criar tarefa
export async function createTask(studentId, exerciseType, details, professorId) {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert({
                student_id: studentId,
                professor_id: professorId,
                exercise_type: exerciseType,
                details,
                created_at: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0]
            })
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        throw error;
    }
}

// Obter tarefas do aluno para hoje
export async function getTodayTasks(studentId) {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('student_id', studentId)
            .eq('date', today)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        throw error;
    }
}

// Obter tarefas do aluno logado
export async function getCurrentStudentTasks() {
    try {
        const student = await getCurrentStudentData();
        return await getTodayTasks(student.id);
    } catch (error) {
        console.error('Erro ao buscar tarefas do aluno:', error);
        throw error;
    }
}

// Atualizar tarefa
export async function updateTask(taskId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        throw error;
    }
}

/**
 * PAGAMENTOS
 */

// Obter pagamentos pendentes
export async function getPendingPayments() {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .gt('days_overdue', 0);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar pagamentos pendentes:', error);
        throw error;
    }
}

// Marcar pagamento como pago
export async function markPaymentAsPaid(studentId) {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .update({
                days_overdue: 0,
                last_payment_date: new Date().toISOString()
            })
            .eq('id', studentId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Erro ao marcar pagamento como pago:', error);
        throw error;
    }
}

// Obter status de pagamento do aluno logado
export async function getCurrentStudentPaymentStatus() {
    try {
        const student = await getCurrentStudentData();
        
        const today = new Date();
        const currentDay = today.getDate();
        const daysOverdue = currentDay > student.payment_day ? 
            (currentDay - student.payment_day) : 0;

        return {
            paymentDay: student.payment_day,
            monthlyCost: student.monthly_cost,
            daysOverdue,
            isPaid: daysOverdue === 0
        };
    } catch (error) {
        console.error('Erro ao obter status de pagamento:', error);
        throw error;
    }
}

/**
 * UTILIDADES
 */

// Calcular idade a partir da data de nascimento
export function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

// Formatar data
export function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

// Formatar hora
export function formatTime(date) {
    return new Date(date).toLocaleTimeString('pt-BR');
}

// Formatar moeda
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
