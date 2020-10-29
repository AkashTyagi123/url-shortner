const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const url = require('./models/UrlModel');
let slugId = 1;
const generateSlug = async ()=>{
    
    const alpha = "abcdefghijklmnopqrstABCDEFGHIJKLMNOPQRST0123456789"
      let temp = slugId;
      let result = "";
      while(temp!=0){
        
        const rem = temp%62;
        result = result + alpha.charAt(rem);
        temp = parseInt(temp/62);
      }
      slugId++;
      while(result.length < 7){
        result = result + Math.floor(Math.random(0,1)*62)
      }
      return result;
    
}
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));
mongoose.connect("mongodb+srv://test:test123@cluster0-ptnjs.mongodb.net/urls?retryWrites=true&w=majority",{useCreateIndex:true,useNewUrlParser:true,useUnifiedTopology:true},()=>console.log("Mongo db connected"));
app.get("/",(req,res)=>{
    res.render('pages/index',{error:null,miniUrl:""});
});
app.get("/shrinker/contact",(req,res)=>{
    res.render("pages/contact");
});
app.post('/api/shrink',(req,res)=>{
    let {longurl,shorturl,password} = {...req.body};
    if(shorturl.length === 0){
        shorturl = generateSlug();
        
    }
    console.log(slugId);
    url.findOne({slug:shorturl})
    .then(u=>{
        if(u){
            return res.render('pages/index',{error:"The Slug Already exist",miniUrl:null});;
        }
        else{
            let slug = shorturl;
   

    if(password){
        bcrypt.hash(password, 10, function(err, hash) {
            // Store hash in your password DB.
            const newUrl = new url(
                {slug:slug,
                 destination:longurl,
                 password:hash
                 });
                       newUrl.save().then((u)=>{res.render('pages/index',{error:null,miniUrl:`www.shrinker.com/${u.slug}`});
                             })
                             .catch(err=>console.log(err));
        });
    }
    

    else{
        const newUrl = new url(
            {slug:slug,
             destination:longurl,
             password:password
             });
                   newUrl.save().then((u)=>{
                    res.render('pages/index',{error:null,miniUrl:`www.shrinker.com/${u.slug}`});
                         })
                         .catch(err=>console.log(err));
    }
        }
    })
    .catch(err=>console.log(err));
});


app.get('/:miniUrl',async(req,res)=>{
    const mini=await url.findOne({slug:req.params.miniUrl});
    if(mini==null)
    res.sendStatus(404);
    else{
    const pass=mini.password;
    if(pass.length === 0){
    
    
    res.redirect(mini.destination);
    }
    else{
        res.render('pages/auth',{miniUrl:mini.slug,err:null});
    }
   
  }
 });
app.get('/:miniUrl/passAuth',(req,res)=>{
    res.render('pages/authFailed',{err:"Please Enter the correct password",miniUrl:req.params.miniUrl});
})
 app.post('/:miniUrl/passAuth',async(req,res)=>{
    const mini=await url.findOne({slug:req.params.miniUrl});
    const dbPass = mini.password;
    const pass = req.body.password;

    bcrypt.compare(pass,dbPass,(err,isMatch)=>{
        if(err){
           
          return res.render('pages/auth',{err:"Please Enter the correct password",miniUrl:req.params.miniUrl});
        }
        if(!isMatch){
           
           return res.render('pages/auth',{err:"Please Enter the correct password",miniUrl:req.params.miniUrl});
        }
       return  res.redirect(mini.destination);
        
    });

   
  
 });



app.listen(3000,()=>{
    console.log("App started on port 3000");
})