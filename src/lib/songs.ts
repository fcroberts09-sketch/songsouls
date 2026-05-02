/**
 * Public song library. Edit this file to add your own finished songs.
 *
 * To add a song:
 *   1. Drop the MP3 in /public/songs/
 *   2. Drop the cover image in /public/images/ (1:1 ratio, ~1200x1200)
 *   3. Add an entry below
 *
 * That's the entire content management system for the showcase.
 */

import type { ShowcaseSong } from "@/types/song";

export const SHOWCASE_SONGS: ShowcaseSong[] = [
  {
    slug: "the-light-she-left",
    title: "The Light She Left",
    dedication: "For my grandmother, Rose — 1932–2024",
    genre: "In Memory",
    duration: "3:42",
    tier: "curated",
    addedAt: "2025-09-12",
    audioUrl: "/songs/the-light-she-left.mp3",
    coverImage: "/images/the-light-she-left.jpg",
    coverGradient: "from-indigo-500/40 via-purple-700/30 to-rose-500/30",
    story:
      "Rose taught me how to make her bread, how to argue without losing love, and how to listen to a room before you walk into it. I wrote this for my mother on the first Christmas without her — to play on the speaker while we cooked, so the house wouldn't feel so quiet.",
    lyrics: `She left a window open,
the kind that lets the morning in.
Bread on the counter, flour on her hands,
the radio singing to no one again.

She left her laugh in the corner of the room
where the photographs lean,
she left her stubborn way of loving us
even when we couldn't be seen.

[Chorus]
And I carry the light she left.
I carry the light she left.
Some things don't end, they only soften,
they only soften and stay.

She left her recipe in the margins,
the kind that says "a little more."
She left the way she'd hum on Sundays
and she left the open door.

I still set the table for one too many,
I still hear her in the rain.
She left the kind of love that doesn't leave —
it just learns another name.`,
    recipientQuote:
      "I cried for an hour. Then I played it for the whole family on Christmas morning. It's like she was in the room.",
    recipientQuoteAuthor: "Mom",
  },
  {
    slug: "ten-thousand-tuesdays",
    title: "Ten Thousand Tuesdays",
    dedication: "For Sam — 25 years and counting",
    genre: "For My Person",
    duration: "3:18",
    tier: "ai-crafted",
    addedAt: "2025-08-04",
    audioUrl: "/songs/ten-thousand-tuesdays.mp3",
    coverGradient: "from-rose-400/40 via-pink-500/30 to-amber-400/30",
    story:
      "We didn't write this for our wedding. We wrote it for the Tuesday after. The point of being chosen by someone is the ordinary days they choose you again, in the kitchen, in the small things.",
    lyrics: `It's Tuesday and you're making coffee,
two sugars, the way you've always known.
The kettle hums a quiet question,
and you answer it, like you do, alone.

I'm watching from the doorway like a stranger,
the lucky kind, the kind that gets to stay.
You don't know I'm here yet, and that's the magic —
this is the part of love nobody writes about.

[Chorus]
Ten thousand Tuesdays, give or take a few,
ten thousand reasons I keep choosing you.
Not the holidays, not the shining hours,
just the kitchen light, the kettle, and the quiet, and you.`,
  },
  {
    slug: "the-letter-i-never-sent",
    title: "The Letter I Never Sent",
    dedication: "For my father — for both of us",
    genre: "The Letter",
    duration: "4:03",
    tier: "curated",
    addedAt: "2025-07-19",
    audioUrl: "/songs/the-letter-i-never-sent.mp3",
    coverGradient: "from-orange-500/40 via-rose-700/30 to-ink-900",
    story:
      "I wrote this song instead of calling him for ten years. Then I called him. We listened to it together over the phone. It was the longest conversation we'd had since I was sixteen.",
    lyrics: `I wrote you letters I would never send,
left them in drawers like coats I outgrew.
Some of them angry, some of them tender,
all of them honest, all of them true.

I'm not asking for the years back —
the years took what they needed to take.
I'm asking if there's room in the small time left
for both of us to be a little less afraid.

[Chorus]
Here is the letter I never sent,
folded into a melody I didn't mean to write.
If you're listening, dad, the door is open.
If you're listening — I'm still your son tonight.`,
    recipientQuote: "He played it on speaker. I heard him cry. I'd never heard him cry.",
    recipientQuoteAuthor: "Anonymous",
  },
  {
    slug: "the-version-of-me-at-seven",
    title: "The Version of Me at Seven",
    dedication: "For the girl I used to be",
    genre: "For the Inner Self",
    duration: "3:51",
    tier: "curated",
    addedAt: "2025-06-02",
    audioUrl: "/songs/the-version-of-me-at-seven.mp3",
    coverGradient: "from-purple-500/40 via-indigo-600/30 to-ink-900",
    story:
      "My therapist suggested I write a letter to seven-year-old me. I asked SongSouls to turn it into a song instead. I listen to it on the drive home from sessions. It's mine and hers.",
    lyrics: `Hey little one, with the bangs you cut yourself,
with the pockets full of acorns and the bruise on your knee —
I came back to tell you what I know now.
Most of it is good news, even the part that wasn't.

You weren't wrong about the way the kitchen felt.
You weren't wrong to hide inside the closet of your books.
The grown-ups got it backwards — you were never the loud one.
You were the listening one. That's what I want you to know.

[Chorus]
You made it. You made it. You made it.
The world got a little softer, and so did you.
There's a window in our kitchen now and a dog who loves us,
and on the hardest days, I still hear you cheering us through.`,
  },
  {
    slug: "to-the-boy-with-my-name",
    title: "To the Boy With My Name",
    dedication: "For Eli, on his eighth birthday",
    genre: "Parent & Child",
    duration: "3:09",
    tier: "ai-crafted",
    addedAt: "2025-05-21",
    audioUrl: "/songs/to-the-boy-with-my-name.mp3",
    coverGradient: "from-amber-400/40 via-orange-500/30 to-rose-500/30",
    story:
      "I wanted Eli to have something from me he could play whenever he needed it. Not a video, not a card — a song he could carry into the rest of his life.",
    lyrics: `You're eight today, and you build whole worlds out of cardboard,
and you ask me questions I am not equipped to answer.
You laugh like your grandfather, the one you never met,
and you cry the way I do, in the bathroom, quietly.

I won't be the man who tells you who to be —
I'll be the man who keeps the porch light on.
However far you wander, however late you come back,
the porch light is on. The porch light is on.

[Chorus]
You'll be okay. You'll be okay.
And on the days you aren't —
the porch light is on, my boy,
the porch light is on.`,
  },
  {
    slug: "the-friday-girls",
    title: "The Friday Girls",
    dedication: "For Maya, Jess, and Priya — twenty years",
    genre: "For My People",
    duration: "3:27",
    tier: "ai-crafted",
    addedAt: "2025-04-08",
    audioUrl: "/songs/the-friday-girls.mp3",
    coverGradient: "from-emerald-400/40 via-sky-500/30 to-purple-500/30",
    story:
      "We've been the Friday girls since college. One song for twenty years of holding each other up. We played it at Maya's wedding instead of the bridesmaids' speech.",
    lyrics: `It's been twenty years of Friday nights,
twenty years of the same booth in the back.
We have outlived our boyfriends and our haircuts,
and the version of ourselves who thought we knew.

We have been each other's bridesmaids,
each other's emergency contacts, each other's homes.
There is a version of me that doesn't exist without you.
There is a version of you I helped you build.

[Chorus]
To the Friday girls, to the Friday girls,
to the women who stayed when nobody had to stay.
We're going to be old together,
we're going to be loud together,
and we're going to keep showing up on Fridays anyway.`,
  },
];

export function getShowcaseSong(slug: string): ShowcaseSong | undefined {
  return SHOWCASE_SONGS.find((s) => s.slug === slug);
}
