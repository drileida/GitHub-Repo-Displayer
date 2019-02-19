const axios = require('axios');
const express = require('express');
const exhbs = require('express-handlebars');
const bodyParser = require('body-parser');
const passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
const express_session = require('express-session');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const RepoList = require('./models/RepoList');


mongoose.connect('mongodb://localhost:27017/github_Repos',{useNewUrlParser: true})
        .then((db)=>{console.log('CONNECTED')})
        .catch((err)=>{console.log(err)})
mongoose.set('useCreateIndex', true);

var GITHUB_CLIENT_ID = "6eea5adc3bc760c29a67";
var GITHUB_CLIENT_SECRET = "de6d739f77b55a7c8ea3a1755be4bf719968e6e5";


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: "http://127.0.0.1:9999/auth/github/callback"
},
function(accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect...
  process.nextTick(function () {
    
    // To keep the example simple, the user's GitHub profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the GitHub account with a user record in your database,
    // and return that user instead.
    return done(null, profile);
  });
}
));

const app = express();

app.use(express_session({ secret: 'cat', resave: false, saveUninitialized: true, cookie: { secure: true }}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.engine('handlebars', exhbs({defaultLayout:'home'}));
app.set("view engine", "handlebars");

app.get('/', (req, res) => {
  // res.render('home/login.handlebars');
  res.redirect('/auth/github');
})

app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:username' ] }),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  async function(req, res) {
    let username = req.user._json.login;
    let result = await axios.get('https://api.github.com/users/'+username+'/starred');
    result = Object.values(result);
    result = result[result.length-1];

    let newRepoInfo = new RepoList({username: username, repos: []});
    result.forEach(element => {
      newRepoInfo.repos.push(element.full_name);
    });

    newRepoInfo.save().then((item) => {
      res.render('home/repos.handlebars', {repos: result, username:username});
    }).catch((err) => {
      console.log(err);
    })
    
  });

app.listen(9999);


