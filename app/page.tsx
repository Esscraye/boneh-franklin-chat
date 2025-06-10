"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Lock, Unlock, Key, Users, Send, Shield } from "lucide-react"
import { BonehFranklinSimulator, Point, SystemParameters } from "@/lib/boneh-franklin"

interface User {
  id: string
  identity: string
  name: string
  publicKey?: string
  privateKey?: Point
  identityPoint?: Point
}

interface Message {
  id: string
  from: string
  to: string
  content: string
  encryptedContent: string
  timestamp: Date
  isEncrypted: boolean
}

export default function BonehFranklinChat() {
  const [initialUsers] = useState<User[]>([
    { id: "1", identity: "alice@example.com", name: "Alice" },
    { id: "2", identity: "bob@example.com", name: "Bob" },
    { id: "3", identity: "charlie@example.com", name: "Charlie" },
  ])

  const [users, setUsers] = useState<User[]>(initialUsers)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [simulator] = useState(new BonehFranklinSimulator())
  const [systemParams, setSystemParams] = useState<SystemParameters | null>(null)

  useEffect(() => {
    // Initialize system parameters
    const params = simulator.setup()
    setSystemParams(params)

    // Generate keys for all users
    const updatedUsers = initialUsers.map((user) => {
      const keys = simulator.keyGeneration(user.identity, params)
      return {
        ...user,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        identityPoint: keys.identityPoint,
      }
    })
    setUsers(updatedUsers)
    setCurrentUser(updatedUsers[0])

    // Test the encryption/decryption
    console.log("Testing Boneh-Franklin implementation...")
    simulator.testMultipleMessages(params)
  }, [simulator, initialUsers])

  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser || !selectedRecipient || !systemParams) return

    const messageId = Date.now().toString()

    // Encrypt message using recipient's identity
    const encryptedContent = simulator.encrypt(newMessage, selectedRecipient.identity, systemParams)

    const message: Message = {
      id: messageId,
      from: currentUser.identity,
      to: selectedRecipient.identity,
      content: newMessage,
      encryptedContent,
      timestamp: new Date(),
      isEncrypted: true,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const decryptMessage = (message: Message) => {
    if (!currentUser || message.to !== currentUser.identity || !systemParams) return null

    try {
      const decryptedContent = simulator.decrypt(message.encryptedContent, currentUser.privateKey!, systemParams)
      console.log("Déchiffrement:")
      console.log("- Message chiffré:", message.encryptedContent)
      console.log("- Message déchiffré:", decryptedContent)
      console.log("- Message original:", message.content)
      console.log("- Correspondance:", decryptedContent === message.content)
      
      return decryptedContent
    } catch (error) {
      console.error("Erreur lors du déchiffrement:", error)
      return null
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Boneh-Franklin IBE</h1>
          <p className="text-gray-600">
            Chiffrement basé sur l&apos;identité - Les messages sont chiffrés avec l&apos;identité du destinataire
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* System Parameters */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres du Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Courbe Elliptique:</span>
                  <p className="text-gray-600">E: y² = x³ + ax + b (mod p)</p>
                </div>
                <div>
                  <span className="font-medium">Générateur:</span>
                  <p className="text-gray-600">Point G sur E</p>
                </div>
                <div>
                  <span className="font-medium">Clé Maître:</span>
                  <p className="text-gray-600">s ∈ Zp (secrète)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentUser?.id === user.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setCurrentUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.identity}</p>
                      </div>
                      {currentUser?.id === user.id && (
                        <Badge variant="secondary" className="text-xs">
                          Actuel
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-2" data-testid="chat-interface">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Messages</span>
                {currentUser && (
                  <Badge variant="outline" className="text-xs">
                    Connecté: {currentUser.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    // Déterminer ce qui doit être affiché selon l'utilisateur actuel
                    let displayContent = ""
                    let canDecrypt = false
                    let isEncryptedForMe = false

                    if (message.from === currentUser?.identity) {
                      // Si c'est mon message, je le vois toujours en clair
                      displayContent = message.content
                    } else if (message.to === currentUser?.identity) {
                      // Si le message m'est destiné
                      isEncryptedForMe = true
                      canDecrypt = true
                      displayContent = "🔒 Message chiffré (cliquez pour déchiffrer)"
                    } else {
                      // Si le message ne m'est pas destiné, je ne peux pas le voir
                      displayContent = "🔒 Message chiffré (non destiné à vous)"
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${message.from === currentUser?.identity ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.from === currentUser?.identity
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs opacity-75">
                              {users.find((u) => u.identity === message.from)?.name}
                            </span>
                            {canDecrypt && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => {
                                  const decrypted = decryptMessage(message)
                                  // Afficher le message déchiffré temporairement
                                  const messageElement = document.getElementById(`message-${message.id}`)
                                  if (messageElement && decrypted) {
                                    messageElement.textContent = decrypted
                                  }
                                }}
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                            )}
                            {!isEncryptedForMe && message.from !== currentUser?.identity && (
                              <Lock className="h-3 w-3 opacity-75" />
                            )}
                            {message.from === currentUser?.identity && <Unlock className="h-3 w-3 opacity-75" />}
                          </div>
                          <p className="text-sm" id={`message-${message.id}`}>
                            {displayContent}
                          </p>
                          <p className="text-xs opacity-75 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Destinataire:</label>
                  <div className="flex gap-2">
                    {users
                      .filter((u) => u.id !== currentUser?.id)
                      .map((user) => (
                        <Button
                          key={user.id}
                          size="sm"
                          variant={selectedRecipient?.id === user.id ? "default" : "outline"}
                          onClick={() => setSelectedRecipient(user)}
                        >
                          {user.name}
                        </Button>
                      ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    rows={2}
                    data-testid="message-input"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !selectedRecipient}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encryption Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Détails Cryptographiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentUser && (
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="font-medium">Identité:</span>
                    <p className="text-gray-600 break-all">{currentUser.identity}</p>
                  </div>

                  <div>
                    <span className="font-medium">Clé Privée:</span>
                    <p className="text-gray-600 font-mono text-xs break-all">
                      {currentUser.privateKey && !currentUser.privateKey.isInfinity
                        ? `(${currentUser.privateKey.x.toString().substring(0, 10)}..., ${currentUser.privateKey.y.toString().substring(0, 10)}...)`
                        : "Point à l'infini"}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium">Point d&apos;Identité (Q_ID):</span>
                    <p className="text-gray-600 font-mono text-xs break-all">
                      {currentUser.identityPoint && !currentUser.identityPoint.isInfinity
                        ? `(${currentUser.identityPoint.x.toString().substring(0, 10)}..., ${currentUser.identityPoint.y.toString().substring(0, 10)}...)`
                        : "Point à l&apos;infini"}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Processus IBE:</h4>
                    <ol className="text-xs text-gray-600 space-y-1">
                      <li>1. Setup: Génération des paramètres</li>
                      <li>2. KeyGen: Clé privée = H₁(ID)ˢ</li>
                      <li>3. Encrypt: Chiffrement avec ID</li>
                      <li>4. Decrypt: Déchiffrement avec clé privée</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
