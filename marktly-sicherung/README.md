# Marktly – Shop-Admin (erste Backend-Ausbaustufe)

Dieses Projekt ersetzt die bisherige reine Demo-Verkaufsverwaltung durch einen geschützten Admin-Bereich mit Supabase.

## Enthalten
- Admin-Login mit Supabase Auth
- Admin-Freigabe über `profiles.is_admin`
- Produkte anlegen, bearbeiten, ausblenden und löschen
- Produktbilder in Supabase Storage hochladen
- Verkaufspreis, Einkaufspreis und Lagerbestand verwalten
- Bestellungen einsehen
- Dashboard: bezahlter Bruttoumsatz und geschätzter Rohertrag

## Noch nicht live / noch nicht enthalten
- Kunden-Shop und öffentlicher Checkout
- echte Zahlungsabwicklung / Stripe / PayPal
- automatische Erstellung und Aktualisierung von Bestellungen durch Zahlungs-Webhooks
- Versandlabels, Retouren und Steuern
- vollständige Gewinnrechnung (Gebühren, Versand, Verpackung, Steuern etc.)

Die Umsatz- und Gewinnkarten bleiben ohne echte bezahlte Bestellungen bei 0 €. Keine Demo-Zahlen werden als echte Umsätze ausgegeben.

## 1. Supabase einrichten
1. Ein Supabase-Projekt erstellen.
2. `supabase/schema.sql` im Supabase SQL Editor öffnen und vollständig ausführen.
3. Unter Authentication einen Benutzer für dich anlegen.
4. Unter Authentication / Users deine User-UUID kopieren.
5. In SQL Editor diese Zeile mit deiner UUID ausführen:
   `insert into public.profiles (id, is_admin) values ('DEINE-UUID', true) on conflict (id) do update set is_admin = true;`
6. Unter Project Settings / API die Project URL und den anon/public key kopieren.

## 2. Codespaces konfigurieren
Im Stammordner (dort, wo package.json liegt) eine Datei `.env` erstellen:
```
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=DEIN_PUBLIC_ANON_KEY
```
Nur den anon/public key verwenden. NIEMALS den `service_role` key in eine VITE_-Variable oder in den Browser-Code schreiben.

## 3. Starten
```
npm install
npm run dev -- --host 0.0.0.0
```
Bei Änderungen an `.env` den Entwicklungsserver stoppen (Ctrl+C) und neu starten.

## 4. Wichtig zur Gewinnberechnung
Das Dashboard berechnet aktuell:
- Bruttoumsatz = Summe der bezahlten Bestellungen
- geschätzter Rohertrag = Bruttoumsatz minus gespeicherte Einkaufskosten der verkauften Artikel

Noch nicht berücksichtigt: Zahlungsgebühren, Versand, Verpackung, Retouren, Steuern, Werbung und sonstige Kosten. Der angezeigte Rohertrag ist daher kein steuerlicher oder endgültiger Nettogewinn.

## 5. Zahlungen
Zahlungsarten wie Visa, Mastercard, PayPal, Apple Pay, Google Pay, Klarna oder SEPA müssen im nächsten Schritt über Zahlungsanbieter eingerichtet und im Anbieter-Dashboard für dein Geschäft freigeschaltet werden. Die Dateien in diesem Projekt führen noch keine echten Zahlungen aus.
