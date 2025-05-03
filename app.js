const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const exphbs = require('express-handlebars'); // motor de visualização
const Alimento = require('./models/alimento'); // modelo Sequelize
const sequelize = require('./db'); // conexão com o banco

const app = express();
const port = 3000;

// Configurar Handlebars
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layout')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Configurar body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Rota para listar todos os alimentos
app.get('/alimentos', (req, res) => {
  // Adicionar { raw: true } para retornar objetos simples
  Alimento.findAll({ raw: true })
    .then((alimentos) => {
      // 'alimentos' agora será um array de objetos JavaScript simples
      res.render('alimentos', { alimentos });
    })
    .catch((err) => console.log(err));
});

// Rota para exibir o formulário de adição de alimentos
app.get('/add-alimento', (req, res) => {
  res.render('add-alimento');
});

// Rota para adicionar alimento ao banco
app.post('/add-alimento', (req, res) => {
  const { nome, quantidade, descricao } = req.body;

  Alimento.create({
    nome,
    quantidade,
    descricao,
  })
    .then(() => res.redirect('/alimentos'))
    .catch((err) => console.log(err));
});
// Rota para deletar um alimento
app.post('/alimentos/delete/:id', (req, res) => {
  // Extrair o ID do parâmetro da URL
  const alimentoId = req.params.id;

  // Encontrar o alimento pelo ID
  Alimento.findByPk(alimentoId)
    .then((alimento) => {
      // Verificar se o alimento foi encontrado
      if (!alimento) {
        console.log(`Alimento com ID ${alimentoId} não encontrado.`);
        // Redirecionar de volta para a lista, talvez com uma mensagem de erro
        return res.redirect('/alimentos');
      }

      // Deletar o alimento
      return alimento.destroy();
    })
    .then(() => {
      console.log(`Alimento com ID ${alimentoId} deletado com sucesso.`);
      // Redirecionar de volta para a página da lista após deletar
      res.redirect('/alimentos');
    })
    .catch((err) => {
      console.log('Erro ao deletar alimento:', err);
      // Em caso de erro, redirecionar de volta para a lista ou renderizar uma página de erro
      res.redirect('/alimentos'); // Ou outra página de erro, se tiver
    });
});
// Sincronizar banco e iniciar servidor
sequelize.sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));
