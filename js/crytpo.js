var _algorithm = "AES-CBC";
var _key_size = 256;
var _pbkdf_iterations = 100;

// Do not change this once used in production
// If copying from StackExchange replace with a new random value for your app 
// or pass in a user specific value from the DB
var _defaultSalt = "sr9i9rm2kqkfrnyfvd245qme2bc8n2xw";

// Derives a key from the given password.
// Salt is not required. If supplied should be a hex string.
function deriveKey(passphrase, salt)
{   
    if (typeof(salt) === 'undefined')
    {
        salt = _defaultSalt;
    }

    return passphrase == null || passphrase.length < 10 ?
        Promise.reject("Password must be at least 10 characters") :
        crypto.subtle.importKey(
            'raw',
            stringToUtf8ByteArray(passphrase),
            { name: 'PBKDF2'},
            false,
            ['deriveBits', 'deriveKey' ]
        ).then(function(passwordKey) {
            return crypto.subtle.deriveKey(
                {
                    "name": 'PBKDF2',
                    "salt": hexStringToByteArray(salt),
                    "iterations": _pbkdf_iterations,
                    "hash": 'SHA-256'
                },
                passwordKey,
                { "name": _algorithm, "length": _key_size },
                false, // Extractable is set to false so that underlying key details cannot be accessed.
                [ "encrypt", "decrypt" ]
            );
        });
}

function encryptData(keyObject, data)
{
    let iv = crypto.getRandomValues(new Uint8Array(16));

    return crypto.subtle.encrypt(
        {name: _algorithm, iv: iv},
        keyObject,
        data
    ).then(function(encryptedData) {
        return {
            iv:iv,
            data:encryptedData
        }
    });
}

function decryptData(keyObject, iv, encryptedData)
{   
    return crypto.subtle.decrypt(
        {name: _algorithm, iv: iv},
        keyObject,
        encryptedData
    );
}