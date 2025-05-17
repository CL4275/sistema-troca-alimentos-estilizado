// models/rating.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Importa a instância do Sequelize

const Rating = sequelize.define('Rating', {
  ratingValue: {
    type: DataTypes.INTEGER, // Ex: nota de 1 a 5
    allowNull: false,
    validate: {
      isInt: true,
      min: 1, // Opcional: Definir valor mínimo (ex: 1)
      max: 5, // Opcional: Definir valor máximo (ex: 5)
    },
  },
  // --- ADICIONE ESTE CAMPO: Chave estrangeira para Alimento ---
  alimentoId: {
    type: DataTypes.INTEGER,
    // allowNull: false, // Se a avaliação for obrigatória estar ligada a um alimento
    // references: { // Isso é opcional se a associação estiver bem definida no app.js
    //   model: 'Alimentos', // nome da tabela referenciada
    //   key: 'id',
    // },
    // onDelete: 'CASCADE' // Opcional: se deletar alimento, deleta rating (ou SET NULL como na associação no app.js)
  },

  // Se quiser incluir quem avaliou, adicionaríamos um campo userId aqui
  // Ex: userId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Rating;