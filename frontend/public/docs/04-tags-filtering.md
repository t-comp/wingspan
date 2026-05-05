# Tags & Filtering

Tags are how you filter images in Wingspan. Every image can have multiple tags and you can filter by any combination of them. Tags have a **name** and a **category** — categories group related tags together.

---

## Core Tags

These tags are applied to every butterfly image in Wingspan. Every image will have one tag from each of these three categories:

| Category   | Tags                       | Notes                                                    |
| ---------- | -------------------------- | -------------------------------------------------------- |
| `Position` | Wings Open, Wings Closed   | Mutually exclusive — an image will have one or the other |
| `Layout`   | Horizontal, Vertical       | Mutually exclusive — an image will have one or the other |
| `Sex`      | Male, Female, Unknown      | Mutually exclusive — an image will have one or the other |

> If the sex of the specimen cannot be determined it will be tagged `Unknown` under the `Sex` category.

---

## Other Tag Categories

Beyond the core tags, images may also have tags from these categories:

| Category                   | Examples                                              |
| -------------------------- | ----------------------------------------------------- |
| `Life Stage`               | Egg, Larva, Nymph, Pupa, Adult, Multiple Stages       |
| `Behavior`                 | Feeding, Flying, Resting, Mating, Courtship           |
| `Ecological Interaction`   | Pollination, Camouflage, Mimicry, Parasitism          |
| `View / Anatomy`           | Dorsal, Lateral, Ventral, Wing Detail, Whole Organism |
| `Developmental Context`    | Emerging, Molting, Pupating, Newly Emerged Adult      |
| `Host / Substrate`         | On Host Plant, Flower Visit, Leaf Underside, Bark     |
| `Image Quality / Technical`| Macro, Studio, Field Photo, Natural Light, Flash Used |
| `Conservation / Status`    | Native, Tropical, Invasive, Endangered, Wild Individual |
| `Special Biological Moments` | Deformity, Disease, Injury, Seasonal Morph, Gynandromorph |
| `Image Use / Management`   | Educational Program, Marketing, Social Media Ready    |
| `Layout`                   | Horizontal, Vertical                                  |

> **Note on `lifecyclestage`:** Images have a separate `lifecyclestage` field (e.g. "adult") that is distinct from Life Stage tags. The field is set directly on the image — the Life Stage tags are additional optional metadata.

Call `GET /tags` to see the full current list of all tags in the library.

---

## Browsing Available Tags

```
GET /tags
```

Returns all tags. Use this to see what is available before building filter logic.

```
GET /tags/category/Position
GET /tags/category/Sex
GET /tags/category/Layout
```

Returns all tags in a specific category. Category names are case sensitive — use them exactly as shown above.

---

## Filtering Images by Tags

Use the filter endpoint to get images for a species that have specific tags. Pass tag names as a comma-separated list. The endpoint returns images that have **all** of the specified tags.

Always filter using `tagNames` — tag names are stable and human readable.

```
GET /images/species/name/{name}/filter?tagNames=Wings Open,Female
```

**Example — get all Wings Open Female images for Red Lacewing:**
```
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Open,Female
```

**Example response:**
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
      { "tagId": 92, "tagName": "Vertical", "tagCategory": "Layout" },
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

## The Featured Image System

Nathan can mark one image as the **preferred shot** per species per tag combination. Adding `&featured=true` to your filter request returns that preferred image first. If no image is marked featured for that combination it falls back to the first matching image automatically.

```
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Open,Female&featured=true
```

This means if Nathan swaps out the preferred photo your app automatically gets the new one on the next request — no code changes needed on your end.

The `isFeatured` field on each image object tells you whether that image is currently the featured one for its tag combination.

> **Note:** All image endpoints automatically return featured images first even without the filter. The `&featured=true` param is most useful when you are filtering by specific tags and want Nathan's preferred shot for that exact combination.

---

## Common Filtering Patterns

**All images for a species, no filter:**
```
GET /images/species/name/Cethosia biblis
```

**Wings Open images only:**
```
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Open
```

**Featured Wings Open Female shot (Nathan's pick):**
```
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Open,Female&featured=true
```

**All Horizontal Adult images:**
```
GET /images/species/name/Cethosia biblis/filter?tagNames=Horizontal,Adult
```

**Wings Closed Male shot:**
```
GET /images/species/name/Cethosia biblis/filter?tagNames=Wings Closed,Male&featured=true
```