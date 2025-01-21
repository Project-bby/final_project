export async function generateHash(password, salt) {
    const combined = password + salt; // שילוב הסיסמה וה-SALT
    const encoder = new TextEncoder(); // ממיר את המחרוזת לבינארי
    const data = encoder.encode(combined); // קידוד נתוני המחרוזת
    const hashBuffer = await crypto.subtle.digest('SHA-1', data); // חישוב ה-Hash
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // המרה למערך בתים
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join(''); // המרה להקסדצימלי
    return hashHex; // מחזיר את ה-Hash
}



