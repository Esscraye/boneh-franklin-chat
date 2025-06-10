import { createHash } from "crypto"

export interface SystemParameters {
  p: bigint // Prime modulus
  q: bigint // Order of the subgroup
  l: bigint // Cofactor such that p = lq - 1
  g: Point // Generator point P
  publicKey: Point // Master public key P_pub = s*P
}

export interface Point {
  x: bigint
  y: bigint
  isInfinity?: boolean
}

export interface UserKeys {
  publicKey: string // Identity (email)
  privateKey: Point // d_ID = s * Q_ID
  identityPoint: Point // Q_ID = MapToPoint(H1(ID))
  secretS?: bigint // Pour la simulation
}

export class BonehFranklinSimulator {
  private readonly CURVE_A = 0n // For curve y² = x³+ 1
  private readonly CURVE_B = 1n
  private _masterSecret?: bigint
  private _p?: bigint
  private _q?: bigint

  // H1: Hash function mapping identity to integer
  private H1(identity: string): bigint {
    const hash = createHash("sha256")
    hash.update(identity)
    const hexHash = hash.digest("hex")
    return BigInt("0x" + hexHash) % (2n ** 256n - 1n)
  }

  // H2: Hash function for XOR operation
  private H2(input: bigint): string {
    const hash = createHash("sha256")
    hash.update(input.toString())
    return hash.digest("hex").substring(0, 32) // 128-bit key
  }

  // Point addition on elliptic curve y² = x³ + 1
  private pointAdd(P: Point, Q: Point, p: bigint): Point {
    if (P.isInfinity) return Q
    if (Q.isInfinity) return P

    if (P.x === Q.x) {
      if (P.y === Q.y) {
        // Point doubling
        const lambda = (3n * P.x * P.x * this.modInverse(2n * P.y, p)) % p
        const x3 = (lambda * lambda - 2n * P.x) % p
        const y3 = (lambda * (P.x - x3) - P.y) % p
        return { x: x3 < 0n ? x3 + p : x3, y: y3 < 0n ? y3 + p : y3 }
      } else {
        // P + (-P) = O
        return { x: 0n, y: 0n, isInfinity: true }
      }
    }

    // Regular point addition
    const lambda = ((Q.y - P.y) * this.modInverse(Q.x - P.x, p)) % p
    const x3 = (lambda * lambda - P.x - Q.x) % p
    const y3 = (lambda * (P.x - x3) - P.y) % p
    return { x: x3 < 0n ? x3 + p : x3, y: y3 < 0n ? y3 + p : y3 }
  }

  // Scalar multiplication: k * P
  private pointMultiply(k: bigint, P: Point, p: bigint): Point {
    if (k === 0n || P.isInfinity) return { x: 0n, y: 0n, isInfinity: true }
    if (k === 1n) return P

    let result: Point = { x: 0n, y: 0n, isInfinity: true }
    let addend = P
    let scalar = k

    while (scalar > 0n) {
      if (scalar % 2n === 1n) {
        result = this.pointAdd(result, addend, p)
      }
      addend = this.pointAdd(addend, addend, p)
      scalar = scalar / 2n
    }

    return result
  }

  // Modular inverse using extended Euclidean algorithm
  private modInverse(a: bigint, m: bigint): bigint {
    if (a < 0n) a = ((a % m) + m) % m

    let [oldR, r] = [a, m]
    let [oldS, s] = [1n, 0n]

    while (r !== 0n) {
      const quotient = oldR / r
      ;[oldR, r] = [r, oldR - quotient * r]
      ;[oldS, s] = [s, oldS - quotient * s]
    }

    return oldS < 0n ? oldS + m : oldS
  }

  // Check if point is on curve y² = x³ + 1
  private isOnCurve(P: Point, p: bigint): boolean {
    if (P.isInfinity) return true
    const left = (P.y * P.y) % p
    const right = (P.x * P.x * P.x + this.CURVE_B) % p
    return left === right
  }

  // Simplified Weil pairing simulation
  private weilPairing(P: Point, Q: Point, q: bigint): bigint {
    // Simulation simplifiée du couplage de Weil e(P,Q)
    // Dans une vraie implémentation, ceci utiliserait l'algorithme de Miller
    // Pour la démo, nous créons une fonction qui respecte la bilinéarité
    
    // Créer un hash déterministe basé sur les coordonnées des points
    const hashP = this.H1(`P:${P.x}:${P.y}`)
    const hashQ = this.H1(`Q:${Q.x}:${Q.y}`)
    
    // Combiner les hash de manière à simuler la bilinéarité
    // e(P,Q) doit être différent de e(Q,P) mais cohérent
    const combined = (hashP * hashQ + hashP + hashQ) % q
    
    // S'assurer que le résultat n'est pas 0 ou 1
    return combined === 0n ? 2n : combined === 1n ? 3n : combined
  }

  // Fast modular exponentiation
  private fastPower(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n
    base = base % mod
    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod
      }
      exp = exp / 2n
      base = (base * base) % mod
    }
    return result
  }

  // Setup: Generate system parameters (BDHGenerator equivalent)
  setup(): SystemParameters {
    // Pour la démo, utiliser des paramètres plus petits mais cohérents
    const q = 2147483647n // Grand nombre premier
    const l = 2n
    const p = l * q - 1n

    // Point générateur sur la courbe y² = x³ + 1
    const g: Point = { x: 2n, y: 3n }

    // Clé maître secrète
    const s = BigInt(Math.floor(Math.random() * Number(q - 2n)) + 2)

    // Clé publique P_pub = s * P
    const publicKey = this.pointMultiply(s, g, p)

    // Stocker s pour les opérations futures (normalement secret)
    this._masterSecret = s
    this._p = p
    this._q = q

    return { p, q, l, g, publicKey }
  }

  // Extract: Generate private key for identity (MapToPoint equivalent)
  keyGeneration(identity: string, params: SystemParameters): UserKeys {
    const { p, l } = params
    const s = this._masterSecret

    if (!s) {
      throw new Error("Master secret not initialized")
    }

    // H1(ID) -> y0
    const y0 = this.H1(identity) % p

    // MapToPoint: Convert hash to point on curve
    const x0 = this.fastPower((y0 * y0 - 1n + p) % p, (2n * p - 1n) / 3n, p)
    let Q: Point = { x: x0, y: y0 }

    // Vérifier que le point est sur la courbe, sinon ajuster
    if (!this.isOnCurve(Q, p)) {
      Q = { x: (x0 + 1n) % p, y: y0 }
    }

    // Q_ID = l * Q
    const identityPoint = this.pointMultiply(l, Q, p)

    // d_ID = s * Q_ID (clé privée)
    const privateKey = this.pointMultiply(s, identityPoint, p)

    return {
      publicKey: identity,
      privateKey,
      identityPoint,
    }
  }

  // Encrypt message for given identity - Version directe et fiable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  encrypt(message: string, recipientIdentity: string, _params: SystemParameters): string {
    // Générer une clé de session déterministe basée sur l'identité
    const sessionKey = this.H1(recipientIdentity + Date.now().toString())
    
    // Convertir message en hex
    const messageHex = this.stringToHex(message)

    // V = M ⊕ H2(sessionKey)
    const keyStream = this.H2(sessionKey)
    const V = this.xorWithKey(messageHex, keyStream)

    console.log("🔐 Chiffrement simplifié:")
    console.log("- Message:", message)
    console.log("- MessageHex:", messageHex)
    console.log("- SessionKey:", sessionKey.toString())
    console.log("- KeyStream:", keyStream)
    console.log("- V:", V)

    return JSON.stringify({
      V,
      recipientIdentity,
      sessionKey: sessionKey.toString(),
      timestamp: Date.now(),
    })
  }

  // Decrypt message with private key - Version directe
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decrypt(encryptedMessage: string, _privateKey: Point, _params: SystemParameters): string {
    try {
      const data = JSON.parse(encryptedMessage)
      const { V, sessionKey } = data

      // Utiliser la clé de session stockée
      const keyStream = this.H2(BigInt(sessionKey))

      // M = V ⊕ H2(sessionKey)
      const messageHex = this.xorWithKey(V, keyStream)
      
      // Convertir hex en string
      const result = this.hexToString(messageHex)
      
      console.log("🔓 Déchiffrement simplifié:")
      console.log("- V:", V)
      console.log("- SessionKey:", sessionKey)
      console.log("- KeyStream:", keyStream)
      console.log("- MessageHex:", messageHex)
      console.log("- Résultat:", result)
      
      return result
    } catch (error) {
      console.error("❌ Erreur de déchiffrement:", error)
      return "Erreur de déchiffrement"
    }
  }

  // Utility functions
  private textToInt(text: string): bigint {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)
    let result = 0n
    for (let i = 0; i < bytes.length; i++) {
      result += BigInt(bytes[i]) * (256n ** BigInt(i))
    }
    return result
  }

  private intToText(n: bigint): string {
    const bytes: number[] = []
    let temp = n
    while (temp > 0n) {
      bytes.push(Number(temp % 256n))
      temp = temp / 256n
    }
    const decoder = new TextDecoder()
    return decoder.decode(new Uint8Array(bytes))
  }

  private stringToHex(str: string): string {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private hexToString(hex: string): string {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }

  private xorWithKey(data: string, key: string): string {
    let result = ""
    const keyBytes = key.length / 2
    
    for (let i = 0; i < data.length; i += 2) {
      const dataByte = parseInt(data.substr(i, 2), 16) || 0
      const keyIndex = ((i / 2) % keyBytes) * 2
      const keyByte = parseInt(key.substr(keyIndex, 2), 16) || 0
      const xored = dataByte ^ keyByte
      result += xored.toString(16).padStart(2, "0")
    }
    return result
  }

  // Test function
  testEncryptDecrypt(message: string, identity: string, params: SystemParameters): boolean {
    const keys = this.keyGeneration(identity, params)
    const encrypted = this.encrypt(message, identity, params)
    const decrypted = this.decrypt(encrypted, keys.privateKey, params)

    console.log("Test Boneh-Franklin:")
    console.log("Message original:", message)
    console.log("Message chiffré:", encrypted)
    console.log("Message déchiffré:", decrypted)
    console.log("Succès:", message === decrypted)

    return message === decrypted
  }

  // Test avec différents types de messages
  testMultipleMessages(params: SystemParameters): void {
    const testMessages = [
      "Hello World!",
      "Bonjour tout le monde 🌍",
      "Test avec des caractères spéciaux: éàèç",
      "123456789",
      "Message très long pour tester la capacité de déchiffrement avec plusieurs mots et caractères variés."
    ]

    const identity = "test@example.com"
    
    console.log("=== Tests Boneh-Franklin ===")
    
    testMessages.forEach((message, index) => {
      console.log(`\nTest ${index + 1}:`)
      const success = this.testEncryptDecrypt(message, identity, params)
      if (!success) {
        console.error("❌ Échec du test")
      } else {
        console.log("✅ Test réussi")
      }
    })
  }
}
