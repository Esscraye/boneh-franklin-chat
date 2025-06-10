# Documentation Technique - Algorithme Boneh-Franklin

## Vue d'ensemble de l'implémentation

Cette documentation détaille l'implémentation simplifiée de l'algorithme IBE (Identity-Based Encryption) de Boneh-Franklin dans cette application.

## Composants cryptographiques

### 1. Courbe Elliptique

```typescript
// Courbe utilisée: E: y² = x³ + 1 (mod p)
const CURVE_A = 0n
const CURVE_B = 1n
```

### 2. Fonctions de hachage

- **H1(ID)** : Mappe une identité vers un entier
- **H2(value)** : Génère une clé de chiffrement symétrique

### 3. Opérations sur la courbe

- Addition de points elliptiques
- Multiplication scalaire
- Vérification d'appartenance à la courbe

## Algorithme détaillé

### Setup (Initialisation)

1. Choisir un grand nombre premier `q`
2. Calculer `p = l*q - 1` où `l` est un cofacteur
3. Sélectionner un générateur `G` sur la courbe
4. Choisir une clé maître secrète `s`
5. Calculer la clé publique `P_pub = s*G`

### KeyGen (Génération de clés)

Pour une identité `ID` :

1. Calculer `y0 = H1(ID) mod p`
2. Trouver un point `Q` sur la courbe avec `y = y0`
3. Calculer `Q_ID = l * Q`
4. Générer la clé privée `d_ID = s * Q_ID`

### Encrypt (Chiffrement)

Pour chiffrer un message `M` vers l'identité `ID` :

1. Choisir un nombre aléatoire `r`
2. Calculer `U = r * G`
3. Obtenir `Q_ID` pour l'identité
4. Calculer la clé de session basée sur l'identité
5. Chiffrer `V = M ⊕ H2(clé_session)`

### Decrypt (Déchiffrement)

Pour déchiffrer avec la clé privée `d_ID` :

1. Reconstruire la clé de session
2. Calculer `M = V ⊕ H2(clé_session)`

## Simplifications pour la démo

### ⚠️ Avertissements importants

1. **Couplage bilinéaire simulé** : Le vrai algorithme utilise des couplages de Weil/Tate
2. **Paramètres réduits** : Les nombres premiers sont plus petits que recommandé
3. **Stockage de secrets** : La clé maître est stockée côté client
4. **Validation minimale** : Pas de vérification cryptographique complète

### Différences avec l'implémentation réelle

| Aspect | Demo | Production |
|--------|------|------------|
| Couplage | Hash simulé | Couplage de Weil réel |
| Taille des clés | ~64 bits | 256+ bits |
| Courbe | Simplifiée | P-256, BN curves |
| Stockage clés | Client | HSM sécurisé |
| Tests | Basiques | Audit complet |

## Interface de programmation

### Classe principale

```typescript
class BonehFranklinSimulator {
  // Configuration du système
  setup(): SystemParameters
  
  // Génération de clés utilisateur
  keyGeneration(identity: string, params: SystemParameters): UserKeys
  
  // Chiffrement de message
  encrypt(message: string, recipientIdentity: string, params: SystemParameters): string
  
  // Déchiffrement de message
  decrypt(encryptedMessage: string, privateKey: Point, params: SystemParameters): string
}
```

### Types de données

```typescript
interface SystemParameters {
  p: bigint        // Prime modulus
  q: bigint        // Order of subgroup
  l: bigint        // Cofactor
  g: Point         // Generator point
  publicKey: Point // Master public key
}

interface UserKeys {
  publicKey: string      // Identity (email)
  privateKey: Point      // Private key d_ID
  identityPoint: Point   // Identity point Q_ID
}

interface Point {
  x: bigint
  y: bigint
  isInfinity?: boolean
}
```

## Tests et validation

### Tests automatiques

L'application exécute automatiquement des tests au démarrage :

```typescript
const testMessages = [
  "Hello World!",
  "Bonjour tout le monde 🌍",
  "Test avec des caractères spéciaux: éàèç",
  // ... autres tests
]
```

### Métriques vérifiées

- Cohérence chiffrement/déchiffrement
- Support Unicode
- Gestion des erreurs
- Performance basique

## Utilisation pour l'apprentissage

### Concepts illustrés

1. **Cryptographie basée sur l'identité**
2. **Courbes elliptiques**
3. **Couplages bilinéaires (simulés)**
4. **Gestion des clés publiques/privées**
5. **Chiffrement hybride**

### Exercices suggérés

1. Modifier les paramètres de la courbe
2. Ajouter de nouveaux utilisateurs
3. Implémenter des tests unitaires
4. Analyser les performances
5. Comparer avec RSA/AES

## Ressources pour aller plus loin

- [Paper original Boneh-Franklin](https://crypto.stanford.edu/~dabo/papers/bfibe.pdf)
- [Cryptographie sur courbes elliptiques](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography)
- [Implémentations production : MIRACL, PBC library](https://github.com/miracl/core)

---

**Note** : Cette documentation est à des fins éducatives. Pour une implémentation en production, consultez des cryptographes experts et utilisez des bibliothèques auditées.
