Sprint 5C Delta

What you get
- Radix Toast provider (Toasts.tsx)
- Event bus (signals.ts)
- Fame/Popularity bump logic from outcome tags (fame.ts)
- Result chips (Responsiveness, Riposte, Flair)
- CharacterPage full page
- RosterTable with flair chip, fame/pop color scales and deep links
- Minimal RunRoundPanel wired to signals + toast

How to install
1) Unzip this into your existing project root (merges /src).
2) Ensure these deps exist:
   npm i @radix-ui/react-toast react-router-dom
3) Wrap your app with <DMToastProvider> once, near the root.
4) Use <RunRoundPanel simulate={...}/> and call it from your sim pass-through.
