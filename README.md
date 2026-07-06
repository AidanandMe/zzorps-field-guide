# Zzorp’s Field Guide

**Zzorp’s Field Guide** is a child-friendly AI observation agent built for the Kaggle 5-Day AI Agents Intensive Capstone with Google.

The project invites children to enter the **Observation Lab**, where Zzorp, a curious alien explorer, helps them notice human behaviour, ask one safety-aware follow-up question, generate a playful Field Guide report, create a comic mission, and export an Explorer Dossier.

The educational goal is to help children understand the difference between:

- what they observed,
- what they think it might mean,
- and what kind question they could ask next.

The public version can run in **mock mode** without exposing a Gemini API key. The architecture also supports Gemini through an environment variable for local testing or a future secured backend deployment.

## Main feature: Observation Lab

The main capstone feature is the **Zzorp Observation Agent**.

The agentic loop is:

1. Child enters a human behaviour they noticed.
2. Zzorp checks the input for safety and privacy.
3. Zzorp asks one adaptive follow-up question.
4. The child answers.
5. Zzorp generates a structured Field Guide report.
6. The report becomes a comic mission.
7. The child can sketch evidence and export a self-contained dossier.

## Why it matters

Zzorp’s Field Guide uses AI not simply to answer children, but to help them slow down, observe carefully, avoid assumptions, and practise kind curiosity.

## Running locally

Install dependencies with `npm install`.

Start the app with `npm run dev`.

Build the app with `npm run build`.



It is a playful prototype, but it explores a serious question:

**Can AI agents help children become more thoughtful, empathetic observers of the human world?**


