require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");



const app = express();

//Configuracao do Json
app.use(cors());
app.use(express.json());

//Importando os Modelos para aplicacao
const User = require("./models/User");
const Clima = require("./models/Clima");
const { restart } = require("nodemon");

//Chamar dados
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

//Rota Publica
app.get("/", (req, res) => {
  res.status(200).json({ msg: "OK" });
});

//Rota Privada
app.get('/user/:id',checkToken, async (req, res) => {

    const id = req.params.id;

    //Checa se o usuario existe
    const user = await User.findById(id,'-password')

    if(!user){
        return res.status(404).json({ msg: 'Nao existe este usuario'})
    }
    res.status(200).json({ user})
})

//Checa o Token
function checkToken(req,res,next){

    const authHeader = req.header['authorization']
    const token = authHeader &&  authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({msg:'Acesso nao autorizado'})
    }

    try{
        const secret =process.env.SECRET
        jwt.verify(token,secret)
    }catch(error){
        res.status(400).json({msg:'Token eh invalido'})
    }
}




//////////////////////////////////////////////////////////////////////////
//Registo de Usuario
app.post("/auth/register", async (req, res) => {
  const { email, password, confirmpassword } = req.body;

  if (!email) {
    return res.status(422).json({ msg: "Email Obrigatorio" });
  }
  if (!password) {
    return res.status(422).json({ msg: "Password Obrigatorio" });
  }
//   if (password != confirmpassword) {
//     return res.status(422).json({ msg: "Confirmacao Password Obrigatorio" });
//   }

  //Confere se ha usuario semelhante
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res
      .status(422)
      .json({ msg: "Email ja cadastrado, tente outro email" });
  }

  //Criacao da senha - seguranca

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  //Criacao de Usuario
  const user = new User({
    email,
    password: passwordHash,
  });
  try {
    await user.save();
    res.status(201).json({ msg: "Cadastro ocorreu com sucesso!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Erro no servidor da aplicacao. Aguarde e tente novamente!",
    });
  }
});
////////////////////////////////////////////////////////////////////

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  //Validacao de login de usuario
  if (!email) {
    return res.status(422).json({ msg: "Eh obrigatório utilizacao do email!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "Eh obrigatorio utilizacao de senha" });
  }
  const user = await User.findOne({ email: email });
  //Checagem de conta  de usuario
  if (!user) {
    return res.status(422).json({ msg: "Usuario não encontrado" });
  }
  const checkPassword = await bcrypt.compare(password, user.password);
  //Verificacao de senha do usuario
  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha digita esta incorreta" });
  }
  try {
    const secret = process.env.SECRET;
    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );
    res.status(200).json({ msg: "Exito na Autenticacao", token });
  } catch (err) {
    console.log(error);
    res.status(500).json({
      msg: "Erro no servidor da aplicacao. Aguarde e tente novamente!",
    });
  }
});

// API//

app.post('/api/register', async (req, res) => {
    const {estado, tipoClima} = req.body;
    if(!estado){
        return res.status(422).json({msg:'Nome do estado eh Obrigatorio'}
    )}
    if(!tipoClima){
        return res.status(422).json({msg:'Tipo de Clima eh Obrigatorio'}
    )}
    const climaExists = await Clima.findOne({estado:estado})
    if(climaExists){
        return res.status(422).json({msg:'Estado ja existente'})
    }
    const clima = new Clima({
        estado,
        tipoClima
    })
    try{
        await clima.save()
        res.status(201).json({msg:'Cadastro do Estado e Tipo de Clima com sucesso'})
    }catch(error){
        console.log(error)
        res.status(500).json({msg:'Erro com o servidor tente mais tarde'})
    }

})

app.get('api/search/:estado', async(req, res)=>{
    const{estado}= req.query
    const regex = new RegExp(estado, 'i')

    try{
        const response = await Clima.find({estado:{$regex:regex}})
        if(response.length === 0){
            res.status(422).json({ msg:'Pesquisa esta vazia'})
        }else{
            console.log(response)
            return res.status(201).json({msg:'Pesquisa Realizada'})
        }
    }catch(error){
        console.log(error)
        res.status(500).json({msg:'Erro com o servidor tente mais tarde'})
    }
})


mongoose.set("strictQuery", false);
mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster1.h1nasng.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000);
    console.log("Listening on port 3000");
  })
  .catch((err) => console.log(err));
