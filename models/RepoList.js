const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepoListSchema = new Schema({

    username:{
        type: String,
        required: true
    },

    repos:[{
        type: String
    }]
});

module.exports = mongoose.model('repolists', RepoListSchema);