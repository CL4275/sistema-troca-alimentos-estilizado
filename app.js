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

// Sincronizar banco e iniciar servidor
sequelize.sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));
