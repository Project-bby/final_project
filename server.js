
import express, { request, response } from "express";
import mysql from 'mysql2';
import { validatePassword } from "./config/Password_Policy.js";
import { generateHash } from "./config/Salt_HMAC.js";
import axios from 'axios';
import crypto from 'crypto';
import nodemailer from 'nodemailer';


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Server:
const app = express()
const port = 3000

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123123',
    database: 'communication_ltd',
    port: 3306

}).promise()
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: true }))
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// pages:
app.get("/Main_Page", (request, response) => { response.render('Main_Page.ejs') })
app.get("/Forgot_Password", (request, response) => { response.render('Forgot_Password.ejs') })
app.get("/Change_Password", (request, response) => { response.render('Change_Password.ejs') })
app.get("/Login", (request, response) => { response.render('Login.ejs') })
app.get("/New_Register", (request, response) => { response.render('New_Register.ejs') })
app.get("/System_Page", (request, response) => { response.render('System_Page.ejs') })
app.listen(port, () => { console.log("listeing on 3000 port") })

    ;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    app.post("/Login", async (request, response) => {
        try {
            const username = request.body.username;
            const password = request.body.password;
            const salt = "mydSalt"; // Salt קבוע
            const password_hash = await generateHash(password, salt)

            const query = `SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password_hash}'`;
            
            const [result] = await pool.query(query);
            
            if (result.length > 0) {
                response.send("Login successful!");
            } else {
                console.log("User not found.");
                response.status(401).send("Wrong credentials.");
            }
        } catch (error) {
            
            response.status(500).send("Server error.");
        }});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    app.post("/System_Page", async (request, response) => {
        try {
            const new_customer = request.body.newcustomer;
            console.log("New customer input:", new_customer);
            // הוספת הלקוח למסד הנתונים
            const query = `INSERT INTO customers (name) VALUES ('${new_customer}')`;
            await pool.query(query);
    
            // שאילתה לאחזור הלקוח שהוסף
            const query2 = `SELECT name FROM customers WHERE name = '${new_customer}'`;
            const [result] = await pool.query(query2);
    
            // הדפסת שם הלקוח           
                const message = `Customer was added successfully : ${result[0].name}`;
                response.status(200).send(message);  // שולח את הפלט הרצוי
        } catch (error) {            
            console.log("Error:", error);
            response.status(500).send("Server error.");
        }});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/Change_Password", async (request, response) => {
    try {       
        const username = request.body.username1;
        const password = request.body.CurrentPassword;
        const newpassword = request.body.NewPassword
        const salt = "mydSalt"; // Salt קבוע
        const password_hash = await generateHash(password, salt);

        // שאלת בסיס נתונים לאימות הסיסמה הנוכחית
        const query = `SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password_hash}'`;
        const [result] = await pool.query(query);
        
        // אם נמצא משתמש והסיסמה תקינה, אפשר לעדכן
        if ((result.length > 0) && await validatePassword(username, newpassword) === true && (password!=newpassword)){
            const newPassword_hash = await generateHash(newpassword,salt)
            const updateQuery = `UPDATE users SET password_hash = '${newPassword_hash}' WHERE username = '${username}'`;
            await pool.query(updateQuery);
            response.status(200).send("Password changed successfully.");
        } else {
            response.status(400).send("Invalid password or password policy not met.");
        }

    } catch (error) {
        console.error(error);
        response.status(500).send("Server error.");
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/New_Register", async (request, response) => {
    try {
        const email = request.body.email;
        const username = request.body.username;
        const password = request.body.password;
    
        const salt = "mydSalt";

        // בדיקת הסיסמה לפי המדיניות
        const passwordError = validatePassword(username, password);
        if (passwordError === false) {
            response.status(400).send("Invalid password or password policy not met.");
        }

        const password_hash = await generateHash(password, salt);
       
        // הוספת המשתמש למסד הנתונים
        const query = `INSERT INTO users (username, email, password_hash) VALUES ('${username}', '${email}', '${password_hash}');`;

        await pool.query(query);
        response.status(200).send("User was added successfully.");

    } catch (error) {
        console.error(error);
        response.status(500).send("Server error.");
    }
});
    //P@ssw0rd#1 aviel_t 21247a1a9bf17bd17e5e1bb3814c038581f9e0ba
    //Gr8#T!me2  yoav_k  bd51b3c537b46313721faeee8e16b400a155072f
    //H@ppyDay3! samara_a 21667ab6a0ec8c1666be91c5a115f533d5c6101b


/////////////////////////////////////////////////////////////////////////////////////////////////////////////



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'supoortt10@gmail.com',  // כתובת המייל שלך
        pass: 'PSYA@9834'              // סיסמת המייל שלך
    }
});


app.use(express.json());  // לאפשר קריאות JSON מהלקוח


// נתיב לבקשה של שחזור סיסמה
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    
    // יצירת ערך אקראי עבור טוקן עם SHA-1
    const token = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');

    // שליחת המייל עם הטוקן
    const mailOptions = {
        from: 'supoortt10@gmail.com',  // כתובת השולח
        to: email,  // כתובת היעד שהמשתמש הזין
        subject: 'Password Reset Token',  // נושא המייל
        text: `Here is your password reset token: ${token}`  // תוכן המייל
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email: ' + error);
        }
        res.json({ message: 'Reset token sent to your email' });
    });
});

// נתיב לאימות הטוקן
app.post('/verify-token', (req, res) => {
    const { email, token } = req.body;
    
    // אין צורך לבדוק את הטוקן במאגר
    res.json({ message: 'Token verified! You can now reset your password.' });
});

