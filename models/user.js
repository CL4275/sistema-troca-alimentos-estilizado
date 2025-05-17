// models/user.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Importa a instância do Sequelize
const bcrypt = require('bcrypt'); // Importa a biblioteca bcrypt

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Garante que cada email seja único
    validate: {
      isEmail: true, // Valida se é um formato de email válido
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: true, // Nome pode ser opcional dependendo da necessidade
  },
}, {
  // Opções do modelo
  hooks: {
    // Hook para fazer o hash da senha ANTES de criar um novo usuário
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10); // Gera um salt (fator aleatório)
        user.password = await bcrypt.hash(user.password, salt); // Faz o hash da senha usando o salt
      }
    },
    // Você pode adicionar hooks beforeUpdate se permitir a mudança de senha
  },
  instanceMethods: {
    // Método para comparar uma senha fornecida com o hash armazenado
    validPassword: async function (password) {
      return await bcrypt.compare(password, this.password);
    },
  },
});

// Adiciona o método validPassword ao protótipo do modelo
User.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


module.exports = User;