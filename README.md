# Haushaltsbuch – Web-App

Ein einfacher Ausgaben-/Einnahmen-Tracker als Webseite: Login mit E-Mail/Passwort,
Buchungen erfassen, Dashboard mit Kennzahlen und Diagrammen. Läuft komplett im
Browser (HTML/CSS/JavaScript) und speichert die Daten in einer kostenlosen
Supabase-Datenbank – dadurch siehst du auf jedem Gerät dieselben Buchungen.

## 1. Supabase-Projekt anlegen (kostenlos)

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto.
2. Klicke auf **"New project"**, vergib einen Namen (z. B. `haushaltsbuch`) und ein
   Datenbank-Passwort (merken/aufschreiben, wird nicht mehr für die App benötigt).
3. Warte, bis das Projekt fertig eingerichtet ist (ca. 1–2 Minuten).

## 2. Datenbank-Tabelle anlegen

1. Öffne im Supabase-Dashboard links **"SQL Editor"** → **"New query"**.
2. Kopiere den kompletten Inhalt von [`supabase/schema.sql`](supabase/schema.sql)
   hinein und klicke auf **"Run"**.
3. Das legt die Tabelle `transactions` an – inklusive Regeln, dass jede*r Nutzer*in
   nur die eigenen Buchungen sehen kann.

## 3. E-Mail-Login aktivieren

Unter **Authentication → Providers** ist "Email" bei neuen Supabase-Projekten
standardmäßig aktiviert – hier ist nichts weiter zu tun. Falls du willst, dass du
dich sofort nach dem Registrieren einloggen kannst (ohne Bestätigungs-E-Mail),
kannst du unter **Authentication → Settings** die Option **"Confirm email"**
deaktivieren (praktisch für den privaten Gebrauch).

## 4. API-Zugangsdaten eintragen

1. Gehe zu **Project Settings → API**.
2. Kopiere die **Project URL** und den **anon public** Key.
3. Öffne [`js/config.js`](js/config.js) in diesem Projekt und trage beide Werte ein:

```js
const SUPABASE_URL = "https://dein-projekt.supabase.co";
const SUPABASE_ANON_KEY = "dein-anon-key";
```

> Der `anon`-Key ist bewusst öffentlich im Frontend-Code sichtbar – das ist bei
> Supabase so vorgesehen. Der eigentliche Schutz kommt von den Row-Level-Security-
> Regeln aus Schritt 2, nicht von der Geheimhaltung dieses Keys.

## 5. Auf GitHub hochladen und mit GitHub Pages hosten

1. Erstelle auf [github.com](https://github.com) ein neues Repository (z. B.
   `haushaltsbuch`), öffentlich oder privat (öffentlich ist für GitHub Pages
   im kostenlosen Plan nötig, außer du hast GitHub Pro).
2. Lade den kompletten Inhalt dieses Ordners in das Repository hoch (per
   GitHub-Weboberfläche "Add file → Upload files", oder per `git`):

   ```bash
   cd haushaltsbuch-app
   git init
   git add .
   git commit -m "Erste Version Haushaltsbuch"
   git branch -M main
   git remote add origin https://github.com/DEIN-NUTZERNAME/haushaltsbuch.git
   git push -u origin main
   ```

3. Im Repository: **Settings → Pages** → unter "Source" den Branch `main` und
   Ordner `/ (root)` auswählen → **Save**.
4. Nach ein bis zwei Minuten ist die App erreichbar unter:
   `https://DEIN-NUTZERNAME.github.io/haushaltsbuch/`

## 6. Nutzen

1. Öffne die URL auf einem beliebigen Gerät.
2. Klicke auf **"Registrieren"**, gib eine E-Mail und ein Passwort ein (einmalig).
3. Ab sofort auf jedem Gerät mit **"Anmelden"** einloggen – alle Buchungen sind
   sofort überall sichtbar, da sie zentral in Supabase gespeichert werden.

## Kategorien anpassen

Die Kategorien stehen ganz oben in [`js/app.js`](js/app.js) im Array `CATEGORIES`.
Jede Kategorie hat einen Namen, einen `type` (`Einnahme`/`Ausgabe`) und eine
`klasse` (`Einnahme`/`Fix`/`Variabel`). Einfach Zeilen ergänzen, ändern oder
entfernen – keine Datenbankänderung nötig.

## Kosten

Sowohl Supabase (Free-Tier: 500 MB Datenbank, unbegrenzte API-Requests im
üblichen Rahmen) als auch GitHub Pages sind für dieses Nutzungsvolumen
kostenlos.

## Grenzen dieser ersten Version

Diese Version ist bewusst als schlankes Grundgerüst gebaut (wie besprochen):
Buchungen erfassen/löschen, Monats-KPIs, ein Kategorie- und ein 6-Monats-Diagramm.
Was aus der Excel-Vorlage noch fehlt und bei Bedarf ergänzt werden kann:
Jahresübersicht, Fix-/Variabel-Aufschlüsselung im Dashboard, Bearbeiten
bestehender Buchungen, CSV-Export. Sag einfach Bescheid, was als Nächstes dran soll.
# haushaltsbuch
# haushaltsbuch
