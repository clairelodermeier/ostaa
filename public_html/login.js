/*
Claire Lodermeier
The purpose of this file is to create login and account creation requests between the client and 
server for an online marketplace app. It interacts with DOM elements and sends requests to the
server.
*/

// dom elements for login
const userBox = document.getElementById('username');
const pwBox = document.getElementById('password');
const loginButton = document.getElementById('loginButton');

// dom elements for creating account
const createUserBox = document.getElementById('createUsername');
const createPwBox = document.getElementById('createPassword');
const createUserButton = document.getElementById('createButton');


// user makes a login attempt
loginButton.onclick = () => {
    let username = userBox.value;
    let password = pwBox.value;
    validateLogin(username, password);

    // clear input fields
    userBox.value = '';
    pwBox.value = '';
};

// when user creates an account
createUserButton.onclick = () => {
    let username = createUserBox.value;
    let password = createPwBox.value;

    if (username == '' || password == '') {
        alert('Username or password is invalid');
    }
    else {
        addUser(username, password);

        // clear input fields 
        createUserBox.value = '';
        createPwBox.value = '';
    }

};

function validateLogin(username, password) {
    /* 
    The purpose of this function is to send a post request to the server to validate a user's 
    login info. If the login is successful, the user is redirected to the home screen. 
    Param: username (String for inputted username), password (String for inputted password)
    */

    // create login object with fields u for username and p for password
    let loginObj = { u: username, p: password };

    // make POST request to server containing login object in body
    let url = '/account/login/';
    let p = fetch(url, {
        method: 'POST',
        body: JSON.stringify(loginObj),
        headers: { 'Content-Type': 'application/json' }
    });
    p.then((response) => {
        return response.text();
    }).then((text) => {
        // if successful response, redirect to home screen
        if (text.startsWith('SUCCESS')) {
            window.location.href = '/home.html';
        }
        else {
            (alert(text));
        }
    });

}

function addUser(username, password) {
    /* 
    The purpose of this function is to send a request to the server to create a new user. 
    Param: username (String for inputted username), password (String for inputted password)
    */

    // create login object with fields u for username and p for password
    let userObj = { u: username, p: password };

    // make a GET request to server
    let url = '/account/create/' + userObj.u + '/' + encodeURIComponent(userObj.p);
    let p = fetch(url);
    p.then((response) => {
        return response.text();
    }).then((text) => {
        alert(text);
    });
}
