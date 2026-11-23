export const contact = { adresse: '00 rue Wellington, Sherbrooke', telephone: '819 555-0100', courriel: 'bonjour@marchepopulaire.example' };
// Tarifs de démonstration en dollars canadiens, par jour. Dimensions indicatives.
export const kiosques = [0, 1].flatMap(etage =>
    [0, 1].flatMap(cote =>
        [0, 1, 2, 3].map(rang => {
            const largeur = rang === 3 ? 4 : 3.5;
            const profondeur = 3.5;
            const distanceCentre = etage === 1 ? 12 - profondeur / 2 : 7;
            return {
                id: `${etage === 0 ? 'R' : 'M'}-${cote === 0 ? 'A' : 'B'}${rang + 1}`,
                etage,
                x: cote === 0 ? -distanceCentre : distanceCentre,
                z: -7.5 + rang * 5,
                largeur,
                profondeur,
                rotation: etage === 1 ? (cote === 0 ? Math.PI / 2 : -Math.PI / 2) : 0,
                prix: etage === 0
                    ? (rang === 3 ? 215 : 200)
                    : (rang === 3 ? 165 : 150),
                zone: cote === 0 ? 'Aile ouest' : 'Aile est'
            };
        })
    )
);
export const equipements = [
    { id: 'table', nom: 'Table pliante', prix: 10, max: 6 },
    { id: 'chaise', nom: 'Chaise', prix: 3, max: 12 },
    { id: 'frigo', nom: 'Réfrigérateur', prix: 30, max: 2 },
    { id: 'congelateur', nom: 'Congélateur', prix: 35, max: 2 },
    { id: 'presentoir', nom: 'Présentoir', prix: 12, max: 4 }
];
