export const GAME_CONFIG = {

  // MARKA VE SPONSORLUK YÖNETİMİ

  // Klasöre model yüklemediysen 'fallback' kalsın. Yüklediğin an 'gltf' yap.

  models: {

    sharkMode: 'gltf' as 'gltf' | 'gltf',

    sharkPath: '/models/shark.glb',

   

    lollieMode: 'gltf' as 'gltf' | 'gltf',

    lolliePath: '/models/lollie.glb',

   

    sharkBaitMode: 'gltf' as 'gltf' | 'gltf', // Marka yemi aktifse 'gltf' yap

    sharkBaitPath: '/models/shark_bait.glb',

   

    lollieBaitMode: 'gltf' as 'gltf' | 'gltf', // Marka yemi aktifse 'gltf' yap

    lollieBaitPath: '/models/lollie_bait.glb',

  },



  // MONETAG REKLAM KANALLARI KİMLİKLERİ

  ads: {

    topBannerId: 'monetag-top-zone-id',

    bottomBannerId: 'monetag-bottom-zone-id',

    interstitialId: 'monetag-interstitial-id'

  }

}; 

