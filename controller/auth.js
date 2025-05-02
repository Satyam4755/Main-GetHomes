const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
exports.LoginPage = (req, res, next) => {
    // registerHomes ka variable me, find() ko call karenge
    const { email, password } = req.body;
    console.log(req.body)
    console.log(req.isLogedIn);
    res.render('./store/logIn', { title: "Log Page" ,
        currentPage:'logIn',
        isLogedIn:req.isLogedIn,
        oldInput:{email,password},
        errorMessage:[],
        user:req.session.user,
    })

}
/**NOTE:
 * simple log in krne par page direct home page pe ja raha hai as a new page 
 * hume choti information store krne hogi use ka jisse hum ye jaan sake ki user login hua hai ya nahi
 * iske liye hum cookie use karenge...
 */
exports.PostLogin = async (req, res, next) => {
    const { email, password } = req.body;
    const user=await User.findOne({email})
    if(!user){
        return res.status(422).render('./store/logIn',{
            title:"Login Page",
            isLogedIn:false,
            currentPage:'logIn',
            errorMessage:['Incorrect email or password'],
            oldInput:{email},
            user:{}
        })
    }
    const isMatched=await bcrypt.compare(password,user.password)
    if(!isMatched){
        return res.status(422).render('./store/logIn',{
            title:"Login Page",
            isLogedIn:false,
            currentPage:'logIn',
            errorMessage:['Incorrect email or password'],
            oldInput:{email},
            user:{}
        })
    }
    req.session.isLogedIn=true;
    req.session.user=user;
    await req.session.save();
    if(user.userType==='host'){
        return res.redirect('/host/admin_HomeList')
    }
    res.redirect('/')
}
exports.PostLogout=(req,res,next)=>{
    req.session.destroy(()=>{
        res.redirect('/logIn')
    })
    
}
// we can make middleware in array format also....
exports.postSignUpPage = [
    check('firstName')
    .notEmpty()
    .withMessage("First name should not be empty")
    .trim()
    .isLength({min:2})
    .withMessage("Name should be greater than 1 character")
    .matches(/^[a-zA-Z]+$/)
    .withMessage("Should be correct name"),
    // last name
    check('lastName')
    .matches(/^[a-zA-Z]*$/)
    .withMessage("Should be correct name"),
    // email
    check('email')
    .isEmail()
    .withMessage("Email should be in email format")
    .normalizeEmail(),
    // password
    check('password')
    .isLength({min:6})
    .withMessage("the password must be of 6 letters")
    .matches(/[a-z]/)
    .withMessage("the password must contain at least one Lower case character")
    .matches(/[A-Z]/)
    .withMessage("the password must contain at least one upper case character")
    .matches(/[!@#$%^&*_=]/)
    .withMessage("the password must contain at least one Special character")
    .matches(/[0-9]/)
    .withMessage("the password must contain at least one Number")
    .trim(),
    // now we've to check Confirm password in which first we take the password value and check it to the confirm password
    check('confirmPassword')
    .trim()
    .custom((value,{req})=>{
        if(value!==req.body.password){
            throw new Error("Password don't matched")
        }
        return true;
    }),
    // user type
    check('userType')
    .isIn(['guest','host'])
    .withMessage("please select any options"),
    // terms
    check('terms')
    .custom(value=>{
        if(value!=='on'){
            throw new Error("please click the terms and condition button")
        }
        return true;
    }),
    (req, res, next) => {

        const {firstName, lastName, email,password,userType}=req.body;
        const errors=validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).render('store/signup',{
                title:"sign-Up",
                isLogedIn:false,
                errorMessage:errors.array().map(err=>err.msg),
                oldInput:{firstName, lastName, email,password,userType},
                user:{}
            })
        }
        

        // first we bcrypt the password and then save the user
        bcrypt.hash(password,8).then(hashed=>{
            const user=new User({firstName, lastName, email,password:hashed,userType})
            user.save().then(()=>{
                res.redirect('/logIn')
            }).catch(err=>{
                console.log(err,"error")
                return res.status(422).render('store/signup',{
                    title:"sign-Up",
                    isLogedIn:false,
                    errorMessage:[err.message],
                    oldInput:{firstName, lastName, email,password,userType}
                })
            })
        })

        
        
}]


exports.getSignUpPage=(req,res,next)=>{
    const {firstName, lastName, email,password,userType}=req.body;
    res.render('./store/signup', { title: "Sign-UP Page" ,isLogedIn:req.isLogedIn,oldInput:{firstName, lastName, email,password,userType}})
}