# Sistema de Notificações Toast

## Descrição
O sistema de notificações Toast foi criado para substituir os `alert()` tradicionais por notificações mais elegantes e não-intrusivas. As notificações aparecem no canto superior direito da tela com animações suaves.

## Uso

### Importação
O arquivo `js/toast.js` deve ser incluído em todas as páginas HTML:
```html
<link rel="stylesheet" href="css/toast.css">
<script src="js/toast.js"></script>
```

### Sintaxe Básica

#### Success (Verde)
```javascript
Toast.success('Operação realizada com sucesso!');
```
Duração padrão: 3 segundos

#### Error (Vermelho)
```javascript
Toast.error('Erro ao processar a requisição');
```
Duração padrão: 4 segundos

#### Warning (Laranja)
```javascript
Toast.warning('Por favor, preencha todos os campos');
```
Duração padrão: 3 segundos

#### Info (Azul)
```javascript
Toast.info('Informação importante');
```
Duração padrão: 3 segundos

### Função Avançada
Para mais controle, use a função `showToast()`:
```javascript
showToast('Mensagem customizada', 'success', 5000);
```

Parâmetros:
- `message` (string): Mensagem a ser exibida
- `type` (string): 'success', 'error', 'warning' ou 'info'
- `duration` (number): Tempo em milissegundos antes de desaparecer

## Estilos

### Classes CSS
- `.toast-container`: Contêiner de toasts
- `.toast`: Classe base
- `.toast.success`: Toast verde com ✓
- `.toast.error`: Toast vermelho com ✕
- `.toast.warning`: Toast laranja com ⚠
- `.toast.info`: Toast azul com ℹ

### Cores
- Success: #4CAF50 (verde)
- Error: #f44336 (vermelho)
- Warning: #FF9800 (laranja)
- Info: #2196F3 (azul)

## Migração de Alert

### Antes
```javascript
alert('Operação realizada!');
alert('Ocorreu um erro');
```

### Depois
```javascript
Toast.success('Operação realizada!');
Toast.error('Ocorreu um erro');
```

## Arquivos Modificados
- ✅ aluno.html - Links CSS e JS adicionados
- ✅ professor.html - Links CSS e JS adicionados
- ✅ login-aluno.html - Links CSS e JS adicionados
- ✅ cadastro.html - Links CSS e JS adicionados
- ✅ login-professor.html - Links CSS e JS adicionados
- ✅ index.html - Links CSS e JS adicionados
- ✅ inicio.html - Links CSS e JS adicionados
- ✅ js/aluno.js - Todos os alert() substituídos por Toast
- ✅ js/professor.js - Todos os alert() substituídos por Toast
- ✅ cadastro.html - Todos os alert() substituídos por Toast

## Características

### Animações
- **Entrada**: slideInRight (desliza da direita)
- **Saída**: slideOutRight (sai pela direita)
- Duração: 0.3s (entrada), 0.3s (saída)

### Responsividade
- Desktop: Margem 20px no canto superior direito
- Mobile (< 480px): Margem 10px, largura adaptada

### Auto-dismiss
Cada toast desaparece automaticamente após o tempo especificado:
- Success: 3s
- Error: 4s (mais tempo para leitura)
- Warning: 3s
- Info: 3s

### Close Button
Cada toast possui um botão "×" para fechar manualmente

## Exemplos de Uso

### Aluno
```javascript
// Perfil atualizado
Toast.success('Perfil atualizado com sucesso!');

// Nome inválido
Toast.warning('Por favor, insira um nome válido');

// Erro ao carregar dados
Toast.error('Erro ao carregar dados do usuário');
```

### Professor
```javascript
// Aluno atualizado
Toast.success('Informações do aluno atualizadas com sucesso!');

// Validação de seleção
Toast.warning('Selecione um aluno');

// Erro ao enviar tarefa
Toast.error('Erro ao enviar tarefa');

// Pagamento marcado
Toast.success('Pagamento de João marcado como pago!');
```

### Cadastro
```javascript
// Campos vazios
Toast.warning('Por favor, preencha todos os campos');

// Senha curta
Toast.warning('A senha deve ter pelo menos 6 caracteres');

// Sucesso
Toast.success('Cadastro realizado com sucesso!');

// Erro
Toast.error('Erro ao cadastrar. Tente novamente.');
```

## Suporte a Mensagens Dinâmicas

Você pode incluir variáveis nas mensagens:
```javascript
const studentName = 'João Silva';
Toast.success(`Tarefa enviada para ${studentName}!`);
Toast.error(`Erro ao processar pagamento de ${studentName}`);
```

## Performance
- Notificações são criadas dinamicamente no DOM
- Removidas automaticamente após a duração
- Sem overhead de biblioteca externa
- Implementação pura em JavaScript vanilla
