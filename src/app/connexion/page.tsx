"use client";

import { useState } from "react";

export default function PageConnexion() {
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const rep = await fetch("/api/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motDePasse }),
    });
    if (!rep.ok) {
      setErreur((await rep.json().catch(() => null))?.erreur ?? "Connexion impossible.");
      setEnvoi(false);
      return;
    }
    // On ne suit que des chemins du site (jamais une adresse extérieure).
    const suite = new URLSearchParams(window.location.search).get("suite") ?? "/";
    window.location.href = suite.startsWith("/") && !suite.startsWith("//") ? suite : "/";
  }

  return (
    <form className="capture" onSubmit={valider}>
      <h1>Accès à l'application</h1>
      <p className="intro">Saisissez le code d'accès qui vous a été communiqué.</p>
      {erreur && (
        <p className="alerte" role="alert">
          {erreur}
        </p>
      )}
      <div className="champ">
        <label htmlFor="code">Code d'accès</label>
        <input id="code" type="password" autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoFocus />
      </div>
      <div className="actions">
        <button className="bouton" type="submit" disabled={envoi || !motDePasse}>
          {envoi ? "Vérification…" : "Entrer"}
        </button>
      </div>
    </form>
  );
}
