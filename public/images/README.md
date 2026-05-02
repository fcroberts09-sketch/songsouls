# Cover images

Drop song cover art in this folder. Square (1:1) images at ~1200×1200 work best.

Reference them from `src/lib/songs.ts`:

```ts
coverImage: "/images/your-song.jpg"
```

If you don't supply a cover image, the showcase will fall back to a gradient — set `coverGradient` in the song entry to control the colors.
