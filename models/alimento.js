// models/alimento.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Importa a instância do Sequelize

const Alimento = sequelize.define('Alimento', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  quantidade: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  fornecedor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // --- NOVOS CAMPOS DE GEOLOCALIZAÇÃO ---
  address: {
    type: DataTypes.STRING, // Para o endereço de texto legível
    allowNull: true, // Endereço pode ser opcional
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8), // DECIMAL com precisão para latitude
    allowNull: true, // Latitude pode ser opcional
    // Você pode adicionar validação para verificar o range de latitude (-90 a +90)
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8), // DECIMAL com precisão para longitude
    allowNull: true, // Longitude pode ser opcional
    // Você pode adicionar validação para verificar o range de longitude (-180 a +180)
  },
});

module.exports = Alimento;