# FAQ

---

## General

**Do I need the API key to display images in my app?**

No. The API key is only needed to call Wingspan API endpoints. Once you have image URLs from the response you can use them directly in an `img` tag — the image files are publicly accessible on DigitalOcean Spaces and require no authentication.

**What if I copy a URL from the Wingspan frontend?**

You can use it directly in your project without an API key. It points to DigitalOcean Spaces which is publicly accessible. The API key is only needed when calling Wingspan API endpoints to get data back.

**What is the difference between using the API vs copying a URL from the frontend?**

The API lets you dynamically pull images, filter by tags, search species, and get all the metadata that comes with each image. Copying a URL is simpler if you just want one specific image hardcoded into your project. Most teams use a mix of both.

**What if I lose my API key?**

Log into your dashboard to find it. If it is deactivated or missing contact Nathan.

**Can my API key expire?**

Yes, keys expire after one year by default. Your dashboard shows the expiration date. Contact Nathan to extend it.

---

## Species

**Should I use common name or scientific name?**

Always use scientific name as your stable identifier. Common names can be shared by multiple species — for example two completely different butterflies can both be called the same common name. Scientific names like `Cethosia biblis` are unique and will never be duplicated. All `/name/{name}` endpoints accept both but scientific name is strongly recommended.

**How do I find a specific species?**

Use `GET /species/name/Cethosia biblis` with the scientific name, or `GET /species/all` to browse everything, or `GET /species/filter` to filter by taxonomy (order, family, genus).

**What is the difference between `name` and `scientificName`?**

`name` is the common name like "Red Lacewing". `scientificName` is the Latin binomial like "Cethosia biblis". Always use `scientificName` as your identifier.

**What is `thumbnailUrl` on a species?**

The species `thumbnailUrl` is the single representative photo Nathan picked for that species as a whole — used for gallery cards. It is not a size tier. It may be null if Nathan has not set one yet, in which case you should fall back to the first image in the species image list.

**What is the difference between `thumbnailUrl` on a species and `xSmallUrl` on an image?**

They are completely different things. `thumbnailUrl` on a species is the one photo Nathan chose to represent that species. `xSmallUrl` on an image object is the 300px resized version of that specific individual photo.

---

## Images

**What is the difference between `GET /images/species/name/{name}` and `GET /species/name/{name}/with-images`?**

Both give you the full image objects for a species. The difference is the shape of the response. `GET /images/species/name/{name}` returns a plain flat array of images only. `GET /species/name/{name}/with-images` returns the species object with the images nested inside it. Use the first if you already have the species info and just need images. Use the second if you need everything in one call.

**Some of my image URL fields are null — is that a bug?**

No, that is expected. Smaller uploads may only have `xSmallUrl` and the original. Always check if a URL is non-null before using it. `mediumUrl` and `originalUrl` are always safe fallbacks.

**What is `isFeatured` on an image?**

Nathan can mark one image as the preferred shot per species per tag combination. When `isFeatured` is `true` it means Nathan has chosen that as the best photo for that particular tag combo. Featured images are always returned first automatically. Use `&featured=true` on the filter endpoint to get Nathan's preferred image for a specific tag combination.

**What are `attributes` on an image?**

Attributes are custom key-value pairs Nathan sets on images — things like Morph, Collection Location, etc. They are flexible and vary by species. Always check if `attributes` is non-null before using.

**What is `nathansNotes`?**

Nathan's personal notes on an image. This field is displayed as **Notes** in the Wingspan frontend app but is returned as `nathansNotes` in the API response. May be null.

**The images are loading slowly.**

Use `xSmallUrl` instead of `mediumUrl` for grid views. Smaller files load much faster when showing many images at once.

**What is `lifecyclestage` on an image?**

A direct field on the image indicating the life stage of the specimen (e.g. "adult"). This is separate from the Life Stage tags — it is set directly on the image by Nathan when uploading. May be null.

---

## Tags & Filtering

**How do I get Nathan's preferred photo for a species?**

Use the filter endpoint with `featured=true`:
```
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Open,Female&featured=true
```
This returns Nathan's preferred Wings Open Female shot first. If he updates the preferred photo your app automatically gets the new one — no code changes needed.

**Should I filter by tagNames or tagIds?**

Always use `tagNames`. Tag names are human readable and stable. Use `tagNames=Wings Open,Female` not tag IDs.

**What core tags will every butterfly image have?**

Every butterfly image in Wingspan has a Position tag (Wings Open or Wings Closed), a Layout tag (Horizontal or Vertical), and a Sex tag (Male, Female, or Unknown).

**What is the difference between `lifecyclestage` and Life Stage tags?**

`lifecyclestage` is a direct field on the image object set when uploading. Life Stage tags (Egg, Larva, Pupa, Adult etc) are optional metadata tags that can also be applied. They may or may not match. Use `lifecyclestage` for basic filtering and Life Stage tags for more detailed filtering.

---

## Technical

**I am getting a 401 error.**

Your API key is missing, invalid, inactive, or expired. Check that you are sending it in the `X-API-Key` header and that it shows as active on your dashboard.

**I am getting a 403 error.**

You are trying to do something that requires admin access like uploading or deleting. API keys are read-only.

**I am getting a CORS error.**

Make sure you are developing on an allowed origin — localhost:3000, 5173, or 8080. Contact Nathan if you need a different origin added.

**The response from `all-with-images` is very large.**

If you only need one species use `GET /species/name/Cethosia biblis/with-images` instead. Only use `all-with-images` if you genuinely need the full dataset.

**Can I use the API without JavaScript?**

Yes, any HTTP client works — Postman, curl, Python requests, etc. Just add the `X-API-Key` header to every request.