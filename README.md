# AI-Powered Customer Support Message Queue & Classifier

Webowa aplikacja służąca do automatyzacji obsługi klienta i weryfikacji wiadomości przy użyciu sztucznej inteligencji. System kategoryzuje przychodzące zgłoszenia, nadaje im priorytety, generuje spójne kontekstowo odpowiedzi w języku polskim oraz pozwala operatorowi na zarządzanie całą kolejką w czasie rzeczywistym.

## 🚀 Główne Funkcjonalności

*   **Inteligentna Klasyfikacja (AI):** Dedykowany endpoint API integrujący się z modelem `gpt-4o-mini`, który kategoryzuje wiadomości na: *zamówienie, pytanie, reklamacja, spam* oraz określa priorytet (*high, medium, low*).
*   **Weryfikacja w Czasie Rzeczywistym:** Panel operatora (Queue) umożliwiający natychmiastowe zatwierdzanie (`approved`), odrzucanie (`rejected`) lub edycję wersji roboczych odpowiedzi wygenerowanych przez AI.
*   **Dynamiczny Formularz Symulacji (AI-Native):** Moduł pozwalający na ręczne wprowadzanie nowych zgłoszeń dla dowolnej firmy, wywołujący asynchronicznie klasyfikację AI i natychmiastowo zasilający kolejkę bez przeładowania strony.
*   **Panel Statystyk:** Reaktywny licznik podsumowujący globalny stan zgłoszeń (Oczekujące, Zatwierdzone, Odrzucone), ułatwiający monitorowanie pracy operatora.
*   **Filtrowanie i UX:** System filtrowania zgłoszeń po kategoriach oraz pełna kontrola typów TypeScript (Strict Mode).

## 🛠️ Stack Technologiczny

*   **Framework:** Next.js 15 (App Router)
*   **Język:** TypeScript (Strict Mode)
*   **AI Integration:** OpenAI API (`gpt-4o-mini`) z wymuszonym formatowaniem struktury danych (`response_format: { type: "json_object" }`)
*   **Stylizowanie:** Tailwind CSS
*   **State Management:** React Hooks (`useState`, `useEffect` - bez zewnętrznych bibliotek)

## 🤖 Podejście AI-Native i Debugowanie

Projekt został zrealizowany w paradygmacie **AI-Native**, wykorzystując narzędzia LLM (Gemini, GitHub Copilot) do optymalizacji czasu powstawania interfejsu użytkownika. 

Kluczowym elementem projektu było przeprowadzenie rygorystycznego code review kodu generowanego przez AI. Podczas prac nad zarządzaniem stanem tablicy wykryto i ręcznie poprawiono błąd logiczny w pętli `.map()`, gdzie model zastosował tautologię (`item.id === item.id`), co powodowało globalną zmianę statusu wszystkich kart jednocześnie. Błąd został zdebugowany i naprawiony poprzez wprowadzenie poprawnego porównania identyfikatorów.

## 📦 Uruchomienie Lokalne

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/CodeWebSpirit/Mini_Panel_Weryfikacji
   cd Mini_Panel_Weryfikacji

   Zainstaluj zależności:

Bash
npm install
Skonfiguruj zmienne środowiskowe:
Utwórz plik .env.local w głównym katalogu i dodaj swój klucz API od OpenAI:

Fragment kodu
OPENAI_API_KEY=twój_klucz_api_tutaj
Uruchom serwer developerski:

Bash
npm run dev
Aplikacja będzie dostępna pod adresem: http://localhost:3000/queue
