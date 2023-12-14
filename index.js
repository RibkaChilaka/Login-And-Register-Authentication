const express=require('express')
const path=require('path')
const cookieParser=require('cookie-parser')
const app=express();
const mongoose=require('mongoose')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')
const env=require('dotenv').config()

const port=process.env.PORT || 4000

//connecting to database
mongoose.connect(process.env.URL,{
    dbName:"backend"
}).then(()=>console.log('db connected'))
.catch((e)=>console.log(e))
//defining Schema
const userSchema=new mongoose.Schema({
    name:String,
    email:String,
    password:String
})
//passing the Schema into collection User
const User=mongoose.model("User",userSchema)

//using middlewares
app.use(express.static(path.join(path.resolve(),"public")))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

//setting up view engine
app.set('view engine', 'ejs')

const isAuthenticated=async(req,res,next)=>{
    const {token}=req.cookies;
    if(token){
       const decoded = jwt.verify(token,"asdfghjqwertgyhu")
        //console.log(decoded)
        req.user=await User.findById(decoded._id)
        next();
    }
    else{
        res.redirect("/login")
    }
}

//middleware function
app.get('/',isAuthenticated,(req,res)=>{
    // console.log(req.user)

    res.render("logout", {name:req.user.name})
    // console.log(req.cookies.token)
    //taking this bellow commented code inside a isAuthenticated function
    // const {token}=req.cookies;
    // if(token){
    //     res.render("logout")
    // }
    // else{
    //     res.render("login")
    // }
    // res.render("login")
})

app.get("/login",(req,res)=>{
    res.render("login")
})
app.post("/login",async(req,res)=>{
    const {email,password}=req.body
    let user=await User.findOne({email})
    if(!user)return res.redirect('register')

    // const isMatch=user.password===password;
    const isMatch=await bcrypt.compare(password, user.password)
    if(!isMatch) return res.render('login',{message:"Incorrect password",email:email})

    const token=jwt.sign({_id:user._id}, "asdfghjqwertgyhu") 
//    console.log(token)

    res.cookie('token', token,{
        httpOnly:true,expires:new Date(Date.now()+60*1000)
    });
    res.redirect('/')

})

app.get("/register",(req,res)=>{
    res.render('register')
})
app.post("/register",async(req,res)=>{

    const {name,email,password}=req.body;

    let user=await User.findOne({email})
    if(user){
      return res.redirect("/login");
    }

    const hashedPassword=await bcrypt.hash(password, 10)

     user=await User.create({
        name,
        email,
        password:hashedPassword
    })

   const token=jwt.sign({_id:user._id}, "asdfghjqwertgyhu") 
//    console.log(token)

    res.cookie('token', token,{
        httpOnly:true,expires:new Date(Date.now()+60*1000)
    });
    res.redirect('/')
})
app.get("/logout",(req,res)=>{
    res.cookie('token', null,{
        httpOnly:true,expires:new Date(Date.now())
    });
    res.redirect('/')
})

app.listen(port,()=>{
    console.log("server started")
})