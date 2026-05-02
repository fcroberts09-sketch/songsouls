# Songs

Drop your finished MP3s in this folder. Reference them from `src/lib/songs.ts` like:

```ts
audioUrl: "/songs/your-song.mp3"
```

The audio player on `/songs/[slug]` will automatically play them.

> Tip: keep file sizes small (encode at 128–192 kbps VBR) so the page loads fast.
