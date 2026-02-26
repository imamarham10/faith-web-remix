import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("about", "routes/about.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("contact", "routes/contact.tsx"),
  index("routes/home.tsx"),
  route("calendar", "routes/calendar.tsx"),
  route("prayers", "routes/prayers.tsx"),
  route("quran", "routes/quran.tsx"),
  route("quran/bookmarks", "routes/quran.bookmarks.tsx"),
  route("quran/:surahId", "routes/quran.$surahId.tsx"),
  route("qibla", "routes/qibla.tsx"),
  route("dhikr", "routes/dhikr.tsx"),
  route("names", "routes/names.tsx"),
  route("names/muhammad", "routes/names.muhammad.tsx"),
  route("feelings", "routes/feelings.tsx"),
  route("feelings/:slug", "routes/feelings.detail.tsx"),
  route("duas", "routes/duas.tsx"),
  route("duas/:id", "routes/duas.$id.tsx"),
  route("settings", "routes/settings.tsx"),
  route("auth", "routes/auth.tsx", [
    route("login", "routes/auth.login.tsx"),
    route("register", "routes/auth.register.tsx"),
  ]),
] satisfies RouteConfig;
