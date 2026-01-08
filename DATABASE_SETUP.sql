-- Script SQL para criar as tabelas no Supabase
-- Execute isto no editor SQL do Supabase

-- Tabela de Alunos
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  photo_url TEXT,
  payment_day INT CHECK (payment_day >= 1 AND payment_day <= 31),
  monthly_cost DECIMAL(10, 2) DEFAULT 0,
  days_overdue INT DEFAULT 0,
  last_payment_date TIMESTAMP,
  payment_status VARCHAR(50) DEFAULT 'nao_definido' CHECK (payment_status IN ('em_dia', 'pendente', 'atrasado', 'nao_definido')),
  is_active BOOLEAN DEFAULT TRUE,
  name_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Tarefas/Exercícios
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  professor_id BIGINT REFERENCES professors(id) ON DELETE CASCADE,
  exercise_type VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Função para calcular status de pagamento automaticamente
CREATE OR REPLACE FUNCTION calculate_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  days_overdue INT;
  current_day INT;
  last_payment_month TEXT;
  current_month TEXT;
BEGIN
  -- Se não tem dia de pagamento configurado, status = 'nao_definido'
  IF NEW.payment_day IS NULL OR NEW.payment_day < 1 OR NEW.payment_day > 31 THEN
    NEW.payment_status := 'nao_definido';
    RETURN NEW;
  END IF;

  -- Se já pagou neste mês, status = 'em_dia'
  IF NEW.last_payment_date IS NOT NULL THEN
    last_payment_month := TO_CHAR(NEW.last_payment_date, 'YYYY-MM');
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    IF last_payment_month = current_month THEN
      NEW.payment_status := 'em_dia';
      RETURN NEW;
    END IF;
  END IF;

  -- Calcular dias de atraso
  current_day := EXTRACT(DAY FROM NOW())::INT;
  days_overdue := CASE 
    WHEN current_day > NEW.payment_day THEN current_day - NEW.payment_day
    ELSE 0
  END;

  -- Determinar status baseado em dias de atraso
  IF days_overdue > 5 THEN
    NEW.payment_status := 'atrasado';
  ELSIF days_overdue > 0 THEN
    NEW.payment_status := 'pendente';
  ELSE
    NEW.payment_status := 'em_dia';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular status quando student é inserido ou atualizado
CREATE TRIGGER trigger_calculate_payment_status
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION calculate_payment_status();

-- Criar índices para melhor performance
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_students_payment_status ON students(payment_status);
CREATE INDEX idx_professors_user_id ON professors(user_id);
CREATE INDEX idx_tasks_student_id ON tasks(student_id);
CREATE INDEX idx_tasks_professor_id ON tasks(professor_id);
CREATE INDEX idx_tasks_date ON tasks(date);

-- Habilitar Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
-- DESABILITAR RLS para tasks (professor precisa gerenciar todas as tarefas)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Políticas RLS para Students
-- Aluno pode inserir seus próprios dados
CREATE POLICY "Alunos podem inserir seus próprios dados" ON students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Aluno pode ver seus próprios dados
CREATE POLICY "Alunos podem ver seus próprios dados" ON students
  FOR SELECT USING (auth.uid() = user_id);

-- Professor pode ver todos os alunos ativos
CREATE POLICY "Professores podem ver todos os alunos" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professors WHERE professors.user_id = auth.uid()
    )
  );

-- Aluno pode atualizar seus próprios dados
CREATE POLICY "Alunos podem atualizar seus próprios dados" ON students
  FOR UPDATE USING (auth.uid() = user_id);

-- Professor pode atualizar informações de pagamento
CREATE POLICY "Professores podem atualizar alunos" ON students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM professors WHERE professors.user_id = auth.uid()
    )
  );

-- Políticas RLS para Tasks (DESABILITADAS - RLS não está habilitada para tasks)
-- As tarefas são gerenciadas pelo professor que pode criar, ler, atualizar e deletar
