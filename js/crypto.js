const LOCAL_STORAGE_DATA = 'BITRISE_ENCRYPTED_DATA';
var _defaultSalt = "sr9i9rm2kqkfrnyfvd245qme2bc8n2xw";
let VAULT_STATE = 0; 
let API_KEY = '';
// 0 = NO ACCOUNT
// 1 = LOGGED OUT
// 2 = LOGGED IN

/**
 * Encrypts plaintext using AES-GCM with supplied password, for decryption with aesGcmDecrypt().
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} plaintext - Plaintext to be encrypted.
 * @param   {String} password - Password to use to encrypt plaintext.
 * @returns {String} Encrypted ciphertext.
 *
 * @example
 *   const ciphertext = await aesGcmEncrypt('my secret text', 'pw');
 *   aesGcmEncrypt('my secret text', 'pw').then(function(ciphertext) { console.log(ciphertext); });
 */
 async function aesGcmEncrypt(plaintext, password) {
    const pwUtf8 = new TextEncoder().encode(password);                                 // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);                      // hash the password

    const iv = crypto.getRandomValues(new Uint8Array(12));                             // get 96-bit random iv
    const ivStr = Array.from(iv).map(b => String.fromCharCode(b)).join('');            // iv as utf-8 string

    const alg = { name: 'AES-GCM', iv: iv };                                           // specify algorithm to use

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']); // generate key from pw

    const ptUint8 = new TextEncoder().encode(plaintext);                               // encode plaintext as UTF-8
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);                   // encrypt plaintext using key

    const ctArray = Array.from(new Uint8Array(ctBuffer));                              // ciphertext as byte array
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');             // ciphertext as string

    return btoa(ivStr+ctStr);                                                          // iv+ciphertext base64-encoded
}


/**
 * Decrypts ciphertext encrypted with aesGcmEncrypt() using supplied password.
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} ciphertext - Ciphertext to be decrypted.
 * @param   {String} password - Password to use to decrypt ciphertext.
 * @returns {String} Decrypted plaintext.
 *
 * @example
 *   const plaintext = await aesGcmDecrypt(ciphertext, 'pw');
 *   aesGcmDecrypt(ciphertext, 'pw').then(function(plaintext) { console.log(plaintext); });
 */
async function aesGcmDecrypt(ciphertext, password) {
    const pwUtf8 = new TextEncoder().encode(password);                                 // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);                      // hash the password

    const ivStr = atob(ciphertext).slice(0,12);                                        // decode base64 iv
    const iv = new Uint8Array(Array.from(ivStr).map(ch => ch.charCodeAt(0)));          // iv as Uint8Array

    const alg = { name: 'AES-GCM', iv: iv };                                           // specify algorithm to use

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']); // generate key from pw

    const ctStr = atob(ciphertext).slice(12);                                          // decode base64 ciphertext
    const ctUint8 = new Uint8Array(Array.from(ctStr).map(ch => ch.charCodeAt(0)));     // ciphertext as Uint8Array
    // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

    try {
        const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);            // decrypt ciphertext using key
        const plaintext = new TextDecoder().decode(plainBuffer);                       // plaintext from ArrayBuffer
        return plaintext;                                                              // return the plaintext
    } catch (e) {
        throw new Error('Decrypt failed');
    }
}

async function saveAPIKey(password, api_key){
    let encrypted = '';
    try{
        encrypted = await aesGcmEncrypt(api_key, password);
        localStorage.setItem(LOCAL_STORAGE_DATA, encrypted);
        let saved_api_key = getAPIKey(password);
        if(saved_api_key == ''){
            alert("Error API not saved!");
            API_KEY = '';
        } else {
            API_KEY = saved_api_key;
        }
    } catch(err) {
        console.log(err);
        API_KEY = '';
        alert("Error API failed to save!" + JSON.stringify(err));
    }
}

async function getAPIKey(password){
    let ciphertext = localStorage.getItem(LOCAL_STORAGE_DATA);
    try{
        let api_key = await aesGcmDecrypt(ciphertext, password);
        if(api_key == ''){
            alert('Invalid password!');
        } else {
            API_KEY = api_key;
            document.getElementById('logged_in_api_key').value = API_KEY;
        }
        VAULT_STATE = 2; // LOGGED IN
        setTimeout(()=>{
            document.getElementById('sign_up').style.display = 'none';
            document.getElementById('log_in').style.display = 'none';
            document.getElementById('logged_in').style.display = 'block';
            document.getElementById('loginBtn').innerHTML = 'Save';
            document.getElementById('login').innerHTML = 'Account';
        }, 500);
     } catch(err) {
         console.log(err);
         API_KEY = '';
         alert("Invalid password!" + JSON.stringify(err));
    }
    if(API_KEY != ''){
        loadAPIData();
    }
}

function hasAPIKey(){
    let ciphertext = localStorage.getItem(LOCAL_STORAGE_DATA);
    if(ciphertext){
        VAULT_STATE = 1; // LOGGED OUT
        setTimeout(()=>{
            document.getElementById('sign_up').style.display = 'none';
            document.getElementById('log_in').style.display = 'block';
            document.getElementById('logged_in').style.display = 'none';
            document.getElementById('loginBtn').innerHTML = 'Log In';
            document.getElementById('login').innerHTML = 'Log In';
        }, 500);
    } else {
        VAULT_STATE = 0; // NO ACCOUNT
        setTimeout(()=>{
            document.getElementById('sign_up').style.display = 'block';
            document.getElementById('log_in').style.display = 'none';
            document.getElementById('logged_in').style.display = 'none';
            document.getElementById('loginBtn').innerHTML = 'Sign Up';
            document.getElementById('login').innerHTML = 'Sign Up';
        }, 500);
    }
    return ciphertext ? true : false;
}


function clearMemory(){
    API_KEY = '';
    setTimeout(()=>{
        document.getElementById('sign_up').style.display = 'none';
        document.getElementById('log_in').style.display = 'block';
        document.getElementById('logged_in').style.display = 'none';
        document.getElementById('loginBtn').innerHTML = 'Log In';
        document.getElementById('login').innerHTML = 'Log In';

        document.getElementById('logged_in_api_key').value = '';
        document.getElementById('signup_api_key').value = '';
        document.getElementById('signup_password').value = '';
        document.getElementById('login_password').value = '';
        document.getElementById('logged_in_password').value = '';
    }, 500);
}
function deleteAPIKey(){
    API_KEY = '';
    localStorage.removeItem(LOCAL_STORAGE_DATA);
    setTimeout(()=>{
        document.getElementById('sign_up').style.display = 'block';
        document.getElementById('log_in').style.display = 'none';
        document.getElementById('logged_in').style.display = 'none';
        document.getElementById('loginBtn').innerHTML = 'Sign Up';
        document.getElementById('login').innerHTML = 'Sign Up';

        document.getElementById('logged_in_api_key').value = '';
        document.getElementById('signup_api_key').value = '';
        document.getElementById('signup_password').value = '';
        document.getElementById('login_password').value = '';
        document.getElementById('logged_in_password').value = '';
    }, 500);
    hasAPIKey();
}