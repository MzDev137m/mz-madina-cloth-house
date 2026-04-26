// Firebase Firestore sync for Madina Cloth House Admin
// Loads first — fetches cloud data into localStorage before page renders

const _MCH_KEYS = [
  'mch_products','mch_brands','mch_categories','mch_gallery',
  'mch_customers','mch_orders','mch_tailoring','mch_finance',
  'mch_promotions','mch_credentials'
]

const _MCH_CONFIG = {
  apiKey: "AIzaSyDpYmD6FrOLfPMKdvnX5DoNLdzLYh2vFaM",
  authDomain: "mz-projects-6f5a9.firebaseapp.com",
  projectId: "mz-projects-6f5a9",
  storageBucket: "mz-projects-6f5a9.firebasestorage.app",
  messagingSenderId: "454812915813",
  appId: "1:454812915813:web:8d8e6b955011273c148e8c",
}

// This promise resolves when Firestore data is loaded into localStorage
window._mchSyncReady = new Promise((resolve) => {
  Promise.all([
    import('https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js'),
  ]).then(([{ initializeApp, getApps }, { getFirestore, doc, getDoc, setDoc }]) => {

    // Avoid duplicate app init
    const app = getApps().find(a => a.name === 'mch') ||
                initializeApp(_MCH_CONFIG, 'mch')
    const db = getFirestore(app)

    // Store globally so saveData can use it
    window._mchFB = { db, doc, setDoc }

    // Pull all collections from Firestore → update localStorage
    return Promise.all(_MCH_KEYS.map(async (key) => {
      try {
        const snap = await getDoc(doc(db, 'clothhouse', key))
        if (snap.exists() && snap.data().items !== undefined) {
          localStorage.setItem(key, JSON.stringify(snap.data().items))
        }
      } catch (e) { /* ignore individual key failures */ }
    }))

  }).then(() => {
    resolve()
  }).catch((err) => {
    console.warn('[MCH Firebase] Sync failed, using local data.', err)
    resolve() // resolve anyway so page still works offline
  })
})
