const puppeteer = require('puppeteer');
const path = require('path');

async function takeScreenshot() {
  console.log('🚀 Lancement du navigateur...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    
    // Définir la taille de la fenêtre
    await page.setViewport({
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
    });
    
    console.log('📱 Chargement de l\'application...');
    
    // Naviguer vers l'application
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Attendre que l'interface soit complètement chargée
    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 10000 });
    
    console.log('🎭 Configuration de la démo...');
    
    // Attendre un peu pour que tout soit rendu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simuler des interactions pour rendre l'interface plus intéressante
    try {
      // Sélectionner Bob comme destinataire en cliquant sur son bouton
      const buttons = await page.$$('button');
      let bobButton = null;
      
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && text.includes('Bob')) {
          bobButton = button;
          break;
        }
      }
      
      if (bobButton) {
        await bobButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ Bob sélectionné comme destinataire');
      }
      
      // Taper un message d'exemple
      const textarea = await page.$('[data-testid="message-input"]');
      if (textarea) {
        await textarea.type('Bonjour Bob! Ceci est un exemple de message chiffré avec l\'algorithme IBE Boneh-Franklin. 🔒');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Message d\'exemple saisi');
      }
      
      // Envoyer le message pour montrer l'interface avec un message
      const sendButton = await page.$('button[disabled=""]') || await page.$('button:not([disabled])');
      if (sendButton && textarea) {
        // Vérifier si le bouton n'est pas désactivé
        const isDisabled = await page.evaluate(btn => btn.disabled, sendButton);
        if (!isDisabled) {
          await sendButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Message envoyé');
        }
      }
      
    } catch (error) {
      console.log('⚠️  Interactions optionnelles échouées:', error.message);
    }
    
    console.log('📸 Capture du screenshot...');
    
    // Prendre le screenshot
    const screenshotPath = path.join(__dirname, '..', 'screenshot.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1400,
        height: 900
      }
    });
    
    console.log('✅ Screenshot sauvegardé:', screenshotPath);
    
  } catch (error) {
    console.error('❌ Erreur lors de la capture:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  takeScreenshot()
    .then(() => {
      console.log('🎉 Screenshot terminé avec succès!');
      console.log('💡 Le fichier screenshot.png a été créé à la racine du projet');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur:', error);
      console.error('🔧 Assurez-vous que l\'application tourne sur http://localhost:3000');
      process.exit(1);
    });
}

module.exports = { takeScreenshot };
