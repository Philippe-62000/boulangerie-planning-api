/**
 * Check-list des postes vente (vendeuses).
 * Textes repris de la fiche magasin : ouverture, rappels de service, après rush, fermeture.
 * La ligne « pizza sur rond festonné » figurait deux fois dans la fiche : elle n’est gardée qu’une fois.
 */

const PHASES = [
  {
    id: 'ouverture',
    label: 'Ouverture',
    hint: 'De l’allumage de la boutique jusqu’à la mise en place.'
  },
  {
    id: 'apres-rush',
    label: 'Après rush',
    hint: 'Remise en état et relances après le coup de feu.'
  },
  {
    id: 'fermeture',
    label: 'Fermeture',
    hint: 'Du rush pizzas jusqu’à la clôture du magasin.'
  }
];

const TASKS = [
  {
    id: 'ouv-allumer-boutique',
    phase: 'ouverture',
    label: 'Allumer la boutique'
  },
  {
    id: 'ouv-allumer-vitrine',
    phase: 'ouverture',
    label: 'Allumer la vitrine, le four et la presse panini'
  },
  {
    id: 'ouv-machine-cafe',
    phase: 'ouverture',
    label: 'Vérifier si la machine à café est prête à fonctionner'
  },
  {
    id: 'ouv-commandes',
    phase: 'ouverture',
    label: 'Préparer les commandes clients'
  },
  {
    id: 'ouv-mise-vitrine',
    phase: 'ouverture',
    label: '6h–6h30 — Mise en vitrine',
    detail: 'Pains, baguettes, viennoiseries, gamme restante salée (J+1) et sucrée, gamme américaine. Sans oublier les étiquettes : un produit = une étiquette.'
  },
  {
    id: 'ouv-ouvrir',
    phase: 'ouverture',
    label: '6h25 — Vérifier la salle et les WC, puis ouvrir le magasin à 6h30'
  },
  {
    id: 'ouv-mise-rayon',
    phase: 'ouverture',
    label: 'Continuer la mise en rayon suivant le suivi de la production',
    detail: 'Soit sur l’échelle du frigo prépa, soit derrière la ligne de vente.'
  },
  {
    id: 'ouv-lait-chantilly',
    phase: 'ouverture',
    label: 'Vérifier le stock de lait et de chantilly',
    detail: 'Tout produit ouvert doit avoir une étiquette DLC. Le client reste la priorité.'
  },
  {
    id: 'ouv-temperatures',
    phase: 'ouverture',
    label: 'Relever les températures des frigos',
    detail: 'Frigo boisson, vitrine snacking, vitrine pâtisserie.'
  },
  {
    id: 'ouv-tarterie',
    phase: 'ouverture',
    label: 'Mise en place de la tarterie du jour',
    detail: 'En vitrine : la tarterie préparée le matin. Dans le frigo pâtisseries : celle de la veille, à prendre en priorité.'
  },
  {
    id: 'ouv-sandwiches',
    phase: 'ouverture',
    label: 'Mise en place des sandwiches',
    detail: 'Respecter les gammes Premium, Eco et Classique.'
  },
  {
    id: 'ouv-salades',
    phase: 'ouverture',
    label: 'Mise en place des salades',
    detail: 'En vitrine : les salades à prendre en priorité. En bas du frigo boissons : celles produites le matin.'
  },
  {
    id: 'ouv-desserts',
    phase: 'ouverture',
    label: 'Mise en rayon des desserts en pots',
    detail: 'En vitrine : les desserts à prendre en priorité. Dans le frigo boissons : ceux produits le matin.'
  },
  {
    id: 'ouv-boites-pizza',
    phase: 'ouverture',
    group: 'rappel',
    groupLabel: 'Ne pas oublier',
    label: 'Avoir des boîtes à pizza en quantité suffisante'
  },
  {
    id: 'ouv-vaisselle-barista',
    phase: 'ouverture',
    group: 'rappel',
    groupLabel: 'Ne pas oublier',
    label: 'Laver la vaisselle Barista et les plateaux au fur et à mesure'
  },
  {
    id: 'ouv-tour-salle',
    phase: 'ouverture',
    group: 'rappel',
    groupLabel: 'Ne pas oublier',
    label: 'Faire un tour régulier en salle et aux WC clients'
  },
  {
    id: 'ouv-exterieurs',
    phase: 'ouverture',
    group: 'rappel',
    groupLabel: 'Ne pas oublier',
    label: 'Suivi des extérieurs et de la terrasse (papiers, mégots)'
  },
  {
    id: 'ouv-poubelle',
    phase: 'ouverture',
    group: 'rappel',
    groupLabel: 'Ne pas oublier',
    label: 'Nettoyage de la poubelle'
  },
  {
    id: 'ouv-gamme-appli',
    phase: 'ouverture',
    group: 'rappel',
    groupLabel: 'Ne pas oublier',
    label: 'Vérifier la gamme sur l’application régulièrement',
    detail: 'Valider les manquants avec le chef prépa, au moment de la mise en place VAD.'
  },
  {
    id: 'rush-salle',
    phase: 'apres-rush',
    label: 'Nettoyage de la salle (tables, chaises), passage du balai, WC et terrasse'
  },
  {
    id: 'rush-poubelle',
    phase: 'apres-rush',
    label: 'Vider la poubelle et la nettoyer (intérieur et extérieur)'
  },
  {
    id: 'rush-pinces',
    phase: 'apres-rush',
    label: 'Nettoyage des pinces (à la main ou à la plonge)'
  },
  {
    id: 'rush-frigo-boisson',
    phase: 'apres-rush',
    label: 'Remplir le frigo boisson'
  },
  {
    id: 'rush-relance',
    phase: 'apres-rush',
    label: 'Relances à réaliser si besoin',
    detail: 'Sandwichs (poulet pro, jambon beurre, jambon emmental), tarterie, gamme américaine.'
  },
  {
    id: 'rush-rotation',
    phase: 'apres-rush',
    label: 'Vérifier la rotation de la tarterie, des salades et des pots desserts'
  },
  {
    id: 'rush-pointage',
    phase: 'apres-rush',
    label: 'Réaliser le pointage tarterie et gamme américaine'
  },
  {
    id: 'rush-ruptures',
    phase: 'apres-rush',
    label: 'Réaliser les ruptures sur les applications'
  },
  {
    id: 'rush-consommables',
    phase: 'apres-rush',
    label: 'Remplir sachets, boîtes, boîtes à pizzas, serviettes, couverts…'
  },
  {
    id: 'rush-plaques',
    phase: 'apres-rush',
    weekly: true,
    label: 'Soulever les plaques snacking et tarterie pour nettoyage',
    detail: 'Au moins une fois par semaine. Si ce n’est pas le jour, indiquez quand cela a été fait.'
  },
  {
    id: 'rush-viennoiserie',
    phase: 'apres-rush',
    label: 'Penser à la relance viennoiserie'
  },
  {
    id: 'rush-four',
    phase: 'apres-rush',
    label: 'Nettoyage du four suivant le process, et de la presse panini'
  },
  {
    id: 'fer-rush-pizzas',
    phase: 'fermeture',
    label: 'Préparer le rush pizzas à partir de 17h'
  },
  {
    id: 'fer-salle',
    phase: 'fermeture',
    label: 'Nettoyage salle, balai, tables et sanitaires vers 18h30–19h'
  },
  {
    id: 'fer-salades-desserts',
    phase: 'fermeture',
    label: 'Laisser en vitrine les salades et pots desserts qui se terminent à date',
    detail: 'Le reste au frigo. Garder une quantité suffisante pour un bel effet.'
  },
  {
    id: 'fer-vitrine-viennoiserie',
    phase: 'fermeture',
    label: 'Resserrer la vitrine viennoiserie selon les produits restants',
    detail: 'La vitrine doit rester bien achalandée jusqu’à la fermeture.'
  },
  {
    id: 'fer-machine-cafe',
    phase: 'fermeture',
    label: '19h30 — Nettoyage de la machine à café suivant le process'
  },
  {
    id: 'fer-plonge',
    phase: 'fermeture',
    label: 'Suivi de la plonge',
    detail: 'Ne pas la laisser pour la prépa : la faire au fur et à mesure.'
  },
  {
    id: 'fer-poubelles',
    phase: 'fermeture',
    label: 'Vider la poubelle de vente et la poubelle barista'
  },
  {
    id: 'fer-four',
    phase: 'fermeture',
    label: 'Nettoyage du four suivant le process'
  },
  {
    id: 'fer-vitrines',
    phase: 'fermeture',
    label: 'Nettoyage du dessus et du devant des vitrines'
  },
  {
    id: 'fer-pizza-rond',
    phase: 'fermeture',
    label: 'Vers 19h — Mettre les pizzas sur rond festonné',
    detail: 'Pour anticiper le nettoyage.'
  },
  {
    id: 'fer-tgt-prep',
    phase: 'fermeture',
    label: '19h15–19h30 — Préparation Too Good To Go',
    detail: 'Pas d’emballage, sauf le sac craft US.'
  },
  {
    id: 'fer-gamme-restante',
    phase: 'fermeture',
    label: '19h30 — Faire la gamme restante',
    detail: 'Vérifier la DLC brioche : retirer les produits à la moitié de la DLC, soit J+2.'
  },
  {
    id: 'fer-tgt-don',
    phase: 'fermeture',
    label: '19h45 — Donation du panier Too Good To Go'
  },
  {
    id: 'fer-invendus-debut',
    phase: 'fermeture',
    label: '19h45 — Commencer l’enregistrement des invendus',
    detail: 'Bien séparer un ticket baguette et un ticket avec le reste.'
  },
  {
    id: 'fer-bacs',
    phase: 'fermeture',
    label: 'Mettre muffins, donuts, mendiants et fondants en bac'
  },
  {
    id: 'fer-fermeture',
    phase: 'fermeture',
    label: '20h — Fermeture du magasin'
  },
  {
    id: 'fer-portes',
    phase: 'fermeture',
    label: 'Fermer les portes'
  },
  {
    id: 'fer-terrasse',
    phase: 'fermeture',
    label: 'Valider le nettoyage de la terrasse avant la fermeture'
  },
  {
    id: 'fer-invendus-fin',
    phase: 'fermeture',
    label: 'Finaliser les invendus'
  },
  {
    id: 'fer-caisse',
    phase: 'fermeture',
    label: 'Clôturer la caisse 2'
  },
  {
    id: 'fer-dons',
    phase: 'fermeture',
    label: 'Préparer les caisses de dons'
  },
  {
    id: 'fer-tablettes',
    phase: 'fermeture',
    label: 'Mettre les tablettes en charge'
  }
];

const PHASE_IDS = new Set(PHASES.map((phase) => phase.id));
const TASK_BY_ID = new Map(TASKS.map((task) => [task.id, task]));

module.exports = {
  PHASES,
  TASKS,
  PHASE_IDS,
  TASK_BY_ID
};
