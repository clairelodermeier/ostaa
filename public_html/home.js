/*
Claire Lodermeier
The purpose of this file is to create requests between the client and server for an online 
marketplace app from the home screen. It allows user to search, create, and purchase items. 
It interacts with DOM elements and sends requests to the server.
*/

// dom elements in home.html
const searchButton = document.getElementById('searchButton');
const searchBox = document.getElementById('searchTerm');
const purchasesButton = document.getElementById('viewPurchases');
const listingsButton = document.getElementById('viewListings');
const createListingButton = document.getElementById('createListing');
const welcome = document.getElementById('welcome');

// welcome message
displayWelcome();

// Create a listing: redirect to post page
createListingButton.onclick = () => {
    window.location.href = '/post.html';
}

// Search listings
searchButton.onclick = () => {
    search(searchBox.value);
}

// View listings
listingsButton.onclick = () => {
    viewListings();
}

// View purchases
purchasesButton.onclick = () => {
    viewPurchases();
}

function initializeBuy() {
    /*
    The purpose of this function is to initialize the buy buttons once a search has been made.
    It gets a list of buyButton elements, and sets their onlick to the buyItem function.
    */
    const buyButtons = document.getElementsByClassName('buyButton');
    // Buy an item
    for (const b of buyButtons) {
        b.onclick = () => {
            buyItem(b.id);
        };
    }
}

function displayWelcome() {
    /*
    The purpose of this function is to display the welcome message at the top of the home page. 
    It fetches the logged in user's username and updates the DOM element. 
    */
    let p = fetch('/get/username/');
    p.then((r) => {
        return r.text();
    }).then((name) => {
        if (!(name.startsWith("<"))) {
            welcome.innerText = 'Welcome ' + name + '! What would you like to do?';
        }
        else {
            window.location.href = '/index.html';
        }
    }).catch(() => {
        window.location.href = '/index.html';
    });

}

function search(keyword) {
    /*
    The purpose of this function is to allow the user to search for an item.
    It sends a GET request to the server for items containing a keyword and displays the items.
    Param: keyword (String input by user as a search keyword)
    */

    let url = '/search/items';
    if (keyword != '') {
        url += '/' + keyword + '/';
    };
    let p = fetch(url);
    p.then((response) => {
        return response.json();
    }).then((items) => {
        // display the list of items sent from the server
        displayItems(items);
    }).then(() => {
        initializeBuy();
    }).catch((err) => {
        alert(err);
    });
}

function viewListings() {
    /*
    The purpose of this function is to allow the user to view their own listings.
    It sends a GET request to the server for items listed by the user and displays them.
    */
    let url = '/get/listings/';
    let p = fetch(url);
    p.then((response) => {
        return response.json();
    }).then((listings) => {
        // display the list of items sent from the server
        displayOwnItems(listings, '<h4> Your listings: </h4>');
    }).catch((err) => {
        alert(err);
        //window.location.href = '/index.html';
    });
}

function viewPurchases() {
    /*
    The purpose of this function is to allow the user to view the items they have purchased.
    It sends a GET request to the server for items purchased by the user and displays them.
    */
    let url = '/get/purchases';
    let p = fetch(url);
    p.then((response) => {
        return response.json();
    }).then((purchases) => {
        // display the list of items sent from the server
        displayOwnItems(purchases, '<h4> Your purchases: </h4>');
    }).catch(() => {
        window.location.href = '/index.html';
    });
}


function displayOwnItems(items, htmlStr) {
    /*
    The purpose of this function is to display items listed by current user.
    It builds an html string, displaying item info inside divs, and displays the html in the 
    right column of home.html.
    Param: items (a js array of listings/purchases), htmlStr (a starter string of html)
    */
    const display = document.getElementById('right');
    for (let i = 0; i < items.length; i++) {

        htmlStr += '<div class = "box">';
        htmlStr += '<h2>' + items[i].title + '</h2>';
        htmlStr += '<img class = "image" src="/image/' + items[i].image.toString() + '">';
        htmlStr += '<p>' + items[i].desc + '</p>';
        htmlStr += '<p>' + items[i].price + '</p>';
        htmlStr += '<p>' + items[i].stat + '</p>';
        htmlStr += '</div>';
    }
    display.innerHTML = htmlStr;
}

function displayItems(items) {
    /*
    The purpose of this function is to display items not listed by current user.
    It builds an html string, displaying item info inside divs, and displays the html in the 
    right column of home.html.
    Param: items (a js array of listings)
    */
    const display = document.getElementById('right');
    var htmlStr = '';
    for (let i = 0; i < items.length; i++) {
        htmlStr += "<div class='box'>";
        htmlStr += '<h2>' + items[i].title + '</h2>';
        htmlStr += '<img class = "image" src="/image/' + items[i].image.toString() + '">';
        htmlStr += '<p>' + items[i].desc + '</p>';
        htmlStr += '<p>' + items[i].price + '</p>';

        // buy button for available items
        if (items[i].stat == ('SALE')) {
            htmlStr += '<button class = "buyButton" id="' + items[i]._id + '">Buy Now!</button>';
        }
        else {
            htmlStr += '<p> Item has been purchased</p>';
        }
        htmlStr += '</div>';
    }
    display.innerHTML = htmlStr;

}

function buyItem(itemId) {
    /*
    The purpose of this function is to allow a user to purchase an item. It is triggered by the 
    user pressing the buy button for a specific item, and it sends a request to the server.
    Param: itemId(String for the id of the listed item)
    */

    let url = '/buy/item/';
    let p = fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 'itemId': itemId }),
        headers: { 'Content-Type': 'application/json' }
    });
    p.then((response) => {
        return response.text();
    }).then((text) => {
        // given a success response from server, go to purchases.
        if (text.startsWith('SUCCESS')) {
            viewPurchases();
        }
        else {
            alert(text);
        }
    });

}
