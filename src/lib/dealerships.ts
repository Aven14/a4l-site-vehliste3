// Fonction pour déterminer le concessionnaire selon la marque et la catégorie

export function getDealershipLocation(brandName: string, category?: string | null): { name: string; location: string } {
  // Catégories spéciales
  if (category) {
    const cat = category.toLowerCase()
    if (cat === 'moto' || cat === 'quad') {
      return { name: 'Concessionnaire Moto/Quad', location: 'Woodland Heights' }
    }
    if (cat === 'utilitaire' || cat === 'transport' || cat === 'poids lourd' || cat === 'camion') {
      return { name: 'Concessionnaire Transports', location: 'Lakeside' }
    }
    if (cat === 'event' || cat === 'shop event') {
      return { name: 'Concessionnaire EVENT', location: 'Palm' }
    }
    if (cat === 'avion' || cat === 'aérien') {
      return { name: 'Concessionnaire Aérien', location: 'Aux Aéroports' }
    }
    if (cat === 'bateau' || cat === 'maritime') {
      return { name: 'Concessionnaire Maritime', location: 'Aux Ports' }
    }
  }

  // Par première lettre de la marque
  const firstLetter = brandName.charAt(0).toUpperCase()
  
  if ('ABCDEF'.includes(firstLetter)) {
    return { name: 'Concessionnaire A-F', location: 'Perrytonia' }
  }
  if ('GHIJKL'.includes(firstLetter)) {
    return { name: 'Concessionnaire G-L', location: 'Los Diablos' }
  }
  if ('MNOPQR'.includes(firstLetter)) {
    return { name: 'Concessionnaire M-R', location: 'Jamestown' }
  }
  if ('STUVWXYZ'.includes(firstLetter)) {
    return { name: 'Concessionnaire S-Z', location: 'Watergate' }
  }

  return { name: 'Concessionnaire', location: 'Inconnu' }
}
