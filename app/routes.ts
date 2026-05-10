import { type RouteConfig, index, route } from "@react-router/dev/routes";

const REDIRECT = "routes/redirect-to-islam.tsx";

export default [
  // Static / faith-neutral
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("about", "routes/about.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("contact", "routes/contact.tsx"),
  index("routes/home.tsx"),
  route("subscribe", "routes/subscribe.tsx"),
  route("settings", "routes/settings.tsx"),

  // Auth
  route("auth", "routes/auth.tsx", [
    route("login", "routes/auth.login.tsx"),
    route("register", "routes/auth.register.tsx"),
  ]),

  // Faith: Islam
  route("islam", "routes/islam.tsx"),
  route("islam/calendar", "routes/calendar.tsx"),
  route("islam/prayers", "routes/prayers.tsx"),
  route("islam/quran", "routes/quran.tsx"),
  route("islam/quran/bookmarks", "routes/quran.bookmarks.tsx"),
  route("islam/quran/:surahId", "routes/quran.$surahId.tsx"),
  route("islam/qibla", "routes/qibla.tsx"),
  route("islam/dhikr", "routes/dhikr.tsx"),
  route("islam/names", "routes/names.tsx"),
  route("islam/names/muhammad", "routes/names.muhammad.tsx"),
  route("islam/feelings", "routes/feelings.tsx"),
  route("islam/feelings/:slug", "routes/feelings.detail.tsx"),
  route("islam/duas", "routes/duas.tsx"),
  route("islam/duas/:id", "routes/duas.$id.tsx"),
  route("islam/hadiths", "routes/hadiths.tsx"),
  route("islam/hadiths/:hadithId", "routes/hadiths.$hadithId.tsx"),

  // Faith: Hindu
  route("hindu", "routes/hindu.tsx"),
  route("hindu/puja-times", "routes/hindu.puja-times.tsx"),
  route("hindu/scriptures", "routes/hindu.scriptures.tsx"),
  route("hindu/japa", "routes/hindu.japa.tsx"),
  route("hindu/panchang", "routes/hindu.panchang.tsx"),
  route("hindu/stotras", "routes/hindu.stotras.tsx"),
  route("hindu/temples", "routes/hindu.temples.tsx"),
  route("hindu/feelings", "routes/hindu.feelings.tsx"),
  route("hindu/stories", "routes/hindu.stories.tsx"),

  // 301 redirects from old top-level Islamic paths -> /islam/*
  route("calendar", REDIRECT, { id: "redir-calendar" }),
  route("prayers", REDIRECT, { id: "redir-prayers" }),
  route("quran", REDIRECT, { id: "redir-quran" }),
  route("quran/bookmarks", REDIRECT, { id: "redir-quran-bookmarks" }),
  route("quran/:surahId", REDIRECT, { id: "redir-quran-surah" }),
  route("qibla", REDIRECT, { id: "redir-qibla" }),
  route("dhikr", REDIRECT, { id: "redir-dhikr" }),
  route("names", REDIRECT, { id: "redir-names" }),
  route("names/muhammad", REDIRECT, { id: "redir-names-muhammad" }),
  route("feelings", REDIRECT, { id: "redir-feelings" }),
  route("feelings/:slug", REDIRECT, { id: "redir-feelings-slug" }),
  route("duas", REDIRECT, { id: "redir-duas" }),
  route("duas/:id", REDIRECT, { id: "redir-duas-id" }),
  route("hadiths", REDIRECT, { id: "redir-hadiths" }),
  route("hadiths/:hadithId", REDIRECT, { id: "redir-hadiths-id" }),
] satisfies RouteConfig;
