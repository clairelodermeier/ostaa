/*
Claire Lodermeier
The purpose of this file is to create requests between the client and server for an online 
marketplace app from the create a post screen. It allows user to create new listings. 
It interacts with DOM elements and sends post requests to the server.
*/

// dom elements for adding a post in post.html
const titleBox = document.getElementById('itemTitle');
const descBox = document.getElementById('desc');
const priceBox = document.getElementById('price');
const statusBox = document.getElementById('status');
const imgBox = document.getElementById('imgUpload');


// when user creates a post
createPostButton.onclick = () => {
  var title = titleBox.value;
  var desc = descBox.value;
  var price = priceBox.value;
  var stat = statusBox.value;
  if (title == ('') || desc == ('') || price == ('') || stat == ('') || imgBox.files.length == 0) {
    alert('One or more fields is incomplete.');
  }
  else {
    var imgFile = imgBox.files[0];

    // Create a FormData object
    var formData = new FormData();

    // Append the image file to the FormData object with a specific field name
    formData.append('photo', imgFile, imgFile.name);

    // Create the fetch request
    let url = '/upload';
    let p = fetch(url, {
      method: 'POST',
      body: formData,
    });
    p.then((r) => {
      return r.json();
    }).then((idObj) => {
      let itemObj = { t: title, d: desc, i: idObj, p: price, s: stat };
      // add item to the database
      addItem(itemObj);
    });

    // clear input fields
    titleBox.value = '';
    descBox.value = '';
    priceBox.value = '';
    statusBox.value = '';
    imgBox.value = '';
  }

};


function addItem(itemObj) {
  /*
  The purpose of this function is to make a request to the server to add an item to the database. 
  It creates a post request with the item sent in the body as a JSON object.
  Param: itemObj (a js object with String fields t, d, i, p, and s for title, desc, image path, 
  price, and status)
  */

  let url = '/add/item/';
  let p = fetch(url, {
    method: 'POST',
    body: JSON.stringify(itemObj),
    headers: { 'Content-Type': 'application/json' }
  });

  p.then((response) => {
    return response.text();
  }).then((text) => {
    // given a success response from server, redirect to home screen.
    if (text.startsWith('SUCCESS')) {
      window.location.href = '/home.html';
    }
    else {
      alert(text);
    }
  }).catch(() => {
    window.location.href = '/index.html';
  });

}


