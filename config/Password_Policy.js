
import { generateHash } from "./Salt_HMAC.js";
import mysql from 'mysql2';
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123123',
    database: 'communication_ltd',
    port: 3306
}).promise();


const config = {
    passwordPolicy: {
        minLength: 10,
        complexity: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            specialCharacters: true,
        },
        dictionaryCheck: true,
        loginAttempts: 3,
        preventReuse: true, // מניעת שימוש חוזר בסיסמאות
    },
};

/**
 * פונקציה לבדיקת מדיניות סיסמה
 * @param {string} username - שם המשתמש.
 * @param {string} password - הסיסמה לבדיקה.
 * @returns {Promise<boolean>} - האם הסיסמה עומדת בתנאים.
 */
export async function validatePassword(username, password) {
    const policy = config.passwordPolicy;

    // בדיקת אורך מינימלי
    if (password.length < policy.minLength) {
        console.error("Password is too short.");
        return false; // סיסמה קצרה מדי
    }

    // בדיקת מורכבות
    if (policy.complexity.uppercase && !/[A-Z]/.test(password)) {
        console.error("Password must contain at least one uppercase letter.");
        return false; // לא מכילה אות גדולה
    }
    if (policy.complexity.lowercase && !/[a-z]/.test(password)) {
        console.error("Password must contain at least one lowercase letter.");
        return false; // לא מכילה אות קטנה
    }
    if (policy.complexity.numbers && !/[0-9]/.test(password)) {
        console.error("Password must contain at least one number.");
        return false; // לא מכילה מספר
    }
    if (policy.complexity.specialCharacters && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        console.error("Password must contain at least one special character.");
        return false; // לא מכילה תו מיוחד
    }

    // אם מניעת שימוש חוזר בסיסמאות מופעלת, מבוצעת בדיקה מול מסד הנתונים
    if (policy.preventReuse) {
        const historyCheck = await generateHash(password); // יצירת hash לסיסמה
        const query = `SELECT password_hash FROM users WHERE username = '${username}' LIMIT 3`; // הנחה שיש 3 סיסמאות בהיסטוריה
        const [result] = await pool.query(query);

        // בדוק אם הסיסמה קיימת באחת משלוש הסיסמאות הקודמות
        for (let i = 0; i < result.length; i++) {
            if (result[i].password_hash === historyCheck) {
                console.error("Password was used previously.");
                return false; // הסיסמה כבר שימשה בעבר
            }
        }
    }

    console.log("Password is valid.");
    return true; // הסיסמה תקינה
}














































/**const config = {
    passwordPolicy: {
        minLength: 10,
        complexity: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            specialCharacters: true
        },
        
        dictionaryCheck: true,
        loginAttempts: 3
    },
    
};


export function validatePassword(password) {
    const policy = config.passwordPolicy;

    // בדיקת אורך מינימלי
    if (password.length < policy.minLength) {
        console.error("Password is too short.");
        return false;
    }

    // בדיקת מורכבות
    if (policy.complexity.uppercase && !/[A-Z]/.test(password)) {
        console.error("Password must contain at least one uppercase letter.");
        return false;
    }
    if (policy.complexity.lowercase && !/[a-z]/.test(password)) {
        console.error("Password must contain at least one lowercase letter.");
        return false;
    }
    if (policy.complexity.numbers && !/[0-9]/.test(password)) {
        console.error("Password must contain at least one number.");
        return false;
    }
    if (policy.complexity.specialCharacters && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        console.error("Password must contain at least one special character.");
        return false;
    }


    console.log("Password is valid.");
    return true;
}
*/


