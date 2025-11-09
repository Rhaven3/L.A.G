# 📜 TTRPG Initiative Tracker Discord Bot
<!-- Futur Badge avec Shields.io -->
This bot is designed to help Dungeon Masters and Players track initiative in Tabletop Role-Playing Games (TTRPGs) like Dungeons & Dragons. It integrates Discord.js with the Google Sheets API to manage and display initiative order efficiently.


## ⚙️ Installation & Setup
### 1️⃣ Prerequisites
- Install [Node.js](https://nodejs.org/fr/download) (v20.18.1 or later)
- Create a Google Cloud Project & enable Google Sheets API
  - -> [Vidéo Google Sheet API with JS](https://youtu.be/PFJNJQCU_lo)
- Set up a Discord Bot on the Discord Developer Portal
<!-- ajouté le lien de discord dev portal -->

### 2️⃣ Clone the Repository
```
git clone https://github.com/Rhaven3/L.A.G.git
cd L.A.G
```
<!-- modifier le lien une fois renomé -->
### 3️⃣ Install Dependencies 
```
npm install
```
### 4️⃣ Configure your Token and API Keys file
- Create a ``config.secret`` file in the ``./config/`` directory and add:
```json
{
    "token": "YOUR_DISCORD_BOT_TOKEN",
}
```
- Move your ``projet-it-credentials.json`` from your Google Cloud Project in ``config/``

5️⃣ Run the Bot
```
npx nodemon
```
> nodemon allow you to edit file when the bot is running

but you can use the usual way
```
node index.js
```

## ✨ Features
- 🎲 Track Initiative: Automatically sorts players & NPCs by initiative.
- 📊 Google Sheets Integration: Fetches character stats from Google Sheets.
- 🎭 Support for Players & NPCs: Different handling for Player Characters (PCs) and Non-Player Characters (NPCs).


## Available Commands
| Command | Description |
| ------- | ----------- |
| ``/initiative idSheets:<id1, id2, etc...> `` | Starts an initiative tracker |

<!--
### Initiative
Starts an initiative tracker
-->

## 💖 Support the project
- Starring and sharing the project. 🚀
<!-- Buy me a beer -->


## 📜 License
This project is licensed under the MIT License.


## 🛠️ Support & Contact
- Report bugs or your orwn idea for improvement via [Issues](https://github.com/Rhaven3/ITRP_DiscordBot/issues) <!-- À transfromer en bouton ISSUES-->
- Directly put your own Improvement with [Pull requests](https://github.com/Rhaven3/ITRP_DiscordBot/pulls)

---
Contributions are welcome! <3 ( check [CONTRIBUTING.md](https://github.com/Rhaven3/ITRP_DiscordBot/blob/main/docs/CONTRIBUTING.md) if you want so )
Made with ❤️ for all TTRPG fans! 🎲


<!--
[Ajout du bot sur discord](https://discord.com/oauth2/authorize?client_id=744525122530181203&permissions=8&integration_type=0&scope=applications.commands+bot)

## Doc Dev
[Doc Rules ESLint](https://eslint.org/docs/latest/rules/)
[Discord.JS Guide](https://discordjs.guide/)
[Doc Discord.JS](https://discord.js.org/docs/packages/discord.js/14.17.3)

-->
