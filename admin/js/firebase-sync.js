// Firebase Firestore real-time sync for Madina Cloth House Admin
// Loads first — subscribes to live Firestore data; updates localStorage on every change.

const _MCH_KEYS = [
  'mch_products','mch_brands','mch_categories','mch_gallery',
  'mch_customers','mch_orders','mch_tailoring','mch_finance',
  'mch_promotions','mch_credentials'
]

const _MCH_CONFIG = {
  apiKey:            "AIzaSyDpYmD6FrOLfPMKdvnX5DoNLdzLYh2vFaM",
  authDomain:        "mz-projects-6f5a9.firebaseapp.com",
  projectId:         "mz-projects-6f5a9",
  storageBucket:     "mz-projects-6f5a9.firebasestorage.app",
  messagingSenderId: "454812915813",
  appId:             "1:454812915813:web:8d8e6b955011273c148e8c",
}

// Resolves once all keys have their first snapshot — page init waits on this
window._mchSyncReady = new Promise((resolve) => {
  Promise.all([
    import('https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js'),
  ]).then(([{ initializeApp, getApps }, { getFirestore, doc, onSnapshot, setDoc }]) => {

    const app = getApps().find(a => a.name === 'mch') ||
                initializeApp(_MCH_CONFIG, 'mch')
    const db  = getFirestore(app)

    // Store globally so saveData in core.js can write back to Firestore
    window._mchFB = { db, doc, setDoc }

    const loadedKeys = new Set()
    let resolved     = false

    _MCH_KEYS.forEach(key => {
      onSnapshot(
        doc(db, 'clothhouse', key),
        (snap) => {
          if (snap.exists() && snap.data().items !== undefined) {
            localStorage.setItem(key, JSON.stringify(snap.data().items))
          }
          loadedKeys.add(key)

          if (!resolved && loadedKeys.size >= _MCH_KEYS.length) {
            // First full load — unblock page init
            resolved = true
            resolve()
          } else if (resolved) {
            // Subsequent real-time update from another device/tab
            window.dispatchEvent(new CustomEvent('mch-data-changed', { detail: { key } }))
          }
        },
        (err) => {
          console.warn(`[MCH Admin] Snapshot error for ${key}:`, err)
          loadedKeys.add(key)
          if (!resolved && loadedKeys.size >= _MCH_KEYS.length) {
            resolved = true
            resolve()
          }
        }
      )
    })

  }).catch((err) => {
    console.warn('[MCH Firebase] Sync failed, using local data.', err)
    resolve() // still let the page load offline
  })
})
