# Wedding Invitation Website

Open `index.html` in a browser or upload the whole `outputs` folder to any static host.

## Edit details

All names, date, time, venue, map link, invitation text, share preview, photos, and music are editable in `config.js`.

## Add your media

- Put couple photos in `assets/photos/`.
- Put music in `assets/music/`.
- Update `config.js`:

```js
assets: {
  cover: "assets/photos/cover.jpg",
  music: "assets/music/song.mp3",
  photos: [
    "assets/photos/photo-1.jpg",
    "assets/photos/photo-2.jpg",
    "assets/photos/photo-3.jpg"
  ]
}
```

For WhatsApp preview, host the site online and change `share.image` to a fully qualified image URL from the same hosted site.
