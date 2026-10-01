/** @format */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FicheForm } from '@/components/FicheForm'
import { ficheVide, nettoyerFiche } from '@/domain/fiche-vide'
import type { Fiche } from '@/domain/types'
import { dateFr } from '@/lib/format'
import { compresserImage } from '@/lib/image'

type Etat =
  | { etape: 'capture'; erreur?: string }
  | { etape: 'lecture' }
  | {
      etape: 'verification'
      fiche: Fiche
      doutes: string[]
      apercu?: string
      photo?: string
      erreur?: string
    }
  | { etape: 'enregistre'; date: string }

export default function PageScan() {
  const [etat, setEtat] = useState<Etat>({ etape: 'capture' })

  async function surPhoto(fichier: File) {
    setEtat({ etape: 'lecture' })
    try {
      const img = await compresserImage(fichier)
      const rep = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img.base64, mediaType: img.mediaType })
      })
      const data = await rep.json()
      if (!rep.ok) throw new Error(data.erreur)
      const { doutes, ...fiche } = data
      setEtat({
        etape: 'verification',
        fiche,
        doutes,
        apercu: img.apercu,
        photo: img.base64
      })
    } catch (e) {
      setEtat({
        etape: 'capture',
        erreur: e instanceof Error ? e.message : "La fiche n'a pas pu être lue."
      })
    }
  }

  async function enregistrer(fiche: Fiche, photo?: string) {
    const rep = await fetch('/api/fiches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fiche: nettoyerFiche(fiche), photo })
    })
    if (!rep.ok) {
      const { erreur } = await rep.json()
      setEtat((e) => (e.etape === 'verification' ? { ...e, erreur } : e))
      return
    }
    setEtat({ etape: 'enregistre', date: fiche.date })
  }

  if (etat.etape === 'lecture') {
    return (
      <>
        <h1>Lecture de la fiche</h1>
        <p className='intro' role='status'>
          Les chiffres sont en cours de lecture, quelques secondes.
        </p>
      </>
    )
  }

  if (etat.etape === 'enregistre') {
    return (
      <>
        <h1>Fiche enregistrée</h1>
        <p className='intro'>
          La fiche du {dateFr(etat.date)} est enregistrée.
        </p>
        <div className='actions'>
          <button
            className='bouton'
            onClick={() => setEtat({ etape: 'capture' })}
          >
            Scanner une autre fiche
          </button>
          <Link className='bouton secondaire' href='/journal'>
            Voir le journal des feuilles
          </Link>
        </div>
      </>
    )
  }

  if (etat.etape === 'verification') {
    const { fiche, doutes, apercu, photo, erreur } = etat
    const majVerif = (
      patch: Partial<Extract<Etat, { etape: 'verification' }>>
    ) => setEtat((e) => (e.etape === 'verification' ? { ...e, ...patch } : e))

    return (
      <>
        <h1>Vérifier la fiche</h1>
        <p className='intro'>
          {doutes.length > 0
            ? `${doutes.length} valeur(s) en jaune sont à contrôler sur la photo.`
            : "Comparez les chiffres avec la photo avant d'enregistrer."}
        </p>
        {erreur && (
          <p className='alerte' role='alert'>
            {erreur}
          </p>
        )}
        <div className='verif'>
          {apercu && (
            <div className='apercu'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apercu} alt='Photo de la fiche' />
            </div>
          )}
          <div>
            <FicheForm
              fiche={fiche}
              doutes={doutes}
              onChange={(f) => majVerif({ fiche: f })}
              onVu={(chemin) =>
                setEtat((e) =>
                  e.etape === 'verification'
                    ? {
                        ...e,
                        doutes: e.doutes.filter(
                          (d) => d !== chemin && !d.startsWith(chemin + '.')
                        )
                      }
                    : e
                )
              }
            />
            <div className='barre-action'>
              <button
                className='bouton secondaire'
                onClick={() => setEtat({ etape: 'capture' })}
              >
                Annuler
              </button>
              <button
                className='bouton'
                onClick={() => enregistrer(fiche, photo)}
              >
                Enregistrer la fiche
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className='capture'>
      <h1>Scanner une fiche journalière</h1>
      <p className='intro'>
        Photographiez la fiche à plat, bien éclairée, sans reflet. Les chiffres
        sont lus puis à vérifier avant l'enregistrement.
      </p>
      {etat.erreur && (
        <p className='alerte' role='alert'>
          {etat.erreur}
        </p>
      )}
      <div className='actions'>
        <input
          id='photo'
          type='file'
          accept='image/*'
          capture='environment'
          onChange={(e) => {
            const fichier = e.target.files?.[0]
            e.target.value = ''
            if (fichier) surPhoto(fichier)
          }}
        />
        <input
          id='galerie'
          type='file'
          accept='image/*'
          onChange={(e) => {
            const fichier = e.target.files?.[0]
            e.target.value = ''
            if (fichier) surPhoto(fichier)
          }}
        />
        <label className='bouton' htmlFor='photo'>
          Prendre une photo
        </label>
        <label className='bouton secondaire' htmlFor='galerie'>
          Choisir une photo existante
        </label>
        <button
          className='bouton secondaire'
          onClick={() =>
            setEtat({ etape: 'verification', fiche: ficheVide(), doutes: [] })
          }
        >
          Saisir à la main
        </button>
      </div>
    </div>
  )
}
