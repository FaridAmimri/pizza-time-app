/**
 * Seul fichier qui parle à Claude. Pour changer de modèle : variable ANTHROPIC_MODEL.
 * On fournit un "outil" dont le schéma est celui de ExtractionSchema et on demande à Claude de l'appeler.
 * (tool_choice forcé non supporté par ce modèle.)
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { formatHM, versMinutes } from "@/domain/calculs";
import { ExtractionSchema, type Extraction } from "@/domain/types";
import { PROMPT_SYSTEME } from "./prompt";

const MODELE = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

function schemaOutil(): Anthropic.Tool.InputSchema {
  const { $schema: _ignore, ...schema } = z.toJSONSchema(ExtractionSchema) as Record<string, unknown>;
  return schema as Anthropic.Tool.InputSchema;
}

/** "9:30" -> "09:30" ; valeur invalide -> null */
function normaliserHeure(h: string | null): string | null {
  const m = versMinutes(h);
  return m === null ? null : formatHM(m);
}

/** Plan B : si Claude répond en texte, on récupère le JSON qu'il contient. */
function jsonDansTexte(texte: string): unknown | null {
  const debut = texte.indexOf("{");
  const fin = texte.lastIndexOf("}");
  if (debut === -1 || fin <= debut) return null;
  try {
    return JSON.parse(texte.slice(debut, fin + 1));
  } catch {
    return null;
  }
}

export async function extraireFiche(imageBase64: string, mediaType: "image/jpeg" | "image/png" | "image/webp"): Promise<Extraction> {
  const client = new Anthropic(); // lit ANTHROPIC_API_KEY
  const reponse = await client.messages.create({
    model: MODELE,
    max_tokens: 16000,
    system: PROMPT_SYSTEME,
    tools: [
      {
        name: "enregistrer_fiche",
        description: "Enregistre les données lues sur la fiche journalière.",
        input_schema: schemaOutil(),
      },
    ],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: "Lis cette fiche journalière puis appelle l'outil enregistrer_fiche avec toutes les données lues. Réponds uniquement par cet appel d'outil.",
          },
        ],
      },
    ],
  });

  const bloc = reponse.content.find((b) => b.type === "tool_use");
  let brut: unknown = bloc && bloc.type === "tool_use" ? bloc.input : null;

  if (!brut) {
    const texte = reponse.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
    console.error("Pas d'appel d'outil. stop_reason =", reponse.stop_reason);
    console.error("Types de blocs reçus :", reponse.content.map((b) => b.type).join(", "));
    console.error("Début du texte reçu :", texte.slice(0, 800));
    brut = jsonDansTexte(texte);
  }

  if (!brut) {
    throw new Error(`Aucune donnée extraite de la photo (stop_reason: ${reponse.stop_reason}).`);
  }

  const data = ExtractionSchema.parse(brut);
  data.employes = data.employes.map((e) => ({
    ...e,
    matin: { da: normaliserHeure(e.matin.da), fs: normaliserHeure(e.matin.fs) },
    soir: { da: normaliserHeure(e.soir.da), fs: normaliserHeure(e.soir.fs) },
  }));
  return data;
}