# Image Sizing

When Nathan uploads a photo to Wingspan, the system automatically generates up to four resized versions and stores each one separately. You should not have to resize images yourself, please pick the size that fits your use case from the API response.

---

## Size Tiers

Every image response includes these URL fields:

| Field | Width | Use For |
| --- | --- | --- |
| `xSmallUrl` | 300px | Gallery grids, cards, showing many images at once |
| `smallUrl` | 800px | Mobile displays, sidebars, smaller contexts |
| `mediumUrl` | 1024px | Default display, never null |
| `largeUrl` | 2048px | High resolution detail view |
| `originalUrl` | Original | Nathan's untouched upload, never null |


Not every image will have every size. Smaller uploads may only have `xSmallUrl` and the original. Any size that could not be generated will come back as `null`. Always check before using a URL. `mediumUrl` and `originalUrl` will never be null.

---

## The Species Object

When you call any species endpoint you get back a species object with these fields:

| Field | Description |
| --- | --- |
| `id` | Internal database ID, do not use this as your identifier |
| `name` | Common name e.g. "Red Lacewing" |
| `scientificName` | Scientific name, use this as your identifier |
| `description` | Description of the species if set |
| `orderName` | Taxonomic order |
| `family` | Taxonomic family |
| `genus` | Taxonomic genus |
| `thumbnailUrl` | The representative photo Nathan picked for this species which is used for our gallery cards. This is not a size tier, it is a single chosen photo URL. May be null if Nathan has not set one. |
| `attributeDef` | Map of custom attribute definitions Nathan has set for this species. May be null. |

> **Note on `nathansNotes`:** This field is displayed as "Notes" in the Wingspan frontend app. In the API response it is returned as `nathansNotes`.


---

## The Image Object

When you call any image endpoint you get back image objects with these fields:

| Field | Description |
| --- | --- |
| `id` | Internal image ID |
| `filename` | Original filename |
| `xSmallUrl` | 300px resized version. May be null. |
| `smallUrl` | 800px resized version. May be null. |
| `mediumUrl` | 1024px resized version, never null. |
| `largeUrl` | 2048px resized version. May be null. |
| `originalUrl` | Nathan's untouched original, never null. |
| `description` | Image description if set. May be null. |
| `nathansNotes` | Nathan's notes on the image. Displayed as "Notes" in the app. May be null. |
| `fileSizeFormatted` | File size e.g. "2.2 MB" |
| `width` | Raw pixel width |
| `height` | Raw pixel height |
| `dimensions` | Formatted string e.g. "2240×1680" |
| `lifecyclestage` | Life stage of the specimen e.g. "adult". This is a direct field on the image, separate from tags. May be null. |
| `isFeatured` | Whether Nathan has marked this as the preferred shot for its tag combination |
| `tags` | Array of tag objects, each with `tagId`, `tagName`, and `tagCategory` |
| `attributes` | Map of custom key-value pairs Nathan has set e.g. Morph, Collection Location. May be null. |

> **Note on `thumbnailUrl` vs `xSmallUrl`:** These are different things. `thumbnailUrl` on a species object is the single representative photo Nathan chose for that species card in the Wingspan application. `xSmallUrl` on an image object is the 300px resized version of that specific photo. Do not confuse them.

---

