# Getting Started

Wingspan is a centralized butterfly and insect image library built for Iowa State students' senior design teams. Instead of storing your own images or building your own image pipeline, you use Wingspan to access a collection of insect photos which are primarily butterflys. This is maintained by Nathan at Reiman Gardens.

Students can use Wingspan in two ways:

(1) **Programmatically** - use your team's API key to pull images, species info, and metadata directly into your application via the Wingspan API. This is the main use case for most student teams.

(2) **Through the frontend** - log into the Wingspan app, browse the library, find specific images you want, and copy the URL for the size you need directly into your project.

---

## Getting Your API Key

Every student team gets an API key when they put in the system. Your API key is tied to your team and gives you read only access to all species, images, tags, and metadata in the library.

To find your API key:

1. Log into the Wingspan app with your student account
2. Go to your dashboard
3. Your API key will be displayed there along with its expiration date and active status

If your key is inactive or expired, please contact Nathan to get it reactivated.

---

## Making Requests

Once you have your API key, you can add it to every request as a header called `X-API-Key`. See below for an example to get all species from the library. 

```javascript
fetch('http://159.203.134.226/species/all', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
})
.then(res => res.json())
.then(species => console.log(species));
```

If your key is valid you will get back a list of species objects. If you get a 401 error your key may be inactive or incorrect, make sure to check your dashboard.

---

## What You Can Access

With your API key you have read only access to:

- All species and their info (name, scientific name, description, taxonomy)
- All images for any species, with multiple size URLs ready to use
- All tags and categories
- Filter and search functionality

You cannot upload, edit, or delete anything in the Wingspan library.

---

## Displaying Images

When you get images back from the API each one comes with multiple URL fields pointing to different sizes of the same photo. Just use the URL directly in an `img` tag or wherever you need it no authentication needed for the image files themselves.

```javascript
// get images for a species
fetch('http://159.203.134.226/images/species/28', {
  headers: { 'X-API-Key': 'your_api_key_here' }
})
.then(res => res.json())
.then(images => {
  images.forEach(img => {
    // use displayUrl as your default, it always has a value
    const url = img.displayUrl;
    document.getElementById('my-image').src = url;
  });
});
```

See the Image Sizing guide for a full breakdown of which URL to use when.