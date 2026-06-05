## Krok 3 — co zrobiłem/am i dlaczegonpx tsc --noEmit
Zaimplementowałem zintegrowany panel symulacji ruchu, składający się z formularza ręcznego dodawania wiadomości oraz dynamicznego licznika statystyk (Oczekujące, Zatwierdzone, Odrzucone). Wybrałem to rozwiązanie, ponieważ pozwala ono na pełne przetestowanie endpointu /api/classify bezpośrednio z poziomu interfejsu (End-to-End). Operator widzi natychmiastową reakcję systemu: nowo sklasyfikowana przez AI wiadomość trafia na początek kolejki, a licznik statystyk automatycznie i reaktywnie aktualizuje globalny stan aplikacji bez przeładowania strony.

## AI — jak używałem/am narzędzi
- **Narzędzia:** Gemini (wersja przeglądarkowa do architektury logiki) oraz Visual Studio Code Copilot (do szybkiego generowania warstwy UI).
- **Prompt który zadziałał najlepiej:**
  > "Wygeneruj dla mnie komponent formularza w Next.js (Tailwind), który pozwala dodać nową wiadomość do weryfikacji. Formularz ma zawierać: input dla 'Nazwa firmy', textarea dla 'Treść wiadomości' oraz przycisk 'Analizuj przez AI'. Obsłuż lokalny stan ładowania (loading) podczas wysyłania zapytania. Po wysłaniu formularza zrób asynchroniczny fetch POST do /api/classify z przekazanym obiektem { message, company }. Otrzymany z API wynik (category, priority, draft_reply, confidence) połącz z nowym ID oraz statusem 'pending', a następnie przekaż do mojej głównej funkcji handleAddMessage(newMessage)."

- **Gdzie AI się pomylił/a i co poprawiłem/am ręcznie:**
  Najbardziej kluczowy błąd AI (Gemini) pojawił się przy generowaniu logiki aktualizacji stanu kolejki po prompcie: *"Zaimplementuj funkcję handleAction, która przyjmuje id i action (MessageStatus). Użyj setItems z funkcją map(), aby zmienić status elementu."*
  
  Model wygenerował poprawną strukturę funkcji, ale wewnątrz metody `.map()` zastosował błędny warunek logiczny (tautologię): `item.id === item.id` zamiast porównać identyfikator z parametrem funkcji (`item.id === id`). Przez to każda podjęta w interfejsie akcja (zatwierdzenie, odrzucenie) modyfikowała jednocześnie **całą tablicę stanów** i zmieniała status wszystkich wiadomości w kolejce na raz. Przeanalizowałem zachowanie komponentu, zlokalizowałem błąd w pętli i poprawiłem warunek na poprawny, co przywróciło niezależne działanie każdej karty.

- **Szacowany udział AI w kodzie:** ok. 75% wygenerowane (głównie powtarzalny kod UI Tailwind i szkielety funkcji), 25% napisane i zdebugowane ręcznie (poprawa logiki stanów Reacta, walidacja i integracja komponentów).