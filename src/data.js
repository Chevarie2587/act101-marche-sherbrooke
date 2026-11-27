export const contact = { adresse: '93, rue Wellington Nord, Sherbrooke', telephone: '819 555-0100', courriel: 'contact@banqueatrouvailles.ca' };
export const tableIncluse = { id: 'table-incluse', nom: 'Table fournie gratuitement', quantite: 1, prix: 0 };
// Entreprises existantes à Sherbrooke, avec des attributions de kiosques fictives.
// Sources : notrecentro.com/carte/, appalaches.leslibraires.ca/nos-librairies,
// lesmels.quebec/qui-sont-les-mels/.
// Les 11 réguliers occupent le rez-de-chaussée, la mezzanine reste réservable.
const entreprisesRegulieres = {
    R1: 'Librairie Appalaches',
    R2: 'Brûleries Faro',
    R3: 'Boulangerie Les Vraies Richesses',
    R4: 'Blôma fleuriste',
    R5: 'Atelier Voyageur',
    R6: 'Boutique Joséphine',
    R7: 'Belle et Rebelle',
    R8: 'Librairie Les Deux Soeurs',
    R9: 'Cordonnerie Tremblay',
    R10: 'Atelier Moonday',
    R11: 'Les Mels',
};
// Tarifs de démonstration en dollars canadiens, par jour. Dimensions indicatives.
export const kiosques = [0, 1].flatMap(etage =>
    [0, 1].flatMap(cote =>
        [0, 1, 2, 3].map(rang => {
            const largeur = rang === 3 ? 4 : 3.5;
            const profondeur = 3.5;
            const distanceCentre = etage === 1 ? 12 - profondeur / 2 : 7;
            return {
                id: `${etage === 0 ? 'R' : 'M'}${cote * 4 + rang + 1}`,
                ancienId: `${etage === 0 ? 'R' : 'M'}-${cote === 0 ? 'A' : 'B'}${rang + 1}`,
                etage,
                x: cote === 0 ? -distanceCentre : distanceCentre,
                z: -7.5 + rang * 5,
                largeur,
                profondeur,
                rotation: cote === 0 ? Math.PI / 2 : -Math.PI / 2,
                prix: etage === 0
                    ? (rang === 3 ? 215 : 200)
                    : (rang === 3 ? 165 : 150),
                zone: cote === 0 ? 'Aile ouest' : 'Aile est'
            };
        })
    )
).concat([0, 1].flatMap(etage => [-3.2, 0, 3.2].map((x, i) => ({
    id: `${etage === 0 ? 'R' : 'M'}${i + 9}`,
    ancienId: `${etage === 0 ? 'R' : 'M'}-F${i + 1}`,
    etage,
    x,
    z: -10,
    largeur: 2.8,
    profondeur: 3.5,
    rotation: 0,
    prix: etage === 0 ? 200 : 150,
    zone: 'Galerie du fond'
})))).sort((a, b) => a.etage - b.etage || Number(a.id.slice(1)) - Number(b.id.slice(1)))
    .map(k => ({ ...k, regulier: Object.hasOwn(entreprisesRegulieres, k.id), entreprise: entreprisesRegulieres[k.id] || null }));
export const equipements = [
    { id: 'table', nom: 'Table supplémentaire', prix: 10, max: 6 },
    { id: 'chaise', nom: 'Chaise', prix: 3, max: 12 },
    { id: 'frigo', nom: 'Réfrigérateur', prix: 30, max: 2 },
    { id: 'congelateur', nom: 'Congélateur', prix: 35, max: 2 },
    { id: 'presentoir', nom: 'Présentoir', prix: 12, max: 4 }
];
