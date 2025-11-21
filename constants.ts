import { SuperheroOption } from './types';

export const SUPERHEROES: SuperheroOption[] = [
  {
    id: 'ironman',
    name: 'Iron Avenger',
    image: 'https://images.unsplash.com/photo-1626278664285-f796b96180af?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing a high-tech red and gold armored suit with a glowing arc reactor in the chest, futuristic HUD interface overlay style',
    color: 'from-red-500 to-yellow-500'
  },
  {
    id: 'batman',
    name: 'Dark Knight',
    image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cd4?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing a tactical black kevlar batsuit with a flowing cape, brooding atmosphere, dark rainy gotham city background, dramatic lighting',
    color: 'from-gray-700 to-black'
  },
  {
    id: 'superman',
    name: 'Man of Steel',
    image: 'https://images.unsplash.com/photo-1520073201527-6b044ba2ca9f?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing a blue superhero suit with a red cape and an S shield on the chest, flying in the sky, hopeful and heroic lighting',
    color: 'from-blue-600 to-red-600'
  },
  {
    id: 'wonderwoman',
    name: 'Amazon Warrior',
    image: 'https://images.unsplash.com/photo-1610559857034-f737eb5c6975?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing ancient greek inspired golden eagle armor, holding a glowing lasso, heroic stance, warm golden hour lighting',
    color: 'from-red-600 to-yellow-600'
  },
  {
    id: 'spiderman',
    name: 'Web Slinger',
    image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing a red and blue spandex suit with web patterns, crouching in a dynamic pose on a building edge, new york city skyline background',
    color: 'from-red-600 to-blue-600'
  },
  {
    id: 'captainamerica',
    name: 'First Soldier',
    image: 'https://images.unsplash.com/photo-1624213111452-35e8d3d5cc18?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing a tactical blue military superhero suit with star symbols, holding a round vibranium shield, patriotic lighting',
    color: 'from-blue-700 to-red-500'
  },
  {
    id: 'thor',
    name: 'Thunder God',
    image: 'https://images.unsplash.com/photo-1568902660031-6f59b3c57a5b?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing asgardian armor and a red cape, holding a magical hammer with lightning crackling around, epic nordic fantasy atmosphere',
    color: 'from-slate-600 to-yellow-300'
  },
  {
    id: 'scarletwitch',
    name: 'Chaos Witch',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&h=200',
    promptModifier: 'wearing a crimson tiara and red leather coat, with glowing red hex magic energy swirling around hands, mystical atmosphere',
    color: 'from-red-900 to-red-500'
  }
];
