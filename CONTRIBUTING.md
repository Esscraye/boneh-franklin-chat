# Guide de Contribution

Merci de votre intérêt pour contribuer au projet Chat Boneh-Franklin IBE !

## 🚀 Démarrage pour les développeurs

1. **Fork** le repository
2. **Clone** votre fork : `git clone <your-fork-url>`
3. **Installer** les dépendances : `pnpm setup`
4. **Créer une branche** : `git checkout -b feature/ma-fonctionnalite`

## 📝 Standards de code

- **TypeScript strict** : Toutes les nouvelles fonctionnalités doivent être typées
- **ESLint** : Le code doit passer `pnpm lint` sans erreurs
- **Prettier** : Formatage automatique avec les règles du projet
- **Tests** : Les nouvelles fonctionnalités doivent inclure des tests

## 🔧 Outils de développement

```bash
pnpm lint:fix        # Correction automatique du style
pnpm screenshot      # Test visuel de l'interface
pnpm clean           # Reset de l'environnement
```

## 🎯 Types de contributions acceptées

### 🐛 Corrections de bugs
- Corrections de l'algorithme cryptographique
- Amélioration de la gestion d'erreurs
- Fix des problèmes d'interface

### ✨ Nouvelles fonctionnalités
- Support de nouvelles courbes elliptiques
- Amélioration de l'interface utilisateur
- Optimisations de performance
- Tests unitaires

### 📚 Documentation
- Amélioration du README
- Documentation technique
- Exemples d'utilisation

## 🚫 Ce qui ne sera PAS accepté

- Code non typé ou mal documenté
- Modifications qui cassent la compatibilité
- Fonctionnalités de production sans audit de sécurité
- Code qui ne respecte pas les standards ESLint

## 📋 Process de review

1. **Tests automatiques** : Votre PR doit passer tous les tests
2. **Review de code** : Un mainteneur examinera votre code
3. **Tests manuels** : Vérification du bon fonctionnement
4. **Merge** : Intégration après validation

## 🔒 Sécurité

⚠️ **Important** : Ce projet est à des fins éducatives uniquement.

- Ne pas proposer d'optimisations de sécurité sans expertise reconnue
- Toute amélioration cryptographique doit être documentée et référencée
- Les modifications de l'algorithme doivent préserver l'aspect éducatif

## 📞 Contact

Pour toute question, ouvrez une **issue** sur le repository.

Merci pour votre contribution ! 🙏
