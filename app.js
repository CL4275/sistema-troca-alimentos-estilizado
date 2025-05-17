// app.js (CÓDIGO COMPLETO COM AUTENTICAÇÃO, SESSIONS E ROTAS PROTEGIDAS)
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const exphbs = require('express-handlebars'); // motor de visualização
const session = require('express-session'); // Middleware de sessão
const bcrypt = require('bcrypt'); // Para hash de senha

const Alimento = require('./models/alimento'); // modelo Sequelize Alimento
const User = require('./models/user'); // modelo Sequelize User
const Rating = require('./models/rating');
const sequelize = require('./db'); // conexão com o banco

// --- Definir Associações ---
// Um Alimento pode ter muitas Avaliações (Ratings)
Alimento.hasMany(Rating, {
    foreignKey: 'alimentoId', // Define o nome da coluna de chave estrangeira na tabela Ratings
    as: 'ratings' // Define um alias para acessar ratings através de um Alimento (ex: alimento.getRatings())
});

// Uma Avaliação (Rating) pertence a um Alimento
Rating.belongsTo(Alimento, {
    foreignKey: 'alimentoId', // Define o nome da coluna de chave estrangeira na tabela Ratings (o mesmo nome acima)
    as: 'alimento' // Define um alias para acessar o alimento através de um Rating (ex: rating.getAlimento())
});

const app = express();
const port = 3000; // ou 3700, a porta que você estiver usando

// --- Configurar Handlebars ---
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layout')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// --- Configurar body-parser ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- Configurar express-session ---
app.use(session({
  secret: 'mariana', // <<< *** MUDE ESTA STRING PARA ALGO UNICO ***
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use 'false' para desenvolvimento local (HTTP)
}));

// --- Configurar Servir Arquivos Estáticos (CSS, JS, Imagens, etc.) ---
app.use(express.static(path.join(__dirname, 'public')));


// --- Middleware de Autenticação ---
// Esta função verifica se o usuário está logado (se req.session.userId existe)
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        // Se o usuário estiver logado, continue para a próxima função (a rota em si)
        return next();
    } else {
        // Se o usuário NÃO estiver logado, redirecione para a página de login
        console.log('Acesso negado: usuário não autenticado. Redirecionando para login.');
        // Opcional: Adicionar mensagem de erro na sessão antes de redirecionar
        // req.session.errorMessage = 'Por favor, faça login para acessar esta página.';
        // Certifique-se de que você tem o middleware de mensagens na sessão configurado antes de usar req.session.errorMessage
        res.redirect('/login');
    }
}

// --- Rotas Públicas (Não Requerem Login) ---

// Rota para a página inicial (Home) - Crie a view views/home.handlebars se não existir
app.get('/', (req, res) => {
    // Você pode verificar req.session.userId aqui para saber se o usuário está logado na view
    res.render('home', { title: 'Página Inicial', isAuthenticated: !!req.session.userId });
});

// Rota para a página Sobre - Crie a view views/sobre.handlebars se não existir
app.get('/sobre', (req, res) => {
    // Você pode verificar req.session.userId aqui para saber se o usuário está logado na view
    res.render('sobre', { title: 'Sobre o Projeto', isAuthenticated: !!req.session.userId });
});

app.get('/chat-demonstrativo', (req, res) => {
    res.render('chat-demonstrativo', { title: 'Chat Demonstrativo' });
});

// Rota para listar todos os alimentos (Geralmente Pública)
app.get('/alimentos', (req, res) => {
  // Adicionar { raw: true } para retornar objetos simples
  // >>> ADICIONAR include: ['ratings'] para buscar as avaliações associadas
  Alimento.findAll({
    include: ['ratings'], // Inclui as avaliações associadas (usando o alias 'ratings' definido na associação em app.js)
    // raw: true // <<< Note: raw: true pode dificultar o acesso a dados incluídos/associados.
                  // Melhor remover raw:true quando usando include, e acessar os dados do objeto corretamente.
  })
    .then((alimentos) => {
      // 'alimentos' agora será um array de objetos Sequelize (ou simples se raw:true for usado)
      // Quando raw: true é removido, você acessa dados de associações assim: alimento.ratings
      // Se usar raw: true, os dados associados vêm "chatos" no objeto principal (ex: ratings.0.id, ratings.0.ratingValue)
      // Para simplicidade, vamos remover raw: true e acessar via o objeto retornado.

        console.log('Alimentos buscados (com ratings):', alimentos.map(a => ({ nome: a.nome, ratingCount: a.ratings ? a.ratings.length : 0 }))); // Debug: Ver a contagem de ratings

        // Passa os alimentos (agora com ratings incluídos) para a view
      res.render('alimentos', { alimentos, isAuthenticated: !!req.session.userId });
    })
    .catch((err) => {
        console.error('Erro ao listar alimentos (com ratings):', err); // Melhor usar console.error para erros
        res.status(500).send('Erro ao carregar lista de alimentos.'); // Resposta mais adequada em caso de erro
    });
});


// --- Rotas de Cadastro de Usuário ---
// Rota para exibir o formulário de cadastro
app.get('/cadastro', (req, res) => {
  // Se o usuário JÁ estiver logado, talvez redirecionar para a home? (Opcional)
  // if (req.session && req.session.userId) { return res.redirect('/'); }
  // TODO: Passar mensagens de erro/sucesso via session
  res.render('cadastro', { title: 'Cadastro de Usuário', isAuthenticated: !!req.session.userId });
});

// Rota para processar o envio do formulário de cadastro
app.post('/cadastro', async (req, res) => {
  // Se o usuário JÁ estiver logado, ignorar o pedido? (Opcional)
  // if (req.session && req.session.userId) { return res.redirect('/'); }
  const { email, password, nome } = req.body;

  try {
    const newUser = await User.create({ email, password, nome });
    console.log('Usuário cadastrado com sucesso:', newUser.toJSON());
    // TODO: Mensagem de sucesso na session
    res.redirect('/login');

  } catch (err) {
    console.error('Erro no cadastro:', err);
    // TODO: Lidar com erros amigavelmente
    res.redirect('/cadastro');
  }
});

// --- Rotas de Login de Usuário ---
// Rota para exibir o formulário de login
app.get('/login', (req, res) => {
  // Se o usuário JÁ estiver logado, talvez redirecionar para a home? (Opcional)
  // if (req.session && req.session.userId) { return res.redirect('/'); }
  // TODO: Passar mensagens de erro/sucesso via session
  res.render('login', { title: 'Login de Usuário', isAuthenticated: !!req.session.userId });
});

// Rota para processar o envio do formulário de login
app.post('/login', async (req, res) => {
  // Se o usuário JÁ estiver logado, ignorar o pedido? (Opcional)
  // if (req.session && req.session.userId) { return res.redirect('/'); }
  const { email, password } = req.body;

  if (!email || !password) {
    // TODO: Mensagem de erro via session
    console.log('Login falhou: Email ou senha não fornecidos.');
    return res.redirect('/login');
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (user && await user.validPassword(password)) {
      // Login bem-sucedido!
      req.session.userId = user.id; // Armazena o ID do usuário na sessão
      console.log('Login bem-sucedido para User ID:', user.id);
      res.redirect('/alimentos'); // Redireciona após o login

    } else {
      // Credenciais inválidas
      // TODO: Mensagem de erro via session
      console.log('Login falhou: Credenciais inválidas para o email:', email);
      res.redirect('/login');
    }

  } catch (err) {
    console.error('Erro durante o login:', err); // Erro inesperado
    // TODO: Mensagem de erro via session
    res.redirect('/login');
  }
});

// Rota para processar o envio de uma avaliação (Rating)
app.post('/rate-alimento', isAuthenticated, async (req, res) => { // <<< Rota Protegida
    const { alimentoId, ratingValue } = req.body; // Extrai o ID do alimento e a nota

    console.log(`Recebida avaliação ${ratingValue} para Alimento ID ${alimentoId}`); // Debug

    // Validação básica dos dados recebidos
    if (!alimentoId || !ratingValue || isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        console.error('Erro ao avaliar: Dados inválidos recebidos.');
        // TODO: Adicionar mensagem de erro na sessão
        return res.redirect('/alimentos'); // Redireciona de volta com erro
    }

    try {
        // Cria um novo registro na tabela Ratings
        const newRating = await Rating.create({
            ratingValue: parseInt(ratingValue, 10), // Garante que é um número inteiro
            alimentoId: parseInt(alimentoId, 10), // Associa a avaliação ao alimento
            // TODO: Se associar Rating a User, adicione userId: req.session.userId aqui
        });

        console.log('Avaliação salva com sucesso:', newRating.toJSON()); // Debug
        // TODO: Adicionar mensagem de sucesso na sessão

        // Redireciona de volta para a lista de alimentos
        res.redirect('/alimentos');

    } catch (err) {
        console.error('Erro ao salvar avaliação:', err); // Loga o erro
        // TODO: Adicionar mensagem de erro na sessão
        res.redirect('/alimentos'); // Redireciona de volta em caso de erro
    }
});

// --- Rota de Logout ---
// Esta rota encerra a sessão do usuário
app.get('/logout', (req, res) => {
    // req.session.destroy() destrói a sessão completamente
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar sessão:', err);
            // TODO: Lidar com erro de forma amigável
            res.status(500).send('Erro ao fazer logout.'); // Resposta em caso de erro
        } else {
            // Redireciona para a página de login ou home após encerrar a sessão
            console.log('Sessão encerrada com sucesso.');
            res.redirect('/login'); // Redireciona para a página de login
            // Ou res.redirect('/'); // Redireciona para a página inicial
        }
    });
});
// --- Rotas Protegidas (Requerem Login) ---
// Aplica o middleware isAuthenticated ANTES da função da rota

// Rota para exibir o formulário de adição de alimentos
app.get('/add-alimento', isAuthenticated, (req, res) => { // <<< AGORA COM isAuthenticated
  res.render('add-alimento', { title: 'Adicionar Novo Alimento', isAuthenticated: !!req.session.userId });
});

// Rota para adicionar alimento ao banco (Processa formulário)
app.post('/add-alimento', isAuthenticated, (req, res) => {
  // Extrair TODOS os campos do req.body, incluindo os novos
  const { nome, quantidade, descricao, valor, fornecedor, email, telefone, address, latitude, longitude } = req.body; // <<< ADICIONE address, latitude, longitude AQUI NA EXTRAÇÃO

  // Criar o alimento no banco de dados, passando todos os campos
  Alimento.create({
    nome,
    quantidade,
    descricao,
    valor,
    fornecedor,
    email,
    telefone,
    address,     // <<< ADICIONE address AQUI
    latitude,   // <<< ADICIONE latitude AQUI
    longitude   // <<< ADICIONE longitude AQUI
  })
    .then(() => {
      console.log('Alimento adicionado com sucesso!');
      res.redirect('/alimentos');
    })
    .catch((err) => {
      console.error('Erro ao adicionar alimento:', err);
      // TODO: Lidar com erros de forma mais amigável
      res.redirect('/add-alimento');
    });
});

// Rota para deletar um alimento
app.post('/alimentos/delete/:id', isAuthenticated, (req, res) => { // <<< AGORA COM isAuthenticated
  const alimentoId = req.params.id;

  Alimento.findByPk(alimentoId)
    .then((alimento) => {
      if (!alimento) {
        console.log(`Alimento com ID ${alimentoId} não encontrado.`);
        return res.redirect('/alimentos');
      }
      return alimento.destroy();
    })
    .then(() => {
      console.log(`Alimento com ID ${alimentoId} deletado com sucesso.`);
      res.redirect('/alimentos');
    })
    .catch((err) => {
      console.error('Erro ao deletar alimento:', err);
      res.redirect('/alimentos');
    });
});

// --- Sincronizar banco e iniciar servidor ---
// Use { alter: true } com cuidado em desenvolvimento para atualizar tabelas existentes se necessário
// Use { force: true } DELETA e recria tabelas (cuidado!)
sequelize.sync()
  .then(() => {
    console.log('Banco de dados sincronizado.');
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao sincronizar banco de dados ou iniciar servidor:', err);
  });