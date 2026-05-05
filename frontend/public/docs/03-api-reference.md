# API Reference

All requests require your API key in the `X-API-Key` header. API key access is read-only. You can GET data but cannot POST, PUT, PATCH, or DELETE anything.

**Base URL:** `http://159.203.134.226`

> **Important:** Always use scientific name as your identifier. Common names can be shared by multiple species but scientific names are unique and will never be duplicated. All `/name/{name}` endpoints accept both common and scientific name but scientific name is strongly recommended.

> **Large response warning:** `GET /species/all-with-images` returns every species with all images nested. This can be a very large response, so only use it if you need the full dataset. For a single species use `GET /species/name/{name}/with-images` instead.

---

## Species

### Get all species

```
GET /species/all
```

Returns all species with their info and `thumbnailUrl`. The `thumbnailUrl` here is the representative photo Nathan chose for that species card, it is not a size tier.

Example response:
```json
[
  {
    "id": 122,
    "name": "Red Lacewing",
    "scientificName": "Cethosia biblis",
    "description": "A striking butterfly found across South and Southeast Asia.",
    "orderName": "Lepidoptera",
    "family": "Nymphalidae",
    "genus": "Cethosia",
    "thumbnailUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._medium.jpg",
    "attributeDef": null
  }
]
```

---

### Get species by name or scientific name

```
GET /species/name/{name}
```

Returns a single species. Works with both common name and scientific name.

Examples:
```
GET /species/name/Red Lacewing
GET /species/name/Cethosia biblis
```

Example response:
```json
{
  "id": 122,
  "name": "Red Lacewing",
  "scientificName": "Cethosia biblis",
  "description": "A butterfly found across South and Southeast Asia.",
  "orderName": "Lepidoptera",
  "family": "Nymphalidae",
  "genus": "Cethosia",
  "thumbnailUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._medium.jpg",
  "attributeDef": null
}
```

---

### Get species with all images nested

```
GET /species/name/{name}/with-images
```

Returns the species object with all its images in a nested `images` array. Works with both common and scientific name.

Examples:
```
GET /species/name/Cethosia biblis/with-images
GET /species/name/Red Lacewing/with-images
```

Example response:
```json
{
  "id": 122,
  "name": "Red Lacewing",
  "scientificName": "Cethosia biblis",
  "description": "A butterfly found across South and Southeast Asia.",
  "orderName": "Lepidoptera",
  "family": "Nymphalidae",
  "genus": "Cethosia",
  "thumbnailUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._medium.jpg",
  "attributeDef": null,
  "images": [
    {
      "id": 276,
      "xSmallUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._xsmall.jpg",
      "smallUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._small.jpg",
      "mediumUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._medium.jpg",
      "largeUrl": null,
      "originalUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._original.jpg",
      "description": null,
      "nathansNotes": null,
      "fileSizeFormatted": "2.2 MB",
      "width": 2240,
      "height": 1680,
      "dimensions": "2240×1680",
      "lifecyclestage": "adult",
      "isFeatured": true,
      "tags": [
        { "tagId": 93, "tagName": "Horizontal", "tagCategory": "Layout" },
        { "tagId": 10, "tagName": "Female", "tagCategory": "Sex" }
      ],
      "attributes": {
        "Morph": "wet season",
        "Collection Location": "Reiman Gardens, Ames IA"
      }
    }
  ]
}
```

---

### Get all species with all images nested

```
GET /species/all-with-images
```

Returns every species with all their images nested. See large response warning above.

---

### Filter species by taxonomy

```
GET /species/filter?orderName={}&family={}&genus={}
```

All parameters are optional and can be combined.

Example:
```
GET /species/filter?family=Nymphalidae
```

Example response:
```json
[
  {
    "id": 122,
    "name": "Red Lacewing",
    "scientificName": "Cethosia biblis",
    "family": "Nymphalidae",
    "thumbnailUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._medium.jpg"
  }
]
```

---

### Get filter options

```
GET /species/filter-options
```

Returns all distinct orders, families, and genera currently in the database.

Example response:
```json
{
  "orders": ["Lepidoptera"],
  "families": ["Nymphalidae", "Papilionidae"],
  "genera": ["Cethosia", "Danaus", "Papilio"]
}
```

---

## Images

### Get all images for a species

```
GET /images/species/name/{name}
```

Returns a flat array of all images for a species. Use this when you already have the species info and just need the images. Works with both common and scientific name. Featured images are returned first automatically.

Examples:
```
GET /images/species/name/Red Lacewing
GET /images/species/name/Cethosia biblis
```

Example response:
```json
[
  {
    "id": 276,
    "filename": "c95feb6d_Cethosia_biblis.jpg",
    "xSmallUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._xsmall.jpg",
    "smallUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._small.jpg",
    "mediumUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._medium.jpg",
    "largeUrl": null,
    "originalUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._original.jpg",
    "description": null,
    "nathansNotes": null,
    "fileSizeFormatted": "2.2 MB",
    "width": 2240,
    "height": 1680,
    "dimensions": "2240×1680",
    "lifecyclestage": "adult",
    "isFeatured": true,
    "tags": [
      { "tagId": 93, "tagName": "Horizontal", "tagCategory": "Layout" },
      { "tagId": 10, "tagName": "Female", "tagCategory": "Sex" }
    ],
    "attributes": {
      "Morph": "wet season",
      "Collection Location": "Reiman Gardens, Ames IA"
    }
  }
]
```

---

### Filter images within a species

```
GET /images/species/name/{name}/filter
```

Filter images within a species by tag names and featured status. Works with both common and scientific name. Featured images are returned first automatically.

Query parameters (all optional, can be combined):
- `tagNames`: comma separated tag names, returns images that have all specified tags
- `featured`: if `true`, returns Nathan's preferred image for that exact tag combination first

Examples:
```
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Open,Female
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Open,Female&featured=true
```

Example response:
```json
[
  {
    "id": 276,
    "xSmallUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._xsmall.jpg",
    "mediumUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._medium.jpg",
    "largeUrl": null,
    "originalUrl": "https://sfo3.digitaloceanspaces.com/wingspan/..._original.jpg",
    "lifecyclestage": "adult",
    "isFeatured": true,
    "tags": [
      { "tagId": 93, "tagName": "Horizontal", "tagCategory": "Layout" },
      { "tagId": 10, "tagName": "Female", "tagCategory": "Sex" }
    ],
    "attributes": {
      "Morph": "wet season",
      "Collection Location": "Reiman Gardens, Ames IA"
    }
  }
]
```

---

### Get image by ID

```
GET /images/{imageId}
```

Returns a single image by its ID.

---

## Tags

For full tag documentation and filtering examples see Tags and Filtering.

### Get all tags

```
GET /tags
```

Returns all tags in the library.

Example response (abbreviated):
```json
[
  { "tagId": 9, "tagName": "Male", "tagCategory": "Sex" },
  { "tagId": 10, "tagName": "Female", "tagCategory": "Sex" },
  { "tagId": 92, "tagName": "Vertical", "tagCategory": "Layout" },
  { "tagId": 93, "tagName": "Horizontal", "tagCategory": "Layout" },
  { "tagId": 96, "tagName": "Unknown", "tagCategory": "Sex" }
]
```

---

### Get tags by category

```
GET /tags/category/{category}
```

Returns all tags in a given category. Category names are case sensitive.

Examples:
```
GET /tags/category/Sex
GET /tags/category/Layout
GET /tags/category/Life Stage
```

Example response for `GET /tags/category/Sex`:
```json
[
  { "tagId": 9, "tagName": "Male", "tagCategory": "Sex" },
  { "tagId": 10, "tagName": "Female", "tagCategory": "Sex" },
  { "tagId": 96, "tagName": "Unknown", "tagCategory": "Sex" }
]
```

---

### Get tag by ID

```
GET /tags/{tagId}
```

Returns a single tag by its ID.

---

## Authentication Notes

```
X-API-Key: your_api_key_here
```

- API keys are read-only. Any non-GET request returns a `403` error.
- `401`: your key is missing, invalid, inactive, or expired. Check your dashboard or contact Nathan.
- `403`: you are trying something that requires admin access.
- `CORS error`: make sure you are on an allowed origin (localhost:3000, 5173, or 8080).