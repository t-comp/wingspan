# Getting Started

Wingspan is a centralized butterfly and insect image library built for senior design and capstone student teams at Iowa State University. Its purpose is to allow students access to a collection of images to use in their applications instead of building their own pipeline. This application was built by Taylor Bauer, Lexi, Abby Van Den Brink, and Siri. The images and application are maintained by Nathan Brockman at Reiman Gardens.

>**Important:** Always use scientific name (e.g. `Cethosia biblis`) as your identifier when calling endpoints. Common names like "Red Lacewing" can be shared by multiple species but scientific names are unique and will never be duplicated.

---

You can use Wingspan in two ways:

1. **Programmatically:** use your team's API key to pull images, species info, and metadata directly into your application via the Wingspan API. This is the main use case for most teams.
2. **Through the frontend:** log into the Wingspan app, browse the library, find specific images you want, and copy the URL for the size you need directly into your project.

---

## Getting Your API Key

Every student team gets an API key when they are added to the system. Your API key is tied to your team and gives you read-only access to all species, images, tags, and metadata in the library.

To find your API key:

1. Log into the Wingspan app with your student account
2. Go to your dashboard
3. Your API key will be displayed there along with its expiration date and active status

If your key is inactive or expired, contact Nathan to get it reactivated.

---

## Making Requests

Add your API key to every request as a header called `X-API-Key`:

```javascript
fetch('http://159.203.134.226/species/all', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
})
.then(res => res.json())
.then(species => console.log(species));
```

If your key is valid you will get back a list of species objects. If you get a `401` error your key may be inactive or incorrect. Please check your dashboard or contact Nathan.

---

## What You Can Access

With your API key you have read-only access to:

- All species and their info (name, scientific name, description, taxonomy)
- All images for any species, with multiple size URLs ready to use
- All tags and categories
- Filter functionality by tags, taxonomy, and more

You cannot upload, edit, or delete anything in the Wingspan library.

---

## Displaying Images

Each image comes with multiple URL fields for different sizes. Use the URL directly in an `img` tag, so no authentication will be needed for the images themselves. Please always use `mediumUrl` as your default because it will always have a value.

See Image Sizing for more details.